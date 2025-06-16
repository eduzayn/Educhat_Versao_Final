import { useState, useCallback } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';

export function useOptimizedDeletion(messageId: number, conversationId?: number) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteMessage = useCallback(async (isFromContact: boolean, contactPhone?: string | null, messageMetadata?: any) => {
    if (!conversationId) {
      toast({
        title: "Erro",
        description: "ID da conversa não encontrado",
        variant: "destructive",
      });
      return false;
    }

    const startTime = performance.now();
    console.log(`🗑️ Iniciando exclusão da mensagem ${messageId}`);
    
    setIsDeleting(true);

    try {
      if (isFromContact) {
        await apiRequest("POST", "/api/messages/soft-delete", {
          messageId,
          conversationId,
        });
      } else {
        const metadata = messageMetadata as any;
        const zapiMessageId = metadata?.messageId || metadata?.zaapId || metadata?.id;
        
        if (!zapiMessageId) {
          throw new Error("ID da mensagem Z-API não encontrado");
        }

        await apiRequest("POST", "/api/zapi/delete-message", {
          phone: contactPhone,
          messageId: zapiMessageId.toString(),
          conversationId,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', conversationId, 'messages'],
      });

      const duration = performance.now() - startTime;
      console.log(`✅ Mensagem ${messageId} deletada com sucesso em ${duration.toFixed(2)}ms`);
      
      toast({ 
        title: "Sucesso", 
        description: "Mensagem deletada com sucesso" 
      });

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      const duration = performance.now() - startTime;
      
      console.error(`❌ Erro ao deletar mensagem ${messageId} após ${duration.toFixed(2)}ms:`, error);
      
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [messageId, conversationId, toast]);

  const canDelete = useCallback((sentAt?: Date | string | null) => {
    if (!sentAt) return false;
    
    const now = new Date();
    const messageDate = new Date(sentAt);
    const timeDifference = now.getTime() - messageDate.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000;
    
    return timeDifference <= sevenMinutesInMs;
  }, []);

  return {
    isDeleting,
    deleteMessage,
    canDelete
  };
}
