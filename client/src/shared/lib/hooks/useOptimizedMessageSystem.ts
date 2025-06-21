/**
 * Hook unificado para sistema de mensagens otimizado
 * Combina UI otimista, Socket.IO e fallback REST
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOptimizedMessageSender } from './useOptimizedMessageSender';
import { useSocketMessageListener } from './useSocketMessageListener';
import { useMessages } from './useMessages';
import type { InsertMessage, Message } from '@shared/schema';

interface UseOptimizedMessageSystemOptions {
  conversationId: number | null;
  onMessageSent?: (message: Message) => void;
  onMessageError?: (error: Error, optimisticId: string) => void;
  enableSocket?: boolean;
}

export function useOptimizedMessageSystem({
  conversationId,
  onMessageSent,
  onMessageError,
  enableSocket = true
}: UseOptimizedMessageSystemOptions) {
  const queryClient = useQueryClient();
  const performanceMetrics = useRef({
    totalMessages: 0,
    averageRenderTime: 0,
    errorCount: 0,
    socketSuccessRate: 0
  });

  // Hook para carregar mensagens
  const messagesQuery = useMessages(conversationId);

  // Hook para envio otimizado
  const messageSender = conversationId ? useOptimizedMessageSender({
    conversationId,
    onSuccess: (message) => {
      performanceMetrics.current.totalMessages++;
      onMessageSent?.(message);
      console.log(`✅ Mensagem ${message.id} enviada com sucesso`);
    },
    onError: (error, optimisticId) => {
      performanceMetrics.current.errorCount++;
      onMessageError?.(error, optimisticId);
      console.error(`❌ Erro ao enviar mensagem ${optimisticId}:`, error.message);
    }
  }) : null;

  // Hook para listener Socket.IO
  useSocketMessageListener(enableSocket && conversationId ? conversationId : null);

  // Função unificada para envio de mensagens
  const sendMessage = useCallback(async (messageData: Omit<InsertMessage, 'conversationId'>) => {
    if (!conversationId || !messageSender) {
      throw new Error('Conversa não selecionada');
    }

    const startTime = performance.now();
    console.log(`📤 Iniciando envio de mensagem: "${messageData.content}"`);

    try {
      messageSender.sendMessage(messageData);
      
      const duration = performance.now() - startTime;
      console.log(`⚡ Mensagem processada em ${duration.toFixed(1)}ms`);
      
      // Atualizar métricas de performance
      const currentAvg = performanceMetrics.current.averageRenderTime;
      const total = performanceMetrics.current.totalMessages;
      performanceMetrics.current.averageRenderTime = 
        (currentAvg * total + duration) / (total + 1);
        
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }, [conversationId, messageSender]);

  // Função para retry de mensagens com erro
  const retryMessage = useCallback((optimisticId: string) => {
    if (!messageSender) return;
    
    console.log(`🔄 Tentando reenviar mensagem ${optimisticId}`);
    messageSender.retryMessage(optimisticId);
  }, [messageSender]);

  // Função para marcar mensagens como lidas
  const markAsRead = useCallback(async (messageIds: number[]) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds })
      });

      if (response.ok) {
        // Atualizar cache local
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages'],
          (old: Message[] | undefined) => {
            if (!old) return [];
            
            return old.map(msg => 
              messageIds.includes(msg.id) 
                ? { ...msg, readAt: new Date().toISOString() }
                : msg
            );
          }
        );
      }
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
    }
  }, [conversationId, queryClient]);

  // Função para obter métricas de performance
  const getPerformanceMetrics = useCallback(() => {
    return {
      ...performanceMetrics.current,
      successRate: performanceMetrics.current.totalMessages > 0 
        ? ((performanceMetrics.current.totalMessages - performanceMetrics.current.errorCount) / performanceMetrics.current.totalMessages) * 100 
        : 0
    };
  }, []);

  // Função para limpar cache de mensagens
  const clearMessageCache = useCallback(() => {
    if (!conversationId) return;
    
    queryClient.removeQueries({
      queryKey: ['/api/conversations', conversationId, 'messages']
    });
    
    console.log(`🧹 Cache de mensagens limpo para conversa ${conversationId}`);
  }, [conversationId, queryClient]);

  // Verificar se Socket.IO está conectado
  const isSocketConnected = useCallback(() => {
    return (window as any).socketInstance?.connected || false;
  }, []);

  // Status do sistema
  const systemStatus = {
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    isPending: messageSender?.isPending || false,
    isSocketConnected: isSocketConnected(),
    hasMessages: (messagesQuery.data?.length || 0) > 0,
    pendingMessages: messageSender?.pendingMessages || [],
    errorCount: performanceMetrics.current.errorCount
  };

  return {
    // Dados
    messages: messagesQuery.data || [],
    
    // Ações
    sendMessage,
    retryMessage,
    markAsRead,
    clearMessageCache,
    
    // Status
    ...systemStatus,
    
    // Utilitários
    getPerformanceMetrics,
    refetch: messagesQuery.refetch,
    
    // Query original para compatibilidade
    messagesQuery
  };
}