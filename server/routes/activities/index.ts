import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../../db';
import { activities } from '../../../shared/schema';
import { requireAuth } from '../conversations/middleware';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// POST /api/activities - Criar nova atividade
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      contactId,
      activityType,
      scheduledAt,
      duration,
      priority,
      reminderMinutes,
      location,
      meetingLink
    } = req.body;

    // Validação básica
    if (!title || !scheduledAt) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: título e data/horário' 
      });
    }

    // Criar a atividade no banco
    const newActivity = await db.insert(activities).values({
      title,
      description: description || null,
      contactId: contactId || null,
      type: activityType || 'call',
      scheduledDate: new Date(scheduledAt),
      duration: parseInt(duration) || 30,
      priority: priority || 'normal',
      reminderMinutes: parseInt(reminderMinutes) || 15,
      location: location || null,
      meetingLink: meetingLink || null,
      status: 'scheduled',
      userId: req.user?.id || 1, // ID do usuário logado
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(201).json({
      success: true,
      activity: newActivity[0]
    });

  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao criar atividade' 
    });
  }
});

// GET /api/activities - Listar atividades
router.get('/', async (req: Request, res: Response) => {
  try {
    const userActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, req.user?.id || 1))
      .orderBy(desc(activities.scheduledDate));

    res.json(userActivities);
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar atividades' 
    });
  }
});

export default router;