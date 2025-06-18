import type { Express, Request, Response } from "express";

export function registerAnalyticsRoutes(app: Express) {
  // Analytics routes will be registered here when needed
  console.log("Analytics routes registered");
  
  // Endpoints para monitoramento do round-robin equitativo
  app.get('/api/teams/:teamId/round-robin-stats', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { equitableRoundRobinService } = await import('../services/equitableRoundRobinService');
      
      const stats = await equitableRoundRobinService.getEquityStats(teamId);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao obter estatísticas round-robin:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/teams/:teamId/rebalance-distribution', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { equitableRoundRobinService } = await import('../services/equitableRoundRobinService');
      
      const result = await equitableRoundRobinService.rebalanceTeamDistribution(teamId);
      res.json(result);
    } catch (error) {
      console.error('Erro ao rebalancear distribuição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}