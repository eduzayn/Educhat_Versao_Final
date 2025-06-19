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
    console.log(`🗑️ Iniciando exclusão otimista da mensagem ${messageId}`);
    
    setIsDeleting(true);

    // ✨ ATUALIZAÇÃO OTIMISTA: Marcar mensagem como deletada IMEDIATAMENTE na UI
    const previousMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages']);
    const previousInfiniteMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages', 'infinite']);
    
    // Atualizar tanto query normal quanto infinite
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages'],
      (old: any[] | undefined) => {
        if (!old) return [];
        return old.map(msg => 
          msg.id === messageId 
            ? { ...msg, isDeleted: true, isDeletedByUser: true, deletedAt: new Date() }
            : msg
        );
      }
    );

    // Atualizar query infinite (usada pelo componente atual)
    queryClient.setQueryData(
      ['/api/conversations', conversationId, 'messages', 'infinite'],
      (old: any | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((msg: any) => 
              msg.id === messageId 
                ? { ...msg, isDeleted: true, isDeletedByUser: true, deletedAt: new Date() }
                : msg
            )
          }))
        };
      }
    );

    console.log(`✅ Mensagem ${messageId} marcada como deletada na UI instantaneamente`);

    try {
      if (isFromContact) {
        await apiRequest("POST", "/api/messages/soft-delete", {
          messageId,
          conversationId,
        });
      } else {
        const metadata = messageMetadata as any;
        // Tentar múltiplas formas de encontrar o ID Z-API baseado na estrutura real dos dados
        const zapiMessageId = metadata?.zaapId || 
                             metadata?.messageId || 
                             metadata?.id ||
                             metadata?.whatsappMessageId;
        
        if (!zapiMessageId) {
          console.error("Metadados da mensagem:", metadata);
          throw new Error("ID da mensagem Z-API não encontrado nos metadados");
        }

        await apiRequest("POST", "/api/zapi/delete-message", {
          phone: contactPhone,
          messageId: zapiMessageId.toString(),
          conversationId,
        });
      }

      // Invalidar apenas após sucesso para garantir sincronização com servidor
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', conversationId, 'messages'],
      });

      const duration = performance.now() - startTime;
      console.log(`✅ Exclusão confirmada no servidor em ${duration.toFixed(2)}ms`);
      
      toast({ 
        title: "Sucesso", 
        description: "Mensagem deletada com sucesso" 
      });

      return true;
    } catch (error) {
      // ❌ REVERTER ATUALIZAÇÃO OTIMISTA em caso de erro
      if (previousMessages) {
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages'],
          previousMessages
        );
      }
      
      if (previousInfiniteMessages) {
        queryClient.setQueryData(
          ['/api/conversations', conversationId, 'messages', 'infinite'],
          previousInfiniteMessages
        );
      }

      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      const duration = performance.now() - startTime;
      
      console.error(`❌ Erro ao deletar mensagem ${messageId} após ${duration.toFixed(2)}ms - revertendo UI:`, error);
      
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
    
    // Verificar se a data é válida
    if (isNaN(messageDate.getTime())) {
      console.warn('Data inválida fornecida para canDelete:', sentAt);
      return false;
    }
    
    const timeDifference = now.getTime() - messageDate.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000;
    
    // Debug para entender o problema
    console.log('🕐 Verificação de tempo para exclusão:', {
      sentAt,
      messageDate: messageDate.toISOString(),
      now: now.toISOString(),
      timeDifferenceMs: timeDifference,
      timeDifferenceMinutes: Math.round(timeDifference / (60 * 1000)),
      sevenMinutesMs: sevenMinutesInMs,
      canDelete: timeDifference <= sevenMinutesInMs
    });
    
    return timeDifference <= sevenMinutesInMs;
  }, []);

  return {
    isDeleting,
    deleteMessage,
    canDelete
  };
}
