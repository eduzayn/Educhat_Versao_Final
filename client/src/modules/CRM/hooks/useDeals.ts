import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Deal } from '@/shared/schema';

export function useDeals(team: string, page: number = 1, limit: number = 50, search: string = '') {
  const queryClient = useQueryClient();

  // Buscar negócios
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/deals', { page, limit, team, search }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/deals?page=${page}&limit=${limit}&team=${team}&search=${encodeURIComponent(search)}`);
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  // Mutation para criar negócio
  const createDeal = useMutation({
    mutationFn: async (dealData: any) => {
      const response = await apiRequest('POST', '/api/deals', dealData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    }
  });

  // Mutation para atualizar negócio
  const updateDeal = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: number; stage: string }) => {
      const response = await apiRequest('PATCH', `/api/deals/${dealId}`, { stage });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
    }
  });

  return {
    deals: data?.deals || [],
    isLoading,
    error,
    createDeal,
    updateDeal,
  };
} 