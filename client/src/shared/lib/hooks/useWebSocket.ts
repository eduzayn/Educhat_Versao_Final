import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/shared/store/chatStore';
import type { WebSocketMessage } from '../../../types/chat';
import type { Message } from '../../../types/chat';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { setConnectionStatus, addMessage, setTypingIndicator, activeConversation, updateConversationLastMessage } = useChatStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Configurar URL do Socket.IO
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.host || 'localhost:5000';
    const socketUrl = `${protocol}//${host}`;
    
    console.log('🔌 Conectando ao Socket.IO:', socketUrl);
    
    try {
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        forceNew: true
      });
    } catch (error) {
      console.error('❌ Erro ao criar Socket.IO:', error);
      setConnectionStatus(false);
      return;
    }

    // Handle successful connection
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket.IO conectado');
      setConnectionStatus(true);
      
      if (activeConversation) {
        socketRef.current?.emit('join_conversation', {
          conversationId: activeConversation.id,
        });
      }
    });

    // Handle typing indicators
    socketRef.current.on('typing', (data) => {
      if (data.conversationId !== undefined && data.isTyping !== undefined) {
        setTypingIndicator(data.conversationId, data.isTyping);
      }
    });

    // Handle broadcast messages for other events
    socketRef.current.on('broadcast_message', (data) => {
      // Handle new_message within broadcast_message
      if (data.type === 'new_message' && data.message && data.conversationId) {
        console.log('📨 Nova mensagem via broadcast:', data);
        
        // Adicionar mensagem ao store local imediatamente
        addMessage(data.conversationId, data.message);
        updateConversationLastMessage(data.conversationId, data.message);
        
        // Atualizar cache do React Query imediatamente
        queryClient.setQueryData([`/api/conversations/${data.conversationId}/messages`], (oldData: any) => {
          if (!oldData) return [data.message];
          // Verificar se a mensagem já existe para evitar duplicatas
          const messageExists = oldData.some((msg: any) => msg.id === data.message.id);
          if (messageExists) return oldData;
          return [...oldData, data.message];
        });
        
        // Invalidação em background para sincronização
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${data.conversationId}/messages`] 
        });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations/unread-count'] });
        
        return;
      }

      switch (data.type) {
        case 'status_update':
          if (data.contactId && data.isOnline !== undefined) {
            console.log('🟢 Status atualizado:', {
              contactId: data.contactId,
              isOnline: data.isOnline
            });
          }
          break;
        case 'message_deleted':
          if (data.messageId && data.conversationId) {
            console.log('🗑️ Mensagem deletada:', {
              messageId: data.messageId,
              conversationId: data.conversationId
            });
            
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}/messages`] 
            });
          }
          break;
        case 'course_detected':
          if (data.conversationId && data.course) {
            console.log('🎓 Curso detectado:', {
              conversationId: data.conversationId,
              course: data.course,
              confidence: data.confidence
            });
            
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}`] 
            });
          }
          break;
        case 'crm_update':
          if (data.action === 'deal_created' || data.action === 'conversation_updated') {
            console.log('📊 Atualização CRM:', {
              action: data.action,
              contactId: data.contactId,
              conversationId: data.conversationId,
              macrosetor: data.macrosetor
            });
            
            // Invalidar queries do CRM para forçar recarregamento
            queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          }
          break;
        case 'conversation_assigned':
          if (data.conversationId) {
            console.log('👥 Conversa atribuída:', {
              conversationId: data.conversationId,
              teamId: data.teamId,
              teamName: data.teamName,
              userId: data.userId,
              userName: data.userName,
              macrosetor: data.macrosetor,
              method: data.method
            });
            
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}`] 
            });
          }
          break;
        case 'conversation_unread_status':
          if (data.conversationId) {
            console.log('🔴 Status não lida atualizado:', {
              conversationId: data.conversationId,
              unreadCount: data.unreadCount,
              action: data.action
            });
            
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}`] 
            });
          }
          break;
        default:
          console.log('📨 Evento Socket.IO não mapeado:', data.type);
      }
    });

    // Handle disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO desconectado:', reason);
      setConnectionStatus(false);
      
      if (reason === 'io server disconnect') {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Erro de conexão Socket.IO:', error);
      setConnectionStatus(false);
    });
  }, [setConnectionStatus, addMessage, setTypingIndicator, activeConversation, updateConversationLastMessage, queryClient]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', message);
    }
  }, []);

  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', {
        conversationId,
        isTyping,
      });
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      // Clear all timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close Socket.IO connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  return {
    sendMessage,
    sendTypingIndicator,
  };
}