import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";
import { BIReportConversion, BIReportChannel, BIReportGeneral } from './types';

export function registerReportRoutes(app: Express) {
  // Relatórios Avançados - REST: GET /api/bi/reports
  app.get('/api/bi/reports', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type = 'general', period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(1000, 0);
      const messages = await storage.getAllMessages();
      const deals = await storage.getDeals();
      const channels = await storage.getChannels();

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

      if (type === 'conversion') {
        // Relatório de conversão
        const conversionData: BIReportConversion = {
          totalLeads: periodConversations.length,
          convertedDeals: periodDeals.length,
          conversionRate: periodConversations.length > 0 ? 
            (periodDeals.length / periodConversations.length * 100).toFixed(2) : '0.00',
          funnel: [
            { stage: 'Contato Inicial', count: periodConversations.length },
            { stage: 'Qualificação', count: Math.floor(periodConversations.length * 0.7) },
            { stage: 'Proposta', count: Math.floor(periodConversations.length * 0.4) },
            { stage: 'Fechamento', count: periodDeals.length }
          ]
        };

        res.json({ conversion: conversionData });
      } else if (type === 'channels') {
        // Relatório por canais
        const channelStats: BIReportChannel[] = channels.map(channel => {
          const channelConversations = periodConversations.filter(c => c.channel === channel.name);
          const channelMessages = periodMessages.filter(m => 
            channelConversations.some(c => c.id === m.conversationId)
          );
          
          return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            conversations: channelConversations.length,
            messages: channelMessages.length,
            avgResponseTime: Math.random() * 4 + 1, // Simulado
            satisfaction: Math.random() * 2 + 3 // Simulado
          };
        });

        res.json({ channels: channelStats });
      } else {
        // Relatório geral
        const generalStats: BIReportGeneral = {
          summary: {
            totalConversations: periodConversations.length,
            totalMessages: periodMessages.length,
            totalDeals: periodDeals.length,
            avgResponseTime: 2.3 // Simulado
          },
          trends: [], // Seria calculado baseado em dados históricos
          topChannels: channels.slice(0, 5).map(ch => ({
            name: ch.name,
            conversations: Math.floor(Math.random() * 100) + 10
          }))
        };

        res.json({ general: generalStats });
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 