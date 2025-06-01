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
      // Debug: verificar dados do contato
      console.log('Dados do contato para envio:', contact);
      
      // Se tiver telefone, enviar via Z-API (assumindo WhatsApp como padrão)
      if (contact?.phone) {
        try {
          console.log('Enviando via Z-API:', { phone: contact.phone, message: message.content });
          await apiRequest("POST", "/api/zapi/send-message", {
            phone: contact.phone,
            message: message.content
          });
          console.log('Mensagem enviada via Z-API com sucesso');
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
