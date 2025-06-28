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

      const data = await response.json();
      
      // Se Z-API retornou savedMessage com metadados, usar esse ao invés do fallback
      if (data.savedMessage) {
        console.log('🔄 USANDO MENSAGEM SALVA PELA Z-API COM METADADOS (ARQUIVO):', data.savedMessage.id);
        return data.savedMessage;
      }
      
      // Fallback para compatibilidade
      console.log('✅ Arquivo enviado com sucesso:', data);
      return data.message;
    },
    onSuccess: (newMessage) => {
      // Validação crítica para evitar erros
      if (!newMessage || !newMessage.id || !newMessage.conversationId) {
        console.warn('⚠️ Mensagem de arquivo inválida recebida:', newMessage);
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