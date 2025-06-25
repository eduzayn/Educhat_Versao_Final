import { useQuery } from '@tanstack/react-query';

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: false, // WebSocket atualiza automaticamente
    staleTime: 60000, // Cache válido por 1 minuto
    gcTime: 300000, // Manter cache por 5 minutos
    refetchOnWindowFocus: false, // Evitar requisições ao trocar de aba
  });
}