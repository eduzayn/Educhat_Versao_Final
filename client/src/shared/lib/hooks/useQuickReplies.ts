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
 * Hook para buscar respostas rápidas filtradas por busca inteligente
 */
export function useSearchQuickReplies(searchTerm: string) {
  return useQuery({
    queryKey: ['/api/quick-replies/search', searchTerm],
    queryFn: async () => {
      const trimmedTerm = searchTerm.trim();
      
      // Buscar todas as respostas rápidas
      const response = await fetch('/api/quick-replies');
      if (!response.ok) throw new Error('Erro ao buscar respostas rápidas');
      const allReplies = await response.json() as QuickReply[];
      
      // Se termo vazio, retornar todas
      if (!trimmedTerm) {
        return allReplies;
      }
      
      const searchQuery = trimmedTerm.toLowerCase();
      
      // Implementar busca inteligente com score de relevância
      const scoredReplies = allReplies.map((reply) => {
        let score = 0;
        const title = (reply.title || '').toLowerCase();
        const content = (reply.content || '').toLowerCase();
        
        // Score mais alto para correspondência exata no início do título
        if (title.startsWith(searchQuery)) {
          score += 100;
        }
        // Score alto para correspondência no início de palavra no título
        else if (title.includes(' ' + searchQuery) || title.includes('-' + searchQuery)) {
          score += 80;
        }
        // Score médio para correspondência em qualquer lugar do título
        else if (title.includes(searchQuery)) {
          score += 60;
        }
        
        // Score para correspondência no conteúdo
        if (content.includes(searchQuery)) {
          score += 20;
        }
        
        // Bonus para correspondências de palavras completas
        const titleWords = title.split(/[\s\-_]+/);
        const hasExactWordMatch = titleWords.some(word => 
          word === searchQuery || word.startsWith(searchQuery)
        );
        if (hasExactWordMatch) {
          score += 40;
        }
        
        // Bonus extra para correspondência que inclui múltiplas palavras do termo de busca
        const searchWords = searchQuery.split(/\s+/);
        if (searchWords.length > 1) {
          const matchedWords = searchWords.filter(searchWord =>
            title.includes(searchWord)
          );
          if (matchedWords.length === searchWords.length) {
            score += 30; // Todas as palavras encontradas
          } else if (matchedWords.length > 1) {
            score += 15; // Algumas palavras encontradas
          }
        }
        
        return { ...reply, searchScore: score };
      });
      
      // Filtrar apenas respostas com score > 0 e ordenar por relevância
      return scoredReplies
        .filter(reply => reply.searchScore > 0)
        .sort((a, b) => {
          // Primeiro por score, depois por uso, depois alfabético
          if (b.searchScore !== a.searchScore) {
            return b.searchScore - a.searchScore;
          }
          if (b.usageCount !== a.usageCount) {
            return (b.usageCount || 0) - (a.usageCount || 0);
          }
          return (a.title || '').localeCompare(b.title || '');
        });
    },
    staleTime: 30 * 1000, // 30 segundos para busca
  });
}