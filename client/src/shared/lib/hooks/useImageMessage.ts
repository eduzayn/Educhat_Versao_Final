import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Message } from '@shared/schema';

interface UseImageMessageProps {
  conversationId: number;
  contactPhone: string;
}

interface SendImageResponse {
  message: Message;
  zaapId: string;
  messageId: string;
}

export function useImageMessage({ conversationId, contactPhone }: UseImageMessageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }): Promise<Message> => {
      if (!file || !contactPhone) {
        throw new Error('Arquivo de imagem e telefone do contato são obrigatórios');
      }

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

      const response = await fetch('/api/zapi/send-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data: SendImageResponse = await response.json();
      console.log('✅ Imagem enviada com sucesso:', data);

      return data.message;
    },
    onSuccess: (newMessage) => {
      // Validação crítica para evitar erros
      if (!newMessage || !newMessage.id || !newMessage.conversationId) {
        console.warn('⚠️ Mensagem inválida recebida:', newMessage);
        return;
      }

      // RENDERIZAÇÃO IMEDIATA: Atualizar cache React Query
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [[newMessage]],
            pageParams: [0]
          };
        }
        
        // Verificar se a mensagem já existe em qualquer página com validação segura
        const messageExists = oldData.pages.some((page: any[]) => {
          if (!Array.isArray(page)) return false;
          return page.some((msg: any) => msg && msg.id && msg.id === newMessage.id);
        });
        
        if (messageExists) {
          return oldData;
        }
        
        // Adicionar à primeira página (mais recente) - ordenação cronológica
        const updatedPages = [...oldData.pages];
        const firstPage = Array.isArray(updatedPages[0]) ? updatedPages[0] : [];
        updatedPages[0] = [...firstPage, newMessage].sort((a, b) => {
          const timeA = a && a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const timeB = b && b.sentAt ? new Date(b.sentAt).getTime() : 0;
          return timeA - timeB;
        });
        
        return {
          ...oldData,
          pages: updatedPages
        };
      });
      
      // Invalidar cache em background para sincronização
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${conversationId}/messages`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'] 
      });
      
      toast({
        title: 'Imagem enviada',
        description: 'A imagem foi enviada com sucesso',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar imagem:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });
}