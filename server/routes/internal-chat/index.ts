import { Express, Request, Response } from 'express';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';
import { db } from '../../core/db';
import { 
  internalChatChannels, 
  internalChatMessages, 
  internalChatChannelMembers, 
  internalChatReactions,
  systemUsers,
  teams,
  userTeams,
  roles
} from '../../../shared/schema';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    roleId: number;
  };
}

/**
 * Módulo Internal Chat - Sistema de Chat Interno
 * 
 * Funcionalidades:
 * - Canais de chat privados e públicos
 * - Mensagens em tempo real
 * - Sistema de reações
 * - Controle de leitura de mensagens
 * - Membership de canais
 */
/**
 * Função para sincronizar equipes com canais do chat interno
 */
async function syncTeamsWithChannels() {
  try {
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
        // Criar canal para a equipe
        const [newChannel] = await db
          .insert(internalChatChannels)
          .values({
            name: team.name,
            description: team.description || `Discussões da ${team.name}`,
            type: 'team',
            teamId: team.id,
            isPrivate: false,
            createdBy: 1 // Sistema
          })
          .returning();
        
        // Adicionar todos os membros da equipe ao canal
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
  } catch (error) {
    console.error('Erro ao sincronizar equipes:', error);
  }
}

/**
 * Função para verificar permissões de acesso ao chat
 */
async function checkChatPermissions(userId: number) {
  const user = await db
    .select({
      id: systemUsers.id,
      roleId: systemUsers.roleId,
      roleName: roles.name
    })
    .from(systemUsers)
    .leftJoin(roles, eq(systemUsers.roleId, roles.id))
    .where(eq(systemUsers.id, userId))
    .limit(1);
  
  if (!user[0]) return { canViewAll: false, canViewTeams: false, canViewPrivate: false };
  
  const isAdmin = user[0].roleName === 'Admin';
  const isManager = user[0].roleName === 'Gestor';
  
  return {
    canViewAll: isAdmin || isManager,
    canViewTeams: true, // Todos podem ver equipes das quais fazem parte
    canViewPrivate: isAdmin || isManager, // Apenas admin/gestor veem mensagens privadas de outros
    isAdmin,
    isManager
  };
}

