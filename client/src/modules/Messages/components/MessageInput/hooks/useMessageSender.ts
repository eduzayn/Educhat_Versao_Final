import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useChatStore } from '@/shared/store/chatStore';

export function useMessageSender() {
  const queryClient = useQueryClient();
  const { activeConversation } = useChatStore();
  const conversationId = activeConversation?.id;

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!activeConversation || !conversationId) {
      console.error('❌ Conversa não encontrada');
      return false;
    }

    if (!content.trim()) {
      console.error('❌ Mensagem vazia');
      return false;
    }

    try {
      // BENCHMARK: Iniciar medição de performance
      const startTime = performance.now();
      console.log('🚀 INICIANDO envio direto - sem otimização');

      // ENVIO DIRETO PARA O BANCO
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        content: content.trim(),
        messageType: 'text',
        isFromContact: false,
      });
      const realMessage = await response.json();

      // ATUALIZAR CACHE COM MENSAGEM REAL
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: any[] | undefined) => {
          const messages = oldMessages || [];
          
          // FINALIZAR BENCHMARK
          const renderTime = performance.now() - startTime;
          console.log(`🎯 PERFORMANCE: ENTER → Bubble em ${renderTime.toFixed(1)}ms`);
          
          // Adicionar mensagem real ao final da lista
          return [...messages, realMessage];
        }
      );

      // INVALIDAR QUERIES PARA FORÇAR ATUALIZAÇÃO
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', conversationId, 'messages']
      });

      // Z-API em background se tiver telefone
      if (activeConversation?.contact?.phone) {
        apiRequest("POST", "/api/zapi/send-message", {
          phone: activeConversation.contact.phone,
          message: content.trim(),
          conversationId: conversationId
        }).catch(error => {
          console.error('❌ Erro Z-API (mensagem já salva):', error);
        });
      }

      console.log('✅ Mensagem enviada e renderizada');
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }, [activeConversation, conversationId, queryClient]);

  return { sendMessage };
}