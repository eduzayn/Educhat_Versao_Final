import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CACHE_CONFIG } from '@/lib/cacheConfig';

/**
 * Hook para buscar conversas no banco de dados completo
 */
export function useSearchConversations(searchTerm: string) {
  return useQuery({
    queryKey: ['/api/conversations/search', searchTerm], // Key única por termo
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 1) {
        return [];
      }
      
      console.log(`🔍 Fazendo busca por: "${searchTerm}"`);
      const result = await apiRequest('GET', `/api/conversations/search?q=${encodeURIComponent(searchTerm)}`);
      console.log(`✅ Busca retornou:`, result?.length || 0, 'resultados');
      return result;
    },
    enabled: !!searchTerm && searchTerm.trim().length > 0,
    staleTime: 1000, // Cache por 1 segundo para evitar requisições excessivas
    gcTime: 5000, // Manter no cache por 5 segundos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}