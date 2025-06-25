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

export function useVideoMessage({ conversationId, contactPhone }: UseVideoMessageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }): Promise<Message> => {
      if (!file || !contactPhone) {
        throw new Error('Arquivo de vídeo e telefone do contato são obrigatórios');
      }

      console.log('🎥 Iniciando envio de vídeo:', {
        conversationId,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        hasCaption: !!caption,
        contactPhone
      });

      // Criar FormData para envio
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

      const data: SendVideoResponse = await response.json();
      console.log('✅ Vídeo enviado com sucesso:', data);

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