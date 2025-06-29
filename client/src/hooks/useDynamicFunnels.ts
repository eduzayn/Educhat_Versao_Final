import { useQuery } from '@tanstack/react-query';
import { getAllCategories, getAllCategoriesWithDynamic } from '@/shared/lib/crmFunnels';

/**
 * Hook para buscar funis dinamicamente incluindo equipes do banco
 * Garante que novos funis criados apareçam automaticamente na lista
 */
export function useDynamicFunnels() {
  return useQuery({
    queryKey: ['/api/teams/funnels'],
    queryFn: async () => {
      try {
        // Tentar buscar funis dinâmicos baseados nas equipes do banco
        return await getAllCategoriesWithDynamic();
      } catch (error) {
        console.warn('Falha ao buscar funis dinâmicos, usando estáticos:', error);
        // Fallback para funis estáticos
        return getAllCategories();
      }
    },
    staleTime: 60000, // Cache por 1 minuto
    refetchOnWindowFocus: false,
    retry: 1
  });
}