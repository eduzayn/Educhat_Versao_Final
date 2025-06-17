import { useInfiniteQuery } from '@tanstack/react-query';
import type { Message } from '@shared/schema';

interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextOffset?: number;
  total: number;
}

export function useInfiniteMessages(conversationId: number | null, pageSize: number = 50) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ['/api/conversations', conversationId, 'messages', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString()
      });
      
      console.log(`🔄 Carregando mensagens infinitas - offset: ${offset}, limit: ${pageSize}`);
      
      const response = await fetch(`/api/conversations/${conversationId}/messages?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Adaptar resposta para incluir paginação
      const messages = data.messages || [];
      const hasMore = messages.length === pageSize; // Se retornou o limite, provavelmente há mais
      
      console.log(`✅ Mensagens infinitas carregadas - ${messages.length} mensagens, hasMore: ${hasMore}`);
      
      return {
        messages: messages, // Ordem cronológica correta do servidor (antigas primeiro)
        hasMore,
        nextOffset: offset + pageSize,
        total: data.total || messages.length
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Se não há mais mensagens, retorna undefined
      if (!lastPage.hasMore || lastPage.messages.length < pageSize) {
        return undefined;
      }
      // Próximo offset é o número total de mensagens já carregadas
      return allPages.length * pageSize;
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 segundos
    gcTime: 1000 * 60 * 5, // 5 minutos de cache
    retry: 1,
    retryDelay: 500,
  });
}