import { useInfiniteQuery } from '@tanstack/react-query';
import type { ConversationWithContact } from '@shared/schema';

interface ConversationsResponse {
  conversations: ConversationWithContact[];
  hasNextPage: boolean;
  total: number;
}

interface UseInfiniteConversationsOptions {
  searchTerm?: string;
  enabled?: boolean;
  refetchInterval?: number | false;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

export function useInfiniteConversations(
  limit = 100, 
  options: UseInfiniteConversationsOptions = {}
) {
  const { searchTerm, ...queryOptions } = options;
  
  return useInfiniteQuery<ConversationsResponse>({
    queryKey: ['/api/conversations', { limit, searchTerm }],
    queryFn: async ({ pageParam = 0 }: { pageParam: unknown }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (searchTerm?.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const response = await fetch(`/api/conversations?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar conversas');
      }
      
      const data = await response.json();
      
      // Adaptar resposta se for array simples (busca)
      if (Array.isArray(data)) {
        return {
          conversations: data,
          hasNextPage: data.length === limit,
          total: data.length
        };
      }
      
      // Resposta com paginação (formato padrão)
      return {
        conversations: data.conversations || [],
        hasNextPage: data.hasNextPage || false,
        total: data.total || 0
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      // Para busca, desabilita paginação infinita (carrega tudo de uma vez)
      if (searchTerm?.trim()) return undefined;
      
      // Debug logging
      const totalLoaded = allPages.reduce((total, page) => total + page.conversations.length, 0);
      console.log('📦 hasNextPage Debug:', {
        hasNextPage: lastPage.hasNextPage,
        conversationsInLastPage: lastPage.conversations.length,
        totalLoaded,
        allPagesCount: allPages.length,
        searchTerm: searchTerm?.trim()
      });
      
      // Se não há próxima página ou não carregou conversas suficientes, parar paginação
      if (!lastPage.hasNextPage || lastPage.conversations.length === 0) {
        console.log('🛑 Stopping pagination - hasNextPage:', lastPage.hasNextPage, 'conversations:', lastPage.conversations.length);
        return undefined;
      }
      
      // Calcular offset baseado no total de conversas já carregadas
      console.log('➡️ Next page offset:', totalLoaded);
      return totalLoaded;
    },
    initialPageParam: 0,
    staleTime: searchTerm?.trim() ? 30000 : 5000, // Cache mais longo para buscas
    refetchInterval: false,
    refetchOnWindowFocus: false,
    ...queryOptions
  });
}