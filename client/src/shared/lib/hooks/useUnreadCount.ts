import { useQuery } from '@tanstack/react-query';

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['/api/conversations/unread-count'],
    refetchInterval: 30000, // Reduzido para 30 segundos para evitar requests excessivos
    staleTime: 15000, // Cache válido por 15 segundos
    gcTime: 60000, // Manter cache por 1 minuto
    refetchOnWindowFocus: false, // Evitar refetch ao focar janela
    refetchIntervalInBackground: false, // Parar polling em aba inativa
  });
}