/**
 * Hook para monitorar eventos de sincronização de mensagens via WebSocket
 * Correção crítica para problema de mensagens não exibidas
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';

export function useMessageSyncListener() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listener para atualizações da lista de conversas
    const handleConversationUpdate = (data: any) => {
      console.log('🔄 Evento de sincronização recebido:', data);
      
      try {
        switch (data.action) {
          case 'new_conversation':
            // Nova conversa criada - adicionar à lista
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            console.log('✅ Lista de conversas invalidada - nova conversa');
            break;
            
          case 'message_received':
            // Nova mensagem recebida - atualizar conversa específica
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ 
              queryKey: ['/api/conversations', data.conversationId, 'messages'] 
            });
            console.log(`✅ Conversa ${data.conversationId} atualizada - nova mensagem`);
            break;
            
          case 'message_recovery':
            // Mensagem recuperada - forçar atualização
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            console.log(`✅ Conversa ${data.conversationId} recuperada`);
            break;
        }
      } catch (error) {
        console.error('❌ Erro ao processar evento de sincronização:', error);
      }
    };

    // Listener para forçar refresh completo
    const handleForceRefresh = (data: any) => {
      console.log('🔄 Forçando refresh completo da lista de conversas:', data);
      
      try {
        // Invalidar todas as queries relacionadas a conversas
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/conversations'] });
        
        // Forçar refetch imediato
        queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
        
        console.log('✅ Refresh completo executado');
      } catch (error) {
        console.error('❌ Erro no refresh forçado:', error);
      }
    };

    // Registrar listeners
    socket.on('conversation_list_update', handleConversationUpdate);
    socket.on('force_conversation_refresh', handleForceRefresh);

    // Cleanup
    return () => {
      socket.off('conversation_list_update', handleConversationUpdate);
      socket.off('force_conversation_refresh', handleForceRefresh);
    };
  }, [socket, queryClient]);

  // Função para acionar recuperação manual de mensagens
  const triggerMessageRecovery = async (hoursBack: number = 6) => {
    try {
      console.log(`🔄 Iniciando recuperação manual de mensagens das últimas ${hoursBack} horas`);
      
      const response = await fetch('/api/webhooks/recover-unrendered-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hoursBack,
          forceUpdate: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Recuperação de mensagens concluída:', result);
        
        // Forçar atualização da lista após recuperação
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
        
        return result;
      } else {
        throw new Error('Falha na recuperação de mensagens');
      }
    } catch (error) {
      console.error('❌ Erro na recuperação manual de mensagens:', error);
      throw error;
    }
  };

  return {
    triggerMessageRecovery
  };
}