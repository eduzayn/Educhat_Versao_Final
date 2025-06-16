import { useState, useCallback } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { messagePerformanceMonitor } from '@/shared/lib/utils/messagePerformanceMonitor';
import { messageDebugger } from '@/shared/lib/utils/messageDebugger';
import { useToast } from '@/shared/lib/hooks/use-toast';

export function useMessageDeletion(messageId: number, conversationId?: number) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteMessage = useCallback(async (isFromContact: boolean, contactPhone?: string, messageMetadata?: any) => {
    if (!conversationId) {
      toast({
        title: "Erro",
        description: "ID da conversa não encontrado",
        variant: "destructive",
      });
      return false;
    }

    const performanceKey = messagePerformanceMonitor.startOperation(messageId, 'delete');
    messageDebugger.log(messageId, 'start-delete', { isFromContact, conversationId });
    
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

      messagePerformanceMonitor.endOperation(performanceKey, true);
      messageDebugger.log(messageId, 'success-delete', { isFromContact });
      
      toast({ 
        title: "Sucesso", 
        description: "Mensagem deletada com sucesso" 
      });

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      
      messagePerformanceMonitor.endOperation(performanceKey, false, errorMsg);
      messageDebugger.log(messageId, 'error-delete', { isFromContact, error }, errorMsg);
      
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

  const canDelete = useCallback((sentAt?: Date | string) => {
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
