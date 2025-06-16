import { Router } from 'express';
import { funnelService } from '../../../services/funnelService';
import { validateTeamType, validateTeamId } from '../middleware';

const router = Router();

// Get funnel by team type - REST: GET /api/funnels/team-type/:teamType
router.get('/team-type/:teamType', validateTeamType, async (req, res) => {
  try {
    const { teamType } = req.params;
    const funnel = await funnelService.getFunnelByTeamType(teamType);
    
    if (funnel) {
      res.json(funnel);
    } else {
      res.status(404).json({ message: `Nenhum funil encontrado para o tipo de equipe: ${teamType}` });
    }
  } catch (error) {
    console.error('Erro ao buscar funil por tipo de equipe:', error);
    res.status(500).json({ message: 'Erro ao buscar funil por tipo de equipe' });
  }
});

// Create funnel for specific team - REST: POST /api/funnels/team/:teamId
router.post('/team/:teamId', validateTeamId, async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const success = await funnelService.createFunnelForTeam(teamId);
    
    if (success) {
      res.json({
        success: true,
        message: `Funil criado com sucesso para equipe ${teamId}`
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Não foi possível criar funil para equipe ${teamId}. Equipe não encontrada ou funil já existe.`
      });
    }
  } catch (error) {
    console.error('Erro ao criar funil para equipe:', error);
    res.status(500).json({ message: 'Erro ao criar funil para equipe' });
  }
});

export default router; 