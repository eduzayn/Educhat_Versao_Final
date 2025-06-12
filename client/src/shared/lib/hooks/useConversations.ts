import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  useApiResource, 
  useCreateResource, 
  useUpdateResource,
  resourceConfigs 
} from './useApiResource';
import type { ConversationWithContact, InsertConversation } from '@shared/schema';

export function useConversations(limit = 1000, options = {}) {
  return useApiResource<ConversationWithContact[]>({
    queryKey: ['/api/conversations', { limit }],
    endpoint: `/api/conversations?limit=${limit}&offset=0`,
    ...resourceConfigs.realtime
  }, options);
}

export function useConversation(id: number | null) {
  return useApiResource<ConversationWithContact>({
    queryKey: ['/api/conversations', id],
    endpoint: `/api/conversations/${id}`,
    enabled: !!id,
    ...resourceConfigs.realtime
  });
}

export function useCreateConversation() {
  return useCreateResource<ConversationWithContact, InsertConversation>(
    '/api/conversations',
    [['/api/conversations']]
  );
}

export function useUpdateConversation() {
  return useUpdateResource<ConversationWithContact, { id: number; conversation: Partial<InsertConversation> }>(
    ({ id }) => `/api/conversations/${id}`,
    ({ id }) => [['/api/conversations'], ['/api/conversations', id]],
    {
      mutationFn: async ({ id, conversation }) => {
        const response = await apiRequest('PATCH', `/api/conversations/${id}`, conversation);
        return response.json();
      }
    }
  );
}