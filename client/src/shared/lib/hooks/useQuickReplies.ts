import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QuickReply } from '@shared/schema';

export function useQuickReplies() {
  return useQuery<QuickReply[]>({
    queryKey: ['/api/quick-replies'],
    queryFn: async () => {
      const response = await fetch('/api/quick-replies');
      if (!response.ok) throw new Error('Falha ao carregar respostas rápidas');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}



export function useIncrementQuickReplyUsage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/quick-replies/${id}/increment-usage`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Falha ao incrementar uso');
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['/api/quick-replies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-replies/most-used'] });
    },
  });
}