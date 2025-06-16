import { Router } from 'express';
import { db } from '../../core/db';
import { sql } from 'drizzle-orm';

const router = Router();

// Endpoint para métricas do dashboard
router.get('/metrics', async (req, res) => {
  try {
    // 1. Conversas ativas (últimas 24h com atividade)
    const activeConversations = await db.execute(sql`
      SELECT count(*) as count 
      FROM conversations 
      WHERE updated_at >= current_date - interval '1 day'
    `);

    // 2. Novos contatos
    const newContacts = await db.execute(sql`
      SELECT 
        count(case when created_at >= current_date then 1 end) as today,
        count(case when created_at >= current_date - interval '7 days' then 1 end) as week
      FROM contacts
    `);

    // 3. Taxa de resposta (conversas que receberam pelo menos uma resposta)
    const responseRate = await db.execute(sql`
      SELECT 
        count(distinct c.id) as total,
        count(distinct case when m.is_from_contact = false then c.id end) as responded
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.created_at >= current_date - interval '30 days'
    `);

    // 4. Tempo médio de primeira resposta em horas
    const avgResponseTime = await db.execute(sql`
      SELECT 
        round(
          avg(
            extract(epoch from (
              select min(m_resp.sent_at) 
              from messages m_resp 
              where m_resp.conversation_id = c.id 
              and m_resp.is_from_contact = false 
              and m_resp.sent_at > c.created_at
            ) - c.created_at) / 3600
          ), 1
        ) as avg_hours
      FROM conversations c
      WHERE c.created_at >= current_date - interval '7 days'
      AND exists (
        select 1 from messages m 
        where m.conversation_id = c.id 
        and m.is_from_contact = false
      )
    `);

    // 5. Distribuição por canais
    const channelStats = await db.execute(sql`
      SELECT channel, count(*) as count
      FROM conversations
      GROUP BY channel
      ORDER BY count(*) DESC
      LIMIT 5
    `);

    const metrics = {
      activeConversations: Number((activeConversations.rows[0] as any)?.count || 0),
      newContacts: {
        today: Number((newContacts.rows[0] as any)?.today || 0),
        week: Number((newContacts.rows[0] as any)?.week || 0)
      },
      responseRate: (responseRate.rows[0] as any)?.total > 0 
        ? Math.round((Number((responseRate.rows[0] as any)?.responded) / Number((responseRate.rows[0] as any)?.total)) * 100) 
        : 0,
      averageResponseTime: Number((avgResponseTime.rows[0] as any)?.avg_hours || 0),
      channels: channelStats.rows.map((stat: any) => ({
        name: stat.channel || 'WhatsApp',
        count: Number(stat.count)
      }))
    };

    res.json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para dados de canais
router.get('/channels', async (req, res) => {
  try {
    const channelStats = await db.execute(sql`
      SELECT 
        channel, 
        count(*) as conversations,
        count(distinct c.contact_id) as unique_contacts,
        max(c.updated_at) as last_activity
      FROM conversations c
      WHERE c.created_at >= current_date - interval '30 days'
      GROUP BY channel
      ORDER BY conversations DESC
    `);

    const channels = channelStats.rows.map((stat: any) => ({
      name: stat.channel || 'WhatsApp',
      conversations: Number(stat.conversations),
      uniqueContacts: Number(stat.unique_contacts),
      lastActivity: stat.last_activity,
      status: 'active'
    }));

    res.json(channels);
  } catch (error) {
    console.error('Erro ao buscar dados de canais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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