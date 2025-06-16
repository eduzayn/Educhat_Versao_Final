import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage";

export function registerProductsRoutes(app: Express) {
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

      // Análise por categoria/produto (baseado no teamType)
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
} 