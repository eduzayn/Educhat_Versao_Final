import { Router } from 'express';
import { db } from '../../core/db';
import { conversations, messages, contacts } from '@shared/schema';
import { eq, sql, and, gte, desc } from 'drizzle-orm';

const router = Router();

// Endpoint para métricas do dashboard
router.get('/metrics', async (req, res) => {
  try {
    // 1. Conversas ativas (status = 'active' ou com atividade recente)
    const activeConversations = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(
        sql`(status = 'active' OR last_message_at >= NOW() - INTERVAL '24 hours')`
      );

    // 2. Novos contatos esta semana
    const newContacts = await db
      .select({ 
        today: sql<number>`count(case when created_at >= current_date then 1 end)`,
        week: sql<number>`count(case when created_at >= current_date - interval '7 days' then 1 end)`
      })
      .from(contacts);

    // 3. Taxa de resposta (conversas que receberam pelo menos uma resposta)
    const responseRate = await db
      .select({
        total: sql<number>`count(distinct c.id)`,
        responded: sql<number>`count(distinct case when m.is_from_contact = false then c.id end)`
      })
      .from(conversations.as('c'))
      .leftJoin(messages.as('m'), eq(sql`c.id`, sql`m.conversation_id`))
      .where(gte(sql`c.created_at`, sql`current_date - interval '30 days'`));

    // 4. Tempo médio de primeira resposta
    const avgResponseTime = await db
      .select({
        avgMinutes: sql<number>`
          round(
            avg(
              extract(epoch from (
                select min(m_resp.sent_at) 
                from messages m_resp 
                where m_resp.conversation_id = c.id 
                and m_resp.is_from_contact = false 
                and m_resp.sent_at > c.created_at
              ) - c.created_at) / 60
            ), 1
          )
        `
      })
      .from(conversations.as('c'))
      .where(
        and(
          gte(sql`c.created_at`, sql`current_date - interval '7 days'`),
          sql`exists (
            select 1 from messages m 
            where m.conversation_id = c.id 
            and m.is_from_contact = false
          )`
        )
      );

    // 5. Distribuição por canais
    const channelStats = await db
      .select({
        channel: conversations.channel,
        count: sql<number>`count(*)`
      })
      .from(conversations)
      .where(sql`channel is not null`)
      .groupBy(conversations.channel)
      .orderBy(desc(sql`count(*)`));

    const activeCount = activeConversations[0]?.count || 0;
    const newContactsData = newContacts[0] || { today: 0, week: 0 };
    const responseData = responseRate[0] || { total: 0, responded: 0 };
    const avgTime = avgResponseTime[0]?.avgMinutes || 0;

    const calculatedResponseRate = responseData.total > 0 
      ? Math.round((responseData.responded / responseData.total) * 100 * 10) / 10
      : 0;

    res.json({
      activeConversations: activeCount,
      newContacts: {
        today: newContactsData.today,
        week: newContactsData.week
      },
      responseRate: calculatedResponseRate,
      averageResponseTime: avgTime,
      channels: channelStats.map(stat => ({
        name: stat.channel,
        count: stat.count
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;