import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/cacheConfig';

/**
 * Hook para buscar conversas no banco de dados completo
 */
export function useSearchConversations(searchTerm: string) {
  return useQuery({
    queryKey: ['/api/conversations/search', searchTerm, Date.now()], // Força query única
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 1) {
        return [];
      }
      
      console.log(`🔍 Fazendo busca por: "${searchTerm}"`);
      const result = await apiRequest(`/api/conversations/search?q=${encodeURIComponent(searchTerm)}`);
      console.log(`✅ Busca retornou:`, result?.length || 0, 'resultados');
      return result;
    },
    enabled: !!searchTerm && searchTerm.trim().length > 0,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Sem cache para debug (TanStack Query v5)
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}