import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import type { WebSocketMessage, Message } from '@/types/chat';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const {
    setConnectionStatus,
    addMessage,
    setTypingIndicator,
    updateConversationLastMessage,
    activeConversation,
  } = useChatStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus(true);
        reconnectAttempts.current = 0;

        // Join active conversation if exists
        if (activeConversation) {
          sendMessage({
            type: 'join_conversation',
            conversationId: activeConversation.id,
          });
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              if (data.message && data.conversationId) {
                addMessage(data.conversationId, data.message);
                updateConversationLastMessage(data.conversationId, data.message);
              }
              break;
              
            case 'typing':
              if (data.conversationId !== undefined) {
                setTypingIndicator(
                  data.conversationId,
                  data.isTyping
                    ? {
                        conversationId: data.conversationId,
                        isTyping: data.isTyping,
                        timestamp: new Date(),
                      }
                    : null
                );
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts.current);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus(false);
    }
  }, [setConnectionStatus, addMessage, setTypingIndicator, updateConversationLastMessage, activeConversation]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus(false);
  }, [setConnectionStatus]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    sendMessage({
      type: 'join_conversation',
      conversationId,
    });
  }, [sendMessage]);

  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      conversationId,
      isTyping,
    });
  }, [sendMessage]);

  const sendChatMessage = useCallback((conversationId: number, content: string, isFromContact = false) => {
    sendMessage({
      type: 'send_message',
      conversationId,
      message: {
        conversationId,
        content,
        isFromContact,
      } as Message,
    });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Join conversation when active conversation changes
  useEffect(() => {
    if (activeConversation && wsRef.current?.readyState === WebSocket.OPEN) {
      joinConversation(activeConversation.id);
    }
  }, [activeConversation, joinConversation]);

  return {
    sendMessage,
    joinConversation,
    sendTypingIndicator,
    sendChatMessage,
    connect,
    disconnect,
  };
}
