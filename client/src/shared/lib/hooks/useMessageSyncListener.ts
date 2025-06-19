/**
 * Hook para monitorar eventos de sincronização de mensagens via WebSocket
 * Correção crítica para problema de mensagens não exibidas
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useMessageSyncListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listener para eventos customizados de sincronização
    const handleConversationSync = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      console.log('🔄 Evento de sincronização recebido:', type, data);
      
      try {
        switch (type) {
          case 'new_conversation':
          case 'message_received':
          case 'message_recovery':
            // Invalidar queries relacionadas a conversas
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            if (data?.conversationId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/conversations', data.conversationId, 'messages'] 
              });
            }
            console.log(`✅ Conversas sincronizadas - ${type}`);
            break;
            
          case 'force_refresh':
            // Forçar refresh completo
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard/conversations'] });
            queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
            console.log('✅ Refresh completo executado');
            break;
        }
      } catch (error) {
        console.error('❌ Erro ao processar evento de sincronização:', error);
      }
    };

    // Registrar listener para eventos customizados
    window.addEventListener('messageSync', handleConversationSync as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('messageSync', handleConversationSync as EventListener);
    };
  }, [queryClient]);

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