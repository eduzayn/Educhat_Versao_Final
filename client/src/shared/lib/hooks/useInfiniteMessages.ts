import { useQuery } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

export function useInfiniteMessages(conversationId: number | null, limit = 200) {
  return useQuery({
    queryKey: [`/api/conversations/${conversationId}/messages`, { limit }],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID required');
      
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?limit=${limit}&offset=0`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      const messages = Array.isArray(data) ? data : data.messages || [];
      
      return messages as Message[];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: false,
    refetchOnWindowFocus: false
  });
}