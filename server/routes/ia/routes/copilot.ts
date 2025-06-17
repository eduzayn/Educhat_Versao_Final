import { Router } from 'express';

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
    
    // Por enquanto, resposta simples até integrar com IA
    const copilotResponse = {
      message: `Olá! Sou a Prof. Ana, sua assistente inteligente. 

Analisando sua pergunta: "${message}"

Como assistente especializada, posso ajudar você com:

📚 **Informações sobre cursos**
- Detalhes de graduação, pós-graduação e cursos técnicos
- Requisitos de matrícula e documentação
- Cronogramas e modalidades

💼 **Processos internos**
- Como usar o EduChat de forma eficiente
- Melhores práticas de atendimento
- Procedimentos de vendas e suporte

🎯 **Políticas institucionais**
- Regulamentos acadêmicos
- Políticas de desconto e pagamento
- Procedimentos de certificação

Pode fazer sua pergunta específica que terei prazer em ajudar!`,
      classification: {
        intent: 'copilot_query',
        confidence: 0.9,
        sentiment: 'neutral',
        urgency: 'medium'
      }
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