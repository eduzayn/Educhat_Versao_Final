import { Router } from 'express';
import { db } from '../../../../db';
import { aiMemory, contacts } from '../../../../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { IAMemory, IAMemoryListResponse } from '../../types/memory';
import { MEMORY_DEFAULTS } from '../../config/memory';

const router = Router();

/**
 * GET /api/ia/memory - Lista memórias contextuais com filtros
 */
router.get('/', async (req, res) => {
  try {
    const { conversationId, contactId, memoryType, page = 1, limit = MEMORY_DEFAULTS.PAGE_SIZE } = req.query;
    
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

    const response = {
      memories: memories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: memories.length
      }
    };

    res.json(response);
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
      confidence = MEMORY_DEFAULTS.DEFAULT_CONFIDENCE,
      source = MEMORY_DEFAULTS.DEFAULT_SOURCE
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

export default router; 