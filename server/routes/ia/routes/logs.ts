import { Router } from 'express';
import { db } from '../../../db';
import { aiLogs } from '../../../../shared/schema';
import { desc } from 'drizzle-orm';
import { IALog } from '../types';

const router = Router();

/**
 * GET /api/ia/logs - Logs de interações da IA
 */
router.get('/', async (req, res) => {
  try {
    const logs = await db
      .select({
        id: aiLogs.id,
        message: aiLogs.messageId,
        response: aiLogs.aiResponse,
        classification: aiLogs.classification,
        processingTime: aiLogs.processingTime,
        createdAt: aiLogs.createdAt
      })
      .from(aiLogs)
      .orderBy(desc(aiLogs.createdAt))
      .limit(50);

    res.json(logs);
  } catch (error) {
    console.error('❌ Erro ao buscar logs da IA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/ia/logs - Limpar logs da IA
 */
router.delete('/', async (req, res) => {
  try {
    await db.delete(aiLogs);
    res.json({ success: true, message: 'Logs limpos com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao limpar logs da IA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router; 