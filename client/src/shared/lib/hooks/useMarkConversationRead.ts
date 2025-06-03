import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest('PATCH', `/api/conversations/${conversationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate conversations cache to refresh unread counts
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}