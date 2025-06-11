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
      let contact = await storage.getContact(phone);
      if (!contact) {
        contact = await storage.createContact({
          phone: phone,
          name: webhookData.senderName || `WhatsApp ${phone}`,
          source: 'whatsapp'
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
      const channel = await storage.channels.getChannel(channelId);
      
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


      
      if (!phone || !req.file) {
        return res.status(400).json({ 
          error: 'Phone e arquivo de imagem são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Converter arquivo para base64 com prefixo data URL conforme documentação Z-API
      const imageBase64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;
      
      const payload = {
        phone: cleanPhone,
        image: dataUrl,
        caption: caption
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-image`;
      console.log('🖼️ Enviando imagem para Z-API:', { 
        url: url.replace(token, '****'), 
        phone: cleanPhone,
        imageSize: imageBase64.length,
        mimeType: req.file.mimetype,
        hasCaption: !!caption
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API (imagem):', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200) + '...'
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API (imagem):', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON (imagem):', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Imagem enviada com sucesso via Z-API:', data);
      
      // Salvar mensagem no banco de dados se conversationId foi fornecido
      if (conversationId) {
        try {
          const messageContent = caption ? `📷 ${caption}` : '📷 Imagem';
          
          await storage.createMessage({
            conversationId: parseInt(conversationId),
            content: dataUrl, // Salvar a imagem em base64 para exibição
            isFromContact: false,
            messageType: 'image',
            sentAt: new Date(),
            metadata: {
              zaapId: data.messageId || data.id,
              imageSent: true,
              fileName: req.file.originalname,
              fileSize: req.file.size,
              mimeType: req.file.mimetype,
              caption: caption
            }
          });

          // Broadcast para WebSocket
          const { broadcast } = await import('../realtime');
          broadcast(parseInt(conversationId), {
            type: 'message_sent',
            conversationId: parseInt(conversationId)
          });
        } catch (dbError) {
          console.error('❌ Erro ao salvar mensagem de imagem no banco:', dbError);
        }
      }

      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao enviar imagem via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
  
  // Send audio via Z-API - REST: POST /api/zapi/send-audio
  app.post('/api/zapi/send-audio', uploadAudio.single('audio'), async (req, res) => {
    try {
      console.log('🎵 Recebendo solicitação de envio de áudio:', {
        hasPhone: !!req.body.phone,
        hasFile: !!req.file,
        contentType: req.headers['content-type']
      });
      
      const phone = req.body.phone;
      const conversationId = req.body.conversationId;
      const duration = req.body.duration;
      
      if (!phone || !req.file) {
        return res.status(400).json({ 
          error: 'Phone e arquivo de áudio são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Converter arquivo para base64 com prefixo data URL conforme documentação Z-API
      const audioBase64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${audioBase64}`;
      
      const payload = {
        phone: cleanPhone,
        audio: dataUrl
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-audio`;
      console.log('🎵 Enviando áudio para Z-API:', { 
        url: url.replace(token, '****'), 
        phone: cleanPhone,
        audioSize: audioBase64.length,
        mimeType: req.file.mimetype
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API (áudio):', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200) + '...'
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API (áudio):', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON (áudio):', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Áudio enviado com sucesso via Z-API:', data);
      
      // Salvar mensagem no banco de dados se conversationId foi fornecido
      if (conversationId) {
        try {
          await storage.createMessage({
            conversationId: parseInt(conversationId),
            content: dataUrl, // Salvar o áudio base64 completo para reprodução
            isFromContact: false,
            messageType: 'audio',
            sentAt: new Date(),
            metadata: {
              zaapId: data.messageId || data.id,
              audioSent: true,
              duration: duration ? parseFloat(duration) : 0,
              mimeType: req.file.mimetype,
              originalContent: `Áudio (${duration ? Math.floor(parseFloat(duration)) + 's' : 'duração desconhecida'})`
            }
          });

          // Broadcast para WebSocket
          const { broadcast } = await import('../realtime');
          broadcast(parseInt(conversationId), {
            type: 'message_sent',
            conversationId: parseInt(conversationId)
          });
        } catch (dbError) {
          console.error('❌ Erro ao salvar mensagem de áudio no banco:', dbError);
        }
      }

      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao enviar áudio via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
  
  // Import Z-API contacts - REST: POST /api/zapi/import-contacts
  app.post('/api/zapi/import-contacts', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      let allContacts: any[] = [];
      let page = 1;
      const pageSize = 50;
      let hasMorePages = true;

      while (hasMorePages && allContacts.length < 1000) {
        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts?page=${page}&pageSize=${pageSize}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Client-Token': clientToken || '',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
        }

        const pageData = await response.json();
        
        if (Array.isArray(pageData) && pageData.length > 0) {
          allContacts.push(...pageData);
          page++;
          if (pageData.length < pageSize) {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }
      }

      console.log(`Total de contatos encontrados na Z-API: ${allContacts.length}`);
      
      let importedCount = 0;
      let updatedCount = 0;
      
      for (const zapiContact of allContacts) {
        try {
          const phone = zapiContact.phone || zapiContact.id;
          if (!phone) continue;

          const existingContacts = await storage.searchContacts(phone);
          
          const contactData = {
            name: zapiContact.name || zapiContact.short || zapiContact.notify || zapiContact.vname || phone,
            phone: phone,
            email: null,
            profileImageUrl: zapiContact.profilePic || null,
            canalOrigem: 'whatsapp',
            nomeCanal: 'WhatsApp Comercial',
            idCanal: 'whatsapp-1',
            userIdentity: phone
          };

          if (existingContacts.length === 0) {
            await storage.createContact(contactData);
            importedCount++;
          } else {
            const existingContact = existingContacts[0];
            const updatedData: any = {};
            
            if (!existingContact.profileImageUrl && contactData.profileImageUrl) {
              updatedData.profileImageUrl = contactData.profileImageUrl;
            }
            
            if (!existingContact.canalOrigem) {
              updatedData.canalOrigem = contactData.canalOrigem;
              updatedData.nomeCanal = contactData.nomeCanal;
              updatedData.idCanal = contactData.idCanal;
              updatedData.userIdentity = contactData.userIdentity;
            }

            if (Object.keys(updatedData).length > 0) {
              await storage.updateContact(existingContact.id, updatedData);
              updatedCount++;
            }
          }
        } catch (contactError) {
          console.error('Erro ao processar contato:', contactError);
        }
      }

      res.json({
        message: `Importação concluída: ${importedCount} novos contatos, ${updatedCount} atualizados`,
        imported: importedCount,
        updated: updatedCount,
        total: allContacts.length
      });
      
    } catch (error) {
      console.error('Erro ao importar contatos:', error);
      res.status(500).json({ error: 'Erro interno ao importar contatos' });
    }
  });

  // Update all profile pictures - REST: POST /api/zapi/update-all-profile-pictures
  app.post('/api/zapi/update-all-profile-pictures', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      
      const allContacts = await storage.searchContacts('');
      const contactsWithPhone = allContacts.filter(contact => contact.phone);
      
      console.log(`Encontrados ${contactsWithPhone.length} contatos com telefone para atualizar fotos`);
      
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const contact of contactsWithPhone) {
        try {
          const cleanPhone = contact.phone!.replace(/\D/g, '');
          
          const profileUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-picture?phone=${cleanPhone}`;
          const profileResponse = await fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Client-Token': clientToken || '',
              'Content-Type': 'application/json'
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            
            if (profileData.link && profileData.link !== contact.profileImageUrl) {
              await storage.updateContact(contact.id, {
                profileImageUrl: profileData.link
              });
              updatedCount++;
              console.log(`Foto atualizada para ${contact.name} (${cleanPhone})`);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (contactError) {
          console.error(`Erro ao atualizar foto do contato ${contact.name}:`, contactError);
          errorCount++;
        }
      }

      res.json({
        message: `Atualização concluída: ${updatedCount} fotos atualizadas`,
        updated: updatedCount,
        errors: errorCount,
        total: contactsWithPhone.length
      });
      
    } catch (error) {
      console.error('Erro ao atualizar fotos de perfil:', error);
      res.status(500).json({ 
        error: 'Erro interno ao atualizar fotos de perfil' 
      });
    }
  });

  // Sync messages from Z-API - REST: POST /api/zapi/sync-messages
  app.post('/api/zapi/sync-messages', async (req, res) => {
    try {
      console.log('🔄 Iniciando sincronização de mensagens...');
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const { since, phone } = req.body;
      
      const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);
      
      console.log(`📅 Sincronizando mensagens desde: ${sinceDate.toISOString()}`);
      
      const chatsUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
      
      console.log('🔍 Buscando chats ativos na Z-API...');
      
      const chatsResponse = await fetch(chatsUrl, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!chatsResponse.ok) {
        throw new Error(`Erro na API Z-API: ${chatsResponse.status} - ${chatsResponse.statusText}`);
      }

      const chatsData = await chatsResponse.json();
      const chats = chatsData || [];
      
      console.log(`💬 ${chats.length} chats encontrados na Z-API`);
      
      let processedCount = 0;
      let errorCount = 0;
      const results = [];
      
      for (const chat of chats.slice(0, 20)) {
        try {
          const chatPhone = chat.phone || chat.id;
          if (!chatPhone) continue;
          
          const cleanPhone = chatPhone.replace(/\D/g, '');
          
          const existingContacts = await storage.searchContacts(cleanPhone);
          const contact = existingContacts.find(c => c.phone?.replace(/\D/g, '') === cleanPhone);
          
          if (contact) {
            const conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
            
            if (conversation) {
              const recentMessages = await storage.getMessages(conversation.id, 10);
              
              results.push({
                phone: cleanPhone,
                contactName: contact.name,
                status: 'verified',
                conversationExists: true,
                messageCount: recentMessages.length,
                lastMessageAt: conversation.lastMessageAt?.toISOString()
              });
              
              processedCount++;
            } else {
              results.push({
                phone: cleanPhone,
                contactName: contact.name,
                status: 'no_conversation',
                conversationExists: false
              });
            }
          } else {
            results.push({
              phone: cleanPhone,
              contactName: chat.name || cleanPhone,
              status: 'not_in_system',
              conversationExists: false
            });
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar chat ${chat.phone || chat.id}:`, error);
          errorCount++;
          
          results.push({
            phone: chat.phone || chat.id,
            contactName: chat.name || 'Desconhecido',
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
      
      console.log(`✅ Sincronização concluída: ${processedCount} processadas, ${errorCount} erros`);
      
      res.json({
        success: true,
        summary: {
          totalFound: results.length,
          processed: processedCount,
          errors: errorCount,
          since: sinceDate.toISOString()
        },
        results
      });
      
    } catch (error) {
      console.error('💥 Erro na sincronização:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  });

  // Instagram webhook endpoint for omnichannel integration
  app.post('/api/instagram/webhook', async (req, res) => {
    try {
      console.log('📸 Webhook Instagram recebido:', JSON.stringify(req.body, null, 2));
      
      const webhookData = req.body;
      
      // Processar mensagens do Instagram
      if (webhookData.object === 'instagram' && webhookData.entry) {
        for (const entry of webhookData.entry) {
          if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
              if (messagingEvent.message) {
                await processInstagramMessage(messagingEvent);
              }
            }
          }
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook Instagram:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Email webhook endpoint for omnichannel integration
  app.post('/api/email/webhook', async (req, res) => {
    try {
      console.log('📧 Webhook Email recebido:', JSON.stringify(req.body, null, 2));
      
      const emailData = req.body;
      
      // Processar email recebido
      if (emailData.from && emailData.subject && emailData.text) {
        await processEmailMessage(emailData);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook Email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // SMS webhook endpoint for omnichannel integration  
  app.post('/api/sms/webhook', async (req, res) => {
    try {
      console.log('📱 Webhook SMS recebido:', JSON.stringify(req.body, null, 2));
      
      const smsData = req.body;
      
      // Processar SMS recebido
      if (smsData.from && smsData.body) {
        await processSMSMessage(smsData);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook SMS:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Manychat webhook endpoint for omnichannel integration
  app.post('/api/integrations/manychat/webhook', async (req, res) => {
    try {
      console.log('🤖 Webhook Manychat recebido:', JSON.stringify(req.body, null, 2));
      
      const webhookData = req.body;
      
      // Log webhook no banco de dados
      try {
        await storage.manychat.logWebhook({
          webhookType: webhookData.type || 'message',
          payload: webhookData,
          processed: false
        });
      } catch (logError) {
        console.error('❌ Erro ao salvar log do webhook:', logError);
      }
      
      // Processar diferentes tipos de evento do Manychat
      if (webhookData.user && (webhookData.text || webhookData.message)) {
        await processManychatMessage(webhookData);
      } else if (webhookData.type === 'subscriber_added') {
        await processManychatSubscriberAdded(webhookData);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook Manychat:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Test webhook endpoints
  app.post('/api/test-webhook', async (req, res) => {
    try {
      console.log('🧪 Teste manual do webhook - forçando broadcast');
      
      const { broadcastToAll } = await import('../realtime');
      
      // Forçar broadcast de uma mensagem de teste
      broadcastToAll({
        type: 'new_message',
        conversationId: 305,
        message: {
          id: Date.now(),
          conversationId: 305,
          content: 'Mensagem de teste via webhook manual',
          isFromContact: true,
          messageType: 'text',
          sentAt: new Date(),
          metadata: null,
          deliveredAt: null,
          readAt: null
        }
      });
      
      res.json({ success: true, message: 'Broadcast enviado' });
    } catch (error) {
      console.error('Erro no teste do webhook:', error);
      res.status(500).json({ error: 'Erro no teste' });
    }
  });

  // Sistema de teste de macrosetor removido
}

// Process Instagram message function
async function processInstagramMessage(messagingEvent: any) {
  try {
    const senderId = messagingEvent.sender.id;
    const messageText = messagingEvent.message.text || 'Mensagem do Instagram';
    
    const canalOrigem = 'instagram';
    const nomeCanal = 'Instagram Direct';
    const idCanal = `instagram-${senderId}`;
    const userIdentity = senderId;

    const contact = await storage.findOrCreateContact(userIdentity, {
      name: `Instagram User ${senderId}`,
      phone: null,
      email: null,
      isOnline: true,
      profileImageUrl: null,
      canalOrigem: canalOrigem,
      nomeCanal: nomeCanal,
      idCanal: idCanal
    });

    await storage.updateContactOnlineStatus(contact.id, true);

    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'instagram');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'instagram',
        status: 'open',
        lastMessageAt: new Date()
      });
    }

    const message = await storage.createMessage({
      conversationId: conversation.id,
      content: messageText,
      isFromContact: true,
      messageType: 'text',
      sentAt: new Date(),
      metadata: messagingEvent
    });

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

    // Análise de handoff removida - usaremos apenas o sistema do webhook Z-API

    // Criação automática de deals removida - apenas processar mensagem
    console.log(`📝 Mensagem Instagram processada para contato:`, contact.name);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem do Instagram:', error);
  }
}

// Process Email message function
async function processEmailMessage(emailData: any) {
  try {
    const senderEmail = emailData.from;
    const subject = emailData.subject || 'Email sem assunto';
    const messageText = emailData.text || emailData.html || 'Email vazio';
    
    const canalOrigem = 'email';
    const nomeCanal = 'Email';
    const idCanal = `email-${senderEmail}`;
    const userIdentity = senderEmail;

    const contact = await storage.findOrCreateContact(userIdentity, {
      name: emailData.senderName || senderEmail,
      phone: null,
      email: senderEmail,
      isOnline: false,
      profileImageUrl: null,
      canalOrigem: canalOrigem,
      nomeCanal: nomeCanal,
      idCanal: idCanal
    });

    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'email');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'email',
        status: 'open',
        lastMessageAt: new Date()
      });
    }

    const message = await storage.createMessage({
      conversationId: conversation.id,
      content: `${subject}\n\n${messageText}`,
      isFromContact: true,
      messageType: 'email',
      sentAt: new Date(),
      metadata: emailData
    });

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

    // Análise de handoff removida - usaremos apenas o sistema do webhook Z-API

    // Criação automática de deals removida - apenas processar mensagem
    console.log(`📧 Mensagem Email processada para contato:`, contact.name);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem de Email:', error);
  }
}

// Process SMS message function
async function processSMSMessage(smsData: any) {
  try {
    const senderPhone = smsData.from;
    const messageText = smsData.body || 'SMS vazio';
    
    const canalOrigem = 'sms';
    const nomeCanal = 'SMS';
    const idCanal = `sms-${senderPhone}`;
    const userIdentity = senderPhone;

    const contact = await storage.findOrCreateContact(userIdentity, {
      name: `SMS ${senderPhone}`,
      phone: senderPhone,
      email: null,
      isOnline: false,
      profileImageUrl: null,
      canalOrigem: canalOrigem,
      nomeCanal: nomeCanal,
      idCanal: idCanal
    });

    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'sms');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'sms',
        status: 'open',
        lastMessageAt: new Date()
      });
    }

    const message = await storage.createMessage({
      conversationId: conversation.id,
      content: messageText,
      isFromContact: true,
      messageType: 'text',
      sentAt: new Date(),
      metadata: smsData
    });

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

    // Análise de handoff removida - usaremos apenas o sistema do webhook Z-API

    // Criação automática de deals removida - apenas processar mensagem
    console.log(`📱 Mensagem SMS processada para contato:`, contact.name);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem de SMS:', error);
  }
}

// Additional Z-API endpoints
export function registerZApiRoutes(app: Express) {
  
  // Get QR Code for WhatsApp connection - REST: GET /api/zapi/qrcode
  app.get('/api/zapi/qrcode', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verificar se já está conectado
      if (data.connected === true) {
        return res.json({ 
          connected: true, 
          message: 'WhatsApp já está conectado' 
        });
      }
      
      // Retornar QR Code se disponível
      if (data.value) {
        return res.json({ 
          qrCode: data.value,
          connected: false 
        });
      }
      
      // Se não há QR Code nem conexão
      res.status(400).json({ 
        error: 'QR Code não disponível. Verifique as credenciais da Z-API.' 
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get QR Code for specific channel - REST: GET /api/channels/:id/qrcode
  app.get('/api/channels/:id/qrcode', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      
      // Buscar canal específico no banco
      const channel = await storage.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      // Usar credenciais do canal específico
      const { instanceId, token, clientToken } = channel;
      
      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Canal não possui credenciais Z-API configuradas' 
        });
      }
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verificar se já está conectado
      if (data.connected === true) {
        return res.json({ 
          connected: true, 
          message: 'WhatsApp já está conectado' 
        });
      }
      
      // Retornar QR Code se disponível
      if (data.value) {
        return res.json({ 
          qrCode: data.value,
          connected: false 
        });
      }
      
      // Se não há QR Code nem conexão
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
  
  // Main Z-API webhook endpoint for receiving messages - REST: POST /api/zapi/webhook
  app.post('/api/zapi/webhook', async (req, res) => {
    const webhookData = req.body;
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
        console.error('❌ Webhook inválido: dados não são um objeto');
        return res.status(400).json({ 
          error: 'Dados do webhook inválidos',
          success: false 
        });
      }
      
      if (!webhookData.type) {
        console.error('❌ Webhook sem tipo definido');
        return res.status(400).json({ 
          error: 'Tipo do webhook não definido',
          success: false 
        });
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
        return res.status(200).json({ success: true, type: 'status_update' });
      }
      
      // Verificar se é um callback de mensagem recebida (baseado na documentação)
      if (webhookData.type === 'ReceivedCallback' && webhookData.phone) {
        const phone = webhookData.phone.replace(/\D/g, '');
        let messageContent = '';
        let messageType = 'text';
        
        // Determinar o conteúdo da mensagem baseado no tipo
        let mediaUrl = null;
        let fileName = null;
        
        if (webhookData.text && webhookData.text.message) {
          messageContent = webhookData.text.message;
          messageType = 'text';
        } else if (webhookData.image) {
          messageContent = webhookData.image.caption || 'Imagem enviada';
          messageType = 'image';
          mediaUrl = webhookData.image.imageUrl || webhookData.image.url;
          fileName = webhookData.image.fileName || 'image.jpg';
        } else if (webhookData.audio) {
          messageContent = 'Áudio enviado';
          messageType = 'audio';
          mediaUrl = webhookData.audio.audioUrl || webhookData.audio.url;
          fileName = webhookData.audio.fileName || 'audio.mp3';
        } else if (webhookData.video) {
          messageContent = webhookData.video.caption || 'Vídeo enviado';
          messageType = 'video';
          mediaUrl = webhookData.video.videoUrl || webhookData.video.url;
          fileName = webhookData.video.fileName || 'video.mp4';
        } else if (webhookData.document) {
          messageContent = webhookData.document.fileName || 'Documento enviado';
          messageType = 'document';
          mediaUrl = webhookData.document.documentUrl || webhookData.document.url;
          fileName = webhookData.document.fileName || 'document.pdf';
        } else if (webhookData.location) {
          messageContent = 'Localização enviada';
          messageType = 'location';
        } else if (webhookData.waitingMessage) {
          // Para mensagens em fila, aguardar próximo webhook com conteúdo
          console.log('⏳ Mensagem em fila detectada, ignorando até receber conteúdo...');
          return res.status(200).json({ success: true, type: 'waiting_message' });
        } else {
          // Log detalhado para debug - não salvar mensagens sem conteúdo identificável
          console.log('⚠️ Webhook sem conteúdo reconhecido - ignorando:', {
            hasText: !!webhookData.text,
            hasImage: !!webhookData.image,
            hasAudio: !!webhookData.audio,
            hasVideo: !!webhookData.video,
            hasDocument: !!webhookData.document,
            hasLocation: !!webhookData.location,
            waitingMessage: webhookData.waitingMessage,
            messageId: webhookData.messageId,
            keys: Object.keys(webhookData)
          });
          return res.status(200).json({ success: true, type: 'no_content' });
        }

        console.log(`📱 Processando mensagem WhatsApp de ${phone}: ${messageContent.substring(0, 100)}...`);

        // Criar ou encontrar o contato com tratamento robusto de erros
        let contact;
        try {
          const contacts = await storage.searchContacts(phone);
          contact = contacts.find(c => c.phone === phone);
          
          if (!contact) {
            console.log(`📝 Criando novo contato para ${phone}`);
            contact = await storage.createContact({
              name: webhookData.senderName || `WhatsApp ${phone}`,
              phone: phone,
              email: null,
              isOnline: true,
              profileImageUrl: webhookData.photo || null,
              canalOrigem: 'whatsapp',
              nomeCanal: 'WhatsApp',
              idCanal: `whatsapp-${phone}`
            });
            console.log(`✅ Contato criado: ID ${contact.id}`);
          } else {
            console.log(`📞 Contato existente encontrado: ${contact.name} (ID: ${contact.id})`);
            // Atualizar dados do contato se necessário
            try {
              await storage.updateContact(contact.id, {
                name: webhookData.senderName || contact.name,
                isOnline: true,
                profileImageUrl: webhookData.photo || contact.profileImageUrl
              });
            } catch (updateError) {
              console.log(`⚠️ Erro ao atualizar contato ${contact.id}, continuando com dados existentes:`, updateError.message);
            }
          }
        } catch (contactError) {
          console.error(`❌ Erro crítico ao gerenciar contato ${phone}:`, contactError);
          throw new Error(`Falha ao processar contato: ${contactError.message}`);
        }

        // Criar ou encontrar a conversa com tratamento robusto
        let conversation;
        try {
          conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
          
          if (!conversation) {
            console.log(`💬 Criando nova conversa para contato ${contact.id}`);
            conversation = await storage.createConversation({
              contactId: contact.id,
              channel: 'whatsapp',
              status: 'open',
              lastMessageAt: new Date()
            });
            console.log(`✅ Conversa criada: ID ${conversation.id}`);
          } else {
            console.log(`💬 Conversa existente encontrada: ID ${conversation.id} (status: ${conversation.status})`);
            
            // IMPORTANTE: Reabrir automaticamente conversas resolvidas quando nova mensagem chega
            if (conversation.status === 'resolved' || conversation.status === 'closed') {
              console.log(`🔄 Reabrindo conversa ${conversation.id} (status: ${conversation.status}) para nova mensagem`);
              
              try {
                await storage.updateConversation(conversation.id, {
                  status: 'open',
                  lastMessageAt: new Date(),
                  unreadCount: (conversation.unreadCount || 0) + 1
                });
                
                // Atualizar o objeto local
                conversation.status = 'open';
                conversation.lastMessageAt = new Date();
                
                console.log(`✅ Conversa ${conversation.id} reaberta automaticamente`);
              } catch (reopenError) {
                console.error(`⚠️ Erro ao reabrir conversa ${conversation.id}:`, reopenError.message);
                // Continuar com a conversa no estado atual
              }
            } else {
              // Atualizar timestamp da última mensagem mesmo se já estiver aberta
              try {
                await storage.updateConversation(conversation.id, {
                  lastMessageAt: new Date(),
                  unreadCount: (conversation.unreadCount || 0) + 1
                });
              } catch (updateError) {
                console.log(`⚠️ Erro ao atualizar timestamp da conversa ${conversation.id}:`, updateError.message);
                // Continuar sem atualizar timestamp
              }
            }
          }
        } catch (conversationError) {
          console.error(`❌ Erro crítico ao gerenciar conversa para contato ${contact.id}:`, conversationError);
          throw new Error(`Falha ao processar conversa: ${conversationError.message}`);
        }

        // Criar metadados enriquecidos para mensagens de mídia
        let enhancedMetadata = { ...webhookData };
        if (mediaUrl) {
          enhancedMetadata.mediaUrl = mediaUrl;
          enhancedMetadata.fileName = fileName;
        }

        // PRIORIDADE 1: Broadcast IMEDIATO (antes mesmo de salvar no banco)
        const tempMessage = {
          id: Date.now(), // ID temporário
          conversationId: conversation.id,
          content: mediaUrl || messageContent,
          isFromContact: true,
          messageType,
          sentAt: new Date(),
          metadata: enhancedMetadata,
          isDeleted: false,
          deliveredAt: null,
          readAt: null,
          whatsappMessageId: null,
          zapiStatus: null,
          isGroup: false,
          referenceMessageId: null,
          isInternalNote: false,
          attachmentUrl: null
        };

        try {
          const { broadcast, broadcastToAll } = await import('../realtime');
          
          broadcast(conversation.id, {
            type: 'new_message',
            conversationId: conversation.id,
            message: tempMessage
          });

          broadcastToAll({
            type: 'new_message',
            conversationId: conversation.id,
            message: tempMessage
          });
          
          console.log(`🔄 Broadcast IMEDIATO enviado para conversa ${conversation.id}`);
        } catch (broadcastError) {
          console.error('❌ Erro no broadcast imediato:', broadcastError);
        }

        // PRIORIDADE 2: Salvar mensagem no banco de dados
        setImmediate(async () => {
          try {
            const message = await storage.createMessage({
              conversationId: conversation.id,
              content: mediaUrl || messageContent,
              isFromContact: true,
              messageType,
              sentAt: new Date(),
              metadata: enhancedMetadata
            });

            console.log(`✅ Mensagem salva: ID ${message.id} na conversa ${conversation.id}`);

            // PRIORIDADE 3: Análise inteligente de handoff integrada com IA
            setImmediate(async () => {
              try {
                // Usar novo sistema inteligente de handoff
                const response = await fetch(`http://localhost:5000/api/handoffs/intelligent/execute`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'x-internal-call': 'true'
                  },
                  body: JSON.stringify({
                    conversationId: conversation.id,
                    messageContent: messageContent,
                    type: 'automatic'
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  if (result.handoffCreated) {
                    console.log(`🧠 Handoff inteligente criado: ID ${result.handoffId} para conversa ${conversation.id}`);
                    console.log(`📊 Análise IA: ${result.recommendation.reason}`);
                    console.log(`🎯 Equipe sugerida: ${result.recommendation.teamId}, Confiança: ${result.recommendation.confidence}%`);
                  } else {
                    console.log(`🤖 Handoff não necessário para conversa ${conversation.id}: ${result.message}`);
                  }
                  
                  // NOVA FUNCIONALIDADE: Criar/atualizar negócio automaticamente baseado na análise da IA
                  if (result.aiClassification) {
                    const { CRMService } = await import('../../services/crmService');
                    const crmService = new CRMService();
                    
                    try {
                      const crmActions = await crmService.executeAutomatedActions(
                        result.aiClassification,
                        contact.id,
                        conversation.id,
                        messageContent
                      );
                      
                      if (crmActions && crmActions.length > 0) {
                        for (const action of crmActions) {
                          if (action.type === 'create_lead') {
                            console.log(`💼 Novo deal criado automaticamente: ${action.data.name}`);
                          } else if (action.type === 'update_stage') {
                            console.log(`💼 Deal atualizado: ${action.data.name} → ${action.data.stage}`);
                          }
                        }
                      }
                    } catch (crmError) {
                      console.error('❌ Erro ao executar ações automáticas do CRM:', crmError);
                    }
                  }
                } else {
                  console.error('❌ Erro na resposta do handoff inteligente:', response.status);
                }
              } catch (handoffError) {
                console.error('❌ Erro na análise inteligente de handoff:', handoffError);
              }
            });

          } catch (saveError) {
            console.error('❌ Erro ao salvar mensagem:', saveError);
          }
        });

        // Sistema de detecção automática removido - apenas processamento básico da mensagem
        console.log(`📱 Mensagem WhatsApp processada para contato: ${contact.name}`);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ Erro crítico ao processar webhook Z-API:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        webhookType: webhookData?.type,
        phone: webhookData?.phone,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Tentar retornar sucesso mesmo com erro para evitar reenvios da Z-API
      // mas logar detalhadamente para debugging
      try {
        res.status(200).json({ 
          success: false, 
          error: 'Erro interno processado',
          processed: true 
        });
      } catch (responseError) {
        console.error('❌ Erro ao enviar resposta do webhook:', responseError);
        // Fallback final
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro interno do servidor' });
        }
      }
    }
  });
  
  // Configure Z-API webhook - REST: PUT /api/zapi/webhook
  app.put('/api/zapi/webhook', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const webhookUrl = 'https://24df23a6-4c36-4bba-9bde-863f20db5290-00-220357sbu278p.kirk.replit.dev/api/zapi/webhook';
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/update-webhook-received`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: webhookUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      res.json({ 
        success: true, 
        webhookUrl,
        response: data 
      });
      
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Check WhatsApp number validity - REST: POST /api/zapi/validate-number
  app.post('/api/zapi/validate-number', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: 'Número de telefone é obrigatório' });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/phone-exists`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: cleanPhone })
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro ao validar número:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Block contact via Z-API - REST: PATCH /api/zapi/contacts/:phone/block
  app.patch('/api/zapi/contacts/:phone/block', async (req, res) => {
    try {
      const { phone } = req.params;
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/block`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro ao bloquear contato:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Send reaction via Z-API - REST: POST /api/zapi/reactions
  app.post('/api/zapi/reactions', async (req, res) => {
    try {
      console.log('📤 Recebendo solicitação de envio de reação:', req.body);
      
      const { phone, messageId, reaction } = req.body;
      
      if (!phone || !messageId || !reaction) {
        return res.status(400).json({ 
          error: 'Phone, messageId e reaction são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const payload = {
        phone: cleanPhone,
        messageId: messageId.toString(),
        reaction
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-reaction`;
      console.log('📤 Enviando reação para Z-API:', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API:', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Reação enviada com sucesso:', data);
      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao enviar reação:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Remove reaction via Z-API - REST: DELETE /api/zapi/reactions
  app.delete('/api/zapi/reactions', async (req, res) => {
    try {
      console.log('📤 Recebendo solicitação de remoção de reação:', req.body);
      
      const { phone, messageId } = req.body;
      
      if (!phone || !messageId) {
        return res.status(400).json({ 
          error: 'Phone e messageId são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const payload = {
        phone: cleanPhone,
        messageId: messageId.toString()
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-remove-reaction`;
      console.log('📤 Removendo reação via Z-API:', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API:', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Reação removida com sucesso:', data);
      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao remover reação:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Delete message via Z-API - REST: DELETE /api/zapi/messages/:messageId
  app.delete('/api/zapi/messages/:messageId', async (req, res) => {
    try {
      console.log('🗑️ Recebendo solicitação de exclusão de mensagem:', req.body);
      
      const { phone, conversationId } = req.body;
      const messageId = req.params.messageId;
      
      if (!phone || !messageId) {
        return res.status(400).json({ 
          error: 'Phone e messageId são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages?phone=${cleanPhone}&messageId=${messageId.toString()}&owner=true`;
      
      console.log('🗑️ Deletando mensagem via Z-API:', { 
        url,
        conversationId 
      });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Client-Token': clientToken || ''
        }
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API exclusão de mensagem:', { 
        status: response.status, 
        statusText: response.statusText,
        body: responseText 
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        
        let errorMessage = 'Erro ao deletar mensagem via Z-API';
        if (response.status === 404) {
          errorMessage = 'Mensagem não encontrada ou já foi deletada';
        } else if (response.status === 400) {
          errorMessage = 'Dados inválidos para deletar mensagem';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Credenciais Z-API inválidas ou sem permissão';
        }
        
        return res.status(response.status).json({ 
          error: errorMessage,
          details: responseText
        });
      }

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : { success: true };
      } catch (parseError) {
        console.log('⚠️ Resposta não é JSON válido, tratando como sucesso:', responseText);
        data = { success: true, rawResponse: responseText };
      }

      // Se a exclusão foi bem-sucedida, marcar mensagem como deletada no banco
      if (conversationId) {
        const messages = await storage.getMessages(parseInt(conversationId));
        const messageToDelete = messages.find(msg => {
          const metadata = msg.metadata && typeof msg.metadata === 'object' ? msg.metadata : {};
          const msgId = 'messageId' in metadata ? metadata.messageId : 
                       'zaapId' in metadata ? metadata.zaapId : 
                       'id' in metadata ? metadata.id : null;
          return msgId === messageId.toString();
        });

        if (messageToDelete) {
          await storage.markMessageAsDeleted(messageToDelete.id);
        }

        const { broadcast } = await import('../realtime');
        broadcast(parseInt(conversationId), {
          type: 'message_deleted',
          messageId: messageId.toString(),
          deletedAt: new Date().toISOString(),
          conversationId: parseInt(conversationId)
        });
      }

      console.log('✅ Mensagem deletada com sucesso via Z-API:', data);
      
      res.json({
        success: true,
        messageId: messageId.toString(),
        deletedAt: new Date().toISOString(),
        ...data
      });
      
    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
}

// Process Manychat message function
async function processManychatMessage(webhookData: any) {
  try {
    const user = webhookData.user;
    const messageText = webhookData.text || webhookData.message?.text || 'Mensagem do Manychat';
    
    const canalOrigem = 'manychat';
    const nomeCanal = 'Manychat';
    const userIdentity = user.id || user.user_id || user.psid;
    const idCanal = `manychat-${userIdentity}`;

    // Extrair informações do usuário
    const userName = user.name || user.first_name || user.last_name || 
                    `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                    `Manychat User ${userIdentity}`;
    
    const userEmail = user.email || null;
    const userPhone = user.phone || null;

    console.log(`🤖 Processando mensagem Manychat de ${userName}: ${messageText.substring(0, 100)}...`);

    const contact = await storage.findOrCreateContact(userIdentity, {
      name: userName,
      phone: userPhone,
      email: userEmail,
      isOnline: true,
      profileImageUrl: user.profile_pic || null,
      canalOrigem: canalOrigem,
      nomeCanal: nomeCanal,
      idCanal: idCanal,
      tags: ['manychat', 'bot-interaction']
    });

    await storage.updateContactOnlineStatus(contact.id, true);

    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'manychat');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'manychat',
        status: 'open',
        macrosetor: 'comercial',
        assignmentMethod: 'automatic',
        lastMessageAt: new Date()
      });
    }

    // Determinar tipo de mensagem
    let messageType = 'text';
    let content = messageText;
    
    if (webhookData.message) {
      if (webhookData.message.type === 'image') {
        messageType = 'image';
        content = webhookData.message.image_url || messageText;
      } else if (webhookData.message.type === 'audio') {
        messageType = 'audio';
        content = webhookData.message.audio_url || messageText;
      } else if (webhookData.message.type === 'video') {
        messageType = 'video';
        content = webhookData.message.video_url || messageText;
      } else if (webhookData.message.type === 'file') {
        messageType = 'document';
        content = webhookData.message.file_url || messageText;
      }
    }

    const message = await storage.createMessage({
      conversationId: conversation.id,
      content: content,
      isFromContact: true,
      messageType: messageType,
      sentAt: new Date(),
      metadata: {
        source: 'manychat',
        manychatData: webhookData,
        userId: userIdentity,
        flow: webhookData.flow_name || null,
        step: webhookData.step_name || null
      }
    });

    // Broadcast em tempo real
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

    // Análise de handoff removida - usaremos apenas o sistema do webhook Z-API

    // Sistema de criação automática de negócios removido

    // Sistema de atribuição automática removido

    console.log(`✅ Mensagem Manychat processada com sucesso para ${contact.name}`);
  } catch (error) {
    console.error('❌ Erro ao processar mensagem do Manychat:', error);
  }
}

// Process Manychat subscriber added event
async function processManychatSubscriberAdded(webhookData: any) {
  try {
    const user = webhookData.user;
    const userIdentity = user.id || user.user_id || user.psid;
    const userName = user.name || user.first_name || user.last_name || 
                    `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                    `Manychat User ${userIdentity}`;

    console.log(`🤖 Novo subscriber Manychat adicionado: ${userName}`);

    const contact = await storage.findOrCreateContact(userIdentity, {
      name: userName,
      phone: user.phone || null,
      email: user.email || null,
      isOnline: true,
      profileImageUrl: user.profile_pic || null,
      canalOrigem: 'manychat',
      nomeCanal: 'Manychat',
      idCanal: `manychat-${userIdentity}`,
      tags: ['manychat', 'subscriber', 'new-lead']
    });

    // Criar conversa automaticamente para novos subscribers
    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'manychat');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'manychat',
        status: 'open',
        macrosetor: 'comercial',
        assignmentMethod: 'automatic',
        lastMessageAt: new Date()
      });

      // Mensagem automática de boas-vindas
      const welcomeMessage = await storage.createMessage({
        conversationId: conversation.id,
        content: `Novo subscriber adicionado via Manychat: ${userName}`,
        isFromContact: true,
        messageType: 'text',
        sentAt: new Date(),
        metadata: {
          source: 'manychat',
          type: 'subscriber_added',
          manychatData: webhookData
        }
      });

      // Broadcast da nova conversa
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'new_message',
        conversationId: conversation.id,
        message: welcomeMessage
      });
    }

    console.log(`✅ Novo subscriber Manychat processado: ${contact.name}`);
  } catch (error) {
    console.error('❌ Erro ao processar novo subscriber do Manychat:', error);
  }
}

// Registrar webhook routes do Facebook/Instagram
export function registerFacebookWebhookRoutes(app: Express) {
  app.use('/api/webhooks/facebook', facebookWebhookRoutes);
}