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
    
    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        message: {
          content: content.trim(),
          messageType: 'text',
          isFromContact: false,
        },
        contact: activeConversation?.contact
      });

      // notifySuccess('Mensagem enviada', 'Sua mensagem foi enviada com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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