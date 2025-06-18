import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { teams, systemUsers, conversations, messages } from "../../../shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

/**
 * Rotas para integração de equipes no chat interno
 * Gerencia comunicação entre equipes e membros
 */

export function registerTeamsIntegratedChatRoutes(app: Express) {
  
  // Listar conversas da equipe
  app.get('/api/internal-chat/teams/:teamId/conversations', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const teamConversations = await db
        .select({
          id: conversations.id,
          contactId: conversations.contactId,
          lastMessageAt: conversations.lastMessageAt,
          unreadCount: conversations.unreadCount,
          status: conversations.status,
          assignedTeamId: conversations.assignedTeamId
        })
        .from(conversations)
        .where(eq(conversations.assignedTeamId, parseInt(teamId)))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(50);

      res.json(teamConversations);
    } catch (error) {
      console.error('Erro ao buscar conversas da equipe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar membros da equipe para chat
  app.get('/api/internal-chat/teams/:teamId/members', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const teamMembers = await db
        .select({
          id: systemUsers.id,
          displayName: systemUsers.displayName,
          email: systemUsers.email,
          role: systemUsers.role,
          isActive: systemUsers.isActive,
          avatar: systemUsers.avatar
        })
        .from(systemUsers)
        .where(eq(systemUsers.teamId, parseInt(teamId)));

      res.json(teamMembers);
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar canal de comunicação da equipe
  app.post('/api/internal-chat/teams/:teamId/channels', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { name, description, isPrivate = false } = req.body;

      // Verificar se a equipe existe
      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.id, parseInt(teamId)))
        .limit(1);

      if (team.length === 0) {
        return res.status(404).json({ error: 'Equipe não encontrada' });
      }

      // Para esta implementação básica, retornamos sucesso
      // Em um sistema real, teria uma tabela de canais
      res.json({
        id: Date.now(),
        name,
        description,
        teamId: parseInt(teamId),
        isPrivate,
        createdAt: new Date().toISOString(),
        memberCount: 0
      });
    } catch (error) {
      console.error('Erro ao criar canal da equipe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar estatísticas de comunicação da equipe
  app.get('/api/internal-chat/teams/:teamId/stats', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      // Contar conversas ativas da equipe
      const activeConversations = await db
        .select({ count: conversations.id })
        .from(conversations)
        .where(and(
          eq(conversations.assignedTeamId, parseInt(teamId)),
          eq(conversations.status, 'open')
        ));

      // Contar membros da equipe
      const teamMembers = await db
        .select({ count: systemUsers.id })
        .from(systemUsers)
        .where(eq(systemUsers.teamId, parseInt(teamId)));

      res.json({
        activeConversations: activeConversations.length,
        totalMembers: teamMembers.length,
        teamId: parseInt(teamId)
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas da equipe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}