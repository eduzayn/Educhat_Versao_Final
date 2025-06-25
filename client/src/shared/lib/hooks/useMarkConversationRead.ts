import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRef } from 'react';

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  
  // PROTEÇÃO ANTI-429: Controlar requisições pendentes no nível do hook
  const pendingRequests = useRef<Set<number>>(new Set());
  
  return useMutation({
    mutationFn: async (conversationId: number) => {
      // BLOQUEIO: Se já existe requisição pendente para esta conversa, cancelar
      if (pendingRequests.current.has(conversationId)) {
        throw new Error(`Requisição já pendente para conversa ${conversationId}`);
      }
      
      // Adicionar à lista de pendentes
      pendingRequests.current.add(conversationId);
      
      try {
        const data = await apiRequest('PATCH', `/api/conversations/${conversationId}/read`);
        return data;
      } finally {
        // SEMPRE remover da lista de pendentes, mesmo em caso de erro
        pendingRequests.current.delete(conversationId);
      }
    },
    onSuccess: (_, conversationId) => {
      // Atualizar cache específico ao invés de invalidar tudo
      queryClient.setQueryData(['/api/conversations', conversationId], (oldData: any) => {
        if (oldData) {
          return { ...oldData, isRead: true, unreadCount: 0, markedUnreadManually: false };
        }
        return oldData;
      });
      
      // Atualizar a lista de conversas para remover o indicador visual
      queryClient.setQueryData(['/api/conversations'], (oldData: any) => {
        if (oldData?.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any[]) => 
              page.map((conversation: any) => 
                conversation.id === conversationId
                  ? { ...conversation, isRead: true, unreadCount: 0, markedUnreadManually: false }
                  : conversation
              )
            )
          };
        }
        return oldData;
      });
      
      // Atualizar contador de não lidas diretamente sem invalidar
      queryClient.setQueryData(['/api/conversations/unread-count'], (oldData: any) => {
        if (oldData && oldData.count > 0) {
          return { ...oldData, count: oldData.count - 1 };
        }
        return oldData;
      });
    },
    onError: (error, conversationId) => {
      // Silenciar erros de requisições duplicadas para evitar spam no console
      if (!error.message.includes('já pendente')) {
        console.error(`❌ Falha ao marcar conversa ${conversationId} como lida:`, {
          error: error.message,
          conversationId,
          timestamp: new Date().toISOString()
        });
      }
    },
  });
}