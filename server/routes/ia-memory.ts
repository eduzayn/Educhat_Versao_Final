import { Router } from 'express';
import { db } from '../core/db';
import { aiMemory, conversations, contacts } from '../../shared/schema';
import { eq, desc, and, or, like } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/ia/memory - Lista memórias contextuais com filtros
 */
router.get('/memory', async (req, res) => {
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
    
    const memories = await db.select({
      id: aiMemory.id,
      sessionId: aiMemory.sessionId,
      conversationId: aiMemory.conversationId,
      contactId: aiMemory.contactId,
      memoryType: aiMemory.memoryType,
      key: aiMemory.key,
      value: aiMemory.value,
      confidence: aiMemory.confidence,
      source: aiMemory.source,
      expiresAt: aiMemory.expiresAt,
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

    // Contar total para paginação
    const [{ count }] = await db.select({ 
      count: aiMemory.id 
    })
    .from(aiMemory)
    .where(and(...whereConditions));

    res.json({
      memories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar memórias:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/memory/conversation/:id - Busca memórias de uma conversa específica
 */
router.get('/memory/conversation/:id', async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    
    const memories = await db.select({
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
    .where(and(
      eq(aiMemory.conversationId, conversationId),
      eq(aiMemory.isActive, true)
    ))
    .orderBy(desc(aiMemory.updatedAt));

    // Agrupar por tipo de memória
    const categorizedMemories = {
      user_info: memories.filter(m => m.memoryType === 'user_info'),
      preferences: memories.filter(m => m.memoryType === 'preferences'),
      context: memories.filter(m => m.memoryType === 'context'),
      history: memories.filter(m => m.memoryType === 'history')
    };

    res.json({ memories: categorizedMemories });
  } catch (error) {
    console.error('❌ Erro ao buscar memórias da conversa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/memory - Cria nova memória contextual
 */
router.post('/memory', async (req, res) => {
  try {
    const { 
      conversationId, 
      contactId, 
      memoryType, 
      key, 
      value, 
      confidence = 100,
      source = 'manual',
      expiresAt 
    } = req.body;

    // Verificar se já existe uma memória com a mesma chave
    const existingMemory = await db.select()
      .from(aiMemory)
      .where(and(
        eq(aiMemory.conversationId, conversationId),
        eq(aiMemory.contactId, contactId),
        eq(aiMemory.memoryType, memoryType),
        eq(aiMemory.key, key),
        eq(aiMemory.isActive, true)
      ))
      .limit(1);

    if (existingMemory.length > 0) {
      // Atualizar memória existente
      await db.update(aiMemory)
        .set({
          value,
          confidence,
          source,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          updatedAt: new Date()
        })
        .where(eq(aiMemory.id, existingMemory[0].id));

      res.json({ 
        success: true, 
        message: 'Memória atualizada com sucesso',
        id: existingMemory[0].id
      });
    } else {
      // Criar nova memória
      const [newMemory] = await db.insert(aiMemory).values({
        conversationId,
        contactId,
        memoryType,
        key,
        value,
        confidence,
        source,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }).returning({ id: aiMemory.id });

      res.json({ 
        success: true, 
        message: 'Memória criada com sucesso',
        id: newMemory.id
      });
    }
  } catch (error) {
    console.error('❌ Erro ao criar memória:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/ia/memory/:id - Atualiza memória existente
 */
router.put('/memory/:id', async (req, res) => {
  try {
    const memoryId = Number(req.params.id);
    const { key, value, confidence, source, expiresAt } = req.body;

    await db.update(aiMemory)
      .set({
        key,
        value,
        confidence,
        source,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date()
      })
      .where(eq(aiMemory.id, memoryId));

    res.json({ 
      success: true, 
      message: 'Memória atualizada com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar memória:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/ia/memory/:id - Remove memória (marca como inativa)
 */
router.delete('/memory/:id', async (req, res) => {
  try {
    const memoryId = Number(req.params.id);

    await db.update(aiMemory)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(aiMemory.id, memoryId));

    res.json({ 
      success: true, 
      message: 'Memória removida com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao remover memória:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/memory/stats - Estatísticas das memórias
 */
router.get('/memory/stats', async (req, res) => {
  try {
    const stats = await db.select({
      memoryType: aiMemory.memoryType,
      count: aiMemory.id
    })
    .from(aiMemory)
    .where(eq(aiMemory.isActive, true))
    .groupBy(aiMemory.memoryType);

    const totalMemories = await db.select({ count: aiMemory.id })
      .from(aiMemory)
      .where(eq(aiMemory.isActive, true));

    res.json({
      byType: stats.reduce((acc, stat) => {
        acc[stat.memoryType] = Number(stat.count);
        return acc;
      }, {} as Record<string, number>),
      total: Number(totalMemories[0]?.count || 0)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;