import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

interface ConversationsResponse {
  conversations: ConversationWithContact[];
  hasMore: boolean;
  totalCount: number;
}

export function useInfiniteConversations(pageSize = 50, options = {}) {
  return useInfiniteQuery({
    queryKey: ['/api/conversations', 'infinite', { pageSize }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/conversations?page=${pageParam}&limit=${pageSize}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const conversations = await response.json();
      
      return {
        conversations,
        hasMore: conversations.length === pageSize,
        totalCount: conversations.length,
        currentPage: pageParam,
        nextPage: conversations.length === pageSize ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 0,
    gcTime: 60000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversation: InsertConversation) => {
      const response = await apiRequest('POST', '/api/conversations', conversation);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}