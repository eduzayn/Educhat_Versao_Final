/**
 * Rotina de Recuperação de Mensagens Não Exibidas
 * Sistema para detectar e forçar exibição de mensagens salvas no banco mas não renderizadas
 */

import { Router } from 'express';
import { storage } from '../../storage';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/webhooks/recover-unrendered-messages
 * Busca mensagens não lidas das últimas horas e força sua exibição
 */
router.post('/recover-unrendered-messages', async (req, res) => {
  try {
    const { hoursBack = 24, forceUpdate = true } = req.body;
    
    console.log(`🔍 Iniciando recuperação de mensagens não renderizadas das últimas ${hoursBack} horas`);
    
    // Buscar mensagens recebidas nas últimas horas que podem não estar sendo exibidas
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    
    const unrenderedMessages = await db.execute(sql`
      SELECT 
        m.id as message_id,
        m.conversation_id,
        m.content,
        m.sent_at,
        m.is_from_contact,
        c.id as conversation_db_id,
        c.contact_id,
        c.channel,
        c.last_message_at,
        c.unread_count,
        c.is_read,
        cont.name as contact_name,
        cont.phone as contact_phone
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN contacts cont ON c.contact_id = cont.id
      WHERE 
        m.sent_at >= ${cutoffTime}
        AND m.is_from_contact = true
        AND c.is_read = false
      ORDER BY m.sent_at DESC
      LIMIT 100
    `);
    
    const messageRows = unrenderedMessages.rows || [];
    console.log(`📊 Encontradas ${messageRows.length} mensagens não lidas para verificação`);
    
    const recoveredConversations = new Set();
    const messagesByConversation = new Map();
    
    // Agrupar mensagens por conversa
    for (const msg of messageRows) {
      const convId = (msg as any).conversation_id;
      if (!messagesByConversation.has(convId)) {
        messagesByConversation.set(convId, []);
      }
      messagesByConversation.get(convId)!.push(msg);
    }
    
    // Processar cada conversa com mensagens não lidas
    for (const [conversationId, messages] of Array.from(messagesByConversation.entries())) {
      try {
        const latestMessage = messages[0]; // Mais recente primeiro
        
        // Forçar atualização da conversa
        if (forceUpdate) {
          await storage.updateConversation(conversationId, {
            lastMessageAt: new Date(latestMessage.sent_at),
            unreadCount: messages.length,
            isRead: false,
            updatedAt: new Date()
          });
        }
        
        // Broadcast de recuperação para WebSocket
        try {
          const { broadcastToAll } = await import('../realtime');
          
          broadcastToAll({
            type: 'conversation_list_update',
            action: 'message_recovery',
            conversationId: conversationId,
            conversation: {
              id: conversationId,
              contactId: latestMessage.contact_id,
              contactName: latestMessage.contact_name,
              contactPhone: latestMessage.contact_phone,
              channel: latestMessage.channel,
              lastMessage: {
                content: latestMessage.content,
                sentAt: latestMessage.sent_at,
                isFromContact: latestMessage.is_from_contact
              },
              unreadCount: messages.length,
              lastMessageAt: latestMessage.sent_at,
              isRead: false
            }
          });
          
          recoveredConversations.add(conversationId);
          console.log(`✅ Conversa ${conversationId} recuperada com ${messages.length} mensagens`);
          
        } catch (broadcastError) {
          console.error(`❌ Erro no broadcast de recuperação para conversa ${conversationId}:`, broadcastError);
        }
        
      } catch (convError) {
        console.error(`❌ Erro ao processar conversa ${conversationId}:`, convError);
      }
    }
    
    // Forçar refresh geral da lista de conversas
    try {
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'force_conversation_refresh',
        action: 'message_recovery_complete',
        timestamp: new Date().toISOString(),
        recoveredCount: recoveredConversations.size
      });
    } catch (refreshError) {
      console.error('❌ Erro no refresh geral:', refreshError);
    }
    
    res.json({
      success: true,
      recoveredConversations: recoveredConversations.size,
      totalMessagesProcessed: Array.isArray(unrenderedMessages) ? unrenderedMessages.length : 0,
      message: `${recoveredConversations.size} conversas recuperadas com sucesso`
    });
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na recuperação de mensagens:', error);
    res.status(500).json({
      error: 'Falha na recuperação de mensagens',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/webhooks/check-missing-conversations
 * Verifica se há mensagens no banco sem conversas correspondentes na lista
 */
router.get('/check-missing-conversations', async (req, res) => {
  try {
    const { hoursBack = 6 } = req.query;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - Number(hoursBack));
    
    // Buscar conversas com mensagens recentes mas que podem estar "perdidas"
    const missingConversations = await db.execute(sql`
      SELECT DISTINCT
        c.id as conversation_id,
        c.contact_id,
        c.channel,
        c.last_message_at,
        c.unread_count,
        c.is_read,
        cont.name as contact_name,
        cont.phone as contact_phone,
        COUNT(m.id) as recent_message_count,
        MAX(m.sent_at) as latest_message_time
      FROM conversations c
      JOIN contacts cont ON c.contact_id = cont.id
      JOIN messages m ON m.conversation_id = c.id
      WHERE 
        m.sent_at >= ${cutoffTime}
        AND m.is_from_contact = true
        AND c.is_read = false
      GROUP BY c.id, c.contact_id, c.channel, c.last_message_at, c.unread_count, c.is_read, cont.name, cont.phone
      HAVING COUNT(m.id) > 0
      ORDER BY latest_message_time DESC
    `);
    
    const conversationsArray = Array.isArray(missingConversations.rows) ? missingConversations.rows : [];
    
    res.json({
      success: true,
      missingConversations: conversationsArray.length,
      conversations: conversationsArray.slice(0, 20), // Primeiras 20 para análise
      message: `${conversationsArray.length} conversas com mensagens recentes encontradas`
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar conversas perdidas:', error);
    res.status(500).json({
      error: 'Falha na verificação de conversas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;