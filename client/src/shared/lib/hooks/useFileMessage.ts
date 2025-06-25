import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Message } from '@shared/schema';

interface UseFileMessageProps {
  conversationId: number;
  contactPhone: string;
}

interface SendFileResponse {
  message: Message;
  zaapId: string;
  messageId: string;
}

export function useFileMessage({ conversationId, contactPhone }: UseFileMessageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }): Promise<Message> => {
      if (!file || !contactPhone) {
        throw new Error('Arquivo e telefone do contato são obrigatórios');
      }

      console.log('📄 Iniciando envio de arquivo:', {
        conversationId,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        hasCaption: !!caption,
        contactPhone
      });

      // Criar FormData para envio
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phone', contactPhone);
      formData.append('conversationId', conversationId.toString());
      
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await fetch('/api/zapi/send-file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data: SendFileResponse = await response.json();
      console.log('✅ Arquivo enviado com sucesso:', data);

      return data.message;
    },
    onSuccess: (newMessage) => {
      // RENDERIZAÇÃO IMEDIATA: Atualizar cache React Query
      queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
        if (!oldData || !oldData.pages) {
          return {
            pages: [[newMessage]],
            pageParams: [0]
          };
        }
        
        // Verificar se a mensagem já existe em qualquer página
        const messageExists = oldData.pages.some((page: any[]) => 
          page.some((msg: any) => msg.id === newMessage.id)
        );
        
        if (messageExists) {
          return oldData;
        }
        
        // Adicionar à primeira página (mais recente) - ordenação cronológica
        const updatedPages = [...oldData.pages];
        updatedPages[0] = [...(updatedPages[0] || []), newMessage].sort((a, b) => 
          new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()
        );
        
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
        title: 'Arquivo enviado',
        description: 'O arquivo foi enviado com sucesso',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar arquivo:', error);
      toast({
        title: 'Erro ao enviar arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });
}