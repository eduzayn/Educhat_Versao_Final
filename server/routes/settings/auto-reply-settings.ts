/**
 * Configurações de Resposta Automática
 * Sistema para controlar mensagens automáticas indesejadas
 */

import { Router } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from '../../storage';

const router = Router();

interface AutoReplyConfig {
  enabled: boolean;
  welcomeMessage?: string;
  offlineMessage?: string;
  restrictCallsMessage?: string; // Esta pode ser a mensagem problemática
  triggerRules: {
    newConversation: boolean;
    offlineHours: boolean;
    callAttempts: boolean;
  };
}

// GET /api/settings/auto-reply - Buscar configurações atuais
router.get('/auto-reply', requirePermission('settings:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await storage.system.getSystemSettings();
    const autoReplyConfig = settings.autoReply || {
      enabled: false,
      triggerRules: {
        newConversation: false,
        offlineHours: false,
        callAttempts: false
      }
    };
    
    console.log(`📋 [AUTO-REPLY] Configurações carregadas:`, autoReplyConfig);
    
    res.json({
      success: true,
      config: autoReplyConfig
    });
  } catch (error) {
    console.error('❌ Erro ao buscar configurações de auto-reply:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/settings/auto-reply - Atualizar configurações
router.put('/auto-reply', requirePermission('settings:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const config: AutoReplyConfig = req.body;
    
    // Validar configuração
    if (typeof config.enabled !== 'boolean') {
      return res.status(400).json({ error: 'Campo "enabled" é obrigatório e deve ser boolean' });
    }
    
    await storage.system.updateSystemSettings({
      autoReply: config
    });
    
    console.log(`✅ [AUTO-REPLY] Configurações atualizadas por ${req.user?.username}:`, config);
    
    res.json({
      success: true,
      message: 'Configurações de resposta automática atualizadas com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de auto-reply:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/settings/auto-reply/disable-all - Desabilitar todas as respostas automáticas
router.post('/auto-reply/disable-all', requirePermission('settings:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const disabledConfig = {
      enabled: false,
      triggerRules: {
        newConversation: false,
        offlineHours: false,
        callAttempts: false
      }
    };
    
    await storage.system.updateSystemSettings({
      autoReply: disabledConfig
    });
    
    console.log(`🚫 [AUTO-REPLY] Todas as respostas automáticas foram DESABILITADAS por ${req.user?.username}`);
    
    res.json({
      success: true,
      message: 'Todas as respostas automáticas foram desabilitadas'
    });
  } catch (error) {
    console.error('❌ Erro ao desabilitar auto-reply:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;