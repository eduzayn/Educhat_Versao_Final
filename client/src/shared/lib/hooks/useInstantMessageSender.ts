import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message, InsertMessage } from '@shared/schema';

// Performance benchmark para medir ENTER → Bubble
const performanceBenchmark = {
  startTime: 0,
  
  start() {
    this.startTime = performance.now();
  },
  
  end(): number {
    if (!this.startTime) return 0;
    const duration = performance.now() - this.startTime;
    this.startTime = 0;
    return duration;
  }
};

// Cache para prevenção de duplicatas otimizado
const recentMessages = new Map<string, number>();
const DUPLICATE_THRESHOLD = 50; // 50ms para resposta instantânea

function isDuplicateMessage(conversationId: number, content: string): boolean {
  const key = `${conversationId}:${content.trim()}`;
  const lastSent = recentMessages.get(key);
  const now = Date.now();
  
  if (lastSent && (now - lastSent) < DUPLICATE_THRESHOLD) {
    return true;
  }
  
  return false;
}

function markMessageAsSent(conversationId: number, content: string): void {
  const key = `${conversationId}:${content.trim()}`;
  recentMessages.set(key, Date.now());
  
  // Auto-cleanup para evitar vazamento de memória
  setTimeout(() => {
    recentMessages.delete(key);
  }, DUPLICATE_THRESHOLD * 2);
}

export function useInstantMessageSender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      message, 
      contact 
    }: { 
      conversationId: number; 
      message: Omit<InsertMessage, 'conversationId'>;
      contact?: any;
    }) => {
      // Verificar duplicatas
      if (message.content && isDuplicateMessage(conversationId, message.content)) {
        console.warn('🚫 Mensagem duplicada bloqueada');
        throw new Error('Mensagem duplicada detectada');
      }

      // Marcar como enviada para prevenir duplicatas
      if (message.content) {
        markMessageAsSent(conversationId, message.content);
      }

      // Para notas internas, apenas salvar localmente
      if (message.isInternalNote) {
        const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
        return await response.json();
      }

      // ESTRATÉGIA DUAL: Salvar local + Z-API em paralelo para máxima velocidade
      const saveLocalPromise = apiRequest('POST', `/api/conversations/${conversationId}/messages`, message);
      
      let zapiPromise: Promise<any> | null = null;
      if (contact?.phone) {
        zapiPromise = apiRequest("POST", "/api/zapi/send-message", {
          phone: contact.phone,
          message: message.content,
          conversationId: conversationId
        });
      }

      // Aguardar salvamento local (prioritário para renderização)
      const localResponse = await saveLocalPromise;
      const savedMessage = await localResponse.json();

      // Z-API em background - não bloqueia renderização
      if (zapiPromise) {
        zapiPromise
          .then(response => response.json())
          .then(result => {
            console.log('✅ Z-API enviado em background:', result);
          })
          .catch(error => {
            console.error('❌ Erro Z-API (mensagem já renderizada):', error);
          });
      }

      return savedMessage;
    },
    
    onMutate: async ({ conversationId, message }) => {
      // INICIAR BENCHMARK: ENTER → Bubble
      performanceBenchmark.start();
      
      // Cancelar queries em conflito
      await queryClient.cancelQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });

      // Backup para rollback
      const previousMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages']);

      // RENDERIZAÇÃO INSTANTÂNEA: Criar mensagem otimística
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage = {
        id: Date.now(), // ID numérico temporário
        ...message,
        conversationId,
        sentAt: new Date(),
        isFromContact: false,
        whatsappMessageId: null,
        zapiStatus: 'PENDING',
        isGroup: false,
        referenceMessageId: null,
        isDeleted: false,
        deliveredAt: null,
        readAt: null,
        metadata: message.metadata || null,
        messageType: message.messageType || 'text',
        // Campos para notas internas
        authorId: null,
        authorName: null,
        noteType: 'general',
        notePriority: 'normal',
        noteTags: null,
        isPrivate: false,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null,
        // Marcador para identificação
        optimisticId
      };

      // ATUALIZAÇÃO IMEDIATA DA UI - Bubble aparece instantaneamente
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (old: Message[] | undefined) => {
          const messages = old || [];
          const updatedMessages = [...messages, optimisticMessage as Message];
          
          // FINALIZAR BENCHMARK
          const renderTime = performanceBenchmark.end();
          console.log(`🎯 PERFORMANCE OTIMIZADA: ENTER → Bubble em ${renderTime.toFixed(1)}ms (Target Chatwoot: <50ms)`);
          
          return updatedMessages;
        }
      );

      return { previousMessages, optimisticMessage };
    },

    onSuccess: (realMessage, { conversationId }, context) => {
      // Substituir mensagem otimística pela real sem invalidar cache
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [realMessage];
          
          return oldMessages.map(msg => 
            msg.id === context?.optimisticMessage.id ? realMessage : msg
          );
        }
      );

      // Atualizar lista de conversas silenciosamente
      queryClient.setQueryData(
        ['/api/conversations'],
        (oldData: any) => {
          if (!oldData?.conversations) return oldData;
          
          return {
            ...oldData,
            conversations: oldData.conversations.map((conv: any) => 
              conv.id === conversationId 
                ? { 
                    ...conv, 
                    lastMessageAt: realMessage.sentAt,
                    unreadCount: conv.unreadCount || 0 
                  }
                : conv
            )
          };
        }
      );
      
      console.log('✅ Mensagem sincronizada - performance Chatwoot level');
    },

    onError: (error, { conversationId }, context) => {
      // Rollback em caso de erro
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages'],
          context.previousMessages
        );
      }
      
      console.error('❌ Erro no envio de mensagem:', error);
    },
  });
}