import { useInfiniteQuery } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

export function useInfiniteMessages(conversationId: number, pageSize: number = 100) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: pageSize.toString()
      });
      
      if (pageParam) {
        params.append('cursor', pageParam as string);
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 segundos
  });
}