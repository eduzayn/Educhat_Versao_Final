import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useChatStore } from '@/shared/store/chatStore';
import { canPerformAssignment } from '@/utils/assignmentDebounce';

export function useTeamAssignment(conversationId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateActiveConversationAssignment, activeConversation } = useChatStore();

  return useMutation({
    mutationFn: async (data: { teamId: number | null; method: 'manual' | 'automatic' }) => {
      // CORREÇÃO CRÍTICA: Verificar se atribuição pode ser executada
      if (!canPerformAssignment(conversationId, 'team')) {
        throw new Error('Atribuição de equipe já em andamento para esta conversa');
      }
      
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
      
      // CORREÇÃO CRÍTICA: Invalidação específica apenas da conversa afetada
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'], 
        exact: false,
        predicate: (query) => {
          // Apenas invalidar queries relacionadas a conversas, mas de forma mais específica
          return query.queryKey[0] === '/api/conversations';
        }
      });
      
      // Invalidar apenas esta conversa específica
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
  const { updateActiveConversationAssignment, activeConversation } = useChatStore();

  return useMutation({
    mutationFn: async (data: { userId: number | null; method: 'manual' | 'automatic' }) => {
      // CORREÇÃO CRÍTICA: Verificar se atribuição pode ser executada
      if (!canPerformAssignment(conversationId, 'user')) {
        throw new Error('Atribuição de usuário já em andamento para esta conversa');
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/assign-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atribuir usuário');
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Atualizar store local imediatamente se esta é a conversa ativa
      if (activeConversation && activeConversation.id === conversationId) {
        updateActiveConversationAssignment(activeConversation.assignedTeamId, variables.userId);
      }
      
      // CORREÇÃO CRÍTICA: Invalidação específica apenas da conversa afetada
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'], 
        exact: false,
        predicate: (query) => {
          // Apenas invalidar queries relacionadas a conversas, mas de forma mais específica
          return query.queryKey[0] === '/api/conversations';
        }
      });
      
      // Invalidar apenas esta conversa específica
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
      
      // Invalidar cache do usuário específico para atualizar nome no cabeçalho
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['/api/users/basic', variables.userId] });
      }
      
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