import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../storage";

export function registerDashboardRoutes(app: Express) {
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
} 