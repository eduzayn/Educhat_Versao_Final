import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";

export function registerChartsRoutes(app: Express) {
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
} 