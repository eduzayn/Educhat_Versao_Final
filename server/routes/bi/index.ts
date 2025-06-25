import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { storage } from '../../core/storage';

export function registerBIRoutes(app: Express) {
  
  // KPIs do Dashboard - REST: GET /api/bi/kpis
  app.get('/api/bi/kpis', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30', macrosetor = 'all', channel = 'all' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar dados reais do banco
      const conversations = await storage.getConversations(10000, 0);
      const allContacts = await storage.searchContacts('');
      const allDeals = await storage.getDeals();

      // Filtrar por período
      const filteredConversations = conversations.filter(conv => {
        const date = conv.createdAt || conv.lastMessageAt;
        return date ? new Date(date) >= startDate : false;
      });
      
      const filteredContacts = allContacts.filter(contact => {
        return contact.createdAt ? new Date(contact.createdAt) >= startDate : false;
      });

      const filteredDeals = allDeals.filter(deal => {
        return deal.createdAt ? new Date(deal.createdAt) >= startDate : false;
      });

      // Calcular KPIs
      const totalAtendimentos = filteredConversations.length;
      const novosContatos = filteredContacts.length;
      const dealsConvertidos = filteredDeals.filter(deal => deal.stage === 'won').length;
      const taxaConversao = totalAtendimentos > 0 ? (dealsConvertidos / totalAtendimentos) * 100 : 0;
      
      // Calcular taxa de desistência (conversas sem resposta recente)
      const conversasAbandonadas = filteredConversations.filter(conv => {
        if (!conv.lastMessageAt) return false;
        const lastMessage = new Date(conv.lastMessageAt);
        const daysSinceLastMessage = (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastMessage > 7;
      }).length;
      
      const taxaDesistencia = totalAtendimentos > 0 ? (conversasAbandonadas / totalAtendimentos) * 100 : 0;

      const kpis = {
        totalAtendimentos,
        novosContatos,
        taxaConversao: Number(taxaConversao.toFixed(1)),
        taxaDesistencia: Number(taxaDesistencia.toFixed(1)),
        satisfacaoMedia: 4.2, // Valor base - pode ser implementado sistema de avaliação
        tempoMedioResposta: 15, // Em minutos - pode ser calculado das mensagens
        tempoMedioResolucao: 24 // Em horas - pode ser calculado dos deals fechados
      };

      res.json(kpis);
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

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
      }, {} as Record<string, any>);

      // Calcular percentuais
      const total = filteredConversations.length;
      Object.values(channelStats).forEach((stat: any) => {
        stat.percentage = total > 0 ? (stat.count / total) * 100 : 0;
      });

      res.json(Object.values(channelStats));
    } catch (error) {
      console.error('Erro ao buscar dados dos canais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Dados das equipes - REST: GET /api/bi/teams
  app.get('/api/bi/teams', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deals = await storage.getDeals();
      const filteredDeals = deals.filter(deal => {
        return deal.createdAt ? new Date(deal.createdAt) >= startDate : false;
      });

      // Agrupar por teamType
      const teamStats = filteredDeals.reduce((acc, deal) => {
        const team = deal.teamType || 'comercial';
        if (!acc[team]) {
          acc[team] = { 
            name: team, 
            deals: 0, 
            convertidos: 0, 
            taxaConversao: 0,
            valorTotal: 0
          };
        }
        acc[team].deals++;
        if (deal.stage === 'won') {
          acc[team].convertidos++;
          acc[team].valorTotal += deal.value || 0;
        }
        return acc;
      }, {} as Record<string, any>);

      // Calcular taxas de conversão
      Object.values(teamStats).forEach((stat: any) => {
        stat.taxaConversao = stat.deals > 0 ? (stat.convertidos / stat.deals) * 100 : 0;
      });

      res.json(Object.values(teamStats));
    } catch (error) {
      console.error('Erro ao buscar dados dos macrosetores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Dashboard Estratégico - REST: GET /api/bi/dashboard
  app.get('/api/bi/dashboard', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar dados de conversas, mensagens e negócios
      const conversations = await storage.getConversations(1000, 0);
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
      const channelData = periodConversations.reduce((acc: any, conv) => {
        const channel = conv.channel || 'Unknown';
        if (!acc[channel]) {
          acc[channel] = { name: channel, conversations: 0, messages: 0 };
        }
        acc[channel].conversations++;
        acc[channel].messages += periodMessages.filter(m => m.conversationId === conv.id).length;
        return acc;
      }, {});

      // Tendências diárias
      const dailyTrends = [];
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

      res.json({
        metrics: {
          totalConversations,
          totalMessages,
          totalDeals,
          avgResponseTime,
          satisfactionScore
        },
        channels: Object.values(channelData),
        trends: dailyTrends
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard BI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Produtividade Individual - REST: GET /api/bi/productivity
  app.get('/api/bi/productivity', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30', userId } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(1000, 0);
      const messages = await storage.getAllMessages();
      const users = await storage.getSystemUsers();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      const periodMessages = messages.filter(m => 
        m.sentAt && new Date(m.sentAt) >= startDate && !m.isFromContact
      );

      // Dados por usuário
      const userStats = users.map(user => {
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
          const dailyActivity = [];
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

          res.json({
            user: specificUser,
            dailyActivity,
            goals: {
              conversations: 50,
              responseTime: 2.0,
              satisfaction: 4.5
            }
          });
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

  // Performance de Equipes - REST: GET /api/bi/teams
  app.get('/api/bi/teams', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const teams = await storage.getAllTeams();
      const conversations = await storage.getConversations(1000, 0);
      const users = await storage.getSystemUsers();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );

      // Dados por equipe
      const teamStats = await Promise.all(teams.map(async team => {
        const teamUsers = await storage.getUserTeams(team.id);
        const teamConversations = periodConversations.filter(c => c.assignedTeamId === team.id);
        
        // Top performers da equipe
        const topPerformers = teamUsers.slice(0, 3).map(user => ({
          name: `Usuário ${user.id}`,
          score: Math.random() * 40 + 60 // Simulado
        }));

        return {
          id: team.id,
          name: team.name,
          teamType: team.teamType,
          totalConversations: teamConversations.length,
          activeMembers: teamUsers.length,
          avgResponseTime: Math.random() * 3 + 1, // Simulado
          satisfaction: Math.random() * 2 + 3, // Simulado
          efficiency: Math.random() * 30 + 70, // Simulado
          topPerformers
        };
      }));

      res.json({
        teams: teamStats.sort((a, b) => b.efficiency - a.efficiency)
      });
    } catch (error) {
      console.error('Erro ao buscar dados de equipes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

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
        const conversionData = {
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
        const channelStats = channels.map(channel => {
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
        const generalStats = {
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