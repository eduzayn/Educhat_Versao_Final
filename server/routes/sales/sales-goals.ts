import { Express } from 'express';

export function registerGoalsRoutes(app: Express) {
  // GET /api/sales/goals - Buscar metas de vendas
  app.get('/api/sales/goals', async (req, res) => {
    try {
      res.json({
        success: true,
        goals: []
      });
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/sales/goals - Criar nova meta
  app.post('/api/sales/goals', async (req, res) => {
    try {
      res.json({
        success: true,
        goal: { id: 1, ...req.body }
      });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}