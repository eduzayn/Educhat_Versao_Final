import { Router } from 'express';
import { funnelService } from '../../../services/funnelService';

const router = Router();

// Get all funnels - REST: GET /api/funnels (rota pública)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Buscando todos os funis (rota pública)');
    const funnels = await funnelService.getAllFunnels();
    console.log(`✅ ${funnels.length} funis encontrados`);
    res.json(funnels);
  } catch (error) {
    console.error('Erro ao buscar funis:', error);
    res.status(500).json({ message: 'Erro ao buscar funis' });
  }
});

// Create missing funnels retroactively - REST: POST /api/funnels/create-missing
router.post('/create-missing', async (req, res) => {
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
router.post('/update-deals', async (req, res) => {
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

export default router; 