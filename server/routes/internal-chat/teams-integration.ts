import { Express, Request, Response } from 'express';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';
import { db } from '../../core/db';
import { 
  systemUsers,
  teams,
  userTeams,
  roles
} from '../../../shared/schema';

// Usando interface padrão do Express sem extensão

// Sistema de chat interno integrado com equipes e usuários existentes
export function registerTeamsIntegratedChatRoutes(app: Express) {

  // Verificar permissões do usuário baseado no sistema existente
  async function getUserPermissions(userId: number) {
    const userWithRole = await db
      .select({
        id: systemUsers.id,
        username: systemUsers.username,
        displayName: systemUsers.displayName,
        roleId: systemUsers.roleId,
        roleName: roles.name
      })
      .from(systemUsers)
      .leftJoin(roles, eq(systemUsers.roleId, roles.id))
      .where(eq(systemUsers.id, userId))
      .limit(1);
    
    if (!userWithRole[0]) {
      return { canViewAll: false, canViewTeams: false, canViewPrivate: false, isAdmin: false, isManager: false };
    }
    
    const roleName = userWithRole[0].roleName || '';
    const isAdmin = roleName === 'Administrador' || roleName === 'Admin';
    const isManager = roleName === 'Gerente' || roleName === 'Gestor';
    
    return {
      canViewAll: isAdmin || isManager,
      canViewTeams: true,
      canViewPrivate: isAdmin || isManager,
      isAdmin,
      isManager,
      user: userWithRole[0]
    };
  }

  // Endpoint para buscar canais baseados nas equipes do usuário
  app.get('/api/internal-chat/channels', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      let channels = [];

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
            type: 'team',
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
            type: 'team',
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

  // Endpoint para buscar usuários da equipe/canal
  app.get('/api/internal-chat/channels/:channelId/users', async (req: Request, res: Response) => {
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

  // Endpoint para verificar permissões do usuário
  app.get('/api/internal-chat/permissions', async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      res.json(permissions);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });



  console.log('✅ Chat interno integrado com sistema de equipes e usuários');
}