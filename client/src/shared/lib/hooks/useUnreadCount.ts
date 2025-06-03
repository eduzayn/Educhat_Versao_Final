import { useQuery } from '@tanstack/react-query';

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    staleTime: 1000, // Considerar dados obsoletos após 1 segundo
  });
}