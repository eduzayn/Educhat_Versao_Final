import { Router } from 'express';
import { db } from '../../core/db';
import { sql } from 'drizzle-orm';

const router = Router();

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

export default router; 