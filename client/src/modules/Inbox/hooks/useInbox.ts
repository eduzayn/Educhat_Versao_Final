import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ConversationWithContact, Conversation } from '@/types/chat';

export function useConversations() {
  return useQuery<ConversationWithContact[]>({
    queryKey: ['/api/conversations'],
    refetchInterval: 30000, // Refetch every 30 seconds
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
    mutationFn: async (conversation: Partial<Conversation>) => {
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<Conversation> }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', id] });
    },
  });
}