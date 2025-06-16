import { Router } from 'express';
import { db } from '../../core/db';
import { sql } from 'drizzle-orm';

const router = Router();

// Endpoint para conversas recentes
router.get('/conversations', async (req, res) => {
  try {
    const recentConversations = await db.execute(sql`
      SELECT 
        c.id,
        c.contact_id,
        c.channel,
        c.updated_at,
        ct.name as contact_name,
        ct.phone,
        (
          SELECT m.content 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          ORDER BY m.sent_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT count(*) 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.is_from_contact = true 
          AND m.sent_at >= current_date
        ) as unread_count
      FROM conversations c
      JOIN contacts ct ON c.contact_id = ct.id
      ORDER BY c.updated_at DESC
      LIMIT 10
    `);

    const conversations = recentConversations.rows.map((conv: any) => ({
      id: Number(conv.id),
      contactId: Number(conv.contact_id),
      contactName: conv.contact_name || conv.phone,
      phone: conv.phone,
      channel: conv.channel || 'WhatsApp',
      lastMessage: conv.last_message || 'Sem mensagens',
      lastActivity: conv.updated_at,
      unreadCount: Number(conv.unread_count || 0)
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Erro ao buscar conversas recentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 