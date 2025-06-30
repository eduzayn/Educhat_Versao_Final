import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/cacheConfig';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

interface ConversationFilters {
  userId?: number;
  teamId?: number;
  unassigned?: boolean;
  status?: string;
  channel?: string;
  channelId?: number;
  tagId?: number;
  dateFrom?: string;
  dateTo?: string;
  period?: string;
}

export function useConversations(initialLimit = 10, filters: ConversationFilters = {}, options = {}) {
  // OTIMIZAÇÃO: Reduzir limite inicial para carregamento mais rápido
  const optimizedInitialLimit = Math.min(initialLimit, 10); // Máximo 10 conversas iniciais
  
  // Construir parâmetros de filtro para a URL - CORREÇÃO: usar offset ao invés de page
  const buildFilterParams = (offset: number) => {
    const params = new URLSearchParams();
    
    const limit = offset === 0 ? optimizedInitialLimit : 15; // Primeira carga menor, seguintes maiores
    params.set('limit', limit.toString());
    params.set('offset', offset.toString()); // CORREÇÃO: Backend espera offset
    
    // CORREÇÃO CRÍTICA: Adicionar TODOS os filtros específicos
    if (filters.userId) {
      params.set('userId', filters.userId.toString());
    }
    if (filters.teamId) {
      params.set('teamId', filters.teamId.toString());
    }
    if (filters.unassigned) {
      params.set('unassigned', 'true');
    }
    if (filters.status) {
      params.set('status', filters.status);
    }
    if (filters.channel) {
      params.set('channel', filters.channel);
    }
    if (filters.channelId) {
      params.set('channelId', filters.channelId.toString());
    }
    if (filters.tagId) {
      params.set('tagId', filters.tagId.toString());
    }
    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo);
    }
    if (filters.period) {
      params.set('period', filters.period);
    }
    
    return params.toString();
  };

  return useInfiniteQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations', filters], // Incluir filtros na chave de cache
    queryFn: async ({ pageParam = 0 }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const queryString = buildFilterParams(offset);
      const response = await fetch(`/api/conversations?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    initialPageParam: 0, // CORREÇÃO: Começar do offset 0
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página retornou menos que o limite, não há mais páginas
      if (!lastPage || lastPage.length === 0) {
        return undefined;
      }
      
      // Calcular o limite da última página carregada
      const isFirstPage = allPages.length === 1;
      const lastPageLimit = isFirstPage ? optimizedInitialLimit : 15;
      
      // Se a última página não está cheia, chegamos ao fim
      if (lastPage.length < lastPageLimit) {
        return undefined;
      }
      
      // Calcular próximo offset (total de conversas já carregadas)
      const totalLoadedConversations = allPages.reduce((total, page) => total + page.length, 0);
      return totalLoadedConversations;
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