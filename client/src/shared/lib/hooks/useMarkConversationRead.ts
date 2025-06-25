import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest('PATCH', `/api/conversations/${conversationId}/read`);
      return response.json();
    },
    onSuccess: (_, conversationId) => {
      // Atualizar cache específico ao invés de invalidar tudo
      queryClient.setQueryData(['/api/conversations', conversationId], (oldData: any) => {
        if (oldData) {
          return { ...oldData, isRead: true, unreadCount: 0 };
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
  });
}