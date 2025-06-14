import { useQuery } from '@tanstack/react-query';

interface DashboardMetrics {
  activeConversations: number;
  newContacts: {
    today: number;
    week: number;
  };
  responseRate: number;
  averageResponseTime: number;
  channels: Array<{
    name: string;
    count: number;
  }>;
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 60000, // Reduzido para 1 minuto para evitar polling excessivo
    staleTime: 30000, // Cache válido por 30 segundos
    gcTime: 120000, // Manter cache por 2 minutos
    refetchOnWindowFocus: false, // Evitar refetch ao focar janela
    refetchIntervalInBackground: false, // Parar polling em aba inativa
  });
}