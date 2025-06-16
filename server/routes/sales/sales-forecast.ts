import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage";

export function registerForecastRoutes(app: Express) {
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
} 