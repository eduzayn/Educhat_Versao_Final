import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { ConversationAction, ConversationActionsConfig } from '../../types/types';

export function useConversationActions({
  conversationId,
  contactId,
  onActionComplete
}: ConversationActionsConfig) {
  const [loadingActions, setLoadingActions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async ({ action, showConfirmation }: { action: ConversationAction; showConfirmation?: boolean }) => {
      if (action.requiresConfirmation && !showConfirmation) {
        return { requiresConfirmation: true, action };
      }

      if (!action.endpoint) {
        throw new Error('Funcionalidade em desenvolvimento');
      }

      // Replace placeholders in endpoint URL
      const endpoint = action.endpoint
        .replace('{conversationId}', conversationId.toString())
        .replace('{contactId}', contactId.toString());

      const requestOptions: RequestInit = {
        method: action.method || 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add payload if exists
      if (action.payload) {
        requestOptions.body = JSON.stringify(action.payload(conversationId, contactId));
      }

      const response = await fetch(endpoint, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || 'Erro na requisição');
      }

      if (action.method === 'GET') {
        return response.blob(); // For downloads
      }

      return response.json();
    },
    onMutate: ({ action }) => {
      setLoadingActions(prev => [...prev, action.id]);
      if (action.loadingMessage) {
        toast({
          title: action.loadingMessage,
          description: 'Processando...'
        });
      }
    },
    onSuccess: (data, { action }) => {
      setLoadingActions(prev => prev.filter(id => id !== action.id));
      
      if (data?.requiresConfirmation) {
        return data; // Let the component handle confirmation
      }

      if (action.successMessage) {
        toast({
          title: action.successMessage,
          description: 'Ação executada com sucesso',
          variant: 'default'
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/unread-count'] });
      
      if (onActionComplete) {
        onActionComplete(action.id, data);
      }
    },
    onError: (error: Error, { action }) => {
      setLoadingActions(prev => prev.filter(id => id !== action.id));
      
      const errorMessage = action.errorMessage || 'Erro ao executar ação';
      toast({
        title: errorMessage,
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const executeAction = (action: ConversationAction, showConfirmation = false) => {
    actionMutation.mutate({ action, showConfirmation });
  };

  const isActionLoading = (actionId: string) => {
    return loadingActions.includes(actionId) || actionMutation.isPending;
  };

  const isActionDisabled = (action: ConversationAction, currentStatus?: string) => {
    if (isActionLoading(action.id)) return true;
    if (action.disabled) {
      return action.disabled(conversationId, contactId, currentStatus);
    }
    return false;
  };

  const isActionVisible = (action: ConversationAction, currentStatus?: string) => {
    if (action.visible) {
      return action.visible(conversationId, contactId, currentStatus);
    }
    return true;
  };

  return {
    executeAction,
    isActionLoading,
    isActionDisabled,
    isActionVisible,
    lastActionResult: actionMutation.data,
    isExecuting: actionMutation.isPending
  };
}