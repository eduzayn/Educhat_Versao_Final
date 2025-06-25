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

// Função para criar mensagem placeholder para renderização imediata
function createPlaceholderMessage(conversationId: number, file: File, caption?: string): Message {
  const tempId = Date.now(); // ID temporário único
  const previewUrl = URL.createObjectURL(file);
  
  return {
    id: tempId,
    conversationId,
    content: previewUrl, // URL temporária para preview
    isFromContact: false,
    messageType: 'image',
    sentAt: new Date(),
    deliveredAt: null,
    readAt: null,
    isDeleted: false,
    whatsappMessageId: null,
    zapiStatus: null,
    isGroup: false,
    referenceMessageId: null,
    isInternalNote: false,
    authorId: null,
    authorName: null,
    isHiddenForUser: false,
    metadata: {
      uploading: true, // Flag para identificar mensagem em upload
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      caption: caption || null,
      tempPreviewUrl: previewUrl
    }
  };
}

export function useImageMessage({ conversationId, contactPhone }: UseImageMessageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }): Promise<Message> => {
      if (!file || !contactPhone) {
        throw new Error('Arquivo de imagem e telefone do contato são obrigatórios');
      }

      // 1. RENDERIZAÇÃO IMEDIATA: Criar e exibir placeholder
      const placeholderMessage = createPlaceholderMessage(conversationId, file, caption);
      
      // Adicionar placeholder ao cache imediatamente
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [[placeholderMessage]],
            pageParams: [0]
          };
        }
        
        const updatedPages = [...oldData.pages];
        const firstPage = Array.isArray(updatedPages[0]) ? updatedPages[0] : [];
        updatedPages[0] = [...firstPage, placeholderMessage].sort((a, b) => {
          const timeA = a && a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const timeB = b && b.sentAt ? new Date(b.sentAt).getTime() : 0;
          return timeA - timeB;
        });
        
        return {
          ...oldData,
          pages: updatedPages
        };
      });

      // 2. ENVIO REAL: Processar upload em segundo plano
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
      
      // 3. SUBSTITUIÇÃO: Trocar placeholder pela mensagem real
      return {
        ...data.message,
        // @ts-ignore - Propriedade temporária para identificação do placeholder
        _placeholderId: placeholderMessage.id
      };
    },
    onSuccess: (newMessage) => {
      if (!newMessage || !newMessage.id || !newMessage.conversationId) {
        return;
      }

      // SUBSTITUIÇÃO DO PLACEHOLDER: Trocar mensagem temporária pela real
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [[newMessage]],
            pageParams: [0]
          };
        }
        
        const updatedPages = oldData.pages.map((page: any[]) => {
          if (!Array.isArray(page)) return page;
          
          return page.map((msg: any) => {
            // Substituir placeholder pela mensagem real
            if (msg && msg.metadata && (msg.metadata as any).uploading && (newMessage as any)._placeholderId === msg.id) {
              // Limpar URL temporária do placeholder
              if ((msg.metadata as any).tempPreviewUrl) {
                URL.revokeObjectURL((msg.metadata as any).tempPreviewUrl);
              }
              return newMessage;
            }
            return msg;
          });
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