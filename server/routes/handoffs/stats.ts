import { Router } from 'express';
import { unifiedAssignmentService } from '../../../services/unifiedAssignmentService';
import { IntelligentHandoffService } from '../../../services/intelligentHandoffService';

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

export default router; 