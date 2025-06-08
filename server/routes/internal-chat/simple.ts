import { Express, Request, Response } from 'express';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { db } from '../../core/db';
import { 
  internalChatChannels, 
  internalChatMessages, 
  internalChatChannelMembers, 
  systemUsers,
  teams,
  userTeams,
  roles
} from '../../../shared/schema';

interface ChatRequest extends Request {
  user?: any;
}

/**
 * Sistema de Chat Interno Integrado com Equipes e Usuários
 */
export function registerSimpleInternalChatRoutes(app: Express) {
  
  // Sincronizar equipes com canais de chat
  async function syncTeamsWithChatChannels() {
    try {
      console.log('🔄 Sincronizando equipes com canais de chat...');
      
      // Buscar todas as equipes
      const allTeams = await db.select().from(teams);
      
      for (const team of allTeams) {
        // Verificar se já existe canal para esta equipe
        const existingChannel = await db
          .select()
          .from(internalChatChannels)
          .where(and(
            eq(internalChatChannels.teamId, team.id),
            eq(internalChatChannels.type, 'team')
          ))
          .limit(1);
        
        if (!existingChannel[0]) {
          console.log(`📝 Criando canal para equipe: ${team.name}`);
          
          // Criar canal para a equipe
          const [newChannel] = await db
            .insert(internalChatChannels)
            .values({
              name: team.name,
              description: team.description || `Discussões da ${team.name}`,
              type: 'team',
              teamId: team.id,
              isPrivate: false,
              createdBy: 1
            })
            .returning();
          
          // Adicionar membros da equipe ao canal
          const teamMembers = await db
            .select()
            .from(userTeams)
            .where(eq(userTeams.teamId, team.id));
          
          if (teamMembers.length > 0) {
            await db
              .insert(internalChatChannelMembers)
              .values(
                teamMembers.map(member => ({
                  channelId: newChannel.id,
                  userId: member.userId,
                  isActive: true,
                  role: 'member'
                }))
              );
          }
        }
      }
      
      console.log('✅ Sincronização de equipes concluída');
    } catch (error) {
      console.error('❌ Erro ao sincronizar equipes:', error);
    }
  }

  // Verificar permissões do usuário
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
      return { canViewAll: false, canViewTeams: false, canViewPrivate: false };
    }
    
    const isAdmin = userWithRole[0].roleName === 'Admin';
    const isManager = userWithRole[0].roleName === 'Gestor';
    
    return {
      canViewAll: isAdmin || isManager,
      canViewTeams: true,
      canViewPrivate: isAdmin || isManager,
      isAdmin,
      isManager,
      user: userWithRole[0]
    };
  }

  // Sincronizar na inicialização
  syncTeamsWithChatChannels();

  // Endpoint para buscar canais do usuário
  app.get('/api/internal-chat/channels', async (req: ChatRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      
      let channelsQuery = db
        .select({
          id: internalChatChannels.id,
          name: internalChatChannels.name,
          description: internalChatChannels.description,
          type: internalChatChannels.type,
          teamId: internalChatChannels.teamId,
          isPrivate: internalChatChannels.isPrivate,
          createdAt: internalChatChannels.createdAt,
        })
        .from(internalChatChannels);

      if (!permissions.canViewAll) {
        // Usuários comuns só veem canais das suas equipes
        const userTeamIds = await db
          .select({ teamId: userTeams.teamId })
          .from(userTeams)
          .where(eq(userTeams.userId, req.user.id));
        
        const teamIds = userTeamIds.map(ut => ut.teamId);
        
        if (teamIds.length > 0) {
          channelsQuery = channelsQuery.where(
            or(
              and(
                eq(internalChatChannels.type, 'team'),
                sql`${internalChatChannels.teamId} IN (${teamIds.join(',')})`
              ),
              eq(internalChatChannels.type, 'general')
            )
          );
        } else {
          channelsQuery = channelsQuery.where(eq(internalChatChannels.type, 'general'));
        }
      }

      const channels = await channelsQuery.orderBy(internalChatChannels.name);
      
      res.json(channels);
    } catch (error) {
      console.error('Erro ao buscar canais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para buscar mensagens de um canal
  app.get('/api/internal-chat/channels/:channelId/messages', async (req: ChatRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const channelId = parseInt(req.params.channelId);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Verificar acesso ao canal
      const channel = await db
        .select()
        .from(internalChatChannels)
        .where(eq(internalChatChannels.id, channelId))
        .limit(1);

      if (!channel[0]) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      
      // Verificar se o usuário tem acesso a este canal
      if (!permissions.canViewAll && channel[0].type === 'team') {
        const hasAccess = await db
          .select()
          .from(internalChatChannelMembers)
          .where(
            and(
              eq(internalChatChannelMembers.channelId, channelId),
              eq(internalChatChannelMembers.userId, req.user.id),
              eq(internalChatChannelMembers.isActive, true)
            )
          )
          .limit(1);

        if (!hasAccess[0]) {
          return res.status(403).json({ error: 'Acesso negado ao canal' });
        }
      }

      // Buscar mensagens
      const messages = await db
        .select({
          id: internalChatMessages.id,
          content: internalChatMessages.content,
          messageType: internalChatMessages.messageType,
          userId: internalChatMessages.userId,
          channelId: internalChatMessages.channelId,
          createdAt: internalChatMessages.createdAt,
          userName: systemUsers.displayName,
          userAvatar: systemUsers.avatar
        })
        .from(internalChatMessages)
        .leftJoin(systemUsers, eq(internalChatMessages.userId, systemUsers.id))
        .where(eq(internalChatMessages.channelId, channelId))
        .orderBy(desc(internalChatMessages.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(messages.reverse());
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para enviar mensagem
  app.post('/api/internal-chat/channels/:channelId/messages', async (req: ChatRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const channelId = parseInt(req.params.channelId);
      const { content, messageType = 'text' } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
      }

      // Verificar acesso ao canal
      const channel = await db
        .select()
        .from(internalChatChannels)
        .where(eq(internalChatChannels.id, channelId))
        .limit(1);

      if (!channel[0]) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      
      // Verificar permissão para enviar mensagem
      if (!permissions.canViewAll && channel[0].type === 'team') {
        const hasAccess = await db
          .select()
          .from(internalChatChannelMembers)
          .where(
            and(
              eq(internalChatChannelMembers.channelId, channelId),
              eq(internalChatChannelMembers.userId, req.user.id),
              eq(internalChatChannelMembers.isActive, true)
            )
          )
          .limit(1);

        if (!hasAccess[0]) {
          return res.status(403).json({ error: 'Acesso negado ao canal' });
        }
      }

      // Criar mensagem
      const [newMessage] = await db
        .insert(internalChatMessages)
        .values({
          content,
          messageType,
          userId: req.user.id,
          channelId,
        })
        .returning();

      // Buscar dados do usuário para retornar
      const user = await db
        .select({
          displayName: systemUsers.displayName,
          avatar: systemUsers.avatar
        })
        .from(systemUsers)
        .where(eq(systemUsers.id, req.user.id))
        .limit(1);

      const response = {
        ...newMessage,
        userName: user[0]?.displayName,
        userAvatar: user[0]?.avatar
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para sincronização manual
  app.post('/api/internal-chat/sync-teams', async (req: ChatRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const permissions = await getUserPermissions(req.user.id);
      if (!permissions.isAdmin) {
        return res.status(403).json({ error: 'Apenas administradores podem sincronizar equipes' });
      }

      await syncTeamsWithChatChannels();
      res.json({ message: 'Equipes sincronizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao sincronizar equipes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}