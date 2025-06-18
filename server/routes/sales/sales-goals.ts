import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";

export function registerGoalsRoutes(app: Express) {
  // GET /api/sales/targets - Buscar metas de vendas
  app.get('/api/sales/targets', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = 'month', status = 'all' } = req.query;
      
      // Buscar usuários do sistema
      const users = await storage.userManagement.getSystemUsers();
      const salespeople = users.filter(user => 
        user.role === 'vendedor' || user.role === 'gerente'
      );

      // Simular metas para os vendedores (em produção viria do banco)
      const targets = salespeople.map((person, index) => ({
        id: index + 1,
        salespersonId: person.id,
        salespersonName: person.displayName || person.email,
        targetValue: 50000 + (index * 10000), // Meta base + variação
        currentValue: Math.floor((50000 + (index * 10000)) * (0.3 + Math.random() * 0.7)), // 30-100% da meta
        period: period as string,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        status: Math.random() > 0.7 ? 'completed' : 'active'
      }));

      // Filtrar por status se necessário
      const filteredTargets = status === 'all' ? targets : 
        targets.filter(target => target.status === status);

      // Calcular estatísticas
      const totalTargets = filteredTargets.length;
      const completedTargets = filteredTargets.filter(t => t.status === 'completed').length;
      const activeSalespeople = salespeople.length;
      const averageAchievement = filteredTargets.length > 0 
        ? filteredTargets.reduce((sum, t) => sum + (t.currentValue / t.targetValue), 0) / filteredTargets.length * 100
        : 0;

      res.json({
        targets: filteredTargets,
        totalTargets,
        completedTargets,
        activeSalespeople,
        averageAchievement: Math.round(averageAchievement)
      });
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/sales/salespeople - Buscar vendedores
  app.get('/api/sales/salespeople', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.userManagement.getSystemUsers();
      const salespeople = users
        .filter(user => user.role === 'vendedor' || user.role === 'gerente')
        .map(user => ({
          id: user.id,
          name: user.displayName || user.email,
          email: user.email,
          role: user.role
        }));

      res.json(salespeople);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/sales/targets - Criar nova meta
  app.post('/api/sales/targets', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salespersonId, targetValue, period, startDate, endDate } = req.body;
      
      // Validar dados obrigatórios
      if (!salespersonId || !targetValue || !period) {
        return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
      }

      // Buscar vendedor
      const users = await storage.userManagement.getSystemUsers();
      const salesperson = users.find(u => u.id === parseInt(salespersonId));
      
      if (!salesperson) {
        return res.status(404).json({ error: 'Vendedor não encontrado' });
      }

      // Em produção, salvaria no banco de dados
      const newTarget = {
        id: Date.now(),
        salespersonId: parseInt(salespersonId),
        salespersonName: salesperson.displayName || salesperson.email,
        targetValue: parseFloat(targetValue),
        currentValue: 0,
        period,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString()
      };

      res.json({
        success: true,
        target: newTarget
      });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // PUT /api/sales/targets/:id - Atualizar meta
  app.put('/api/sales/targets/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { salespersonId, targetValue, period, startDate, endDate } = req.body;
      
      // Em produção, atualizaria no banco de dados
      const updatedTarget = {
        id: parseInt(id),
        salespersonId: parseInt(salespersonId),
        targetValue: parseFloat(targetValue),
        period,
        startDate,
        endDate,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        target: updatedTarget
      });
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // DELETE /api/sales/targets/:id - Excluir meta
  app.delete('/api/sales/targets/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Em produção, excluiria do banco de dados
      res.json({
        success: true,
        message: 'Meta excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}