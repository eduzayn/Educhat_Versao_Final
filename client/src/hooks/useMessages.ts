import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@/types/chat';

export function useMessages(conversationId: number | null) {
  return useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: number; message: Omit<InsertMessage, 'conversationId'> }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      return response.json();
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}
