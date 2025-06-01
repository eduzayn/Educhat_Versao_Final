import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null) {
  return useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
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
        try {
          await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content
          });
          // Para WhatsApp, não salvamos localmente - a mensagem voltará via webhook
          return { success: true, via: 'zapi' };
        } catch (error) {
          console.error('Erro ao enviar via Z-API:', error);
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
