import { Router } from 'express';
import { db } from '../../../../core/db';
import { aiMemory } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { IAMemory } from '../../types/memory';

const router = Router();

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

    const updateData: Partial<IAMemory> = { updatedAt: new Date() };
    
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

export default router; 