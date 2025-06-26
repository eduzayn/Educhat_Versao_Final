import { useQuery } from '@tanstack/react-query';

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
    staleTime: 30000, // Cache por 30 segundos
    refetchOnWindowFocus: false
  });
}