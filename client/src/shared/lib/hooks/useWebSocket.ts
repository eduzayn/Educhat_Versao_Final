import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../../store/store/chatStore';
import type { WebSocketMessage } from '../../../types/chat';
import type { Message } from '../../../types/chat';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      console.log('🔌 WebSocket conectado');
      setConnectionStatus(true);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (activeConversation) {
        sendMessage({
          type: 'join_conversation',
          conversationId: activeConversation.id,
        });
      }
    };

    // Handle ping from server - automatically handled by browser WebSocket API
    // The browser automatically responds to ping frames with pong frames
    
    // Setup timeout for detecting server disconnection
    const setupPingTimeout = () => {
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
      
      pingTimeoutRef.current = setTimeout(() => {
        console.log('🚨 Timeout do ping - servidor não responde');
        if (socketRef.current) {
          socketRef.current.close();
        }
      }, PING_TIMEOUT);
    };

    setupPingTimeout(); // Start initial timeout

    socketRef.current.onmessage = (event) => {
      setupPingTimeout(); // Reset timeout on any server activity
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
          case 'conversation_assigned':
            if ((data as any).conversationId) {
              const assignmentData = data as any;
              console.log('👥 Conversa atribuída via WebSocket:', {
                conversationId: assignmentData.conversationId,
                teamId: assignmentData.teamId,
                teamName: assignmentData.teamName,
                userId: assignmentData.userId,
                userName: assignmentData.userName,
                macrosetor: assignmentData.macrosetor,
                method: assignmentData.method
              });
              
              // Invalidar cache das conversas para refletir atribuição
              queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
              
              // Invalidar cache específico da conversa atribuída
              queryClient.invalidateQueries({ 
                queryKey: [`/api/conversations/${assignmentData.conversationId}`] 
              });
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
      console.log('🔌 WebSocket desconectado');
      setConnectionStatus(false);
      
      // Clear ping timeout
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
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
      // Clear all timeouts
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
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