import { useState } from 'react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useSendMessage } from '@/shared/lib/hooks/useMessages';
import { useChatStore } from '@/shared/store/chatStore';
import { useSendAudioMessage } from '@/shared/lib/hooks/useAudioMessage';

interface UseMessageSenderProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function useMessageSender({ conversationId, onSendMessage }: UseMessageSenderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const sendMessageMutation = useSendMessage();
  const { activeConversation } = useChatStore();
  const sendAudioMutation = useSendAudioMessage();

  const notifySuccess = (title: string, description: string) => {
    toast({ title, description });
    onSendMessage?.();
  };

  const notifyError = (title: string, description: string) => {
    toast({ title, description, variant: 'destructive' });
  };

  const sendTextMessage = async (content: string, isInternalNote = false) => {
    if (!content.trim()) return false;
    
    // BENCHMARK: Iniciar cronômetro para medir ENTER → Bubble
    const startTime = performance.now();
    
    // RENDERIZAÇÃO INSTANTÂNEA: Criar ID único para mensagem otimística (usando timestamp negativo para evitar conflitos)
    const optimisticId = -Date.now();
    
    // Criar mensagem otimística para renderização imediata
    const optimisticMessage = {
      id: optimisticId,
      conversationId,
      content: content.trim(),
      messageType: 'text' as const,
      isFromContact: false,
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      whatsappMessageId: null,
      zapiStatus: 'PENDING',
      isGroup: false,
      referenceMessageId: null,
      isDeleted: false,
      metadata: null,
      isInternalNote,
      authorId: null,
      authorName: null,
      noteType: 'general' as const,
      notePriority: 'normal' as const,
      noteTags: null,
      isPrivate: false,
      isHiddenForUser: false,
      isDeletedByUser: false,
      deletedAt: null,
      deletedBy: null,
      // Status otimista para UI
      status: 'sending' as const
    };

    // ATUALIZAÇÃO IMEDIATA DO CACHE - Bubble aparece instantaneamente
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (oldMessages: any[] | undefined) => {
        const messages = oldMessages || [];
        const updatedMessages = [...messages, optimisticMessage];
        
        // FINALIZAR BENCHMARK
        const renderTime = performance.now() - startTime;
        console.log(`🎯 RENDERIZAÇÃO OTIMISTA: ENTER → Bubble em ${renderTime.toFixed(1)}ms (Target Chatwoot: <50ms)`);
        
        return updatedMessages;
      }
    );

    // PROCESSAMENTO EM BACKGROUND: Salvar no banco via WebSocket se possível
    try {
      // SOCKET-FIRST: Tentar envio via WebSocket para tempo real
      if ((window as any).socketInstance?.connected) {
        console.log('📡 SOCKET-FIRST: Enviando mensagem via WebSocket');
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ Timeout no envio via WebSocket, usando fallback REST');
            resolve(false); // Trigger fallback
          }, 3000);

          // Listener para sucesso via broadcast_message
          const handleBroadcast = (data: any) => {
            if (data.type === 'new_message' && data.optimisticId === optimisticId) {
              clearTimeout(timeout);
              (window as any).socketInstance?.off('broadcast_message', handleBroadcast);
              (window as any).socketInstance?.off('message_error', handleError);
              console.log('✅ Mensagem confirmada via WebSocket');
              resolve(true);
            }
          };

          // Listener para erro
          const handleError = (errorData: any) => {
            if (errorData.optimisticId === optimisticId) {
              clearTimeout(timeout);
              (window as any).socketInstance?.off('broadcast_message', handleBroadcast);
              (window as any).socketInstance?.off('message_error', handleError);
              console.error('❌ Erro confirmado via WebSocket:', errorData);
              reject(new Error(errorData.message || 'Erro ao enviar mensagem'));
            }
          };

          // Registrar listeners
          (window as any).socketInstance.on('broadcast_message', handleBroadcast);
          (window as any).socketInstance.on('message_error', handleError);
          
          // Emitir mensagem via WebSocket
          (window as any).socketInstance.emit('send_message', {
            conversationId,
            content: content.trim(),
            messageType: 'text',
            isFromContact: false,
            isInternalNote,
            optimisticId
          });
        }).catch(error => {
          console.error('❌ Erro no WebSocket, usando fallback:', error);
          return false; // Trigger fallback
        });
      }

      // FALLBACK: Se WebSocket não disponível, usar REST API
      console.log('📡 FALLBACK: WebSocket não disponível, usando REST API');
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        content: content.trim(),
        messageType: 'text',
        isFromContact: false,
        isInternalNote,
      });
      const realMessage = await response.json();

      // Substituir mensagem otimística pela real
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: any[] | undefined) => {
          if (!oldMessages) return [realMessage];
          
          return oldMessages.map(msg => 
            msg.id === optimisticId ? { ...realMessage, status: 'sent' } : msg
          );
        }
      );

      // Z-API em background apenas para mensagens não internas
      if (!isInternalNote && activeConversation?.contact?.phone) {
        apiRequest("POST", "/api/zapi/send-message", {
          phone: activeConversation.contact.phone,
          message: content.trim(),
          conversationId: conversationId
        }).catch(error => {
          console.error('❌ Erro Z-API (mensagem já salva):', error);
        });
      }

      console.log('✅ Mensagem sincronizada via REST fallback');
      return true;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // ROLLBACK: Marcar mensagem otimística como erro
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: any[] | undefined) => {
          if (!oldMessages) return [];
          return oldMessages.map(msg => 
            msg.id === optimisticId 
              ? { ...msg, status: 'error', content: `❌ ${msg.content}` }
              : msg
          );
        }
      );
      
      notifyError('Erro ao enviar', 'Não foi possível enviar a mensagem. Tente novamente.');
      return false;
    }
  };

  const uploadFile = async (file: File, caption?: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId.toString());
      if (caption) formData.append('caption', caption);

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha no upload do arquivo');

      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', conversationId, 'messages'],
      });
      notifySuccess('Arquivo enviado', 'Seu arquivo foi enviado com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro no upload:', error);
      notifyError('Erro no upload', 'Não foi possível enviar o arquivo. Tente novamente.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const shareLink = async (url: string, caption?: string) => {
    try {
      const content = caption ? `${caption}\n\n${url}` : url;
      await sendMessageMutation.mutateAsync({
        conversationId,
        message: {
          content,
          messageType: 'text',
          isFromContact: false,
        },
        contact: activeConversation?.contact
      });

      // notifySuccess('Link compartilhado', 'Seu link foi compartilhado com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar link:', error);
      notifyError('Erro ao compartilhar', 'Não foi possível compartilhar o link. Tente novamente.');
      return false;
    }
  };

  const sendAudio = async (audioBlob: Blob, duration: number) => {
    try {
      await sendAudioMutation.mutateAsync({
        conversationId,
        audioBlob,
        duration,
        contact: activeConversation?.contact
      });
      // notifySuccess('Áudio enviado', 'Sua mensagem de áudio foi enviada com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      notifyError('Erro ao enviar áudio', 'Não foi possível enviar o áudio. Tente novamente.');
      return false;
    }
  };

  return {
    isLoading: sendMessageMutation.isPending || sendAudioMutation.isPending,
    isUploading,
    sendTextMessage,
    uploadFile,
    shareLink,
    sendAudio,
  };
}