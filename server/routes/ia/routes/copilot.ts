import { Router } from 'express';
import { aiService } from '../../../services/aiService';
import { IATestResponse } from '../types';

const router = Router();

/**
 * POST /api/ia/copilot - Endpoint específico para o Copilot da Prof. Ana
 */
router.post('/', async (req, res) => {
  try {
    const { message, userId, mode = 'copilot', context = 'copilot_internal' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    console.log('🎓 Copilot Prof. Ana - Processando mensagem:', message);
    console.log('👤 Usuário:', userId);
    
    // Usar o contexto específico do copilot para foco em conteúdo interno
    const classification = await aiService.classifyMessage(message, 0, 0, [], {
      mode: 'copilot',
      context: 'internal_knowledge',
      focus: 'courses_policies_procedures'
    });
    
    const response = await aiService.generateResponse(message, classification, 0, 0, {
      mode: 'copilot',
      systemRole: 'internal_assistant',
      context: 'prof_ana_copilot'
    });
    
    // Log para análise posterior
    console.log('📊 Resposta do Copilot gerada:', {
      confidence: classification.confidence,
      intent: classification.intent,
      responseLength: response.message?.length || 0
    });
    
    const copilotResponse: IATestResponse = {
      message: response.message,
      classification: response.classification
    };

    res.json(copilotResponse);
  } catch (error) {
    console.error('❌ Erro no Copilot Prof. Ana:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router;