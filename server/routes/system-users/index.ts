import { Router } from 'express';
import { db } from '../../core/db';
import { systemUsers, roles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../../core/permissionsRefactored';

const router = Router();

// GET /api/system-users - Buscar todos os usuários do sistema
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar usuários ativos do sistema com informações básicas
    const users = await db
      .select({
        id: systemUsers.id,
        username: systemUsers.username,
        displayName: systemUsers.displayName,
        email: systemUsers.email,
        role: systemUsers.role,
        roleId: systemUsers.roleId,
        teamId: systemUsers.teamId,
        team: systemUsers.team,
        isActive: systemUsers.isActive,
        isOnline: systemUsers.isOnline,
        status: systemUsers.status,
        lastLoginAt: systemUsers.lastLoginAt,
        lastActivityAt: systemUsers.lastActivityAt,
        avatar: systemUsers.avatar,
        initials: systemUsers.initials,
        createdAt: systemUsers.createdAt,
        updatedAt: systemUsers.updatedAt
      })
      .from(systemUsers)
      .leftJoin(roles, eq(systemUsers.roleId, roles.id))
      .where(eq(systemUsers.isActive, true))
      .orderBy(systemUsers.displayName);

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários do sistema:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/system-users/:id - Buscar usuário específico
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'ID do usuário inválido' });
    }

    // Verificar se o usuário está autenticado
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const [user] = await db
      .select({
        id: systemUsers.id,
        username: systemUsers.username,
        displayName: systemUsers.displayName,
        email: systemUsers.email,
        role: systemUsers.role,
        roleId: systemUsers.roleId,
        teamId: systemUsers.teamId,
        team: systemUsers.team,
        isActive: systemUsers.isActive,
        isOnline: systemUsers.isOnline,
        status: systemUsers.status,
        lastLoginAt: systemUsers.lastLoginAt,
        lastActivityAt: systemUsers.lastActivityAt,
        avatar: systemUsers.avatar,
        initials: systemUsers.initials,
        createdAt: systemUsers.createdAt,
        updatedAt: systemUsers.updatedAt
      })
      .from(systemUsers)
      .leftJoin(roles, eq(systemUsers.roleId, roles.id))
      .where(eq(systemUsers.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário específico:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;