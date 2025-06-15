import { useState } from 'react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useSendMessage } from '@/shared/lib/hooks/useMessages';
import { useChatStore } from '@/shared/store/chatStore';

interface UseMessageSenderProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function useMessageSender({ conversationId, onSendMessage }: UseMessageSenderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const invalidateMessages = () => {
    queryClient.invalidateQueries({
      queryKey: ['/api/conversations', conversationId, 'messages'],
    });
  };

  const notifySuccess = (title: string, description: string) => {
    toast({ title, description });
    onSendMessage?.();
  };

  const notifyError = (title: string, description: string) => {
    toast({ title, description, variant: 'destructive' });
  };

  const sendTextMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    try {
      await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        content: content.trim(),
        messageType: 'text',
        isFromContact: false,
      });

      invalidateMessages();
      notifySuccess('Mensagem enviada', 'Sua mensagem foi enviada com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      notifyError('Erro ao enviar', 'Não foi possível enviar a mensagem. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
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

      invalidateMessages();
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
    setIsLoading(true);
    try {
      const content = caption ? `${caption}\n\n${url}` : url;
      await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        content,
        messageType: 'text',
        isFromContact: false,
      });

      invalidateMessages();
      notifySuccess('Link compartilhado', 'Seu link foi compartilhado com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar link:', error);
      notifyError('Erro ao compartilhar', 'Não foi possível compartilhar o link. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isUploading,
    sendTextMessage,
    uploadFile,
    shareLink,
  };
}