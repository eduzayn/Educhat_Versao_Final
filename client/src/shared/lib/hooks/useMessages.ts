import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null) {
  return useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
    // Remover polling automático - usar apenas WebSocket para tempo real
    refetchInterval: false,
    refetchIntervalInBackground: false,
    // Manter dados em cache por mais tempo para melhor performance
    staleTime: 1000 * 60 * 5, // 5 minutos
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
      // Se tiver telefone, enviar via Z-API (assumindo WhatsApp como padrão)
      if (contact?.phone) {
        console.log('📤 Enviando mensagem via Z-API:', {
          phone: contact.phone,
          message: message.content,
          conversationId
        });
        
        try {
          const response = await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content,
            conversationId: conversationId
          });
          console.log('✅ Mensagem enviada via Z-API:', response);
          return response;
        } catch (error) {
          console.error('❌ Erro ao enviar via Z-API:', error);
          // Se falhar, continuar com o envio normal
        }
      }

      // Salvar mensagem no banco de dados local (para canais que não são WhatsApp)
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      return response.json();
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}
