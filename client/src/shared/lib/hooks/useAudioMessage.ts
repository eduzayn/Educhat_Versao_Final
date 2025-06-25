import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/lib/hooks/use-toast';
import type { Message } from '@shared/schema';

interface UseAudioMessageProps {
  conversationId: number;
  contactPhone: string;
}

interface SendAudioResponse {
  message: Message;
  zaapId: string;
  messageId: string;
}

export function useAudioMessage({ conversationId, contactPhone }: UseAudioMessageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, duration }: { file: File; duration?: number }): Promise<Message> => {
      if (!file || !contactPhone) {
        throw new Error('Arquivo de áudio e telefone do contato são obrigatórios');
      }



      // Criar FormData para envio
      const formData = new FormData();
      formData.append('audio', file, 'audio.mp4');
      formData.append('phone', contactPhone);
      formData.append('conversationId', conversationId.toString());
      if (duration) {
        formData.append('duration', duration.toString());
      }

      const response = await fetch('/api/zapi/send-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data: SendAudioResponse = await response.json();
      console.log('✅ Áudio enviado com sucesso:', data);

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
          page && Array.isArray(page) && page.some((msg: any) => msg?.id === newMessage?.id)
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
        title: 'Áudio enviado',
        description: 'O áudio foi enviado com sucesso',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar áudio:', error);
      toast({
        title: 'Erro ao enviar áudio',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });
}