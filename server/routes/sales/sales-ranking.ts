import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";

export function registerRankingRoutes(app: Express) {
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
} 