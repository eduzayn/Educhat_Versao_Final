import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage";
import { BIChannelStats } from './types';

export function registerChannelRoutes(app: Express) {
  // Dados dos canais - REST: GET /api/bi/channels
  app.get('/api/bi/channels', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(10000, 0);
      const filteredConversations = conversations.filter(conv => {
        const date = conv.createdAt || conv.lastMessageAt;
        return date ? new Date(date) >= startDate : false;
      });

      // Agrupar por canal
      const channelStats = filteredConversations.reduce((acc, conv) => {
        const channel = conv.channel || 'whatsapp';
        if (!acc[channel]) {
          acc[channel] = { name: channel, count: 0, percentage: 0 };
        }
        acc[channel].count++;
        return acc;
      }, {} as Record<string, BIChannelStats>);

      // Calcular percentuais
      const total = filteredConversations.length;
      Object.values(channelStats).forEach((stat) => {
        stat.percentage = total > 0 ? (stat.count / total) * 100 : 0;
      });

      res.json(Object.values(channelStats));
    } catch (error) {
      console.error('Erro ao buscar dados dos canais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 