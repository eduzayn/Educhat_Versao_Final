/**
 * Webhooks específicos para conversas - Integração com Gamificação
 * Garante que todas as ações de conversa atualizem as estatísticas em tempo real
 */

import { Router } from 'express';
import { gamificationWebhook } from '../../services/gamificationWebhookIntegration';
import { db } from '../../db';
import { conversations } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/conversations/webhook/assigned
 * Webhook interno para quando uma conversa é atribuída
 */
router.post('/webhook/assigned', async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ 
        error: 'conversationId e userId são obrigatórios' 
      });
    }

    // Verificar se a conversa existe
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return res.status(404).json({ 
        error: 'Conversa não encontrada' 
      });
    }

    // Atualizar gamificação
    await gamificationWebhook.onConversationAssigned(userId, conversationId);

    console.log(`🎮 Webhook de atribuição processado: usuário ${userId}, conversa ${conversationId}`);

    res.json({
      success: true,
      message: 'Gamificação atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no webhook de atribuição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/conversations/webhook/closed
 * Webhook interno para quando uma conversa é fechada
 */
router.post('/webhook/closed', async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ 
        error: 'conversationId e userId são obrigatórios' 
      });
    }

    // Atualizar gamificação
    await gamificationWebhook.onConversationClosed(userId, conversationId);

    console.log(`🎮 Webhook de fechamento processado: usuário ${userId}, conversa ${conversationId}`);

    res.json({
      success: true,
      message: 'Gamificação atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no webhook de fechamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/conversations/webhook/message-sent
 * Webhook interno para quando uma mensagem é enviada
 */
router.post('/webhook/message-sent', async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ 
        error: 'conversationId e userId são obrigatórios' 
      });
    }

    // Atualizar gamificação (apenas estatísticas diárias para performance)
    await gamificationWebhook.onMessageSent(userId, conversationId);

    res.json({
      success: true,
      message: 'Gamificação atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no webhook de mensagem:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;