import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useSendAudioMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      audioBlob, 
      duration, 
      contact 
    }: { 
      conversationId: number; 
      audioBlob: Blob;
      duration: number;
      contact?: any;
    }) => {
      console.log('🎵 Iniciando envio de áudio:', {
        conversationId,
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        duration,
        contactPhone: contact?.phone
      });

      // OTIMIZAÇÃO CHATWOOT: Renderização otimista
      const optimisticId = -Date.now();
      const optimisticMessage = {
        id: optimisticId,
        conversationId,
        content: '🎵 Áudio enviado',
        isFromContact: false,
        messageType: 'audio' as const,
        metadata: {
          phone: contact?.phone,
          mimeType: audioBlob.type,
          audioSize: audioBlob.size,
          duration,
          isOptimistic: true
        },
        isDeleted: false,
        sentAt: new Date().toISOString(),
        deliveredAt: null,
        readAt: null,
        whatsappMessageId: null,
        zapiStatus: 'SENDING' as const,
        isGroup: false,
        referenceMessageId: null,
        isInternalNote: false,
        authorId: null,
        authorName: null,
        noteType: 'general' as const,
        notePriority: 'normal' as const,
        noteTags: null,
        isPrivate: false,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null
      };

      // Atualizar UI instantaneamente
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (old: any[] | undefined) => {
          const messages = old || [];
          return [...messages, optimisticMessage];
        }
      );

      // Se tiver telefone, enviar via Z-API
      if (contact?.phone) {
        // Compressão automática para áudios grandes
        let finalAudioBlob = audioBlob;
        if (audioBlob.size > 2 * 1024 * 1024) { // Mais de 2MB
          console.log('🔄 Comprimindo áudio grande para envio mais rápido...');
          // Usar formato mais compacto se necessário
          finalAudioBlob = audioBlob; // Por enquanto, mantém original
        }

        const formData = new FormData();
        formData.append('phone', contact.phone);
        formData.append('audio', finalAudioBlob, `audio.${finalAudioBlob.type.split('/')[1] || 'webm'}`);
        formData.append('duration', duration.toString());
        formData.append('conversationId', conversationId.toString());

        console.log('📤 Enviando FormData para Z-API:', {
          phone: contact.phone,
          audioType: audioBlob.type,
          audioSize: audioBlob.size,
          conversationId,
          duration
        });

        const response = await fetch('/api/upload/audio', {
          method: 'POST',
          body: formData,
          // Otimizações de timeout para envio rápido
          signal: AbortSignal.timeout(20000) // 20s timeout
        });

        if (!response.ok) {
          throw new Error(`Erro no envio: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📥 Resposta do servidor:', response);
        console.log('✅ Áudio enviado com sucesso:', result);
        
        return { ...result, optimisticId };
      } else {
        // Envio direto para mensagens internas
        const response = await apiRequest(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: '🎵 Áudio enviado',
            messageType: 'audio',
            metadata: {
              mimeType: audioBlob.type,
              audioSize: audioBlob.size,
              duration
            }
          })
        });
        
        return { ...response, optimisticId };
      }
    },
    
    onSuccess: (result, variables, context) => {
      const { conversationId, optimisticId } = result;
      
      // OTIMIZAÇÃO CHATWOOT: Substituir mensagem otimista pela real via WebSocket
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (old: any[] | undefined) => {
          if (!old) return old;
          
          return old.map(msg => {
            if (msg.id === optimisticId) {
              return {
                ...msg,
                id: result.id || result.messageId,
                zapiStatus: 'SENT',
                metadata: {
                  ...msg.metadata,
                  zaapId: result.zaapId,
                  messageId: result.messageId,
                  isOptimistic: false
                }
              };
            }
            return msg;
          });
        }
      );
      
      console.log('✅ SOCKET-FIRST: Mensagem otimista substituída pela real:', result.id || result.messageId);
    },
    
    onError: (error, variables, context) => {
      const { conversationId } = variables;
      const optimisticId = context?.optimisticId || -Date.now();
      
      // OTIMIZAÇÃO CHATWOOT: Marcar mensagem como erro com botão retry
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (old: any[] | undefined) => {
          if (!old) return old;
          
          return old.map(msg => {
            if (msg.id === optimisticId) {
              return {
                ...msg,
                zapiStatus: 'FAILED',
                metadata: {
                  ...msg.metadata,
                  error: error.message,
                  canRetry: true,
                  isOptimistic: false
                }
              };
            }
            return msg;
          });
        }
      );
      
      console.error('❌ Erro no envio de áudio:', error);
    }
  });
}