import { Router } from 'express';
import { unifiedAssignmentService } from '../../services/unifiedAssignmentService';
import { intelligentHandoffService } from '../../services/intelligentHandoffService';
import { assignmentCompatibilityService } from '../../services/assignmentCompatibilityService';
import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';

const router = Router();
const handoffService = new IntelligentHandoffService();

// GET /api/handoffs/stats - Estatísticas dos handoffs
router.get('/', async (req, res) => {
  try {
    const stats = await unifiedAssignmentService.getHandoffStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/stats/intelligent - Estatísticas do sistema inteligente
router.get('/intelligent', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await handoffService.getIntelligentHandoffStats(days);
    
    res.json({
      success: true,
      stats,
      period: `${days} dias`
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas inteligentes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export function registerHandoffStatsRoutes(app: Express) {
  app.get('/api/handoffs/stats', requirePermission('handoffs:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const stats = await assignmentCompatibilityService.getHandoffStats(days);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de handoffs:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas de handoffs' });
    }
  });
}

export default router; 