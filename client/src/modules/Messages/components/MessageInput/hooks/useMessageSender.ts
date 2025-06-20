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

  const sendTextMessage = async (content: string) => {
    if (!content.trim()) return false;
    
    // BENCHMARK: Iniciar cronômetro para medir ENTER → Bubble
    const startTime = performance.now();
    console.log('🚀 INICIANDO envio otimístico - mensagem aparece IMEDIATAMENTE');
    
    // RENDERIZAÇÃO INSTANTÂNEA: Criar ID único para mensagem otimística
    const optimisticId = Date.now();
    
    try {
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

      // ATUALIZAÇÃO IMEDIATA DO CACHE - Bubble aparece instantaneamente
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: any[] | undefined) => {
          const messages = oldMessages || [];
          const updatedMessages = [...messages, optimisticMessage];
          
          // FINALIZAR BENCHMARK
          const renderTime = performance.now() - startTime;
          console.log(`🎯 PERFORMANCE OTIMIZADA: ENTER → Bubble em ${renderTime.toFixed(1)}ms (Target: <50ms)`);
          
          return updatedMessages;
        }
      );

      // SEGUNDO: Processar API em background (não bloqueia UI)
      const realMessage = await sendMessageMutation.mutateAsync({
        conversationId,
        message: {
          content: content.trim(),
          messageType: 'text',
          isFromContact: false,
        },
        contact: activeConversation?.contact
      });

      // TERCEIRO: Substituir mensagem otimística pela real
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: any[] | undefined) => {
          if (!oldMessages) return [realMessage];
          
          return oldMessages.map(msg => 
            msg.id === optimisticId ? realMessage : msg
          );
        }
      );

      console.log('✅ Mensagem sincronizada - performance Chatwoot level');
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // ROLLBACK: Remover mensagem otimística em caso de erro
      const optimisticIdToRemove = optimisticId;
      queryClient.setQueryData(
        ['/api/conversations', conversationId, 'messages'],
        (oldMessages: any[] | undefined) => {
          if (!oldMessages) return [];
          return oldMessages.filter(msg => msg.id !== optimisticIdToRemove);
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