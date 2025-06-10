import { Router } from 'express';
import { db } from '../../core/db';
import { aiMemory, conversations, contacts } from '../../../shared/schema';
import { eq, desc, and, or, like, count, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/ia/memory - Lista memórias contextuais com filtros
 */
router.get('/', async (req, res) => {
  try {
    const { conversationId, contactId, memoryType, page = 1, limit = 50 } = req.query;
    
    const whereConditions = [eq(aiMemory.isActive, true)];
    
    if (conversationId) {
      whereConditions.push(eq(aiMemory.conversationId, Number(conversationId)));
    }
    
    if (contactId) {
      whereConditions.push(eq(aiMemory.contactId, Number(contactId)));
    }
    
    if (memoryType) {
      whereConditions.push(eq(aiMemory.memoryType, memoryType as string));
    }

    const offset = (Number(page) - 1) * Number(limit);
    
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
        updatedAt: aiMemory.updatedAt,
        contactName: contacts.name
      })
      .from(aiMemory)
      .leftJoin(contacts, eq(aiMemory.contactId, contacts.id))
      .where(and(...whereConditions))
      .orderBy(desc(aiMemory.updatedAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      memories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: memories.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar memórias:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/memory - Cria nova memória contextual
 */
router.post('/', async (req, res) => {
  try {
    const {
      conversationId,
      contactId,
      memoryType,
      key,
      value,
      confidence = 0.8,
      source = 'manual'
    } = req.body;

    if (!conversationId || !contactId || !memoryType || !key || !value) {
      return res.status(400).json({
        error: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }

    // Verificar se já existe uma memória similar
    const existingMemory = await db
      .select()
      .from(aiMemory)
      .where(
        and(
          eq(aiMemory.conversationId, conversationId),
          eq(aiMemory.contactId, contactId),
          eq(aiMemory.memoryType, memoryType),
          eq(aiMemory.key, key),
          eq(aiMemory.isActive, true)
        )
      )
      .limit(1);

    if (existingMemory.length > 0) {
      // Atualizar memória existente
      const [updatedMemory] = await db
        .update(aiMemory)
        .set({
          value,
          confidence,
          source,
          updatedAt: new Date()
        })
        .where(eq(aiMemory.id, existingMemory[0].id))
        .returning();

      console.log('🧠 Memória atualizada:', { key, value });
      return res.json(updatedMemory);
    }

    // Criar nova memória
    const [newMemory] = await db
      .insert(aiMemory)
      .values({
        conversationId,
        contactId,
        memoryType,
        key,
        value,
        confidence,
        source,
        isActive: true
      })
      .returning();

    console.log('🧠 Nova memória criada:', { key, value });
    res.json(newMemory);
  } catch (error) {
    console.error('❌ Erro ao criar memória:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/ia/memory/:id - Atualiza memória existente
 */
router.put('/:id', async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const { value, confidence, isActive } = req.body;

    if (isNaN(memoryId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (value !== undefined) updateData.value = value;
    if (confidence !== undefined) updateData.confidence = confidence;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedMemory] = await db
      .update(aiMemory)
      .set(updateData)
      .where(eq(aiMemory.id, memoryId))
      .returning();

    if (!updatedMemory) {
      return res.status(404).json({ error: 'Memória não encontrada' });
    }

    res.json(updatedMemory);
  } catch (error) {
    console.error('❌ Erro ao atualizar memória:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/ia/memory/:id - Remove memória (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);

    if (isNaN(memoryId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await db
      .update(aiMemory)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(aiMemory.id, memoryId));

    res.json({ success: true, message: 'Memória removida com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao remover memória:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/memory/search - Busca memórias por conteúdo
 */
router.get('/search', async (req, res) => {
  try {
    const { query, memoryType, limit = 20 } = req.query;

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

    res.json({ memories });
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

    res.json({
      byType,
      total: totalResult?.count || 0
    });
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

    res.json({ memories });
  } catch (error) {
    console.error('❌ Erro ao buscar memórias da conversa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;