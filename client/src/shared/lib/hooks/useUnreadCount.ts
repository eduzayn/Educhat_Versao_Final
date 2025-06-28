import { useQuery } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/lib/cacheConfig';

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['/api/conversations/unread-count'],
    ...CACHE_CONFIG.REALTIME, // Usar configuração para dados em tempo real
  });
}