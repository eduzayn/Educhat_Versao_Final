/**
 * Sistema de Webhooks Consolidado - EduChat
 * Arquivo principal que integra todos os handlers modulares
 * Reduzido de 1950 linhas para uma arquitetura modular organizada
 */

import type { Express } from "express";
import { storage } from "../../core/storage";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../utils/zapi";
import { webhookHealthMonitor, validateWebhookData } from "../../webhookHealthCheck";

// Importar handlers modulares
import { registerZApiMediaRoutes } from './handlers/zapi';
import { registerSocialWebhookRoutes } from './handlers/social';
import { registerIntegrationRoutes, assignTeamManually } from './handlers/integration';

/**
 * Processa webhook principal Z-API para mensagens recebidas
 */
async function processZApiWebhook(webhookData: any): Promise<{ success: boolean; type?: string; error?: string }> {
  const startTime = Date.now();
  
  try {
    console.log('📨 Webhook Z-API recebido (handler principal):', JSON.stringify(webhookData, null, 2));
    console.log('📊 Dados do webhook processados:', {
      type: webhookData?.type,
      phone: webhookData?.phone,
      hasText: !!(webhookData?.text && webhookData.text.message),
      hasImage: !!webhookData?.image,
      hasAudio: !!webhookData?.audio,
      timestamp: new Date().toISOString()
    });
    
    // Validação robusta dos dados recebidos
    if (!webhookData || typeof webhookData !== 'object') {
      throw new Error('Dados do webhook inválidos');
    }
    
    if (!webhookData.type) {
      throw new Error('Tipo do webhook não definido');
    }
    
    // Sanitização básica para evitar problemas de processamento
    if (webhookData.phone && typeof webhookData.phone === 'string') {
      webhookData.phone = webhookData.phone.replace(/\D/g, '');
    }
    
    if (webhookData.senderName && typeof webhookData.senderName === 'string') {
      webhookData.senderName = webhookData.senderName.trim();
    }
    
    // Verificar se é um callback de status (não precisa processar como mensagem)
    if (webhookData.type === 'MessageStatusCallback') {
      console.log(`📋 Status da mensagem atualizado: ${webhookData.status} para ${webhookData.phone}`);
      return { success: true, type: 'status_update' };
    }
    
    // Verificar callbacks de presença
    if (webhookData.type === 'PresenceChatCallback') {
      console.log(`👤 Status de presença: ${webhookData.status} para ${webhookData.phone}`);
      return { success: true, type: 'presence_update' };
    }
    
    // Verificar se é um callback de mensagem recebida
    if (webhookData.type === 'ReceivedCallback' && webhookData.phone) {
      const phone = webhookData.phone.replace(/\D/g, '');
      let messageContent = '';
      let messageType = 'text';
      let mediaUrl = null;
      let fileName = null;
      
      // Determinar o conteúdo da mensagem baseado no tipo
      if (webhookData.text && webhookData.text.message) {
        messageContent = webhookData.text.message;
        messageType = 'text';
      } else if (webhookData.image) {
        messageContent = `📷 ${webhookData.image.caption || 'Imagem'}`;
        messageType = 'image';
        mediaUrl = webhookData.image.imageUrl || webhookData.image.url;
        fileName = webhookData.image.fileName;
      } else if (webhookData.audio) {
        messageContent = `🎵 Áudio (${webhookData.audio.seconds || 0}s)`;
        messageType = 'audio';
        mediaUrl = webhookData.audio.audioUrl || webhookData.audio.url;
      } else if (webhookData.video) {
        messageContent = `🎥 ${webhookData.video.caption || 'Vídeo'}`;
        messageType = 'video';
        mediaUrl = webhookData.video.videoUrl || webhookData.video.url;
        fileName = webhookData.video.fileName;
      } else if (webhookData.document) {
        messageContent = `📄 ${webhookData.document.fileName || 'Documento'}`;
        messageType = 'document';
        mediaUrl = webhookData.document.documentUrl || webhookData.document.url;
        fileName = webhookData.document.fileName;
      } else {
        messageContent = '[Mensagem não suportada]';
        messageType = 'unknown';
      }
      
      // Buscar ou criar contato
      let contact = await storage.contacts.getContactByPhone(phone);
      if (!contact) {
        contact = await storage.createContact({
          phone: phone,
          name: webhookData.senderName || `WhatsApp ${phone}`,
          canalOrigem: 'whatsapp',
          userIdentity: phone
        });
      }
      
      // Buscar ou criar conversa
      let conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
      if (!conversation) {
        conversation = await storage.createConversation({
          contactId: contact.id,
          channel: 'whatsapp',
          status: 'open'
        });
      }
      
      // Criar mensagem
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content: messageContent,
        isFromContact: true,
        messageType: messageType,
        sentAt: new Date(),
        metadata: {
          zaapId: webhookData.messageId,
          instanceId: webhookData.instanceId,
          phone: phone,
          senderName: webhookData.senderName,
          mediaUrl: mediaUrl,
          fileName: fileName,
          originalContent: messageContent
        }
      });
      
      // Broadcast para WebSocket
      try {
        const { broadcast, broadcastToAll } = await import('../realtime');
        broadcast(conversation.id, {
          type: 'new_message',
          conversationId: conversation.id,
          message: message
        });
        
        broadcastToAll({
          type: 'new_message',
          conversationId: conversation.id,
          message: message
        });
      } catch (wsError) {
        console.error('❌ Erro no WebSocket broadcast:', wsError);
      }
      
      console.log(`📱 Mensagem processada para contato:`, contact.name);
      
      // Registrar sucesso no monitor de saúde
      const processingTime = Date.now() - startTime;
      webhookHealthMonitor.recordSuccess(processingTime);
      
      return { success: true, type: 'message_processed' };
    }
    
    // Tipo de webhook não reconhecido
    console.log(`⚠️ Tipo de webhook não processado: ${webhookData.type}`);
    return { success: true, type: 'unhandled' };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    console.error('❌ Erro ao processar webhook Z-API:', {
      error: errorMessage,
      webhookType: webhookData?.type,
      phone: webhookData?.phone,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Registrar erro no monitor de saúde
    webhookHealthMonitor.recordError(errorMessage, processingTime);
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Importa contatos do Z-API
 */
async function handleImportContacts(req: any, res: any) {
  try {
    console.log('📇 Iniciando importação de contatos Z-API');
    
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'contacts');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    let importedCount = 0;
    let skippedCount = 0;

    if (data && Array.isArray(data)) {
      for (const zapiContact of data) {
        try {
          const phone = zapiContact.id?.replace(/\D/g, '');
          if (!phone) continue;

          const existingContact = await storage.getContact(phone);
          if (existingContact) {
            skippedCount++;
            continue;
          }

          await storage.createContact({
            phone: phone,
            name: zapiContact.name || zapiContact.pushname || `WhatsApp ${phone}`,
            profileImageUrl: zapiContact.profilePicUrl,
            source: 'zapi_import'
          });
          
          importedCount++;
        } catch (contactError) {
          console.error('❌ Erro ao importar contato:', contactError);
        }
      }
    }

    console.log(`✅ Importação concluída: ${importedCount} importados, ${skippedCount} ignorados`);
    res.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erro na importação de contatos:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Obtém QR Code para conexão WhatsApp
 */
async function handleGetQRCode(req: any, res: any) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'qr-code');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.connected === true) {
      return res.json({ 
        connected: true, 
        message: 'WhatsApp já está conectado' 
      });
    }
    
    if (data.value) {
      return res.json({ 
        qrCode: data.value,
        connected: false 
      });
    }
    
    res.status(400).json({ 
      error: 'QR Code não disponível. Verifique as credenciais da Z-API.' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Obtém status da conexão Z-API
 */
async function handleGetStatus(req: any, res: any) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'status');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Registra todas as rotas de webhooks
 */
export function registerWebhookRoutes(app: Express) {
  // Webhook principal Z-API
  app.post('/api/zapi/webhook', async (req, res) => {
    const result = await processZApiWebhook(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  });
  
  // Rotas Z-API auxiliares
  app.post('/api/zapi/import-contacts', handleImportContacts);
  app.get('/api/zapi/qrcode', handleGetQRCode);
  app.get('/api/zapi/status', handleGetStatus);
  
  // QR Code para canal específico
  app.get('/api/channels/:id/qrcode', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channel = await storage.getChannel(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      const { instanceId, token, clientToken } = channel;
      
      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Canal não possui credenciais Z-API configuradas' 
        });
      }
      
      const url = buildZApiUrl(instanceId, token, 'qr-code');
      const response = await fetch(url, {
        method: 'GET',
        headers: getZApiHeaders(clientToken)
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.connected === true) {
        return res.json({ 
          connected: true, 
          message: 'WhatsApp já está conectado' 
        });
      }
      
      if (data.value) {
        return res.json({ 
          qrCode: data.value,
          connected: false 
        });
      }
      
      res.status(400).json({ 
        error: 'QR Code não disponível. Verifique as credenciais da Z-API.' 
      });
      
    } catch (error) {
      console.error(`❌ Erro ao obter QR Code do canal ${req.params.id}:`, error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
  
  // Registrar handlers modulares
  registerZApiMediaRoutes(app);
  registerSocialWebhookRoutes(app);
  registerIntegrationRoutes(app);
  
  console.log('✅ Sistema de webhooks consolidado registrado com sucesso');
}

// Exportar função auxiliar
export { assignTeamManually };