import { useQuery } from '@tanstack/react-query';
import { useInfiniteConversations } from './useInfiniteConversations';
import type { ConversationWithContact } from '@shared/schema';

interface UseConversationsWithSearchProps {
  searchTerm?: string;
  limit?: number;
}

/**
 * Hook que utiliza busca no servidor quando há termo de busca,
 * caso contrário usa scroll infinito normal.
 * Para encontrar conversas antigas com 400+ conversas diárias.
 */
export function useConversationsWithSearch({ 
  searchTerm, 
  limit = 100 
}: UseConversationsWithSearchProps) {
  
  // Busca no servidor quando há termo de busca
  const searchQuery = useQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm?.trim()) return [];
      
      const response = await fetch(`/api/conversations?search=${encodeURIComponent(searchTerm.trim())}&limit=${limit * 2}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar conversas');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!searchTerm?.trim(),
    staleTime: 30000, // 30 segundos de cache
  });

  // Scroll infinito normal quando não há busca
  const infiniteQuery = useInfiniteConversations(limit, {
    enabled: !searchTerm?.trim()
  });

  // Retornar dados apropriados baseado no estado
  if (searchTerm?.trim()) {
    return {
      data: searchQuery.data || [],
      isLoading: searchQuery.isLoading,
      error: searchQuery.error,
      hasNextPage: false,
      fetchNextPage: () => {},
      isFetchingNextPage: false,
      isSearchMode: true
    };
  }

  // Achatar dados do scroll infinito
  const allConversations = infiniteQuery.data?.pages?.flatMap(page => 
    Array.isArray(page) ? page : page?.conversations || []
  ) || [];

  return {
    data: allConversations,
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isSearchMode: false
  };
}