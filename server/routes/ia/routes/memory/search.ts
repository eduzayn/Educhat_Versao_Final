import { Router } from 'express';
import { db } from '../../../../db';
import { aiMemory, contacts } from '../../../../../shared/schema';
import { eq, desc, and, or, like, count } from 'drizzle-orm';
import { IAMemorySearchResponse, IAMemoryStats, IAMemoryConversationResponse } from '../../types/memory';
import { MEMORY_DEFAULTS } from '../../config/memory';

const router = Router();

/**
 * GET /api/ia/memory/search - Busca memórias por conteúdo
 */
router.get('/search', async (req, res) => {
  try {
    const { query, memoryType, limit = MEMORY_DEFAULTS.SEARCH_LIMIT } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Parâmetro de busca é obrigatório' });
    }

    const whereConditions = [
      eq(aiMemory.isActive, true),
      or(
        like(aiMemory.key, `%${query}%`),
        like(aiMemory.value, `%${query}%`)
      )
    ];

    if (memoryType) {
      whereConditions.push(eq(aiMemory.memoryType, memoryType as string));
    }

    const memories = await db
      .select({
        id: aiMemory.id,
        conversationId: aiMemory.conversationId,
        contactId: aiMemory.contactId,
        memoryType: aiMemory.memoryType,
        key: aiMemory.key,
        value: aiMemory.value,
        confidence: aiMemory.confidence,
        source: aiMemory.source,
        createdAt: aiMemory.createdAt,
        contactName: contacts.name
      })
      .from(aiMemory)
      .leftJoin(contacts, eq(aiMemory.contactId, contacts.id))
      .where(and(...whereConditions))
      .orderBy(desc(aiMemory.confidence), desc(aiMemory.updatedAt))
      .limit(Number(limit));

    const response: IAMemorySearchResponse = { memories };
    res.json(response);
  } catch (error) {
    console.error('❌ Erro na busca de memórias:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/memory/stats - Estatísticas de memórias
 */
router.get('/stats', async (req, res) => {
  try {
    // Total de memórias por tipo
    const memoryTypeStats = await db
      .select({
        memoryType: aiMemory.memoryType,
        count: count()
      })
      .from(aiMemory)
      .where(eq(aiMemory.isActive, true))
      .groupBy(aiMemory.memoryType);

    // Total geral
    const [totalResult] = await db
      .select({ count: count() })
      .from(aiMemory)
      .where(eq(aiMemory.isActive, true));

    const byType: Record<string, number> = {};
    memoryTypeStats.forEach(stat => {
      byType[stat.memoryType] = stat.count;
    });

    const stats: IAMemoryStats = {
      byType,
      total: totalResult?.count || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/memory/conversation/:conversationId - Memórias de uma conversa específica
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID de conversa inválido' });
    }

    const memories = await db
      .select({
        id: aiMemory.id,
        memoryType: aiMemory.memoryType,
        key: aiMemory.key,
        value: aiMemory.value,
        confidence: aiMemory.confidence,
        source: aiMemory.source,
        createdAt: aiMemory.createdAt,
        updatedAt: aiMemory.updatedAt
      })
      .from(aiMemory)
      .where(
        and(
          eq(aiMemory.conversationId, conversationId),
          eq(aiMemory.isActive, true)
        )
      )
      .orderBy(desc(aiMemory.updatedAt));

    const response: IAMemoryConversationResponse = { memories };
    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao buscar memórias da conversa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router; 