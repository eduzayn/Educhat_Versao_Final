/**
 * Hook otimizado para envio de mensagens com UI otimista aprimorada
 * Implementa fallback automático e gerenciamento de estado robusto
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import type { Message, InsertMessage } from '@shared/schema';

interface OptimisticMessage extends Message {
  isOptimistic: true;
  optimisticId: string;
  status: 'sending' | 'sent' | 'error';
}

interface UseOptimizedMessageSenderOptions {
  conversationId: number;
  onSuccess?: (message: Message) => void;
  onError?: (error: Error, optimisticId: string) => void;
}

export function useOptimizedMessageSender({ 
  conversationId, 
  onSuccess, 
  onError 
}: UseOptimizedMessageSenderOptions) {
  const queryClient = useQueryClient();
  const [pendingMessages, setPendingMessages] = useState<Map<string, OptimisticMessage>>(new Map());
  const timeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateOptimisticId = useCallback(() => {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addOptimisticMessage = useCallback((messageData: Omit<InsertMessage, 'conversationId'>) => {
    const startTime = performance.now();
    const optimisticId = generateOptimisticId();
    
    const optimisticMessage: OptimisticMessage = {
      id: Date.now(), // ID temporário numérico
      conversationId,
      content: messageData.content,
      isFromContact: false,
      messageType: messageData.messageType || 'text',
      metadata: messageData.metadata || null,
      isDeleted: false,
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      whatsappMessageId: null,
      zapiStatus: 'PENDING',
      isGroup: false,
      referenceMessageId: null,
      isInternalNote: messageData.isInternalNote || false,
      authorId: messageData.authorId || null,
      authorName: messageData.authorName || null,
      noteType: messageData.noteType || 'general',
      notePriority: messageData.notePriority || 'normal',
      noteTags: messageData.noteTags || null,
      isPrivate: messageData.isPrivate || false,
      isHiddenForUser: false,
      isDeletedByUser: false,
      deletedAt: null,
      deletedBy: null,
      isOptimistic: true,
      optimisticId,
      status: 'sending'
    };

    // Adicionar ao cache local
    setPendingMessages(prev => new Map(prev).set(optimisticId, optimisticMessage));

    // Atualizar cache do React Query imediatamente
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (old: Message[] | undefined) => {
        const messages = old || [];
        const updated = [...messages, optimisticMessage as Message];
        
        const renderTime = performance.now() - startTime;
        console.log(`⚡ UI otimista renderizada em ${renderTime.toFixed(1)}ms`);
        
        return updated;
      }
    );

    // Configurar timeout para fallback
    const timeoutId = setTimeout(() => {
      console.warn(`⚠️ Timeout para mensagem otimista ${optimisticId}`);
      handleMessageError(optimisticId, new Error('Timeout no envio da mensagem'));
    }, 15000); // 15s timeout

    timeoutRef.current.set(optimisticId, timeoutId);

    return optimisticId;
  }, [conversationId, queryClient, generateOptimisticId]);

  const replaceOptimisticMessage = useCallback((optimisticId: string, realMessage: Message) => {
    // Limpar timeout
    const timeout = timeoutRef.current.get(optimisticId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRef.current.delete(optimisticId);
    }

    // Remover do cache local
    setPendingMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(optimisticId);
      return newMap;
    });

    // Substituir no cache do React Query
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (old: Message[] | undefined) => {
        if (!old) return [realMessage];
        
        return old.map(msg => {
          const optMsg = msg as any;
          if (optMsg.optimisticId === optimisticId) {
            return realMessage;
          }
          return msg;
        });
      }
    );

    console.log(`✅ Mensagem otimista ${optimisticId} substituída pela real ${realMessage.id}`);
  }, [conversationId, queryClient]);

  const handleMessageError = useCallback((optimisticId: string, error: Error) => {
    // Limpar timeout
    const timeout = timeoutRef.current.get(optimisticId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRef.current.delete(optimisticId);
    }

    // Marcar mensagem como erro
    setPendingMessages(prev => {
      const newMap = new Map(prev);
      const msg = newMap.get(optimisticId);
      if (msg) {
        newMap.set(optimisticId, { ...msg, status: 'error' });
      }
      return newMap;
    });

    // Atualizar visual da mensagem no cache
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (old: Message[] | undefined) => {
        if (!old) return [];
        
        return old.map(msg => {
          const optMsg = msg as any;
          if (optMsg.optimisticId === optimisticId) {
            return { ...msg, zapiStatus: 'ERROR', status: 'error' };
          }
          return msg;
        });
      }
    );

    onError?.(error, optimisticId);
    console.error(`❌ Erro na mensagem otimista ${optimisticId}:`, error.message);
  }, [conversationId, queryClient, onError]);

  const sendMessage = useMutation({
    mutationFn: async (messageData: Omit<InsertMessage, 'conversationId'>) => {
      const optimisticId = addOptimisticMessage(messageData);
      
      try {
        // Tentar Socket.IO primeiro
        if ((window as any).socketInstance?.connected) {
          return await sendViaSocket(messageData, optimisticId);
        } else {
          // Fallback para REST otimizado
          return await sendViaRest(messageData, optimisticId);
        }
      } catch (error) {
        handleMessageError(optimisticId, error as Error);
        throw error;
      }
    },
    onSuccess: (realMessage, variables, context) => {
      const optimisticId = (context as any)?.optimisticId;
      if (optimisticId) {
        replaceOptimisticMessage(optimisticId, realMessage);
      }
      onSuccess?.(realMessage);
    },
    onError: (error, variables, context) => {
      const optimisticId = (context as any)?.optimisticId;
      if (optimisticId) {
        handleMessageError(optimisticId, error as Error);
      }
    }
  });

  const sendViaSocket = async (messageData: Omit<InsertMessage, 'conversationId'>, optimisticId: string): Promise<Message> => {
    return new Promise((resolve, reject) => {
      const socket = (window as any).socketInstance;
      const timeout = setTimeout(() => {
        reject(new Error('Socket timeout'));
      }, 5000);

      socket.emit('send_message', {
        conversationId,
        ...messageData,
        optimisticId
      });

      socket.once('message_sent', (data: any) => {
        clearTimeout(timeout);
        if (data.optimisticId === optimisticId) {
          resolve(data.message);
        }
      });

      socket.once('message_error', (error: any) => {
        clearTimeout(timeout);
        if (error.optimisticId === optimisticId) {
          reject(new Error(error.message));
        }
      });
    });
  };

  const sendViaRest = async (messageData: Omit<InsertMessage, 'conversationId'>, optimisticId: string): Promise<Message> => {
    const response = await fetch(`/api/conversations/${conversationId}/messages/optimized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...messageData, optimisticId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const retryMessage = useCallback(async (optimisticId: string) => {
    const pendingMsg = pendingMessages.get(optimisticId);
    if (!pendingMsg) return;

    setPendingMessages(prev => {
      const newMap = new Map(prev);
      newMap.set(optimisticId, { ...pendingMsg, status: 'sending' });
      return newMap;
    });

    try {
      const realMessage = await sendViaRest({
        content: pendingMsg.content,
        messageType: pendingMsg.messageType,
        isInternalNote: pendingMsg.isInternalNote
      }, optimisticId);
      
      replaceOptimisticMessage(optimisticId, realMessage);
    } catch (error) {
      handleMessageError(optimisticId, error as Error);
    }
  }, [pendingMessages, replaceOptimisticMessage, handleMessageError]);

  return {
    sendMessage: sendMessage.mutate,
    isPending: sendMessage.isPending,
    pendingMessages: Array.from(pendingMessages.values()),
    retryMessage
  };
}