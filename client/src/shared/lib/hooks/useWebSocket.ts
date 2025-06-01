import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../../store/store/chatStore';
import type { WebSocketMessage } from '../../../types/chat';

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { setConnectionStatus, addMessage, setTypingIndicator, activeConversation, updateConversationLastMessage } = useChatStore();

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus(true);
      
      if (activeConversation) {
        sendMessage({
          type: 'join_conversation',
          conversationId: activeConversation.id,
        });
      }
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'new_message':
            if (data.message && data.conversationId) {
              console.log('📨 Mensagem recebida via WebSocket:', data.message);
              addMessage(data.conversationId, data.message);
              updateConversationLastMessage(data.conversationId, data.message);
              
              // Invalidar cache do React Query para atualizar a interface
              queryClient.invalidateQueries({ queryKey: ['/api/conversations', data.conversationId, 'messages'] });
              queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            }
            break;
          case 'typing':
            if (data.conversationId !== undefined && data.isTyping !== undefined) {
              setTypingIndicator(data.conversationId, data.isTyping ? {
                conversationId: data.conversationId,
                isTyping: data.isTyping,
                timestamp: new Date(),
              } : null);
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus(false);
    };
  }, [setConnectionStatus, addMessage, setTypingIndicator, activeConversation]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      conversationId,
      isTyping,
    });
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    sendMessage,
    sendTypingIndicator,
  };
}