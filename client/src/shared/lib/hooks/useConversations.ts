import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

export function useConversations(initialLimit = 20, options = {}) {
  return useInfiniteQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations'],
    queryFn: async ({ pageParam = 1 }) => {
      const limit = pageParam === 1 ? initialLimit : 20; // Primeira página: inicial, demais: 20
      const response = await fetch(`/api/conversations?page=${pageParam}&limit=${limit}`);
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
    staleTime: 30000, // Cache válido por 30 segundos para reduzir requisições
    gcTime: 300000, // Cache mantido por 5 minutos
    refetchOnWindowFocus: false, // Evitar recarregamentos desnecessários
    refetchInterval: false, // WebSocket cuida das atualizações em tempo real
    ...options, // Permitir sobrescrever opções
  });
}

export function useConversation(id: number | null) {
  return useQuery<ConversationWithContact>({
    queryKey: ['/api/conversations', id],
    enabled: !!id,
    staleTime: 120000, // Cache por 2 minutos
    refetchInterval: false, // Sem polling - WebSocket atualiza
    refetchOnWindowFocus: false, // Evitar requisições ao trocar de aba
    gcTime: 300000, // Manter cache por 5 minutos
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