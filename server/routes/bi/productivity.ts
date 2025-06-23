import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { BIUserStats, BIUserResponse, BIDailyActivity } from './types';
import { User } from '../../types/user';

export function registerProductivityRoutes(app: Express) {
  // Produtividade Individual - REST: GET /api/bi/productivity
  app.get('/api/bi/productivity', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30', userId } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(1000, 0);
      const messages = await storage.getAllMessages();
      const users = await storage.getAllUsers();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      const periodMessages = messages.filter(m => 
        m.sentAt && new Date(m.sentAt) >= startDate && !m.isFromContact
      );

      // Dados por usuário
      const userStats: BIUserStats[] = users.map((user: User) => {
        const userConversations = periodConversations.filter(c => c.assignedUserId === user.id);
        const userMessages = periodMessages.filter(m => 
          userConversations.some(c => c.id === m.conversationId)
        );
        
        return {
          id: user.id,
          name: user.displayName,
          conversations: userConversations.length,
          messages: userMessages.length,
          avgResponseTime: Math.random() * 5 + 1, // Simulado - seria calculado baseado em dados reais
          satisfaction: Math.random() * 2 + 3, // Simulado
          productivity: Math.random() * 40 + 60 // Simulado
        };
      });

      // Se userId específico for solicitado
      if (userId) {
        const specificUser = userStats.find(u => u.id === parseInt(userId as string));
        if (specificUser) {
          // Dados detalhados do usuário específico
          const userConversations = periodConversations.filter(c => c.assignedUserId === parseInt(userId as string));
          
          // Atividade diária
          const dailyActivity: BIDailyActivity[] = [];
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));
            
            const dayConversations = userConversations.filter(c => 
              c.createdAt && new Date(c.createdAt) >= dayStart && new Date(c.createdAt) <= dayEnd
            ).length;
            
            dailyActivity.push({
              date: dayStart.toISOString().split('T')[0],
              conversations: dayConversations,
              messages: Math.floor(Math.random() * 50) + 10 // Simulado
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
          users: userStats.sort((a, b) => b.productivity - a.productivity)
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de produtividade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 