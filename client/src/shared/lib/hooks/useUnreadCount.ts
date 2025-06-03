import { useQuery } from '@tanstack/react-query';

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: 2000, // Atualizar a cada 2 segundos
    staleTime: 500, // Considerar dados obsoletos após 500ms
  });
}