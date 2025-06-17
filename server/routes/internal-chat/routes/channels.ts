import { Request, Response, Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../db';
import { teams, userTeams, systemUsers, roles } from '@shared/schema';
import { getUserPermissions } from '../services/permissions';
import { Channel } from '../types/teams';

const router = Router();

// Listar canais
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const permissions = await getUserPermissions(req.user.id);
    let channels: Channel[] = [];

    if (permissions.canViewAll) {
      // Admin/Gestor vê todas as equipes
      const allTeams = await db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
        })
        .from(teams)
        .orderBy(teams.name);
      
      channels = [
        {
          id: 'general',
          name: 'Geral',
          description: 'Canal geral da empresa',
          type: 'general',
          isPrivate: false,
          participants: [],
          unreadCount: 0
        },
        ...allTeams.map(team => ({
          id: `team-${team.id}`,
          name: team.name,
          description: team.description || `Discussões da ${team.name}`,
          type: 'team' as const,
          teamId: team.id,
          isPrivate: false,
          participants: [],
          unreadCount: 0
        }))
      ];
    } else {
      // Usuários comuns só veem suas equipes
      const userTeamIds = await db
        .select({ 
          teamId: userTeams.teamId,
          teamName: teams.name,
          teamDescription: teams.description
        })
        .from(userTeams)
        .leftJoin(teams, eq(userTeams.teamId, teams.id))
        .where(eq(userTeams.userId, req.user.id));
      
      channels = [
        {
          id: 'general',
          name: 'Geral',
          description: 'Canal geral da empresa',
          type: 'general',
          isPrivate: false,
          participants: [],
          unreadCount: 0
        },
        ...userTeamIds.map(ut => ({
          id: `team-${ut.teamId}`,
          name: ut.teamName || 'Equipe',
          description: ut.teamDescription || `Discussões da equipe`,
          type: 'team' as const,
          teamId: ut.teamId,
          isPrivate: false,
          participants: [],
          unreadCount: 0
        }))
      ];
    }
    
    res.json(channels);
  } catch (error) {
    console.error('Erro ao buscar canais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuários do canal
router.get('/:channelId/users', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const channelId = req.params.channelId;
    
    if (channelId === 'general') {
      // Canal geral - todos os usuários
      const allUsers = await db
        .select({
          id: systemUsers.id,
          username: systemUsers.username,
          displayName: systemUsers.displayName,
          avatar: systemUsers.avatar,
          roleName: roles.name
        })
        .from(systemUsers)
        .leftJoin(roles, eq(systemUsers.roleId, roles.id))
        .where(eq(systemUsers.isActive, true))
        .orderBy(systemUsers.displayName);
      
      res.json(allUsers);
    } else if (channelId.startsWith('team-')) {
      // Canal de equipe específica
      const teamId = parseInt(channelId.replace('team-', ''));
      
      const teamUsers = await db
        .select({
          id: systemUsers.id,
          username: systemUsers.username,
          displayName: systemUsers.displayName,
          avatar: systemUsers.avatar,
          roleName: roles.name
        })
        .from(userTeams)
        .leftJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
        .leftJoin(roles, eq(systemUsers.roleId, roles.id))
        .where(and(
          eq(userTeams.teamId, teamId),
          eq(systemUsers.isActive, true)
        ))
        .orderBy(systemUsers.displayName);
      
      res.json(teamUsers);
    } else {
      res.status(404).json({ error: 'Canal não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar usuários do canal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 