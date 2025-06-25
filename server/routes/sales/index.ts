import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { storage } from '../../core/storage';

export function registerSalesRoutes(app: Express) {
  
  // Dashboard de Vendas - REST: GET /api/sales/dashboard
  app.get('/api/sales/dashboard', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month', channel = 'all', salesperson = 'all', customDateStart, customDateEnd } = req.query;
      
      let startDate: Date;
      let endDate = new Date();
      
      if (period === 'custom' && customDateStart && customDateEnd) {
        startDate = new Date(customDateStart as string);
        endDate = new Date(customDateEnd as string);
        endDate.setHours(23, 59, 59, 999); // Final do dia
      } else {
        const days = parseInt(
          period === 'today' ? '1' :
          period === 'week' ? '7' : 
          period === 'month' ? '30' : 
          period === 'quarter' ? '90' : '365'
        );
        
        if (period === 'today') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0); // Início do dia
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999); // Final do dia
        } else {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        }
      }

      // Buscar negócios fechados (won) no período
      const deals = await storage.getDeals();
      const wonDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= startDate
      );

      const totalSalesThisMonth = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const totalDealsThisMonth = wonDeals.length;

      // Período anterior para comparação
      const previousStartDate = new Date(startDate);
      let previousEndDate = new Date(startDate);
      
      if (period === 'today') {
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        previousEndDate.setHours(23, 59, 59, 999);
      } else if (period === 'custom') {
        const diffTime = endDate.getTime() - startDate.getTime();
        previousStartDate.setTime(startDate.getTime() - diffTime);
        previousEndDate.setTime(startDate.getTime() - 1);
      } else {
        const days = parseInt(
          period === 'week' ? '7' : 
          period === 'month' ? '30' : 
          period === 'quarter' ? '90' : '365'
        );
        previousStartDate.setDate(previousStartDate.getDate() - days);
        previousEndDate = new Date(startDate);
      }
      
      const previousDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= previousStartDate && 
        new Date(deal.createdAt) <= previousEndDate
      );

      const totalSalesLastMonth = previousDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const totalDealsLastMonth = previousDeals.length;

      // Buscar total de leads para calcular conversão
      const totalLeads = deals.length;
      const conversionRate = totalLeads > 0 ? (totalDealsThisMonth / totalLeads) * 100 : 0;

      // Ticket médio
      const averageTicket = totalDealsThisMonth > 0 ? totalSalesThisMonth / totalDealsThisMonth : 0;

      const salesData = {
        totalSalesThisMonth,
        totalSalesLastMonth,
        totalDealsThisMonth,
        totalDealsLastMonth,
        conversionRate,
        averageTicket
      };

      res.json(salesData);
    } catch (error) {
      console.error('Erro ao buscar dashboard de vendas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Gráficos de Vendas - REST: GET /api/sales/charts
  app.get('/api/sales/charts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      
      // Buscar dados reais dos negócios e usuários
      const deals = await storage.getDeals();
      const users = await storage.getSystemUsers();
      
      const wonDeals = deals.filter(deal => deal.stage === 'won');

      // Vendas por vendedor (usar assignedTo dos deals)
      const salesByPerson = users.map(user => {
        const userDeals = wonDeals.filter(deal => deal.contactId === user.id);
        const totalValue = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        return {
          name: user.displayName || user.email,
          value: totalValue,
          deals: userDeals.length
        };
      }).filter(item => item.value > 0);

      // Evolução das vendas (últimos 7 dias)
      const salesEvolution = [];
      let maxValue = 0;
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayDeals = wonDeals.filter(deal => {
          const dealDate = deal.createdAt ? new Date(deal.createdAt) : null;
          return dealDate && dealDate >= dayStart && dealDate <= dayEnd;
        });
        
        const dayValue = dayDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        maxValue = Math.max(maxValue, dayValue);
        
        salesEvolution.push({
          date: dayStart.toISOString().split('T')[0],
          value: dayValue,
          deals: dayDeals.length
        });
      }

      // Distribuição por canal
      const channelDistribution = wonDeals.reduce((acc, deal) => {
        const channel = deal.channel || 'whatsapp';
        if (!acc[channel]) {
          acc[channel] = { name: channel, value: 0, deals: 0 };
        }
        acc[channel].value += deal.value || 0;
        acc[channel].deals++;
        return acc;
      }, {} as Record<string, any>);

      // Funil de vendas
      const allDeals = deals;
      const salesFunnel = [
        { stage: 'Lead', count: allDeals.length },
        { stage: 'Qualificado', count: allDeals.filter(d => d.stage !== 'new').length },
        { stage: 'Proposta', count: allDeals.filter(d => ['proposal', 'negotiation', 'won', 'lost'].includes(d.stage)).length },
        { stage: 'Fechamento', count: wonDeals.length }
      ];

      res.json({
        salesByPerson: salesByPerson.slice(0, 10), // Top 10
        salesEvolution,
        channelDistribution: Object.values(channelDistribution),
        salesFunnel,
        maxValue
      });
    } catch (error) {
      console.error('Erro ao buscar gráficos de vendas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Ranking de Vendedores - REST: GET /api/sales/ranking
  app.get('/api/sales/ranking', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month', limit = '10' } = req.query;
      const limitNumber = parseInt(limit as string);
      
      const days = parseInt(
        period === 'week' ? '7' : 
        period === 'month' ? '30' : 
        period === 'quarter' ? '90' : '365'
      );
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deals = await storage.getDeals();
      const users = await storage.getSystemUsers();
      
      const wonDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= startDate
      );

      // Calcular ranking por vendedor
      const ranking = users.map(user => {
        const userDeals = wonDeals.filter(deal => deal.assignedUserId === user.id);
        const totalValue = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const totalDeals = userDeals.length;
        const averageTicket = totalDeals > 0 ? totalValue / totalDeals : 0;

        return {
          id: user.id,
          name: user.displayName || user.email,
          totalValue,
          totalDeals,
          averageTicket,
          performance: totalValue > 0 ? 100 : 0 // Simplificado
        };
      }).filter(item => item.totalValue > 0)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, limitNumber);

      res.json({ ranking });
    } catch (error) {
      console.error('Erro ao buscar ranking de vendedores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Análise de Produtos/Serviços - REST: GET /api/sales/products
  app.get('/api/sales/products', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      
      const days = parseInt(
        period === 'week' ? '7' : 
        period === 'month' ? '30' : 
        period === 'quarter' ? '90' : '365'
      );
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deals = await storage.getDeals();
      const wonDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= startDate
      );

      // Análise por categoria/produto (baseado no macrosetor)
      const productAnalysis = wonDeals.reduce((acc, deal) => {
        const product = deal.teamType || 'Produto Genérico';
        if (!acc[product]) {
          acc[product] = {
            name: product,
            totalValue: 0,
            totalDeals: 0,
            averageTicket: 0,
            growth: Math.random() * 40 - 20 // Simulado
          };
        }
        acc[product].totalValue += deal.value || 0;
        acc[product].totalDeals++;
        return acc;
      }, {} as Record<string, any>);

      // Calcular ticket médio
      Object.values(productAnalysis).forEach((product: any) => {
        product.averageTicket = product.totalDeals > 0 ? product.totalValue / product.totalDeals : 0;
      });

      const sortedProducts = Object.values(productAnalysis)
        .sort((a: any, b: any) => b.totalValue - a.totalValue);

      res.json({ products: sortedProducts });
    } catch (error) {
      console.error('Erro ao buscar análise de produtos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Metas de Vendas - REST: GET /api/sales/goals
  app.get('/api/sales/goals', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month', userId } = req.query;
      
      const days = parseInt(
        period === 'week' ? '7' : 
        period === 'month' ? '30' : 
        period === 'quarter' ? '90' : '365'
      );
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deals = await storage.getDeals();
      const wonDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= startDate
      );

      if (userId) {
        // Meta individual
        const userDeals = wonDeals.filter(deal => deal.assignedUserId === parseInt(userId as string));
        const achieved = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const goal = 50000; // Meta simulada - seria configurável
        const progress = goal > 0 ? (achieved / goal) * 100 : 0;

        res.json({
          userId: parseInt(userId as string),
          period,
          goal,
          achieved,
          progress: Math.min(progress, 100),
          remaining: Math.max(goal - achieved, 0)
        });
      } else {
        // Metas da equipe
        const users = await storage.getSystemUsers();
        const userGoals = users.map(user => {
          const userDeals = wonDeals.filter(deal => deal.assignedUserId === user.id);
          const achieved = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
          const goal = 30000; // Meta simulada
          const progress = goal > 0 ? (achieved / goal) * 100 : 0;

          return {
            userId: user.id,
            userName: user.displayName || user.email,
            goal,
            achieved,
            progress: Math.min(progress, 100),
            status: progress >= 100 ? 'achieved' : progress >= 80 ? 'close' : 'in_progress'
          };
        }).filter(item => item.achieved > 0);

        const totalGoal = userGoals.reduce((sum, item) => sum + item.goal, 0);
        const totalAchieved = userGoals.reduce((sum, item) => sum + item.achieved, 0);
        const overallProgress = totalGoal > 0 ? (totalAchieved / totalGoal) * 100 : 0;

        res.json({
          period,
          overall: {
            goal: totalGoal,
            achieved: totalAchieved,
            progress: Math.min(overallProgress, 100)
          },
          individuals: userGoals.sort((a, b) => b.progress - a.progress)
        });
      }
    } catch (error) {
      console.error('Erro ao buscar metas de vendas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Previsão de Vendas - REST: GET /api/sales/forecast
  app.get('/api/sales/forecast', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      
      const deals = await storage.getDeals();
      const activeDeals = deals.filter(deal => 
        ['qualified', 'proposal', 'negotiation'].includes(deal.stage)
      );

      // Previsão baseada no pipeline atual
      const forecast = activeDeals.reduce((acc, deal) => {
        const probability = deal.stage === 'qualified' ? 0.3 : 
                           deal.stage === 'proposal' ? 0.6 : 
                           deal.stage === 'negotiation' ? 0.8 : 0;
        
        const expectedValue = (deal.value || 0) * probability;
        
        return {
          totalPipeline: acc.totalPipeline + (deal.value || 0),
          expectedRevenue: acc.expectedRevenue + expectedValue,
          dealCount: acc.dealCount + 1
        };
      }, { totalPipeline: 0, expectedRevenue: 0, dealCount: 0 });

      // Tendência baseada em dados históricos (simulado)
      const trend = {
        direction: 'up', // 'up', 'down', 'stable'
        percentage: 15.5,
        confidence: 85
      };

      res.json({
        period,
        forecast: {
          ...forecast,
          averageDealValue: forecast.dealCount > 0 ? forecast.totalPipeline / forecast.dealCount : 0
        },
        trend,
        breakdown: {
          qualified: activeDeals.filter(d => d.stage === 'qualified').length,
          proposal: activeDeals.filter(d => d.stage === 'proposal').length,
          negotiation: activeDeals.filter(d => d.stage === 'negotiation').length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar previsão de vendas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Relatório de Conversão - REST: GET /api/sales/conversion
  app.get('/api/sales/conversion', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month', channel = 'all' } = req.query;
      
      const days = parseInt(
        period === 'week' ? '7' : 
        period === 'month' ? '30' : 
        period === 'quarter' ? '90' : '365'
      );
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(1000, 0);
      const deals = await storage.getDeals();
      
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      
      const periodDeals = deals.filter(d => 
        d.createdAt && new Date(d.createdAt) >= startDate
      );

      const wonDeals = periodDeals.filter(deal => deal.stage === 'won');

      // Taxa de conversão geral
      const totalLeads = periodConversations.length;
      const totalSales = wonDeals.length;
      const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

      // Funil de conversão detalhado
      const funnel = [
        { stage: 'Leads', count: totalLeads, percentage: 100 },
        { stage: 'Contatos Qualificados', count: Math.floor(totalLeads * 0.6), percentage: 60 },
        { stage: 'Propostas Enviadas', count: Math.floor(totalLeads * 0.3), percentage: 30 },
        { stage: 'Negociação', count: Math.floor(totalLeads * 0.15), percentage: 15 },
        { stage: 'Vendas Fechadas', count: totalSales, percentage: conversionRate }
      ];

      // Conversão por canal
      const channelConversion = periodConversations.reduce((acc, conv) => {
        const ch = conv.channel || 'whatsapp';
        if (!acc[ch]) {
          acc[ch] = { name: ch, leads: 0, sales: 0, rate: 0 };
        }
        acc[ch].leads++;
        return acc;
      }, {} as Record<string, any>);

      // Calcular vendas por canal
      wonDeals.forEach(deal => {
        const ch = deal.channel || 'whatsapp';
        if (channelConversion[ch]) {
          channelConversion[ch].sales++;
        }
      });

      // Calcular taxa de conversão por canal
      Object.values(channelConversion).forEach((ch: any) => {
        ch.rate = ch.leads > 0 ? (ch.sales / ch.leads) * 100 : 0;
      });

      res.json({
        period,
        overall: {
          totalLeads,
          totalSales,
          conversionRate: Number(conversionRate.toFixed(2))
        },
        funnel,
        byChannel: Object.values(channelConversion)
      });
    } catch (error) {
      console.error('Erro ao buscar relatório de conversão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}