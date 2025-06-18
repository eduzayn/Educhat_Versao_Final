import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useChatStore } from '@/shared/store/chatStore';

export function useTeamAssignment(conversationId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateActiveConversationAssignment, activeConversation } = useChatStore();

  return useMutation({
    mutationFn: async (data: { teamId: number | null; method: 'manual' | 'automatic' }) => {
      const response = await fetch(`/api/conversations/${conversationId}/assign-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atribuir equipe');
      return response.json();
    },
    onSuccess: (response, variables) => {
      // Atualizar store local imediatamente se esta é a conversa ativa
      if (activeConversation && activeConversation.id === conversationId) {
        updateActiveConversationAssignment(variables.teamId, null);
      }
      
      // Refetch imediato para garantir atualização da interface
      queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
      queryClient.refetchQueries({ queryKey: ['/api/conversations', conversationId] });
      
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
  const { updateActiveConversationAssignment, activeConversation } = useChatStore();

  return useMutation({
    mutationFn: async (data: { userId: number | null; method: 'manual' | 'automatic' }) => {
      const response = await fetch(`/api/conversations/${conversationId}/assign-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atribuir usuário');
      return response.json();
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