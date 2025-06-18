import { Request, Response, Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { internalChatChannels, internalChatMessages, systemUsers, teams } from '../../../shared/schema';
import { Message } from '../types/teams';

const router = Router();

// Buscar mensagens do canal
router.get('/:channelId/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const channelId = req.params.channelId;
    
    // Extrair ID do banco baseado no tipo de canal
    let dbChannelId: number;
    if (channelId.startsWith('direct-')) {
      dbChannelId = parseInt(channelId.replace('direct-', ''));
    } else if (channelId.startsWith('team-')) {
      const teamId = parseInt(channelId.replace('team-', ''));
      
      // Buscar canal para a equipe
      let teamChannel = await db
        .select({ id: internalChatChannels.id })
        .from(internalChatChannels)
        .where(eq(internalChatChannels.teamId, teamId))
        .limit(1);
      
      if (teamChannel.length === 0) {
        return res.json([]);
      }
      dbChannelId = teamChannel[0].id;
    } else if (channelId === 'general') {
      // Canal geral tem ID fixo
      const generalChannel = await db
        .select({ id: internalChatChannels.id })
        .from(internalChatChannels)
        .where(eq(internalChatChannels.type, 'general'))
        .limit(1);
      
      if (generalChannel.length === 0) {
        return res.json([]);
      }
      dbChannelId = generalChannel[0].id;
    } else {
      return res.json([]);
    }

    // Buscar mensagens do canal
    const messages = await db
      .select({
        id: internalChatMessages.id,
        content: internalChatMessages.content,
        messageType: internalChatMessages.messageType,
        metadata: internalChatMessages.metadata,
        createdAt: internalChatMessages.createdAt,
        userId: systemUsers.id,
        userName: systemUsers.displayName,
        userAvatar: systemUsers.avatar,
      })
      .from(internalChatMessages)
      .leftJoin(systemUsers, eq(internalChatMessages.userId, systemUsers.id))
      .where(
        eq(internalChatMessages.channelId, dbChannelId)
      )
      .orderBy(desc(internalChatMessages.createdAt))
      .limit(50);

    res.json(messages.reverse()); // Reverter para ordem cronológica
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem no canal
router.post('/:channelId/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const channelId = req.params.channelId;
    const { content, messageType = 'text', metadata = {} } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    }

    // Extrair ID do banco baseado no tipo de canal
    let dbChannelId: number;
    if (channelId.startsWith('direct-')) {
      dbChannelId = parseInt(channelId.replace('direct-', ''));
    } else if (channelId.startsWith('team-')) {
      const teamId = parseInt(channelId.replace('team-', ''));
      
      // Buscar ou criar canal para a equipe
      let teamChannel = await db
        .select({ id: internalChatChannels.id })
        .from(internalChatChannels)
        .where(eq(internalChatChannels.teamId, teamId))
        .limit(1);
      
      if (teamChannel.length === 0) {
        // Criar canal para a equipe
        const team = await db
          .select({ name: teams.name })
          .from(teams)
          .where(eq(teams.id, teamId))
          .limit(1);
        
        if (team.length === 0) {
          return res.status(404).json({ error: 'Equipe não encontrada' });
        }
        
        const [newChannel] = await db
          .insert(internalChatChannels)
          .values({
            name: team[0].name,
            description: `Discussões da ${team[0].name}`,
            type: 'team',
            teamId: teamId,
            isPrivate: false,
            createdBy: req.user.id,
            isActive: true
          })
          .returning({ id: internalChatChannels.id });
        
        dbChannelId = newChannel.id;
      } else {
        dbChannelId = teamChannel[0].id;
      }
    } else if (channelId === 'general') {
      // Canal geral tem ID fixo
      const generalChannel = await db
        .select({ id: internalChatChannels.id })
        .from(internalChatChannels)
        .where(eq(internalChatChannels.type, 'general'))
        .limit(1);
      
      if (generalChannel.length === 0) {
        return res.status(404).json({ error: 'Canal geral não encontrado' });
      }
      dbChannelId = generalChannel[0].id;
    } else {
      return res.status(400).json({ error: 'Tipo de canal não suportado' });
    }

    // Verificar se o canal existe e o usuário tem permissão
    const channel = await db
      .select()
      .from(internalChatChannels)
      .where(eq(internalChatChannels.id, dbChannelId))
      .limit(1);

    if (channel.length === 0) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }

    // Salvar mensagem no banco
    const [savedMessage] = await db
      .insert(internalChatMessages)
      .values({
        channelId: dbChannelId,
        userId: req.user.id,
        content: content.trim(),
        messageType,
        metadata,
      })
      .returning();

    const message = {
      id: savedMessage.id,
      channelId,
      userId: req.user.id,
      userName: req.user.displayName || req.user.username,
      userAvatar: (req.user as any).avatar,
      content: content.trim(),
      messageType,
      timestamp: savedMessage.createdAt,
      reactions: {},
    };

    console.log(`📨 Nova mensagem salva no canal ${channelId}:`, message);

    res.json({ success: true, message });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 