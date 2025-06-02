import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark conversation as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache das conversas para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}