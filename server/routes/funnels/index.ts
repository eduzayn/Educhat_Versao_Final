import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { funnelService } from '../../services/funnelService';

export function registerFunnelRoutes(app: Express) {
  
  // Get all funnels - REST: GET /api/funnels
  app.get('/api/funnels', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const funnels = await funnelService.getAllFunnels();
      res.json(funnels);
    } catch (error) {
      console.error('Erro ao buscar funis:', error);
      res.status(500).json({ message: 'Erro ao buscar funis' });
    }
  });

  // Get funnel by team type - REST: GET /api/funnels/team-type/:teamType (mantém rota antiga para compatibilidade)
  app.get('/api/funnels/macrosetor/:macrosetor', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { macrosetor } = req.params;
      const funnel = await funnelService.getFunnelByTeamType(macrosetor);
      
      if (funnel) {
        res.json(funnel);
      } else {
        res.status(404).json({ message: `Nenhum funil encontrado para o tipo de equipe: ${macrosetor}` });
      }
    } catch (error) {
      console.error('Erro ao buscar funil por tipo de equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar funil por tipo de equipe' });
    }
  });

  // Create missing funnels retroactively - REST: POST /api/funnels/create-missing
  app.post('/api/funnels/create-missing', requirePermission('deals:create'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔧 Iniciando criação retroativa de funis...');
      const result = await funnelService.createMissingFunnels();
      
      res.json({
        success: true,
        message: `${result.created} funis criados com sucesso`,
        details: result.details
      });
    } catch (error) {
      console.error('Erro na criação retroativa de funis:', error);
      res.status(500).json({ message: 'Erro na criação retroativa de funis' });
    }
  });

  // Update deals to correct funnels - REST: POST /api/funnels/update-deals
  app.post('/api/funnels/update-deals', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔄 Iniciando atualização de deals para funis corretos...');
      const result = await funnelService.updateDealsToCorrectFunnels();
      
      res.json({
        success: true,
        message: `${result.updated} deals atualizados com sucesso`,
        details: result.details
      });
    } catch (error) {
      console.error('Erro na atualização de deals:', error);
      res.status(500).json({ message: 'Erro na atualização de deals' });
    }
  });

  // Get initial stage for team type - REST: GET /api/funnels/initial-stage/:teamType (mantém rota antiga para compatibilidade)
  app.get('/api/funnels/initial-stage/:macrosetor', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { macrosetor } = req.params;
      const initialStage = await funnelService.getInitialStageForTeamType(macrosetor);
      
      res.json({ teamType: macrosetor, initialStage });
    } catch (error) {
      console.error('Erro ao buscar estágio inicial:', error);
      res.status(500).json({ message: 'Erro ao buscar estágio inicial' });
    }
  });

  // Create funnel for specific team - REST: POST /api/funnels/team/:teamId
  app.post('/api/funnels/team/:teamId', requirePermission('deals:create'), async (req: AuthenticatedRequest, res: Response) => {
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
}