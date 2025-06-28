import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Message } from '@shared/schema';

interface UseVideoMessageProps {
  conversationId: number;
  contactPhone: string;
}

interface SendVideoResponse {
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
    messageType: 'video',
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

export function useVideoMessage({ conversationId, contactPhone }: UseVideoMessageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }): Promise<Message> => {
      if (!file || !contactPhone) {
        throw new Error('Arquivo de vídeo e telefone do contato são obrigatórios');
      }

      // 1. RENDERIZAÇÃO IMEDIATA: Criar e inserir placeholder
      const placeholderMessage = createPlaceholderMessage(conversationId, file, caption);
      
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [[placeholderMessage]],
            pageParams: [0]
          };
        }
        
        // Adicionar placeholder à primeira página (mais recente)
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

      console.log('🎥 Iniciando envio de vídeo:', {
        conversationId,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        hasCaption: !!caption,
        contactPhone,
        placeholderId: placeholderMessage.id
      });

      // 2. UPLOAD: Enviar arquivo para backend
      const formData = new FormData();
      formData.append('video', file);
      formData.append('phone', contactPhone);
      formData.append('conversationId', conversationId.toString());
      
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await fetch('/api/zapi/send-video', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(180000), // 3 minutos para vídeos grandes
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Se Z-API retornou savedMessage com metadados, usar esse ao invés do placeholder
      if (data.savedMessage) {
        console.log('🔄 USANDO MENSAGEM SALVA PELA Z-API COM METADADOS (VÍDEO):', data.savedMessage.id);
        return {
          ...data.savedMessage,
          // @ts-ignore - Propriedade temporária para identificação do placeholder
          _placeholderId: placeholderMessage.id
        };
      }
      
      // Fallback para compatibilidade
      return {
        ...data.message,
        // @ts-ignore - Propriedade temporária para identificação do placeholder
        _placeholderId: placeholderMessage.id
      };
    },
    onSuccess: (newMessage) => {
      // Validação crítica para evitar erros
      if (!newMessage || !newMessage.id || !newMessage.conversationId) {
        console.warn('⚠️ Mensagem de vídeo inválida recebida:', newMessage);
        return;
      }

      // 4. SUBSTITUIÇÃO: Atualizar cache substituindo placeholder
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [[newMessage]],
            pageParams: [0]
          };
        }
        
        // Substituir placeholder pela mensagem real em todas as páginas
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
        title: 'Vídeo enviado',
        description: 'O vídeo foi enviado com sucesso',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar vídeo:', error);
      const isTimeout = error instanceof Error && 
        (error.name === 'TimeoutError' || error.message.includes('timeout'));
      
      toast({
        title: 'Erro ao enviar vídeo',
        description: isTimeout
          ? 'O vídeo é muito grande. Arquivos maiores que 50MB podem demorar mais para enviar.'
          : error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });
}