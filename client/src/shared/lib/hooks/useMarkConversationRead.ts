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
      
      // Invalidar apenas contador de não lidas sem forçar refetch das conversas
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations/unread-count'],
        refetchType: 'none' // Apenas marca como stale, não força refetch
      });
    },
  });
}