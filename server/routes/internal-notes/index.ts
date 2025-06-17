import { Router } from 'express';
import { storage } from '../../storage';
import { requireAuth } from '../conversations/middleware';
import { insertMessageSchema } from '../../../shared/schema';
import { z } from 'zod';

const router = Router();

// Schema para criação de nota interna
const createInternalNoteSchema = insertMessageSchema.extend({
  noteType: z.string().optional(),
  notePriority: z.string().optional(),
  noteTags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional()
}).pick({
  conversationId: true,
  content: true,
  noteType: true,
  notePriority: true,
  noteTags: true,
  isPrivate: true
});

// Schema para atualização de nota interna
const updateInternalNoteSchema = createInternalNoteSchema.partial();

/**
 * GET /api/conversations/:conversationId/internal-notes
 * Busca todas as notas internas de uma conversa
 */
router.get('/conversations/:conversationId/internal-notes', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID da conversa inválido' });
    }

    const notes = await storage.getInternalNotes(conversationId);
    res.json(notes);
  } catch (error) {
    console.error('Erro ao buscar notas internas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/conversations/:conversationId/internal-notes
 * Cria uma nova nota interna
 */
router.post('/conversations/:conversationId/internal-notes', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID da conversa inválido' });
    }

    const validatedData = createInternalNoteSchema.parse({
      ...req.body,
      conversationId
    });

    const user = req.user as any;
    
    const noteData = {
      ...validatedData,
      authorId: user.id,
      authorName: user.displayName || user.username
    };

    const note = await storage.createInternalNote(noteData);
    res.status(201).json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao criar nota interna:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/internal-notes/:noteId
 * Atualiza uma nota interna existente
 */
router.put('/internal-notes/:noteId', requireAuth, async (req, res) => {
  try {
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'ID da nota inválido' });
    }

    const validatedData = updateInternalNoteSchema.parse(req.body);
    
    const updatedNote = await storage.updateInternalNote(noteId, validatedData);
    res.json(updatedNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao atualizar nota interna:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/conversations/:conversationId/internal-notes/priority/:priority
 * Busca notas internas por prioridade
 */
router.get('/conversations/:conversationId/internal-notes/priority/:priority', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { priority } = req.params;
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID da conversa inválido' });
    }

    const notes = await storage.getInternalNotesByPriority(conversationId, priority);
    res.json(notes);
  } catch (error) {
    console.error('Erro ao buscar notas por prioridade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/conversations/:conversationId/internal-notes/search/tags
 * Busca notas internas por tags
 */
router.post('/conversations/:conversationId/internal-notes/search/tags', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { tags } = req.body;
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'ID da conversa inválido' });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags devem ser um array' });
    }

    const notes = await storage.getInternalNotesByTags(conversationId, tags);
    res.json(notes);
  } catch (error) {
    console.error('Erro ao buscar notas por tags:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;