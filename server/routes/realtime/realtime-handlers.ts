import { Server as SocketIOServer } from "socket.io";
import { storage } from "../../storage/index";
import { setIOInstance } from './realtime-broadcast';

// Store connected clients with their metadata
const clients = new Map<string, { 
  contactId?: number; 
  conversationId?: number; 
  socketId: string;
  connectedAt: number;
}>();

export function setupSocketHandlers(io: SocketIOServer) {
  // Configurar instância do Socket.IO para broadcasting
  setIOInstance(io);
  
  // Logging específico para produção
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = process.env.REPLIT_DEPLOYMENT_ID || process.env.REPL_ID;
  
  if (isProduction && isReplit) {
    console.log('🔌 [PRODUÇÃO] Socket.IO configurado para Replit:', {
      transports: io.engine.transports,
      cors: io.engine.opts.cors,
      allowUpgrades: io.engine.opts.allowUpgrades
    });
  }
  
  io.on('connection', (socket) => {
    const transport = socket.conn.transport.name;
    console.log(`🔌 Cliente conectado via Socket.IO: ${socket.id} (${transport})`);
    
    clients.set(socket.id, { 
      socketId: socket.id, 
      connectedAt: Date.now() 
    });
    
    // Log transport upgrades em produção
    socket.conn.on('upgrade', () => {
      const newTransport = socket.conn.transport.name;
      console.log(`🔄 Transport upgrade: ${transport} → ${newTransport} (${socket.id})`);
    });
    
    socket.conn.on('upgradeError', (error) => {
      console.error(`❌ Upgrade error para ${socket.id}:`, error.message);
    });

    // Handle joining a conversation room
    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      const clientData = clients.get(socket.id);
      if (clientData && conversationId) {
        // Sair de sala anterior se existir
        if (clientData.conversationId) {
          socket.leave(`conversation:${clientData.conversationId}`);
          console.log(`🚪 [PROD-AUDIT] Cliente ${socket.id} saiu da conversa ${clientData.conversationId}`);
        }
        
        // Entrar na nova sala
        clients.set(socket.id, { ...clientData, conversationId });
        socket.join(`conversation:${conversationId}`);
        
        const roomSize = socket.adapter?.rooms?.get(`conversation:${conversationId}`)?.size || 0;
        console.log(`🏠 [PROD-AUDIT] JOIN_CONVERSATION: Cliente ${socket.id} entrou na conversa ${conversationId} (${roomSize} clientes na sala)`);
        
        // Confirmar entrada na sala com dados completos
        socket.emit('joined_conversation', { 
          conversationId, 
          success: true,
          timestamp: new Date().toISOString(),
          roomSize,
          socketId: socket.id
        });
        
      } else {
        console.warn(`⚠️ [PROD-AUDIT] JOIN_CONVERSATION: Falha - clientData=${!!clientData}, conversationId=${conversationId}`);
        socket.emit('joined_conversation', { 
          conversationId, 
          success: false, 
          error: 'Dados inválidos',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        isTyping,
        socketId: socket.id
      });
    });

    // SOCKET-FIRST: Handle envio de mensagens em tempo real OTIMIZADO
    socket.on('send_message', async (data) => {
      const startTime = performance.now();
      const { conversationId, content, messageType = 'text', isFromContact = false, isInternalNote = false, optimisticId } = data;
      
      try {
        console.log(`📡 [PROD-AUDIT] SOCKET: Processando mensagem ${optimisticId} para conversa ${conversationId}`);
        
        // MELHORIA 1: Resposta imediata ao cliente antes do DB
        socket.emit('message_received', {
          optimisticId,
          status: 'processing',
          timestamp: new Date().toISOString()
        });
        
        // Salvar mensagem no banco com versão otimizada
        const newMessage = await storage.message.createMessageOptimized({
          conversationId,
          content,
          messageType,
          isFromContact,
          isInternalNote
        });
        
        const dbTime = performance.now() - startTime;
        console.log(`💾 [PROD-AUDIT] SOCKET: Mensagem ${newMessage.id} salva em ${dbTime.toFixed(1)}ms`);
        
        // MELHORIA 2: Broadcast otimizado com confirmação de entrega
        const broadcastData = {
          type: 'new_message',
          message: newMessage,
          conversationId,
          optimisticId,
          dbTime: dbTime.toFixed(1),
          source: 'socket',
          timestamp: new Date().toISOString()
        };

        // Broadcast para a sala específica
        const roomName = `conversation:${conversationId}`;
        const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        
        console.log(`📡 [PROD-AUDIT] BROADCAST: Enviando para sala ${roomName} (${roomSize} clientes)`);
        io.to(roomName).emit('broadcast_message', broadcastData);
        
        // MELHORIA 3: Confirmação imediata para o remetente com dados completos
        socket.emit('message_sent', {
          message: newMessage,
          optimisticId,
          processTime: (performance.now() - startTime).toFixed(1),
          broadcastConfirmed: true,
          roomSize
        });
        
        const totalTime = performance.now() - startTime;
        console.log(`⚡ [PROD-AUDIT] SOCKET: Mensagem ${newMessage.id} processada em ${totalTime.toFixed(1)}ms`);
        
        // Z-API em background (não bloqueia resposta)
        if (!isInternalNote) {
          processZApiBackground(conversationId, content, newMessage.id);
        }
        
      } catch (error) {
        const errorTime = performance.now() - startTime;
        console.error(`❌ [PROD-AUDIT] SOCKET: Erro após ${errorTime.toFixed(1)}ms:`, error.message);
        
        socket.emit('message_error', { 
          message: 'Erro ao enviar mensagem',
          error: error.message,
          optimisticId,
          processTime: errorTime.toFixed(1),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle conversation assignment updates
    socket.on('conversation_assignment_updated', (data) => {
      const { conversationId, assignedTeamId, assignedUserId, assignmentMethod } = data;
      
      // Broadcast assignment update to all clients in the conversation
      io.to(`conversation:${conversationId}`).emit('conversation_assignment_updated', {
        conversationId,
        assignedTeamId,
        assignedUserId,
        assignmentMethod,
        updatedAt: new Date().toISOString()
      });
    });

    // Handle disconnection with enhanced logging
    socket.on('disconnect', (reason) => {
      const clientData = clients.get(socket.id);
      const connectionDuration = clientData ? Date.now() - clientData.connectedAt : 0;
      
      console.log(`🔌 Cliente ${socket.id} desconectado: ${reason}`, {
        reason,
        duration: `${Math.round(connectionDuration / 1000)}s`,
        conversationId: clientData?.conversationId,
        wasInRoom: !!clientData?.conversationId
      });
      
      clients.delete(socket.id);
    });

    // Handle connection errors on server side
    socket.on('error', (error) => {
      console.error(`❌ Erro no socket ${socket.id}:`, error);
    });
  });
}

/**
 * Processa Z-API em background sem bloquear Socket.IO
 */
async function processZApiBackground(conversationId: number, content: string, messageId: number) {
  try {
    // Usar método otimizado para buscar apenas dados necessários
    const conversation = await storage.conversation.getConversationWithContact(conversationId);
    
    if (conversation?.contact?.phone) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const response = await fetch(`${process.env.WEBHOOK_URL || 'http://localhost:5000'}/api/zapi/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: conversation.contact.phone,
          message: content,
          conversationId,
          messageId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const zapiData = await response.json();
        await storage.message.updateMessageZApiStatus(messageId, {
          whatsappMessageId: zapiData.messageId,
          zapiStatus: 'SENT'
        });
        console.log(`📱 Z-API background: Sucesso para mensagem ${messageId}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Z-API background falhou para mensagem ${messageId}:`, error.message);
    await storage.message.updateMessageZApiStatus(messageId, {
      zapiStatus: 'ERROR'
    }).catch(() => {}); // Ignorar erro secundário
  }
} 