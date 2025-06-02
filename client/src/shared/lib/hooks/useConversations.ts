import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

export function useConversations(limit = 30) {
  return useInfiniteQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations', { limit }],
    queryFn: async ({ pageParam = 0 }) => {
      console.log(`🔄 Buscando conversas: limit=${limit}, offset=${pageParam}`);
      const response = await fetch(`/api/conversations?limit=${limit}&offset=${pageParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      console.log(`📄 Conversas recebidas: ${data.length} itens`);
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      console.log(`🔍 Verificando próxima página: lastPage.length=${lastPage.length}, limit=${limit}, allPages.length=${allPages.length}`);
      // Se a última página tem menos itens que o limite, não há mais páginas
      if (lastPage.length < limit) {
        console.log(`⛔ Não há mais páginas (lastPage.length < limit)`);
        return undefined;
      }
      // Próxima página começa no offset atual + itens carregados
      const nextOffset = allPages.length * limit;
      console.log(`➡️ Próxima página: offset=${nextOffset}`);
      return nextOffset;
    },
    initialPageParam: 0,
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