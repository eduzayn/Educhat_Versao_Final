/**
 * Handlers otimizados para mensagens com UI otimista e fallback garantido
 * Implementa envio Socket-First com fallback REST automático
 */

import { Router } from 'express';
import { storage } from '../../storage';
import { insertMessageSchema } from '@shared/schema';
import { AuthenticatedRequest } from '../../core/permissions';
import { broadcast, broadcastToAll } from '../realtime/realtime-broadcast';

const router = Router();

/**
 * Endpoint otimizado para criação de mensagens com UI otimista
 * Prioriza velocidade sobre Z-API para melhor UX
 */
router.post('/api/conversations/:id/messages/optimized', async (req: AuthenticatedRequest, res) => {
  const startTime = performance.now();
  const conversationId = parseInt(req.params.id);
  const { optimisticId, skipZApi = false } = req.body;

  try {
    if (isNaN(conversationId)) {
      return res.status(400).json({ 
        error: 'ID da conversa inválido',
        optimisticId
      });
    }

    // ETAPA 1: Validação e preparação otimizada (sem buscar conversa completa)
    const parsedData = insertMessageSchema.parse({
      ...req.body,
      conversationId,
    });

    // ETAPA 2: Salvar mensagem no banco com prepared statement otimizado
    const message = await storage.message.createMessageOptimized(parsedData);

    // ETAPA 3: Broadcast imediato via Socket.IO (sem aguardar Z-API)
    const broadcastData = {
      type: 'new_message',
      conversationId,
      message,
      optimisticId,
      timestamp: new Date().toISOString()
    };

    // Broadcast para conversa específica e global em paralelo
    Promise.all([
      broadcast(conversationId, broadcastData),
      broadcastToAll(broadcastData)
    ]).catch(err => console.warn('Broadcast error:', err.message));

    const processTime = performance.now() - startTime;
    console.log(`⚡ Mensagem processada e enviada em ${processTime.toFixed(1)}ms`);

    // ETAPA 4: Resposta imediata para o frontend
    res.status(201).json({
      ...message,
      processTime: processTime.toFixed(1),
      optimisticId
    });

    // ETAPA 5: Z-API em background (não bloqueia resposta)
    if (!parsedData.isInternalNote && !skipZApi) {
      processZApiInBackground(conversationId, parsedData.content, message.id);
    }

  } catch (error) {
    const processTime = performance.now() - startTime;
    console.error(`❌ Erro ao processar mensagem (${processTime.toFixed(1)}ms):`, error);
    
    res.status(error.name === 'ZodError' ? 400 : 500).json({ 
      error: error.message,
      optimisticId,
      processTime: processTime.toFixed(1)
    });
  }
});

/**
 * Processa Z-API em background sem bloquear a resposta
 */
async function processZApiInBackground(conversationId: number, content: string, messageId: number) {
  try {
    // Buscar dados do contato apenas quando necessário para Z-API
    const conversation = await storage.conversation.getConversationWithContact(conversationId);
    
    if (conversation?.contact?.phone) {
      const zapiResponse = await fetch(`${process.env.WEBHOOK_URL || 'http://localhost:5000'}/api/zapi/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: conversation.contact.phone,
          message: content,
          conversationId, // CRÍTICO: Incluir conversationId para manter canal consistente
          messageId
        }),
        signal: AbortSignal.timeout(10000) // Timeout de 10s para Z-API
      });

      if (zapiResponse.ok) {
        const zapiData = await zapiResponse.json();
        // Atualizar status da mensagem com dados do WhatsApp
        await storage.message.updateMessageZApiStatus(messageId, {
          whatsappMessageId: zapiData.messageId,
          zapiStatus: 'SENT'
        });
        console.log(`📱 Z-API processado com sucesso para mensagem ${messageId}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Z-API falhou em background para mensagem ${messageId}:`, error.message);
    // Marcar mensagem com erro, mas não falhar o processo
    await storage.message.updateMessageZApiStatus(messageId, {
      zapiStatus: 'ERROR'
    }).catch(() => {}); // Ignorar erro da atualização
  }
}

/**
 * Endpoint para retry de mensagens com falha na Z-API
 */
router.post('/api/messages/:id/retry-zapi', async (req: AuthenticatedRequest, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const message = await storage.message.getMessage(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Reprocessar Z-API
    await processZApiInBackground(message.conversationId, message.content, messageId);
    
    res.json({ success: true, message: 'Reenvio iniciado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;