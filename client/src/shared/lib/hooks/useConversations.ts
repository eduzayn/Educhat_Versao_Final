import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/cacheConfig';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

interface ConversationFilters {
  userId?: number;
  teamId?: number;
  unassigned?: boolean;
}

export function useConversations(initialLimit = 10, filters: ConversationFilters = {}, options = {}) {
  // OTIMIZAÇÃO: Reduzir limite inicial para carregamento mais rápido
  const optimizedInitialLimit = Math.min(initialLimit, 10); // Máximo 10 conversas iniciais
  
  // Construir parâmetros de filtro para a URL
  const buildFilterParams = (pageParam: number) => {
    const params = new URLSearchParams();
    params.set('page', pageParam.toString());
    
    const limit = pageParam === 1 ? optimizedInitialLimit : 15; // Páginas seguintes um pouco maiores
    params.set('limit', limit.toString());
    
    // Adicionar filtros específicos
    if (filters.userId) {
      params.set('userId', filters.userId.toString());
    }
    if (filters.teamId) {
      params.set('teamId', filters.teamId.toString());
    }
    if (filters.unassigned) {
      params.set('unassigned', 'true');
    }
    
    return params.toString();
  };

  return useInfiniteQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations', filters], // Incluir filtros na chave de cache
    queryFn: async ({ pageParam = 1 }) => {
      const pageNumber = typeof pageParam === 'number' ? pageParam : 1;
      const queryString = buildFilterParams(pageNumber);
      const response = await fetch(`/api/conversations?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    initialPageParam: 1, // Parâmetro obrigatório para TanStack Query v5
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página retornou menos que o limite, não há mais páginas
      const pageLimit = allPages.length === 1 ? initialLimit : 20;
      if (lastPage.length < pageLimit) return undefined;
      return allPages.length + 1;
    },
    ...CACHE_CONFIG.CONVERSATIONS, // Usar configuração padronizada
    ...options, // Permitir sobrescrever opções
  });
}

export function useConversation(id: number | null) {
  return useQuery<ConversationWithContact>({
    queryKey: ['/api/conversations', id],
    enabled: !!id,
    ...CACHE_CONFIG.CONVERSATIONS, // Usar configuração padronizada
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

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, conversation }: { id: number; conversation: Partial<InsertConversation> }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, conversation);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', id] });
    },
  });
}