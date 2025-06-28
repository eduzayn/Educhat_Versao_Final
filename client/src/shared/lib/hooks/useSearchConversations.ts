import { useQuery } from '@tanstack/react-query';
import { CACHE_CONFIG } from '@/lib/cacheConfig';

/**
 * Hook para buscar conversas no banco de dados completo
 */
export function useSearchConversations(searchTerm: string) {
  return useQuery({
    queryKey: ['/api/conversations/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 1) {
        return [];
      }
      
      const response = await fetch(`/api/conversations/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!searchTerm && searchTerm.trim().length > 0,
    ...CACHE_CONFIG.REALTIME, // Usar configuração para dados em tempo real
  });
}