import { Router } from 'express';
import { db } from '../../../db';
import { aiContext } from '../../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { IAContext } from '../types';

const router = Router();

/**
 * GET /api/ia/contexts - Listar contextos de treinamento
 */
router.get('/', async (req, res) => {
  try {
    const contexts = await db
      .select()
      .from(aiContext)
      .orderBy(desc(aiContext.createdAt));

    res.json(contexts);
  } catch (error) {
    console.error('❌ Erro ao buscar contextos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/contexts - Adicionar contexto de treinamento
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ 
        error: 'Título, conteúdo e categoria são obrigatórios' 
      });
    }

    const [context] = await db
      .insert(aiContext)
      .values({
        name: title,
        type: category,
        content,
        isActive: true
      })
      .returning();

    console.log('✅ Contexto adicionado:', { title, category });
    
    res.json(context);
  } catch (error) {
    console.error('❌ Erro ao adicionar contexto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/ia/contexts/:id - Remover contexto
 */
router.delete('/:id', async (req, res) => {
  try {
    const contextId = parseInt(req.params.id);
    
    if (isNaN(contextId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await db
      .delete(aiContext)
      .where(eq(aiContext.id, contextId));

    res.json({ success: true, message: 'Contexto removido com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao remover contexto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router; 