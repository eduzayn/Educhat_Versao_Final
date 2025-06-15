import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { AssignmentMutationData } from '../types';

export function useTeamAssignment(conversationId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { teamId: number | null; method: 'manual' | 'automatic' }) => {
      return apiRequest(`/api/conversations/${conversationId}/assign-team`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
      
      toast({
        title: 'Equipe atribuída',
        description: variables.teamId === null 
          ? 'Conversa movida para fila neutra'
          : 'Conversa atribuída com sucesso',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao atribuir equipe',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

export function useUserAssignment(conversationId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: number | null; method: 'manual' | 'automatic' }) => {
      return apiRequest(`/api/conversations/${conversationId}/assign-user`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
      
      toast({
        title: 'Usuário atribuído',
        description: variables.userId === null
          ? 'Atribuição removida'
          : 'Conversa atribuída ao usuário',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao atribuir usuário',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}