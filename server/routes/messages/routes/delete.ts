import { Router } from 'express';
import { storage } from '../../../storage';
import { AuthenticatedRequest } from '../../../core/permissions';

const router = Router();

// Soft Delete (Mensagens Recebidas)
router.post('/api/messages/soft-delete', async (req: AuthenticatedRequest, res) => {
  const startTime = Date.now();
  try {
    const { messageId, conversationId } = req.body;
    const userId = req.user?.id || 35;
    if (!messageId || isNaN(parseInt(messageId))) {
      return res.status(400).json({ error: 'messageId é obrigatório e deve ser um número válido' });
    }
    if (!conversationId || isNaN(parseInt(conversationId))) {
      return res.status(400).json({ error: 'conversationId é obrigatório e deve ser um número válido' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const parsedMessageId = parseInt(messageId);
    const message = await storage.getMessage(parsedMessageId);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    if (!message.isFromContact) {
      return res.status(400).json({ error: 'Esta operação é apenas para mensagens recebidas' });
    }
    const messageTime = new Date(message.sentAt || new Date());
    const now = new Date();
    const timeDifference = now.getTime() - messageTime.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000;
    if (timeDifference > sevenMinutesInMs) {
      return res.status(400).json({ 
        error: 'Mensagem não pode ser deletada após 7 minutos do envio',
        timeDifference: Math.round(timeDifference / 1000 / 60),
        maxMinutes: 7
      });
    }
    const success = await storage.markMessageAsDeletedByUser(parsedMessageId, true, Number(userId));
    const updatedMessage = await storage.getMessage(parsedMessageId);
    const { broadcast } = await import('../../realtime');
    broadcast(message.conversationId, {
      type: 'message_updated',
      conversationId: message.conversationId,
      message: updatedMessage,
      deletedAt: new Date().toISOString(),
      deletedForEveryone: false
    });
    if (success) {
      const duration = Date.now() - startTime;
      res.json({ 
        success: true, 
        message: 'Mensagem removida da sua interface',
        type: 'soft_delete',
        deletedForEveryone: false,
        processingTime: `${duration}ms`
      });
    } else {
      res.status(500).json({ error: 'Erro ao deletar mensagem' });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar mensagem enviada (localmente + Z-API)
router.patch('/api/messages/:id/delete-sent', async (req, res) => {
  const startTime = Date.now();
  try {
    const messageId = parseInt(req.params.id);
    const { zapiMessageId, phone } = req.body;
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'ID da mensagem inválido' });
    }
    const message = await storage.getMessage(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    if (message.isFromContact) {
      return res.status(400).json({ error: 'Esta operação é apenas para mensagens enviadas' });
    }
    const messageTime = new Date(message.sentAt || new Date());
    const now = new Date();
    const timeDifference = now.getTime() - messageTime.getTime();
    const sevenMinutesInMs = 7 * 60 * 1000;
    if (timeDifference > sevenMinutesInMs) {
      return res.status(400).json({ 
        error: 'Mensagem não pode ser deletada após 7 minutos do envio',
        timeDifference: Math.round(timeDifference / 1000 / 60),
        maxMinutes: 7
      });
    }
    let zapiDeletionSuccess = false;
    
    // Tentar obter zapiMessageId dos metadados se não foi fornecido
    let finalZapiMessageId = zapiMessageId;
    if (!finalZapiMessageId && message.metadata) {
      const metadata = message.metadata as any;
      finalZapiMessageId = metadata.zaapId || metadata.messageId || metadata.id;
    }
    
    if (finalZapiMessageId && phone) {
      try {
        const { validateZApiCredentials } = await import('../../../utils/zapi');
        const credentials = validateZApiCredentials();
        if (!credentials.valid) {
          throw new Error(credentials.error);
        }
        const { instanceId, token, clientToken } = credentials;
        const cleanPhone = phone.replace(/\D/g, '');
        const deleteUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages?phone=${cleanPhone}&messageId=${finalZapiMessageId}&owner=true`;
        
        console.log(`🗑️ Tentando deletar mensagem via Z-API: ${finalZapiMessageId}`);
        
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Client-Token': clientToken || ''
          }
        });
        const responseText = await deleteResponse.text();
        let deleteResult;
        try {
          deleteResult = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          deleteResult = { rawResponse: responseText };
        }
        if (deleteResponse.ok) {
          console.log(`✅ Mensagem deletada via Z-API: ${finalZapiMessageId}`);
          zapiDeletionSuccess = true;
        } else {
          console.warn(`⚠️ Falha ao deletar via Z-API: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Erro ao deletar via Z-API:', error);
      }
    } else {
      console.warn('⚠️ Mensagem não possui ID Z-API ou telefone para deleção via WhatsApp');
    }
    const success = await storage.markMessageAsDeletedByUser(messageId, true);
    if (!success) {
      return res.status(500).json({ error: 'Erro ao deletar mensagem no banco' });
    }
    const { broadcast } = await import('../../realtime');
    broadcast(message.conversationId, {
      type: 'message_deleted',
      conversationId: message.conversationId,
      messageId: messageId,
      deletedAt: new Date().toISOString(),
      deletedForEveryone: zapiDeletionSuccess
    });
    const duration = Date.now() - startTime;
    res.json({ 
      success: true, 
      message: zapiDeletionSuccess 
        ? 'Mensagem deletada para ambos os usuários' 
        : 'Mensagem removida da sua interface',
      localDeletion: true,
      zapiDeletion: zapiDeletionSuccess,
      deletedForEveryone: zapiDeletionSuccess,
      processingTime: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 