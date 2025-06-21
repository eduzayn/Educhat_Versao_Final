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
      if (clientData) {
        clients.set(socket.id, { ...clientData, conversationId });
        socket.join(`conversation:${conversationId}`);
        console.log(`🏠 Cliente ${socket.id} entrou na conversa ${conversationId}`);
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
        console.log(`📡 SOCKET-OPTIMIZED: Processando mensagem ${optimisticId}`);
        
        // Salvar mensagem no banco com versão otimizada
        const newMessage = await storage.message.createMessageOptimized({
          conversationId,
          content,
          messageType,
          isFromContact,
          isInternalNote
        });
        
        const dbTime = performance.now() - startTime;
        console.log(`💾 SOCKET: Mensagem salva em ${dbTime.toFixed(1)}ms`);
        
        // Broadcast imediato via WebSocket
        const broadcastData = {
          type: 'new_message',
          message: newMessage,
          conversationId,
          optimisticId,
          dbTime: dbTime.toFixed(1)
        };

        io.to(`conversation:${conversationId}`).emit('broadcast_message', broadcastData);
        
        // Resposta de confirmação para o remetente
        socket.emit('message_sent', {
          message: newMessage,
          optimisticId,
          processTime: (performance.now() - startTime).toFixed(1)
        });
        
        const totalTime = performance.now() - startTime;
        console.log(`⚡ SOCKET: Mensagem processada e enviada em ${totalTime.toFixed(1)}ms`);
        
        // Z-API em background (não bloqueia resposta)
        if (!isInternalNote) {
          processZApiBackground(conversationId, content, newMessage.id);
        }
        
      } catch (error) {
        const errorTime = performance.now() - startTime;
        console.error(`❌ SOCKET: Erro após ${errorTime.toFixed(1)}ms:`, error.message);
        
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