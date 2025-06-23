import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { BIUserStats, BIUserResponse, BIDailyActivity } from './types';
import { User } from '../../types/user';

export function registerProductivityRoutes(app: Express) {
  // Produtividade Individual - REST: GET /api/bi/productivity
  app.get('/api/bi/productivity', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30', userId, team, search } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar apenas conversas do período com limite otimizado
      const conversations = await storage.getConversations(1000, 0);
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );

      // Buscar apenas mensagens do período (otimizado)
      const allUsers = await storage.getAllUsers();
      const userStats: BIUserStats[] = [];

      // Processar estatísticas por usuário de forma otimizada
      for (const user of allUsers) {
        if (search && !user.name?.toLowerCase().includes((search as string).toLowerCase())) {
          continue;
        }

        const userConversations = periodConversations.filter(c => c.assignedUserId === user.id);
        const conversationIds = userConversations.map(c => c.id);
        
        if (conversationIds.length === 0) continue;

        // Buscar mensagens apenas para conversas do usuário no período
        const userMessages = await storage.getMessagesByConversationIds(conversationIds);
        const userOutgoingMessages = userMessages.filter(m => 
          m.sentAt && 
          new Date(m.sentAt) >= startDate && 
          !m.isFromContact
        );

        if (userConversations.length === 0 && userOutgoingMessages.length === 0) continue;

        // Calcular produtividade baseada em dados reais
        const productivity = Math.min(100, Math.round(
          (userConversations.length * 2) + (userOutgoingMessages.length * 0.5)
        ));

        userStats.push({
          id: user.id,
          name: user.name || 'Usuário sem nome',
          conversations: userConversations.length,
          messages: userOutgoingMessages.length,
          avgResponseTime: 2.5, // Placeholder até implementar cálculo real
          satisfaction: 4.2, // Placeholder até implementar cálculo real
          productivity
        });
      }

      // Filtrar por equipe se especificado
      const filteredStats = team && team !== 'all' 
        ? userStats.filter(u => u.team === team)
        : userStats;

      // Se userId específico for solicitado
      if (userId) {
        const specificUser = filteredStats.find(u => u.id === parseInt(userId as string));
        if (specificUser) {
          // Dados detalhados do usuário específico
          const userConversations = periodConversations.filter(c => c.assignedUserId === parseInt(userId as string));
          
          // Atividade diária baseada em dados reais
          const dailyActivity: BIDailyActivity[] = [];
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));
            
            const dayConversations = userConversations.filter(c => 
              c.createdAt && new Date(c.createdAt) >= dayStart && new Date(c.createdAt) <= dayEnd
            );

            const dayConversationIds = dayConversations.map(c => c.id);
            const dayMessages = dayConversationIds.length > 0 
              ? await storage.getMessagesByConversationIds(dayConversationIds)
              : [];
            
            const dayOutgoingMessages = dayMessages.filter(m => 
              m.sentAt && 
              new Date(m.sentAt) >= dayStart && 
              new Date(m.sentAt) <= dayEnd && 
              !m.isFromContact
            );
            
            dailyActivity.push({
              date: dayStart.toISOString().split('T')[0],
              conversations: dayConversations.length,
              messages: dayOutgoingMessages.length
            });
          }

          const response: BIUserResponse = {
            user: specificUser,
            dailyActivity,
            goals: {
              conversations: 50,
              responseTime: 2.0,
              satisfaction: 4.5
            }
          };

          res.json(response);
        } else {
          res.status(404).json({ error: 'Usuário não encontrado' });
        }
      } else {
        res.json({
          users: filteredStats.sort((a, b) => b.productivity - a.productivity)
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de produtividade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 