import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

export function useConversations(limit = 1000, options = {}) {
  return useQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations', { limit }],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?limit=${limit}&offset=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    staleTime: 0, // Dados sempre considerados obsoletos para permitir atualizações
    gcTime: 60000, // Cache reduzido para 1 minuto
    refetchOnWindowFocus: true, // Recarregar ao focar na janela
    refetchInterval: 10000, // Atualizar a cada 10 segundos
    ...options, // Permitir sobrescrever opções
  });
}

export function useConversation(id: number | null) {
  return useQuery<ConversationWithContact>({
    queryKey: ['/api/conversations', id],
    enabled: !!id,
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