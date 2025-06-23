import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { BIDashboardResponse, BIChannelData, BIDailyTrend } from './types';

export function registerDashboardRoutes(app: Express) {
  // Dashboard Estratégico - REST: GET /api/bi/dashboard
  app.get('/api/bi/dashboard', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar dados de conversas, mensagens e negócios
      const conversations = await storage.getConversations(5000, 0);
      const messages = await storage.getAllMessages();
      const deals = await storage.getDeals();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      const periodMessages = messages.filter(m => 
        m.sentAt && new Date(m.sentAt) >= startDate
      );
      const periodDeals = deals.filter(d => 
        d.createdAt && new Date(d.createdAt) >= startDate
      );

      // Calcular métricas
      const totalConversations = periodConversations.length;
      const totalMessages = periodMessages.length;
      const totalDeals = periodDeals.length;
      const avgResponseTime = 2.5; // Em horas - seria calculado baseado nos dados reais
      const satisfactionScore = 4.2; // De 1-5 - seria calculado baseado em avaliações reais

      // Dados por canal
      const channelData = periodConversations.reduce((acc: Record<string, BIChannelData>, conv) => {
        const channel = conv.channel || 'Unknown';
        if (!acc[channel]) {
          acc[channel] = { name: channel, conversations: 0, messages: 0 };
        }
        acc[channel].conversations++;
        acc[channel].messages += periodMessages.filter(m => m.conversationId === conv.id).length;
        return acc;
      }, {});

      // Tendências diárias
      const dailyTrends: BIDailyTrend[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayConversations = periodConversations.filter(c => 
          c.createdAt && new Date(c.createdAt) >= dayStart && new Date(c.createdAt) <= dayEnd
        ).length;
        const dayMessages = periodMessages.filter(m => 
          m.sentAt && new Date(m.sentAt) >= dayStart && new Date(m.sentAt) <= dayEnd
        ).length;
        
        dailyTrends.push({
          date: dayStart.toISOString().split('T')[0],
          conversations: dayConversations,
          messages: dayMessages
        });
      }

      const response: BIDashboardResponse = {
        metrics: {
          totalConversations,
          totalMessages,
          totalDeals,
          avgResponseTime,
          satisfactionScore
        },
        channels: Object.values(channelData),
        trends: dailyTrends
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard BI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 