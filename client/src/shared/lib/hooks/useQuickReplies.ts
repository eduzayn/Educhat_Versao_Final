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
      const trimmedTerm = searchTerm.trim();
      
      // Se termo vazio ou muito curto, buscar todas as respostas rápidas
      if (!trimmedTerm || trimmedTerm.length < 2) {
        const response = await fetch('/api/quick-replies');
        if (!response.ok) throw new Error('Erro ao buscar respostas rápidas');
        return response.json() as Promise<QuickReply[]>;
      }
      
      const params = new URLSearchParams({ q: trimmedTerm });
      const response = await fetch(`/api/quick-replies/search?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar respostas rápidas');
      return response.json() as Promise<QuickReply[]>;
    },
    staleTime: 30 * 1000, // 30 segundos para busca
  });
}