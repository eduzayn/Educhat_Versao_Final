import { useState } from 'react';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface UseImageMessageProps {
  conversationId: number;
  contactPhone: string;
  onMessageSent?: () => void;
}

interface SendImageResponse {
  zaapId: string;
  messageId: string;
  id: string;
}

export function useImageMessage({ conversationId, contactPhone, onMessageSent }: UseImageMessageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendImage = async (file: File, caption?: string): Promise<void> => {
    if (!file || !contactPhone) {
      throw new Error('Arquivo de imagem e telefone do contato são obrigatórios');
    }

    setIsLoading(true);

    try {
      console.log('🖼️ Iniciando envio de imagem:', {
        conversationId,
        imageSize: file.size,
        imageType: file.type,
        hasCaption: !!caption,
        contactPhone
      });

      // Criar FormData para envio
      const formData = new FormData();
      formData.append('image', file);
      formData.append('phone', contactPhone);
      formData.append('conversationId', conversationId.toString());
      
      if (caption) {
        formData.append('caption', caption);
      }

      console.log('📤 Enviando FormData para Z-API:', {
        phone: contactPhone,
        imageType: file.type,
        imageSize: file.size,
        conversationId,
        hasCaption: !!caption
      });

      const response = await fetch('/api/zapi/send-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data: SendImageResponse = await response.json();
      
      console.log('📥 Resposta do servidor:', {
        status: response.status,
        statusText: response.statusText,
        body: JSON.stringify(data)
      });

      console.log('✅ Imagem enviada com sucesso:', data);

      // Callback para atualizar a interface
      onMessageSent?.();

    } catch (error) {
      console.error('❌ Erro ao enviar imagem:', error);
      
      toast({
        title: 'Erro ao enviar imagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendImage,
    isLoading
  };
}