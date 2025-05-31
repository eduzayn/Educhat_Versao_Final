import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null) {
  console.log('🔍 useMessages chamado com conversationId:', conversationId);
  
  const query = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 0, // Sempre considerar dados como stale
    gcTime: 0, // Não manter cache
  });
  
  console.log('📨 URL que deveria ser chamada:', `/api/conversations/${conversationId}/messages`);
  console.log('📨 useMessages resultado:', { 
    isLoading: query.isLoading, 
    data: query.data, 
    error: query.error,
    dataLength: query.data?.length 
  });
  
  return query;
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
