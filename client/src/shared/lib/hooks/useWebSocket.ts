import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../../store/store/chatStore';
import type { WebSocketMessage } from '../../../types/chat';
import type { Message } from '../../../types/chat';

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { setConnectionStatus, addMessage, setTypingIndicator, activeConversation, updateConversationLastMessage } = useChatStore();

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    // Garantir que a URL seja sempre válida
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || 'localhost:5000';
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log('🔌 Conectando ao WebSocket:', wsUrl);
    
    try {
      socketRef.current = new WebSocket(wsUrl);
    } catch (error) {
      console.error('❌ Erro ao criar WebSocket:', error);
      setConnectionStatus(false);
      return;
    }

    socketRef.current.onopen = () => {
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
              console.log('📨 Nova mensagem via WebSocket:', {
                conversationId: data.conversationId,
                messageId: data.message.id,
                content: data.message.content
              });
              
              // Primeiro, adicionar ao store local para exibição imediata
              addMessage(data.conversationId, data.message);
              updateConversationLastMessage(data.conversationId, data.message);
              
              // Invalidar cache das mensagens para forçar recarregamento imediato
              queryClient.invalidateQueries({ 
                queryKey: [`/api/conversations/${data.conversationId}/messages`] 
              });
              
              // Invalidar cache das conversas para atualizar contadores e última mensagem
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
          case 'message_deleted':
            if ((data as any).messageId && (data as any).conversationId) {
              const deleteData = data as any;
              console.log('🗑️ Mensagem deletada via WebSocket:', {
                conversationId: deleteData.conversationId,
                messageId: deleteData.messageId
              });
              
              // Invalidar cache para forçar recarregamento das mensagens com status atualizado
              queryClient.invalidateQueries({ 
                queryKey: [`/api/conversations/${deleteData.conversationId}/messages`] 
              });
            }
            break;
          case 'course_detected':
            if ((data as any).conversationId && (data as any).courseInfo) {
              const courseData = data as any;
              console.log('🎓 Curso detectado via WebSocket:', {
                conversationId: courseData.conversationId,
                contactId: courseData.contactId,
                courseInfo: courseData.courseInfo
              });
              
              // Invalidar cache do contato para mostrar curso detectado
              queryClient.invalidateQueries({ 
                queryKey: [`/api/contacts/${courseData.contactId}`] 
              });
              
              // Invalidar cache das conversas para refletir interesse detectado
              queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            }
            break;
          case 'conversation_unread_status':
            if ((data as any).conversationId) {
              const unreadData = data as any;
              console.log('🔴 Status não lida atualizado via WebSocket:', {
                conversationId: unreadData.conversationId,
                unreadCount: unreadData.unreadCount,
                action: unreadData.action
              });
              
              // Invalidar E FORÇAR refetch IMEDIATO das conversas
              queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
              queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
              
              // Invalidar E FORÇAR refetch do contador global
              queryClient.invalidateQueries({ queryKey: ['/api/conversations/unread-count'] });
              queryClient.refetchQueries({ queryKey: ['/api/conversations/unread-count'] });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socketRef.current.onclose = () => {
      setConnectionStatus(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    socketRef.current.onerror = () => {
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