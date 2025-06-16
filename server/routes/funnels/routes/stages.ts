import { Router } from 'express';
import { funnelService } from '../../../services/funnelService';
import { validateTeamType } from '../middleware';
import { requirePermission } from '../../../core/permissions';
import { AuthenticatedRequest } from '../../../core/permissions';

const router = Router();

// Get initial stage for team type - REST: GET /api/funnels/initial-stage/:teamType
router.get('/initial-stage/:teamType', requirePermission('deals:read'), validateTeamType, async (req: AuthenticatedRequest, res) => {
  try {
    const { teamType } = req.params;
    const initialStage = await funnelService.getInitialStageForTeamType(teamType);
    
    res.json({ teamType, initialStage });
  } catch (error) {
    console.error('Erro ao buscar estágio inicial:', error);
    res.status(500).json({ message: 'Erro ao buscar estágio inicial' });
  }
});

export default router;

 