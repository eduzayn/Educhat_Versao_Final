import { useInfiniteQuery } from '@tanstack/react-query';
import type { ConversationWithContact } from '@shared/schema';

interface ConversationsResponse {
  conversations: ConversationWithContact[];
  hasNextPage: boolean;
  total: number;
}

export function useInfiniteConversations(limit = 50, options = {}) {
  return useInfiniteQuery<ConversationsResponse>({
    queryKey: ['/api/conversations/infinite', { limit }],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/conversations?limit=${limit}&offset=${pageParam}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar conversas');
      }
      
      const data = await response.json();
      
      // Adaptar resposta se for array simples
      if (Array.isArray(data)) {
        return {
          conversations: data,
          hasNextPage: data.length === limit,
          total: data.length
        };
      }
      
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasNextPage) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    ...options
  });
}