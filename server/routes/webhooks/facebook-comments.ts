import { storage } from "../../storage";

/**
 * Processar comentários
 */
export async function processCommentEvent(commentData: any, integrationId: number, pageId: string) {
  try {
    const { comment_id, from, message, created_time, post_id } = commentData;
    
    if (!from || !message) {
      console.log('⚠️ Dados de comentário incompletos, ignorando');
      return;
    }

    // Criar log do webhook
    const webhookLog = await storage.facebook.createWebhookLog({
      integrationId,
      webhookType: 'comment',
      platform: 'facebook',
      senderId: from.id,
      messageId: comment_id,
      conversationId: post_id,
      content: message,
      messageType: 'text',
      rawData: commentData,
      processed: false
    });

    // Processar comentário como mensagem
    const result = await storage.facebook.processFacebookMessage({
      platform: 'facebook',
      sender: {
        id: from.id,
        name: from.name || `User ${from.id}`
      },
      message: {
        text: `💬 Comentário: ${message}`,
        mid: comment_id
      },
      timestamp: new Date(created_time),
      threadId: post_id,
      isComment: true
    }, integrationId);

    // Marcar webhook como processado
    await storage.facebook.markWebhookProcessed(webhookLog.id, true);

    console.log('✅ Comentário Facebook processado:', {
      contactId: result.contactId,
      conversationId: result.conversationId,
      commentId: comment_id
    });

  } catch (error) {
    console.error('❌ Erro ao processar comentário:', error);
  }
} 