import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

// Cache global otimizado para resposta rápida
const recentMessages = new Map<string, number>();
const DUPLICATE_PREVENTION_TIME = 50; // Reduzido para 50ms para resposta instantânea

function generateMessageKey(conversationId: number, content: string): string {
  return `${conversationId}:${content.trim()}`;
}

function isDuplicateMessage(conversationId: number, content: string): boolean {
  const key = generateMessageKey(conversationId, content);
  const lastSent = recentMessages.get(key);
  const now = Date.now();
  
  if (lastSent && (now - lastSent) < DUPLICATE_PREVENTION_TIME) {
    return true;
  }
  
  return false;
}

function markMessageAsSent(conversationId: number, content: string): void {
  const key = generateMessageKey(conversationId, content);
  recentMessages.set(key, Date.now());
  
  // Limpar entradas antigas para evitar vazamento de memória
  setTimeout(() => {
    recentMessages.delete(key);
  }, DUPLICATE_PREVENTION_TIME);
}

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
    staleTime: 1000 * 5, // Cache por apenas 5 segundos para resposta rápida
    gcTime: 1000 * 60 * 2, // Cache reduzido para 2 minutos
    retry: 1, 
    retryDelay: 500,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false, // Não recarregar ao focar na janela
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
      // Verificar se é uma mensagem duplicada
      if (message.content && isDuplicateMessage(conversationId, message.content)) {
        console.warn('🚫 Mensagem duplicada bloqueada:', message.content);
        throw new Error('Mensagem duplicada detectada');
      }

      // Marcar mensagem como enviada para evitar duplicatas
      if (message.content) {
        markMessageAsSent(conversationId, message.content);
      }

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
    onMutate: async ({ conversationId, message }) => {
      console.log('🚀 Atualização otimística - mensagem aparece IMEDIATAMENTE');
      
      // Cancelar qualquer refetch em andamento para evitar conflitos
      await queryClient.cancelQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });

      // Snapshot do estado anterior para rollback se necessário
      const previousMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages']);

      // Criar mensagem temporária para exibição imediata
      const optimisticMessage = {
        id: Date.now(), // ID temporário único
        ...message,
        conversationId,
        sentAt: new Date(),
        isFromContact: false,
        zapiMessageId: null,
        readAt: null,
        deliveredAt: null,
        metadata: null,
        isDeleted: false,
        messageType: message.messageType || 'text'
      };

      // Atualização imediata da UI - mensagem aparece instantaneamente
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (old: Message[] | undefined) => {
          const messages = old || [];
          const updatedMessages = [...messages, optimisticMessage as Message];
          console.log('✅ Mensagem adicionada ao bubble imediatamente:', optimisticMessage.id);
          return updatedMessages;
        }
      );

      return { previousMessages, optimisticMessage };
    },
    onSuccess: (newMessage, { conversationId }, context) => {
      // Substituir mensagem temporária pela real
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [newMessage];
          // Substituir mensagem temporária pela real
          return oldMessages.map(msg => 
            msg.id === context?.optimisticMessage.id ? newMessage : msg
          );
        }
      );
      
      // Atualizar apenas o cache da lista de conversas sem invalidar (evita reload desnecessário)
      queryClient.setQueryData(
        ['/api/conversations'],
        (oldConversations: any) => {
          if (!oldConversations?.conversations) return oldConversations;
          return {
            ...oldConversations,
            conversations: oldConversations.conversations.map((conv: any) => 
              conv.id === conversationId 
                ? { 
                    ...conv, 
                    lastMessageAt: newMessage.sentAt,
                    unreadCount: conv.unreadCount || 0 
                  }
                : conv
            )
          };
        }
      );
    },
    onError: (err, { conversationId }, context) => {
      // Restaurar estado anterior em caso de erro
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages'],
          context.previousMessages
        );
      }
    },
  });
}
