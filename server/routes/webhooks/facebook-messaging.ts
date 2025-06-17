import { Request, Response } from 'express';
import { storage } from "../../storage/index";
import { verifyFacebookSignature } from './facebook-verification';
import { processCommentEvent } from './facebook-comments';

/**
 * Processar entrada do webhook
 */
export async function processWebhookEntry(entry: any, integrationId: number) {
  try {
    console.log('🔄 Processando entrada Facebook:', {
      id: entry.id,
      hasMessaging: !!entry.messaging,
      hasChanges: !!entry.changes,
      time: entry.time
    });

    // Processar mensagens (Messenger/Instagram Direct)
    if (entry.messaging) {
      for (const messagingEvent of entry.messaging) {
        await processMessagingEvent(messagingEvent, integrationId, entry.id);
      }
    }

    // Processar mudanças (comentários, menções, etc.)
    if (entry.changes) {
      for (const change of entry.changes) {
        await processChangeEvent(change, integrationId, entry.id);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar entrada do webhook:', error);
  }
}

/**
 * Processar eventos de mensagem
 */
async function processMessagingEvent(messagingEvent: any, integrationId: number, pageId: string) {
  try {
    const { sender, recipient, message, timestamp } = messagingEvent;
    
    if (!message || !sender) {
      console.log('⚠️ Evento de mensagem incompleto, ignorando');
      return;
    }

    // Determinar plataforma baseada no recipient
    const platform = recipient?.id?.includes('instagram') ? 'instagram' : 'facebook';
    
    // Criar log do webhook
    const webhookLog = await storage.facebook.createWebhookLog({
      integrationId,
      webhookType: 'message',
      platform,
      senderId: sender.id,
      recipientId: recipient?.id,
      messageId: message.mid,
      content: message.text || '[Mídia]',
      messageType: message.attachments?.length > 0 ? 'media' : 'text',
      attachments: message.attachments || [],
      rawData: messagingEvent,
      processed: false
    });

    // Processar mensagem para criar contato e conversa
    const result = await storage.facebook.processFacebookMessage({
      platform,
      sender: {
        id: sender.id,
        name: sender.name || `User ${sender.id}`,
        profile_pic: sender.profile_pic
      },
      recipient,
      message,
      timestamp: new Date(timestamp)
    }, integrationId);

    // Marcar webhook como processado
    await storage.facebook.markWebhookProcessed(webhookLog.id, true);

    console.log(`✅ Mensagem ${platform} processada:`, {
      contactId: result.contactId,
      conversationId: result.conversationId,
      messageType: message.attachments?.length > 0 ? 'media' : 'text'
    });

  } catch (error) {
    console.error('❌ Erro ao processar evento de mensagem:', error);
  }
}

/**
 * Processar eventos de mudança (comentários, etc.)
 */
async function processChangeEvent(change: any, integrationId: number, pageId: string) {
  try {
    const { field, value } = change;
    
    console.log('📝 Processando mudança Facebook:', {
      field,
      hasValue: !!value,
      valueKeys: Object.keys(value || {})
    });

    if (field === 'feed' && value) {
      // Processar comentários em postagens
      if (value.item === 'comment') {
        await processCommentEvent(value, integrationId, pageId);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao processar evento de mudança:', error);
  }
}

/**
 * POST /api/webhooks/facebook - Receber webhooks
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    console.log('📨 Webhook Facebook recebido:', {
      hasSignature: !!signature,
      payloadSize: payload.length,
      entries: req.body.entry?.length || 0
    });

    // Buscar integração ativa
    const activeIntegration = await storage.facebook.getActiveIntegration();
    if (!activeIntegration) {
      console.log('⚠️ Nenhuma integração Facebook ativa encontrada');
      return res.status(200).json({ success: true, message: 'Nenhuma integração ativa' });
    }

    // Verificar assinatura se disponível
    if (signature && activeIntegration.appSecret) {
      const isValid = verifyFacebookSignature(payload, signature, activeIntegration.appSecret);
      if (!isValid) {
        console.log('❌ Assinatura do webhook Facebook inválida');
        return res.status(403).json({ error: 'Assinatura inválida' });
      }
    }

    // Processar cada entrada do webhook
    for (const entry of req.body.entry || []) {
      await processWebhookEntry(entry, activeIntegration.id);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 