import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

export function useMessages(conversationId: number | null, limit = 25) {
  return useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async () => {
      const startTime = Date.now();
      console.log(`🔄 Carregando mensagens para conversa ${conversationId}`);
      
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=0`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const endTime = Date.now();
      console.log(`✅ Frontend: Mensagens carregadas em ${endTime - startTime}ms (${data.messages?.length || 0} itens)`);
      
      // Inverter ordem para exibir mensagens mais antigas primeiro (ordem cronológica)
      const messages = data.messages || [];
      return messages.reverse();
    },
    enabled: !!conversationId,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 30000, // Cache por 30 segundos para evitar requisições desnecessárias
    gcTime: 1000 * 60 * 10, // Manter cache por 10 minutos
    retry: 1, // Reduzir tentativas para acelerar feedback de erro
    retryDelay: 500,
    // Otimização: Manter dados anteriores durante carregamento
    placeholderData: (previousData) => previousData,
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
        return await response.json();
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
          const zapiResult = await zapiResponse.json();
          console.log('✅ Mensagem enviada via Z-API:', zapiResult);
        } catch (error) {
          console.error('❌ Erro ao enviar via Z-API:', error);
          // Mensagem já está salva localmente, então usuário vê a mensagem mesmo se Z-API falhar
        }
      }

      return savedMessage;
    },
    onSuccess: (newMessage, { conversationId }) => {
      // Atualizar cache imediatamente com a nova mensagem
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [newMessage];
          return [...oldMessages, newMessage];
        }
      );
      
      // Invalidar cache da lista de conversas para atualizar contadores
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'] 
      });
    },
  });
}
