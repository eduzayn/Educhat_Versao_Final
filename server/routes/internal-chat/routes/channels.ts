import { Request, Response, Router } from 'express';
import { eq, and, or, inArray } from 'drizzle-orm';
import { db } from '../../../db';
import { teams, userTeams, systemUsers, roles, internalChatChannels } from '@shared/schema';
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

    // Buscar canais diretos/privados do usuário
    const directChannels = await db
      .select({
        id: internalChatChannels.id,
        name: internalChatChannels.name,
        description: internalChatChannels.description,
        type: internalChatChannels.type,
        isPrivate: internalChatChannels.isPrivate,
        participantIds: internalChatChannels.participantIds,
      })
      .from(internalChatChannels)
      .where(
        and(
          eq(internalChatChannels.type, 'direct'),
          eq(internalChatChannels.isActive, true),
          or(
            eq(internalChatChannels.createdBy, req.user.id)
            // Note: inArray com array column não suportado diretamente, usar SQL raw se necessário
          )
        )
      );

    // Converter canais diretos para o formato esperado
    const directChannelsFormatted = await Promise.all(
      directChannels.map(async (channel) => {
        const participantIds = channel.participantIds || [];
        const otherUserId = participantIds.find(id => id !== req.user!.id);
        
        if (otherUserId) {
          const otherUser = await db
            .select({
              displayName: systemUsers.displayName,
              username: systemUsers.username,
              avatar: systemUsers.avatar,
            })
            .from(systemUsers)
            .where(eq(systemUsers.id, otherUserId))
            .limit(1);

          if (otherUser.length > 0) {
            return {
              id: `direct-${channel.id}`,
              name: `${otherUser[0].displayName || otherUser[0].username}`,
              description: `Conversa privada`,
              type: 'direct' as const,
              isPrivate: true,
              participants: participantIds,
              unreadCount: 0,
              channelDbId: channel.id,
            };
          }
        }
        return null;
      })
    );

    channels.push(...directChannelsFormatted.filter(Boolean) as any[]);
    
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

// Criar ou buscar canal direto entre dois usuários
router.post('/direct/:targetUserId', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const targetUserId = parseInt(req.params.targetUserId);
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Não é possível criar canal direto consigo mesmo' });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await db
      .select({
        id: systemUsers.id,
        displayName: systemUsers.displayName,
        username: systemUsers.username,
      })
      .from(systemUsers)
      .where(eq(systemUsers.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar canal direto existente
    const participantIds = [currentUserId, targetUserId].sort();
    
    const existingChannel = await db
      .select()
      .from(internalChatChannels)
      .where(
        and(
          eq(internalChatChannels.type, 'direct'),
          eq(internalChatChannels.isActive, true)
        )
      );

    let directChannel = existingChannel.find(channel => {
      const channelParticipants = (channel.participantIds || []).sort();
      return channelParticipants.length === 2 && 
             channelParticipants[0] === participantIds[0] && 
             channelParticipants[1] === participantIds[1];
    });

    // Se não existe, criar novo canal
    if (!directChannel) {
      const [newChannel] = await db
        .insert(internalChatChannels)
        .values({
          type: 'direct',
          name: `Conversa entre ${req.user.displayName || req.user.username} e ${targetUser[0].displayName || targetUser[0].username}`,
          description: 'Canal de mensagem direta',
          isPrivate: true,
          participantIds: participantIds,
          createdBy: currentUserId,
        })
        .returning();

      directChannel = newChannel;
    }

    res.json({
      success: true,
      channel: {
        id: `direct-${directChannel.id}`,
        name: targetUser[0].displayName || targetUser[0].username,
        type: 'direct',
        isPrivate: true,
        channelDbId: directChannel.id,
        participants: participantIds,
      }
    });
  } catch (error) {
    console.error('Erro ao criar/buscar canal direto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 