export function registerInternalChatRoutes(app: Express) {
  
  // Sincronizar equipes automaticamente na inicialização
  syncTeamsWithChannels();
  
  // Endpoint para sincronização manual
  app.post('/api/internal-chat/sync-teams', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      const permissions = await checkChatPermissions(req.user.id);
      if (!permissions.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      
      await syncTeamsWithChannels();
      res.json({ message: 'Equipes sincronizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao sincronizar equipes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Get all channels for current user with permissions
  app.get('/api/internal-chat/channels', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      const permissions = await checkChatPermissions(req.user.id);
      let channels = [];

      const channels = await db
        .select({
          id: internalChatChannels.id,
          name: internalChatChannels.name,
          description: internalChatChannels.description,
          type: internalChatChannels.type,
          teamId: internalChatChannels.teamId,
          isPrivate: internalChatChannels.isPrivate,
          createdAt: internalChatChannels.createdAt,
          updatedAt: internalChatChannels.updatedAt,
          unreadCount: sql<number>`COALESCE(
            (SELECT COUNT(*) 
             FROM ${internalChatMessages} m 
             LEFT JOIN ${internalChatChannelMembers} cm ON cm.channel_id = m.channel_id AND cm.user_id = ${req.user.id}
             WHERE m.channel_id = ${internalChatChannels.id} 
             AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
             AND m.user_id != ${req.user.id}
             AND m.is_deleted = false), 0)`,
          lastMessageAt: sql<Date>`(
            SELECT MAX(m.created_at) 
            FROM ${internalChatMessages} m 
            WHERE m.channel_id = ${internalChatChannels.id} AND m.is_deleted = false
          )`
        })
        .from(internalChatChannels)
        .where(
          and(
            eq(internalChatChannels.isActive, true),
            or(
              eq(internalChatChannels.isPrivate, false),
              sql`EXISTS (
                SELECT 1 FROM ${internalChatChannelMembers} 
                WHERE channel_id = ${internalChatChannels.id} 
                AND user_id = ${req.user.id} 
                AND is_active = true
              )`
            )
          )
        )
        .orderBy(desc(sql`COALESCE(last_message_at, ${internalChatChannels.createdAt})`));

      res.json(channels);
    } catch (error) {
      console.error('Erro ao buscar canais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get messages for a specific channel
  app.get('/api/internal-chat/channels/:channelId/messages', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { channelId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Verificar se o usuário tem acesso ao canal
      const channel = await db
        .select()
        .from(internalChatChannels)
        .where(eq(internalChatChannels.id, parseInt(channelId)))
        .limit(1);

      if (!channel[0]) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      if (channel[0].isPrivate) {
        const membership = await db
          .select()
          .from(internalChatChannelMembers)
          .where(
            and(
              eq(internalChatChannelMembers.channelId, parseInt(channelId)),
              eq(internalChatChannelMembers.userId, req.user.id),
              eq(internalChatChannelMembers.isActive, true)
            )
          )
          .limit(1);

        if (!membership[0]) {
          return res.status(403).json({ error: 'Acesso negado ao canal' });
        }
      }

      // Buscar mensagens com informações do usuário
      const messages = await db
        .select({
          id: internalChatMessages.id,
          channelId: internalChatMessages.channelId,
          userId: internalChatMessages.userId,
          userName: systemUsers.displayName,
          userAvatar: systemUsers.avatarUrl,
          content: internalChatMessages.content,
          messageType: internalChatMessages.messageType,
          replyToId: internalChatMessages.replyToId,
          isImportant: internalChatMessages.isImportant,
          isEdited: internalChatMessages.isEdited,
          editedAt: internalChatMessages.editedAt,
          reminderDate: internalChatMessages.reminderDate,
          metadata: internalChatMessages.metadata,
          createdAt: internalChatMessages.createdAt,
        })
        .from(internalChatMessages)
        .leftJoin(systemUsers, eq(internalChatMessages.userId, systemUsers.id))
        .leftJoin(internalChatReactions, eq(internalChatReactions.messageId, internalChatMessages.id))
        .where(
          and(
            eq(internalChatMessages.channelId, parseInt(channelId)),
            eq(internalChatMessages.isDeleted, false)
          )
        )
        .groupBy(
          internalChatMessages.id,
          internalChatMessages.channelId,
          internalChatMessages.userId,
          systemUsers.displayName,
          systemUsers.profileImageUrl,
          internalChatMessages.content,
          internalChatMessages.messageType,
          internalChatMessages.replyToId,
          internalChatMessages.isImportant,
          internalChatMessages.isEdited,
          internalChatMessages.editedAt,
          internalChatMessages.reminderDate,
          internalChatMessages.metadata,
          internalChatMessages.createdAt
        )
        .orderBy(desc(internalChatMessages.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(messages.reverse()); // Reverter para ordem cronológica
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Send a message
  app.post('/api/internal-chat/channels/:channelId/messages', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { channelId } = req.params;
      const { content, messageType = 'text', replyToId, isImportant = false, reminderDate } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
      }

      // Verificar acesso ao canal
      const channel = await db
        .select()
        .from(internalChatChannels)
        .where(eq(internalChatChannels.id, parseInt(channelId)))
        .limit(1);

      if (!channel[0]) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      if (channel[0].isPrivate) {
        const membership = await db
          .select()
          .from(internalChatChannelMembers)
          .where(
            and(
              eq(internalChatChannelMembers.channelId, parseInt(channelId)),
              eq(internalChatChannelMembers.userId, req.user.id),
              eq(internalChatChannelMembers.isActive, true)
            )
          )
          .limit(1);

        if (!membership[0]) {
          return res.status(403).json({ error: 'Acesso negado ao canal' });
        }
      }

      // Inserir mensagem
      const [newMessage] = await db
        .insert(internalChatMessages)
        .values({
          channelId: parseInt(channelId),
          userId: req.user.id,
          content: content.trim(),
          messageType,
          replyToId: replyToId ? parseInt(replyToId) : null,
          isImportant,
          reminderDate: reminderDate ? new Date(reminderDate) : null,
        })
        .returning();

      // Buscar a mensagem completa com informações do usuário
      const messageWithUser = await db
        .select({
          id: internalChatMessages.id,
          channelId: internalChatMessages.channelId,
          userId: internalChatMessages.userId,
          userName: systemUsers.displayName,
          userAvatar: systemUsers.profileImageUrl,
          content: internalChatMessages.content,
          messageType: internalChatMessages.messageType,
          replyToId: internalChatMessages.replyToId,
          isImportant: internalChatMessages.isImportant,
          isEdited: internalChatMessages.isEdited,
          editedAt: internalChatMessages.editedAt,
          reminderDate: internalChatMessages.reminderDate,
          metadata: internalChatMessages.metadata,
          createdAt: internalChatMessages.createdAt,
        })
        .from(internalChatMessages)
        .leftJoin(systemUsers, eq(internalChatMessages.userId, systemUsers.id))
        .where(eq(internalChatMessages.id, newMessage.id))
        .limit(1);

      res.status(201).json(messageWithUser[0]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Add reaction to message
  app.post('/api/internal-chat/messages/:messageId/reactions', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji é obrigatório' });
      }

      // Verificar se a mensagem existe
      const message = await db
        .select()
        .from(internalChatMessages)
        .where(eq(internalChatMessages.id, parseInt(messageId)))
        .limit(1);

      if (!message[0]) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      // Verificar se já existe uma reação igual do mesmo usuário
      const existingReaction = await db
        .select()
        .from(internalChatReactions)
        .where(
          and(
            eq(internalChatReactions.messageId, parseInt(messageId)),
            eq(internalChatReactions.userId, req.user.id),
            eq(internalChatReactions.emoji, emoji)
          )
        )
        .limit(1);

      if (existingReaction[0]) {
        // Remover reação existente
        await db
          .delete(internalChatReactions)
          .where(eq(internalChatReactions.id, existingReaction[0].id));

        res.json({ action: 'removed', emoji, userId: req.user.id });
      } else {
        // Adicionar nova reação
        await db
          .insert(internalChatReactions)
          .values({
            messageId: parseInt(messageId),
            userId: req.user.id,
            emoji,
          });

        res.json({ action: 'added', emoji, userId: req.user.id });
      }
    } catch (error) {
      console.error('Erro ao gerenciar reação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Mark channel as read
  app.post('/api/internal-chat/channels/:channelId/read', async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { channelId } = req.params;

      // Atualizar ou inserir registro de membro do canal
      await db
        .insert(internalChatChannelMembers)
        .values({
          channelId: parseInt(channelId),
          userId: req.user.id,
          lastReadAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [internalChatChannelMembers.channelId, internalChatChannelMembers.userId],
          set: {
            lastReadAt: new Date(),
            isActive: true,
          },
        });

      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao marcar canal como lido:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}