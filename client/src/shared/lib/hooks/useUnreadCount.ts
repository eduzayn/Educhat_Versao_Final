import { useQuery } from '@tanstack/react-query';

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: 3000, // Atualizar a cada 3 segundos
    staleTime: 1000, // Considerar dados obsoletos após 1 segundo
    gcTime: 5000, // Manter cache por 5 segundos
  });
}