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
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 15000, // Considerar dados antigos após 15 segundos
  });
}