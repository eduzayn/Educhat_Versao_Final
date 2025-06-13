import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

interface MessagePage {
  messages: Message[];
  nextOffset?: number;
  hasMore: boolean;
}

export function useInfiniteMessages(conversationId: number | null, limit = 50) {
  return useInfiniteQuery<MessagePage, Error, InfiniteData<MessagePage>, string[], number>({
    queryKey: [`/api/conversations/${conversationId}/messages/infinite`],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) throw new Error('Conversation ID required');
      
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?limit=${limit}&offset=${pageParam}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      const messages = Array.isArray(data) ? data : data.messages || [];
      
      return {
        messages,
        nextOffset: messages.length === limit ? (pageParam as number) + limit : undefined,
        hasMore: messages.length === limit
      } as MessagePage;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: false,
    refetchOnWindowFocus: false
  });
}