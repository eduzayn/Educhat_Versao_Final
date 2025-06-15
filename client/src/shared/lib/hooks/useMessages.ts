import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null, limit = 50) {
  return useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!conversationId,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 1000 * 30, // ✅ REDUZIDO: 30 segundos para dados mais atualizados
    gcTime: 1000 * 60 * 5, // ✅ REDUZIDO: 5 minutos para liberar memória mais cedo
    retry: 2, // ✅ AUMENTADO: mais tentativas em caso de falha
    retryDelay: 200, // ✅ REDUZIDO: retry mais rápido
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, message, contact }: { 
      conversationId: number; 
      message: Omit<InsertMessage, 'conversationId'>;
      contact?: any;
    }) => {
      // Se for nota interna, NUNCA enviar via Z-API - apenas salvar localmente
      if (message.isInternalNote) {
        console.log('📝 Nota interna - salvando apenas localmente, NÃO enviando via Z-API');
        const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
        return response.json();
      }

      // PRIMEIRO: Sempre salvar mensagem no banco local para aparecer imediatamente no chat
      console.log('💾 Salvando mensagem no banco local primeiro');
      const localResponse = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      const savedMessage = await localResponse.json();

      // SEGUNDO: Se tiver telefone, enviar via Z-API (mensagem já está salva e visível)
      if (contact?.phone) {
        console.log('📤 Enviando mensagem via Z-API:', {
          phone: contact.phone,
          message: message.content,
          conversationId
        });
        
        try {
          const zapiResponse = await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content,
            conversationId: conversationId
          });
          console.log('✅ Mensagem enviada via Z-API:', zapiResponse);
        } catch (error) {
          console.error('❌ Erro ao enviar via Z-API:', error);
          // Mensagem já está salva localmente, então usuário vê a mensagem mesmo se Z-API falhar
        }
      }

      return savedMessage;
    },
    onSuccess: (_, { conversationId }) => {
      // Invalidar cache específico das mensagens dessa conversa
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${conversationId}/messages`] 
      });
      // Invalidar cache da lista de conversas
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'] 
      });
    },
  });
}
