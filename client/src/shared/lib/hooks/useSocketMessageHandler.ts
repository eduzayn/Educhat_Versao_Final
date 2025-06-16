import { useEffect, useCallback } from 'react';
import { socketOptimizations } from '@/shared/lib/utils/socketOptimizations';
import { messageDebugger } from '@/shared/lib/utils/messageDebugger';

export function useSocketMessageHandler(conversationId?: number) {
  const handleSocketMessage = useCallback((event: CustomEvent) => {
    const { messageId, conversationId: msgConversationId } = event.detail;
    
    if (conversationId && msgConversationId !== conversationId) {
      return;
    }

    messageDebugger.log(messageId, 'socket-message-received', { 
      conversationId: msgConversationId,
      currentConversation: conversationId 
    });

    console.log(`📨 Nova mensagem recebida via Socket.IO: ${messageId}`);
  }, [conversationId]);

  useEffect(() => {
    window.addEventListener('socketMessageReceived', handleSocketMessage as EventListener);
    
    return () => {
      window.removeEventListener('socketMessageReceived', handleSocketMessage as EventListener);
    };
  }, [handleSocketMessage]);

  const queueSocketMessage = useCallback((messageId: number, conversationId: number) => {
    socketOptimizations.queueMessage(messageId, conversationId);
  }, []);

  return {
    queueSocketMessage
  };
}
