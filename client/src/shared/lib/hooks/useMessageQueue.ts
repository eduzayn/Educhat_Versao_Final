import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../socket';
import { useLocalCache } from './useLocalCache';
import type { Message } from '@shared/schema';

interface QueuedMessage {
  id: string;
  conversationId: number;
  content: string;
  file?: File;
  messageType: 'text' | 'image' | 'audio' | 'document';
  status: 'queued' | 'sending' | 'sent' | 'error';
  error?: string;
  tempId?: string;
  retryCount: number;
}

export function useMessageQueue(conversationId: number) {
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const queryClient = useQueryClient();
  const processingRef = useRef(false);
  const maxRetries = 3;

  // Cache local para mensagens e conversas
  const messageCache = useLocalCache<Message>({ ttl: 60000, maxSize: 50 });
  const conversationCache = useLocalCache<any>({ ttl: 30000, maxSize: 20 });

  // Adicionar mensagem à fila com otimistic update
  const enqueueMessage = useCallback(async (
    content: string,
    messageType: QueuedMessage['messageType'] = 'text',
    file?: File
  ) => {
    const tempId = uuidv4();
    const newMessage: QueuedMessage = {
      id: tempId,
      conversationId,
      content,
      messageType,
      file,
      status: 'queued',
      retryCount: 0,
      tempId
    };

    // Adicionar à fila
    setMessageQueue(prev => [...prev, newMessage]);

    // Otimistic update na UI
    const optimisticMessage: Partial<Message> = {
      id: parseInt(tempId) || Date.now(), // Converter para number
      conversationId,
      content,
      messageType,
      isFromContact: false,
      sentAt: new Date(),
      status: 'sending',
      tempId
    };

    // Verificar cache antes de atualizar
    const cacheKey = `conversation:${conversationId}`;
    const cachedConversation = conversationCache.get(cacheKey);
    
    if (cachedConversation) {
      // Atualizar cache local primeiro
      const updatedConversation = {
        ...cachedConversation,
        messages: [...(cachedConversation.messages || []), optimisticMessage]
      };
      conversationCache.set(cacheKey, updatedConversation);
    }

    // Atualizar cache do React Query
    queryClient.setQueryData(
      ['conversation', conversationId],
      (old: any) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: [...old.messages, optimisticMessage]
        };
      }
    );

    // Iniciar processamento se não estiver em andamento
    if (!processingRef.current) {
      processQueue();
    }

    return tempId;
  }, [conversationId, queryClient, conversationCache]);

  // Processar fila de mensagens
  const processQueue = useCallback(async () => {
    if (processingRef.current || messageQueue.length === 0) return;
    processingRef.current = true;

    try {
      const message = messageQueue[0];
      
      // Se for mensagem com mídia, fazer upload em paralelo
      if (message.file) {
        await processMediaMessage(message);
      } else {
        await processTextMessage(message);
      }

      // Remover mensagem da fila após sucesso
      setMessageQueue(prev => prev.slice(1));
      
      // Atualizar status na UI
      const cacheKey = `conversation:${conversationId}`;
      const cachedConversation = conversationCache.get(cacheKey);
      
      if (cachedConversation) {
        const updatedConversation = {
          ...cachedConversation,
          messages: (cachedConversation.messages || []).map((msg: any) =>
            msg.tempId === message.tempId
              ? { ...msg, status: 'sent' }
              : msg
          )
        };
        conversationCache.set(cacheKey, updatedConversation);
      }

      queryClient.setQueryData(
        ['conversation', conversationId],
        (old: any) => {
          if (!old?.messages) return old;
          return {
            ...old,
            messages: old.messages.map((msg: any) =>
              msg.tempId === message.tempId
                ? { ...msg, status: 'sent' }
                : msg
            )
          };
        }
      );

    } catch (error) {
      // Atualizar status de erro na UI
      const cacheKey = `conversation:${conversationId}`;
      const cachedConversation = conversationCache.get(cacheKey);
      
      if (cachedConversation) {
        const updatedConversation = {
          ...cachedConversation,
          messages: (cachedConversation.messages || []).map((msg: any) =>
            msg.tempId === messageQueue[0].tempId
              ? { ...msg, status: 'error', error: error instanceof Error ? error.message : 'Erro desconhecido' }
              : msg
          )
        };
        conversationCache.set(cacheKey, updatedConversation);
      }

      queryClient.setQueryData(
        ['conversation', conversationId],
        (old: any) => {
          if (!old?.messages) return old;
          return {
            ...old,
            messages: old.messages.map((msg: any) =>
              msg.tempId === messageQueue[0].tempId
                ? { ...msg, status: 'error', error: error instanceof Error ? error.message : 'Erro desconhecido' }
                : msg
            )
          };
        }
      );

      // Incrementar contador de tentativas
      setMessageQueue(prev => {
        const [current, ...rest] = prev;
        if (current.retryCount >= maxRetries) {
          return rest;
        }
        return [{ ...current, retryCount: current.retryCount + 1, status: 'error' }, ...rest];
      });
    } finally {
      processingRef.current = false;
      
      // Continuar processando se houver mais mensagens
      if (messageQueue.length > 1) {
        processQueue();
      }
    }
  }, [messageQueue, conversationId, queryClient, conversationCache]);

  // Processar mensagem de texto
  const processTextMessage = async (message: QueuedMessage) => {
    return new Promise((resolve, reject) => {
      socket.emit('send_message', {
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
        tempId: message.tempId
      }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  };

  // Processar mensagem com mídia
  const processMediaMessage = async (message: QueuedMessage) => {
    if (!message.file) return;

    // Criar FormData para upload
    const formData = new FormData();
    formData.append('file', message.file);
    formData.append('conversationId', message.conversationId.toString());
    formData.append('messageType', message.messageType);
    formData.append('tempId', message.tempId || '');

    // Upload da mídia em paralelo
    const uploadPromise = fetch('/api/messages/upload', {
      method: 'POST',
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error('Falha no upload');
      return res.json();
    });

    // Enviar mensagem via socket em paralelo
    const socketPromise = new Promise((resolve, reject) => {
      socket.emit('send_message', {
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
        tempId: message.tempId
      }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });

    // Aguardar ambas as operações
    await Promise.all([uploadPromise, socketPromise]);
  };

  // Retentar envio de mensagem
  const retryMessage = useCallback((tempId: string) => {
    setMessageQueue(prev => {
      const index = prev.findIndex(msg => msg.tempId === tempId);
      if (index === -1) return prev;
      
      const newQueue = [...prev];
      newQueue[index] = { ...newQueue[index], status: 'queued', retryCount: 0 };
      return newQueue;
    });

    if (!processingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  return {
    enqueueMessage,
    retryMessage,
    messageQueue,
    messageCache,
    conversationCache
  };
} 