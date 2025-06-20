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
  const { setConnectionStatus, addMessage, setTypingIndicator, activeConversation, updateActiveConversationAssignment, setActiveConversation } = useChatStore();

  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Verificar se já existe uma conexão ativa e válida
    if (socketRef.current?.connected && !socketRef.current.disconnected) {
      console.log('🔌 Socket já conectado e válido, reutilizando conexão');
      return;
    }

    // Desconectar e limpar socket anterior completamente
    if (socketRef.current) {
      console.log('🧹 Limpando socket anterior:', {
        connected: socketRef.current.connected,
        disconnected: socketRef.current.disconnected
      });
      
      try {
        socketRef.current.removeAllListeners();
        if (!socketRef.current.disconnected) {
          socketRef.current.disconnect();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao limpar socket anterior:', error);
      }
      
      socketRef.current = null;
    }

    // Configurar URL do Socket.IO
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.host || 'localhost:5000';
    const socketUrl = `${protocol}//${host}`;
    
    console.log('🔌 Conectando ao Socket.IO:', socketUrl);
    
    try {
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'], // WebSocket prioritário
        timeout: 3000,               // 3s - resposta ultra rápida socket-first
        reconnection: true,
        reconnectionDelay: 200,      // 200ms - reconexão instantânea
        reconnectionDelayMax: 1000,  // 1s máximo - sem delays longos
        reconnectionAttempts: 10,    // Mais tentativas para estabilidade
        randomizationFactor: 0.2,    // Menos randomização para velocidade
        forceNew: false,
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        // Configurações socket-first otimizadas
        closeOnBeforeunload: false   // Manter conexão ao trocar tabs
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
      
      // SOCKET-FIRST: Registrar instância global para envio de mensagens
      (window as any).socketInstance = socketRef.current;
      
      // Limpar timeout de reconexão ao conectar com sucesso
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (activeConversation) {
        socketRef.current?.emit('join_conversation', {
          conversationId: activeConversation.id,
        });
      }
    });

    // All events are now handled via broadcast_message

    // Handle typing indicators
    socketRef.current.on('typing', (data) => {
      if (data.conversationId !== undefined && data.isTyping !== undefined) {
        setTypingIndicator(data.conversationId, data.isTyping);
      }
    });

    // SOCKET-FIRST: Handler otimizado para mensagens em tempo real
    socketRef.current.on('broadcast_message', (data) => {
      // Handle new_message - Sistema socket-first como Chatwoot
      if (data.type === 'new_message' && data.message && data.conversationId) {
        console.log('📨 Nova mensagem via WebSocket:', data);
        
        // SOCKET-FIRST: Para conversa ativa, aplicar mensagem diretamente via WebSocket
        if (activeConversation?.id === data.conversationId) {
          console.log('⚡ SOCKET-FIRST: Aplicando mensagem via WebSocket para conversa ativa');
          
          // Atualizar cache diretamente sem refetch - elimina polling
          queryClient.setQueryData(
            ['/api/conversations', data.conversationId, 'messages'],
            (oldMessages: any[] | undefined) => {
              if (!oldMessages) return [data.message];
              
              // Verificar se é atualização de mensagem otimista ou nova mensagem
              const optimisticIndex = oldMessages.findIndex(msg => 
                msg.id < 0 && msg.content === data.message.content
              );
              
              if (optimisticIndex !== -1) {
                // Substituir mensagem otimista pela real
                const updatedMessages = [...oldMessages];
                updatedMessages[optimisticIndex] = { ...data.message, status: 'delivered' };
                return updatedMessages;
              }
              
              // Nova mensagem via WebSocket
              const exists = oldMessages.find(msg => msg.id === data.message.id);
              if (exists) return oldMessages;
              
              return [...oldMessages, { ...data.message, status: 'received' }];
            }
          );
          
          // Atualizar store local
          addMessage(data.conversationId, data.message);
          return;
        }
        
        // Para outras conversas, atualizar cache silenciosamente
        addMessage(data.conversationId, data.message);
        queryClient.setQueryData(
          ['/api/conversations', data.conversationId, 'messages'],
          (oldMessages: any[] | undefined) => {
            if (!oldMessages) return [data.message];
            const exists = oldMessages.find(msg => msg.id === data.message.id);
            if (exists) return oldMessages;
            return [...oldMessages, data.message];
          }
        );
        
        // SOCKET-FIRST: Atualizar lista de conversas sem polling
        queryClient.setQueryData(['/api/conversations'], (oldData: any) => {
          if (!oldData?.conversations) return oldData;
          return {
            ...oldData,
            conversations: oldData.conversations.map((conv: any) => 
              conv.id === data.conversationId 
                ? { ...conv, lastMessageAt: data.message.sentAt, unreadCount: (conv.unreadCount || 0) + 1 }
                : conv
            )
          };
        });
        
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
        case 'message_updated':
          if (data.messageId && data.conversationId) {
            console.log('🗑️ Mensagem deletada/atualizada:', {
              messageId: data.messageId,
              conversationId: data.conversationId,
              type: data.type
            });
            
            queryClient.invalidateQueries({ 
              queryKey: ['/api/conversations', data.conversationId, 'messages'] 
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
        case 'conversation_assignment_updated':
          if (data.conversationId) {
            console.log('👥 Atribuição de conversa atualizada:', {
              conversationId: data.conversationId,
              assignedTeamId: data.assignedTeamId,
              assignedUserId: data.assignedUserId,
              assignedUser: data.assignedUser,
              assignmentMethod: data.assignmentMethod
            });
            
            // Atualizar estado local ANTES de invalidar queries para garantir reatividade imediata
            if (activeConversation && activeConversation.id === data.conversationId) {
              updateActiveConversationAssignment(data.assignedTeamId, data.assignedUserId);
            }
            
            // Forçar refetch imediato para atualizar interface - garantindo que dados de assignedUser sejam atualizados
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.refetchQueries({ 
              queryKey: ['/api/conversations'],
              type: 'active'
            }).catch(error => {
              console.error('Erro ao atualizar cache de conversas:', error);
            });
            queryClient.invalidateQueries({ 
              queryKey: ['/api/conversations', data.conversationId]
            });
            queryClient.refetchQueries({ 
              queryKey: ['/api/conversations', data.conversationId],
              type: 'active'
            }).catch(error => {
              console.error('Erro ao atualizar cache da conversa:', error);
            });
          }
          break;
        case 'crm_update':
          if (data.action === 'deal_created' || data.action === 'conversation_updated') {
            console.log('📊 Atualização CRM:', {
              action: data.action,
              contactId: data.contactId,
              conversationId: data.conversationId,
              teamType: data.teamType
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
              teamType: data.teamType,
              method: data.method
            });
            
            // Atualizar activeConversation se for a conversa atual
            if (activeConversation && activeConversation.id === data.conversationId) {
              updateActiveConversationAssignment(data.teamId || null, data.userId || null);
            }
            
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
        case 'conversation_updated':
          if (data.conversationId && data.conversation) {
            console.log('🔄 Conversa atualizada em tempo real:', {
              conversationId: data.conversationId,
              assignedUserId: data.conversation.assignedUserId,
              assignedTeamId: data.conversation.assignedTeamId,
              status: data.conversation.status
            });
            
            // Invalidar e recarregar queries relacionadas à conversa
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}`] 
            });
            
            // Force refetch imediato para atualizar o cabeçalho
            Promise.all([
              queryClient.refetchQueries({ 
                queryKey: ['/api/conversations'], 
                type: 'active'
              }),
              queryClient.refetchQueries({ 
                queryKey: [`/api/conversations/${data.conversationId}`],
                type: 'active'
              })
            ]).catch(error => {
              console.error('Erro ao atualizar cache após atualização da conversa:', error);
            });
          }
          break;
        case 'conversation_assigned_to_user':
          if (data.conversationId && data.conversation) {
            console.log('👤 Conversa atribuída a usuário em tempo real:', {
              conversationId: data.conversationId,
              assignedUserId: data.conversation.assignedUserId,
              assignedUserName: data.conversation.assignedUserName
            });
            
            // Atualizar activeConversation se for a conversa atual
            if (activeConversation && activeConversation.id === data.conversationId) {
              updateActiveConversationAssignment(
                data.conversation.assignedTeamId || null, 
                data.conversation.assignedUserId || null
              );
            }
            
            // Invalidar cache para atualizar a interface
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}`] 
            });
            
            // Force refetch para atualização imediata
            Promise.all([
              queryClient.refetchQueries({ 
                queryKey: ['/api/conversations'], 
                type: 'active'
              }),
              queryClient.refetchQueries({ 
                queryKey: [`/api/conversations/${data.conversationId}`],
                type: 'active'
              })
            ]).catch(error => {
              console.error('Erro ao atualizar cache após atribuição:', error);
            });
          }
          break;
        case 'conversation_user_unassigned':
          if (data.conversationId) {
            console.log('🔄 Usuário removido da conversa em tempo real:', {
              conversationId: data.conversationId,
              previousUserId: data.previousUserId,
              previousUserName: data.previousUserName
            });
            
            // Invalidar cache para atualizar a interface
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/conversations/${data.conversationId}`] 
            });
            
            // Force refetch para atualização imediata
            Promise.all([
              queryClient.refetchQueries({ 
                queryKey: ['/api/conversations'], 
                type: 'active'
              }),
              queryClient.refetchQueries({ 
                queryKey: [`/api/conversations/${data.conversationId}`],
                type: 'active'
              })
            ]).catch(error => {
              console.error('Erro ao atualizar cache após remoção:', error);
            });
          }
          break;
        case 'new_conversation_created':
          if (data.conversationId && data.contactName) {
            console.log('🆕 Nova conversa criada em tempo real:', {
              conversationId: data.conversationId,
              contactId: data.contactId,
              contactName: data.contactName,
              contactPhone: data.contactPhone,
              channel: data.channel
            });
            
            // Invalidar cache de conversas para forçar recarregamento imediato
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            
            // Force refetch imediato para garantir que a nova conversa apareça
            queryClient.refetchQueries({ 
              queryKey: ['/api/conversations'], 
              type: 'active'
            }).catch(error => {
              console.error('Erro ao atualizar cache de conversas:', error);
            });
            
            // Remover cache antigo e forçar busca nova
            queryClient.removeQueries({ queryKey: ['/api/conversations'] });
            setTimeout(() => {
              queryClient.refetchQueries({ queryKey: ['/api/conversations'] }).catch(error => {
                console.error('Erro ao recarregar conversas:', error);
              });
            }, 100);
          }
          break;
        default:
          console.log('📨 Evento Socket.IO não mapeado:', data.type);
      }
    });

    // Handle disconnection with enhanced monitoring
    socketRef.current.on('disconnect', (reason) => {
      console.warn('🔌 Desconectado:', reason);
      setConnectionStatus(false);
      
      // Reconectar automaticamente apenas para desconexões não intencionais
      const shouldReconnect = reason !== 'io client disconnect' && 
                             reason !== 'io server disconnect' &&
                             !reconnectTimeoutRef.current;
      
      if (shouldReconnect) {
        const baseDelay = 3000;
        const jitter = Math.random() * 1000; // Adiciona jitter para evitar reconexões simultâneas
        const delay = Math.min(baseDelay + jitter, 30000);
        
        console.log(`🔄 Reagendando reconexão em ${Math.round(delay)}ms - Motivo: ${reason}`);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Tentando reconectar...');
          connect();
        }, delay);
      }
    });

    // Handle connection errors with retry logic
    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Erro de conexão Socket.IO:', error);
      setConnectionStatus(false);
    });

    // Tratamento específico para timeout - CORREÇÃO CRÍTICA
    socketRef.current.on('connect_timeout', () => {
      console.warn('⏰ Timeout de conexão Socket.IO detectado - ignorando para evitar crash');
      // Não alterar connectionStatus para evitar loops desnecessários
    });

    // Tratamento de erros genéricos - PROTEÇÃO CONTRA TIMEOUTS
    socketRef.current.on('error', (error) => {
      if (error && typeof error === 'object' && 'message' in error && 
          error.message && error.message.toString().toLowerCase().includes('timeout')) {
        console.warn('⏰ Timeout Socket.IO detectado - ignorando para manter estabilidade');
        return; // Ignorar timeouts silenciosamente para não quebrar a aplicação
      }
      console.error('❌ Erro genérico Socket.IO:', error);
    });

    // Monitor reconnection attempts
    socketRef.current.on('reconnect_attempt', (attempt) => {
      console.log(`🔁 Tentativa de reconexão ${attempt}`);
    });

    // Handle successful reconnection
    socketRef.current.on('reconnect', (attempt) => {
      console.log(`🔁 Reconectado - tentativa ${attempt}`);
      setConnectionStatus(true);
      
      // Rejoinder conversation room after reconnection
      if (activeConversation) {
        socketRef.current?.emit('join_conversation', {
          conversationId: activeConversation.id,
        });
      }
    });

    // Handle failed reconnection attempts
    socketRef.current.on('reconnect_failed', () => {
      console.error('❌ Falha na reconexão após todas as tentativas');
      setConnectionStatus(false);
    });
  }, [setConnectionStatus, addMessage, setTypingIndicator, activeConversation, queryClient]);

  const isSocketReady = useCallback(() => {
    return socketRef.current && 
           socketRef.current.connected && 
           !socketRef.current.disconnected;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!isSocketReady()) {
      console.warn('⚠️ Socket não está pronto para envio de mensagem:', {
        exists: !!socketRef.current,
        connected: socketRef.current?.connected,
        disconnected: socketRef.current?.disconnected
      });
      return;
    }

    try {
      socketRef.current!.emit('send_message', message);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via socket:', error);
    }
  }, [isSocketReady]);

  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    if (!isSocketReady()) {
      console.warn('⚠️ Socket não está pronto para indicador de digitação:', {
        exists: !!socketRef.current,
        connected: socketRef.current?.connected,
        disconnected: socketRef.current?.disconnected
      });
      return;
    }

    try {
      socketRef.current!.emit('typing', {
        conversationId,
        isTyping,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar indicador de digitação via socket:', error);
    }
  }, [isSocketReady]);

  useEffect(() => {
    connect();

    return () => {
      // Clear all timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close Socket.IO connection apenas se não estiver já desconectado
      if (socketRef.current && !socketRef.current.disconnected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [connect]);

  return {
    sendMessage,
    sendTypingIndicator,
  };
}