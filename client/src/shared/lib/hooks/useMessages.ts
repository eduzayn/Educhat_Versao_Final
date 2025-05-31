import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@/types/chat';

export function useMessages(conversationId: number | null) {
  return useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
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
      // Se for um contato do WhatsApp e tiver telefone, enviar via Z-API
      if (contact?.channel === 'whatsapp' && contact?.phone) {
        try {
          await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content
          });
        } catch (error) {
          console.error('Erro ao enviar via Z-API:', error);
          // Continue com o envio normal se falhar
        }
      }

      // Sempre salvar a mensagem no banco de dados local
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      return response.json();
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}
