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
      console.log(`✅ [CACHE] Atualizando cache para conversa ${conversationId}`);
      
      // Atualizar cache específico da conversa individual
      queryClient.setQueryData(['/api/conversations', conversationId], (oldData: any) => {
        if (oldData) {
          console.log(`✅ [CACHE] Cache individual atualizado para conversa ${conversationId}`);
          // Resetar markedUnreadManually quando conversa é marcada como lida
          return { ...oldData, isRead: true, unreadCount: 0, markedUnreadManually: false };
        }
        return oldData;
      });
      
      // CORREÇÃO CRÍTICA: Atualizar TODAS as variações de cache com filtros diferentes
      const cacheKeys = queryClient.getQueryCache().getAll()
        .map(query => query.queryKey)
        .filter(key => 
          Array.isArray(key) && 
          key.length >= 1 && 
          key[0] === '/api/conversations' &&
          key.length === 2 // ['/api/conversations', filters]
        );
      
      console.log(`✅ [CACHE] Encontradas ${cacheKeys.length} chaves de cache para atualizar`);
      
      // Atualizar cada variação de cache de conversas
      cacheKeys.forEach(cacheKey => {
        queryClient.setQueryData(cacheKey, (oldData: any) => {
          if (oldData?.pages) {
            console.log(`✅ [CACHE] Atualizando páginas para chave:`, cacheKey);
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
      });
      
      // Atualizar contador de não lidas
      queryClient.setQueryData(['/api/conversations/unread-count'], (oldData: any) => {
        if (oldData && oldData.count > 0) {
          console.log(`✅ [CACHE] Contador atualizado: ${oldData.count} → ${oldData.count - 1}`);
          return { ...oldData, count: oldData.count - 1 };
        }
        return oldData;
      });
      
      // Invalidar queries para forçar recarregamento se necessário
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'], 
        exact: false // Invalidar todas as variações 
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