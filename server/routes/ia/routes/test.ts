import { Router } from 'express';
import { aiService } from '../../../services/aiService';
import { IATestResponse } from '../types';

const router = Router();

/**
 * POST /api/ia/test - Testar a IA
 */
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    console.log('🧪 Testando IA com mensagem:', message);
    
    const classification = await aiService.classifyMessage(message, 0, 0, []);
    const response = await aiService.generateResponse(message, classification, 0, 0);
    
    const testResponse: IATestResponse = {
      message: response.message,
      classification: response.classification
    };

    res.json(testResponse);
  } catch (error) {
    console.error('❌ Erro no teste da IA:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router; 