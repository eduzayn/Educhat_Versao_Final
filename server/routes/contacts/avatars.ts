/**
 * Rotas para gerenciamento de avatares de contatos
 */

import { Router } from 'express';
import { AvatarCacheService } from '../../services/avatarCacheService';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /api/contacts/:id/avatar - Obtém URL do avatar com cache
 */
router.get('/:id/avatar', async (req: Request, res: Response) => {
  try {
    const contactId = parseInt(req.params.id);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'ID do contato inválido' });
    }

    const result = await AvatarCacheService.getContactAvatar(contactId);
    
    res.json({
      avatarUrl: result.avatarUrl,
      source: result.source,
      cached: result.cached,
      success: true
    });

  } catch (error) {
    console.error('❌ Erro ao obter avatar do contato:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      avatarUrl: null,
      source: 'fallback',
      cached: false,
      success: false
    });
  }
});

/**
 * POST /api/contacts/:id/avatar/refresh - Força atualização do avatar
 */
router.post('/:id/avatar/refresh', async (req: Request, res: Response) => {
  try {
    const contactId = parseInt(req.params.id);
    const { phone } = req.body;
    
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'ID do contato inválido' });
    }

    const result = await AvatarCacheService.forceRefreshAvatar(contactId, phone);
    
    res.json({
      avatarUrl: result.avatarUrl,
      source: result.source,
      cached: result.cached,
      success: true,
      message: 'Avatar atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar avatar do contato:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      success: false
    });
  }
});

export default router;