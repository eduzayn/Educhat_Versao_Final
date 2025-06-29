import { Express, Response } from 'express';
import { storage } from '../../core/storage';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { insertUserTagSchema, insertContactUserTagSchema } from '../../../shared/schema';
import { z } from 'zod';

export function registerUserTagsRoutes(app: Express) {

// GET /api/user-tags - Buscar todas as tags do usuário logado
app.get('/api/user-tags', requirePermission('inbox:read'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tags = await storage.userTag.getUserTags(userId);
    res.json(tags);
  } catch (error) {
    console.error('Erro ao buscar tags do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/user-tags - Criar nova tag
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const validatedData = insertUserTagSchema.parse({
      ...req.body,
      createdBy: userId
    });

    const newTag = await storage.userTag.createUserTag(validatedData);
    res.status(201).json(newTag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    console.error('Erro ao criar tag:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/user-tags/:id - Atualizar tag existente
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tagId = parseInt(req.params.id);
    if (isNaN(tagId)) {
      return res.status(400).json({ error: 'ID da tag inválido' });
    }

    const validatedData = insertUserTagSchema.partial().parse(req.body);
    const updatedTag = await storage.userTag.updateUserTag(tagId, userId, validatedData);
    
    if (!updatedTag) {
      return res.status(404).json({ error: 'Tag não encontrada ou você não tem permissão para editá-la' });
    }

    res.json(updatedTag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    console.error('Erro ao atualizar tag:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/user-tags/:id - Deletar tag
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tagId = parseInt(req.params.id);
    if (isNaN(tagId)) {
      return res.status(400).json({ error: 'ID da tag inválido' });
    }

    const deleted = await storage.userTag.deleteUserTag(tagId, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Tag não encontrada ou você não tem permissão para deletá-la' });
    }

    res.status(204).send();
  } catch (error) {
    if (error.message?.includes('está sendo usada')) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Erro ao deletar tag:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/user-tags/stats - Estatísticas de uso das tags
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const stats = await storage.userTag.getUserTagStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas das tags:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/user-tags/:tagId/contacts/:contactId - Aplicar tag a um contato
router.post('/:tagId/contacts/:contactId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tagId = parseInt(req.params.tagId);
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(tagId) || isNaN(contactId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Verificar se a tag pertence ao usuário logado
    const tag = await storage.userTag.getUserTagById(tagId);
    if (!tag || tag.createdBy !== req.user?.id) {
      return res.status(404).json({ error: 'Tag não encontrada ou você não tem permissão' });
    }

    const association = await storage.userTag.addTagToContact(contactId, tagId);
    res.status(201).json(association);
  } catch (error) {
    console.error('Erro ao aplicar tag ao contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/user-tags/:tagId/contacts/:contactId - Remover tag de um contato
router.delete('/:tagId/contacts/:contactId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tagId = parseInt(req.params.tagId);
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(tagId) || isNaN(contactId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Verificar se a tag pertence ao usuário logado
    const tag = await storage.userTag.getUserTagById(tagId);
    if (!tag || tag.createdBy !== req.user?.id) {
      return res.status(404).json({ error: 'Tag não encontrada ou você não tem permissão' });
    }

    const removed = await storage.userTag.removeTagFromContact(contactId, tagId);
    
    if (!removed) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover tag do contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/user-tags/contacts/:contactId - Buscar tags de um contato específico
router.get('/contacts/:contactId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'ID do contato inválido' });
    }

    const tags = await storage.userTag.getContactTags(contactId);
    res.json(tags);
  } catch (error) {
    console.error('Erro ao buscar tags do contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;