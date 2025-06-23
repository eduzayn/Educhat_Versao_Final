/**
 * Hook para escutar mensagens via Socket.IO com fallback automático
 * Gerencia broadcast_message e substitui mensagens otimistas
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

interface SocketMessageData {
  type: 'new_message';
  message: Message;
  conversationId: number;
  optimisticId?: string;
  dbTime?: string;
}

export function useSocketMessageListener(conversationId: number | null) {
  const queryClient = useQueryClient();
  const processedMessages = useRef(new Set<string>());

  useEffect(() => {
    if (!conversationId) return;

    const socket = (window as any).socketInstance;
    if (!socket) return;

    const handleBroadcastMessage = (data: SocketMessageData) => {
      // CORREÇÃO CRÍTICA: Sistema inteligente de deduplicação
      const messageKey = `${data.message.id}_${data.conversationId}`;
      const isOptimisticUpdate = data.optimisticId && data.message.id > 0;
      const isGlobalFallback = data.fallbackBroadcast === true;
      
      // Permitir reprocessamento para:
      // 1. Atualizações otimistas (ID temporário sendo substituído)
      // 2. Fallback global (quando sala estava vazia)
      if (processedMessages.current.has(messageKey) && !isOptimisticUpdate && !isGlobalFallback) {
        console.log(`⏩ Mensagem ${messageKey} já processada, ignorando duplicata`);
        return;
      }
      
      processedMessages.current.add(messageKey);
      
      console.log(`📡 Processando mensagem ${data.message.id} para conversa ${data.conversationId}`, {
        isOptimisticUpdate,
        isGlobalFallback,
        deliveryMethod: data.deliveryMethod || 'unknown'
      });

      // Limpar cache antigas (manter apenas últimas 100)
      if (processedMessages.current.size > 100) {
        const oldEntries = Array.from(processedMessages.current).slice(0, 50);
        oldEntries.forEach(key => processedMessages.current.delete(key));
      }

      console.log(`📡 Recebendo broadcast para conversa ${data.conversationId}, mensagem ${data.message.id}`);

      // Atualizar cache de mensagens
      queryClient.setQueryData(
        ['/api/conversations', data.conversationId, 'messages'],
        (old: Message[] | undefined) => {
          const messages = old || [];
          
          // SISTEMA SIMPLIFICADO: Apenas verificar se mensagem já existe e adicionar se necessário
          const exists = messages.some(msg => msg.id === data.message.id);
          if (!exists) {
            return [...messages, data.message];
          }
          return messages;
        }
      );

      // Atualizar lista de conversas se necessário
      queryClient.setQueryData(
        ['/api/conversations'],
        (old: any) => {
          if (!old?.conversations) return old;
          
          return {
            ...old,
            conversations: old.conversations.map((conv: any) => 
              conv.id === data.conversationId 
                ? { 
                    ...conv, 
                    lastMessageAt: data.message.sentAt,
                    unreadCount: conv.id === conversationId ? conv.unreadCount : (conv.unreadCount || 0) + 1
                  }
                : conv
            )
          };
        }
      );
    };

    const handleMessageSent = (data: { message: Message; processTime: string }) => {
      console.log(`✅ Confirmação de envio recebida: ${data.message.id} (${data.processTime}ms)`);
      
      // Mesmo tratamento que broadcast_message
      handleBroadcastMessage({
        type: 'new_message',
        message: data.message,
        conversationId: data.message.conversationId
      });
    };

    const handleMessageError = (error: { message: string; processTime: string }) => {
      console.error(`❌ Erro no envio da mensagem: ${error.message} (${error.processTime}ms)`);
      // Sem ação necessária - não há mensagem otimista para marcar como erro
    };

    // Registrar listeners
    socket.on('broadcast_message', handleBroadcastMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_error', handleMessageError);

    // Entrar na sala da conversa
    console.log(`🏠 Listener: Entrando na sala da conversa ${conversationId}`);
    socket.emit('join_conversation', { conversationId });
    
    // Confirmar entrada na sala
    const handleJoinedConversation = (data: any) => {
      if (data.conversationId === conversationId) {
        if (data.success) {
          console.log(`✅ Listener: Confirmado entrada na sala da conversa ${conversationId}`);
        } else {
          console.error(`❌ Listener: Falha ao entrar na sala da conversa ${conversationId}:`, data.error);
        }
      }
    };
    
    socket.on('joined_conversation', handleJoinedConversation);

    return () => {
      socket.off('broadcast_message', handleBroadcastMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_error', handleMessageError);
      socket.off('joined_conversation', handleJoinedConversation);
    };
  }, [conversationId, queryClient]);
}