import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';
import { performanceBenchmark } from '@/shared/lib/utils/performanceBenchmark';

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
    staleTime: 1000 * 30, // OTIMIZADO: 30s de cache para performance Chatwoot-level
    gcTime: 1000 * 60 * 5, // OTIMIZADO: 5 minutos de cache em memória
    retry: 0, // OTIMIZADO: Sem retry para resposta instantânea
    retryDelay: 0,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // CRÍTICO: Não recarregar ao montar componente
    refetchOnReconnect: false, // CRÍTICO: Não recarregar ao reconectar
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
      // SISTEMA SIMPLIFICADO: Sem mensagens otimistas, apenas preparar para resposta real
      console.log('📤 Enviando mensagem - aguardando confirmação do servidor');
      
      // Cancelar qualquer refetch em andamento para evitar conflitos
      await queryClient.cancelQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });

      // Snapshot do estado anterior para rollback se necessário
      const previousMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages']);

      return { previousMessages };
    },
    onSuccess: (newMessage, { conversationId }, context) => {
      // SISTEMA SIMPLIFICADO: Apenas adicionar a mensagem real quando confirmada pelo servidor
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [newMessage];
          
          // Verificar se mensagem já existe para evitar duplicatas
          const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            return oldMessages;
          }
          
          // Adicionar nova mensagem ao final
          return [...oldMessages, newMessage];
        }
      );
      
      // Atualizar lista de conversas de forma silenciosa (sem refetch)
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
      
      console.log('✅ Mensagem sincronizada sem reload - performance Chatwoot level');
    },
    onError: (err, { conversationId }, context) => {
      // Apenas mostrar erro, sem necessidade de restaurar estado (não há mensagem otimista)
      console.error('❌ Erro ao enviar mensagem:', err.message);
    },
  });
}
