import { useQuery } from '@tanstack/react-query';
import { QuickReply } from '@shared/schema';

/**
 * Hook para buscar respostas rápidas do usuário
 */
export function useQuickReplies() {
  return useQuery({
    queryKey: ['/api/quick-replies'],
    queryFn: async () => {
      const response = await fetch('/api/quick-replies');
      if (!response.ok) throw new Error('Erro ao buscar respostas rápidas');
      return response.json() as Promise<QuickReply[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar respostas rápidas filtradas por busca
 */
export function useSearchQuickReplies(searchTerm: string) {
  return useQuery({
    queryKey: ['/api/quick-replies/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      const params = new URLSearchParams({ q: searchTerm.trim() });
      const response = await fetch(`/api/quick-replies/search?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar respostas rápidas');
      return response.json() as Promise<QuickReply[]>;
    },
    enabled: Boolean(searchTerm.trim()),
    staleTime: 30 * 1000, // 30 segundos para busca
  });
}