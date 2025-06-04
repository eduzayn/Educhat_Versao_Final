import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null, limit = 50) {
  return useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`, { limit }],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=0`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const messages = await response.json();
      // Retornar em ordem cronológica (mais antigas primeiro)
      return messages.reverse();
    },
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
      // Se for nota interna, NUNCA enviar via Z-API - apenas salvar localmente
      if (message.isInternalNote) {
        console.log('📝 Nota interna - salvando apenas localmente, NÃO enviando via Z-API');
        const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
        return response.json();
      }

      // Se tiver telefone e NÃO for nota interna, enviar via Z-API
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
