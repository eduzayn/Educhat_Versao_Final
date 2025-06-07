import type { Express } from "express";
import { storage } from "../../core/storage";

function validateZApiCredentials() {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    return {
      valid: false,
      error: 'Credenciais Z-API não configuradas'
    };
  }

  return {
    valid: true,
    instanceId,
    token,
    clientToken
  };
}

export function registerWebhookRoutes(app: Express) {
  
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

  // Test macrosetor detection
  app.post('/api/test-macrosetor', async (req, res) => {
    try {
      const { message, canal } = req.body;
      console.log('🧪 Testando detecção de macrosetor:', message);
      
      const detectedMacrosetor = storage.detectMacrosetor(message, canal);
      console.log('🎯 Macrosetor detectado:', detectedMacrosetor);
      
      res.json({ 
        success: true, 
        message,
        canal,
        detectedMacrosetor 
      });
    } catch (error) {
      console.error('Erro no teste de macrosetor:', error);
      res.status(500).json({ error: 'Erro no teste' });
    }
  });
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

    // Criar negócio automaticamente
    try {
      const detectedMacrosetor = storage.detectMacrosetor(messageText, canalOrigem);
      const existingDeals = await storage.getDealsByContact(contact.id);
      const hasActiveDeal = existingDeals.some(deal => 
        deal.macrosetor === detectedMacrosetor && deal.isActive
      );
      
      if (!hasActiveDeal) {
        console.log(`💼 Criando negócio automático para contato do Instagram (${detectedMacrosetor}):`, contact.name);
        await storage.createAutomaticDeal(contact.id, canalOrigem, undefined, messageText);
        console.log(`✅ Negócio criado com sucesso no funil ${detectedMacrosetor} para:`, contact.name);
      }
    } catch (dealError) {
      console.error('❌ Erro ao criar negócio automático para Instagram:', dealError);
    }

    // Atribuição automática de equipes
    try {
      const detectedMacrosetor = storage.detectMacrosetor(messageText, canalOrigem);
      const team = await storage.getTeamByMacrosetor(detectedMacrosetor);
      
      if (team) {
        console.log(`🎯 Equipe encontrada para ${detectedMacrosetor}:`, team.name);
        await storage.assignConversationToTeam(conversation.id, team.id, 'automatic');
        console.log(`✅ Conversa ID ${conversation.id} atribuída automaticamente à equipe ${team.name}`);
        
        const availableUser = await storage.getAvailableUserFromTeam(team.id);
        if (availableUser) {
          await storage.assignConversationToUser(conversation.id, availableUser.id, 'automatic');
          console.log(`👤 Conversa atribuída automaticamente ao usuário ${availableUser.displayName}`);
        }
      }
    } catch (assignmentError) {
      console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
    }

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

    // Criar negócio automaticamente
    try {
      const detectedMacrosetor = storage.detectMacrosetor(messageText, canalOrigem);
      const existingDeals = await storage.getDealsByContact(contact.id);
      const hasActiveDeal = existingDeals.some(deal => 
        deal.macrosetor === detectedMacrosetor && deal.isActive
      );
      
      if (!hasActiveDeal) {
        console.log(`💼 Criando negócio automático para contato de Email (${detectedMacrosetor}):`, contact.name);
        await storage.createAutomaticDeal(contact.id, canalOrigem, undefined, messageText);
        console.log(`✅ Negócio criado com sucesso no funil ${detectedMacrosetor} para:`, contact.name);
      }
    } catch (dealError) {
      console.error('❌ Erro ao criar negócio automático para Email:', dealError);
    }

    // Atribuição automática de equipes
    try {
      const detectedMacrosetor = storage.detectMacrosetor(messageText, canalOrigem);
      const team = await storage.getTeamByMacrosetor(detectedMacrosetor);
      
      if (team) {
        console.log(`🎯 Equipe encontrada para ${detectedMacrosetor}:`, team.name);
        await storage.assignConversationToTeam(conversation.id, team.id, 'automatic');
        console.log(`✅ Conversa ID ${conversation.id} atribuída automaticamente à equipe ${team.name}`);
        
        const availableUser = await storage.getAvailableUserFromTeam(team.id);
        if (availableUser) {
          await storage.assignConversationToUser(conversation.id, availableUser.id, 'automatic');
          console.log(`👤 Conversa atribuída automaticamente ao usuário ${availableUser.displayName}`);
        }
      }
    } catch (assignmentError) {
      console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
    }

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

    // Criar negócio automaticamente
    try {
      const detectedMacrosetor = storage.detectMacrosetor(messageText, canalOrigem);
      const existingDeals = await storage.getDealsByContact(contact.id);
      const hasActiveDeal = existingDeals.some(deal => 
        deal.macrosetor === detectedMacrosetor && deal.isActive
      );
      
      if (!hasActiveDeal) {
        console.log(`💼 Criando negócio automático para contato de SMS (${detectedMacrosetor}):`, contact.name);
        await storage.createAutomaticDeal(contact.id, canalOrigem, undefined, messageText);
        console.log(`✅ Negócio criado com sucesso no funil ${detectedMacrosetor} para:`, contact.name);
      }
    } catch (dealError) {
      console.error('❌ Erro ao criar negócio automático para SMS:', dealError);
    }

    // Atribuição automática de equipes
    try {
      const detectedMacrosetor = storage.detectMacrosetor(messageText, canalOrigem);
      const team = await storage.getTeamByMacrosetor(detectedMacrosetor);
      
      if (team) {
        console.log(`🎯 Equipe encontrada para ${detectedMacrosetor}:`, team.name);
        await storage.assignConversationToTeam(conversation.id, team.id, 'automatic');
        console.log(`✅ Conversa ID ${conversation.id} atribuída automaticamente à equipe ${team.name}`);
        
        const availableUser = await storage.getAvailableUserFromTeam(team.id);
        if (availableUser) {
          await storage.assignConversationToUser(conversation.id, availableUser.id, 'automatic');
          console.log(`👤 Conversa atribuída automaticamente ao usuário ${availableUser.displayName}`);
        }
      }
    } catch (assignmentError) {
      console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
    }

  } catch (error) {
    console.error('❌ Erro ao processar mensagem de SMS:', error);
  }
}

// Additional Z-API endpoints
export function registerZApiRoutes(app: Express) {
  
  // Main Z-API webhook endpoint for receiving messages - REST: POST /api/zapi/webhook
  app.post('/api/zapi/webhook', async (req, res) => {
    try {
      console.log('📨 Webhook Z-API recebido (handler principal):', JSON.stringify(req.body, null, 2));
      
      const webhookData = req.body;
      
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
        } else {
          messageContent = 'Mensagem recebida';
        }

        console.log(`📱 Processando mensagem WhatsApp de ${phone}: ${messageContent.substring(0, 100)}...`);

        // Criar ou encontrar o contato
        const contact = await storage.findOrCreateContact(phone, {
          name: webhookData.senderName || `WhatsApp ${phone}`,
          phone: phone,
          email: null,
          isOnline: true,
          profileImageUrl: null,
          canalOrigem: 'whatsapp',
          nomeCanal: 'WhatsApp',
          idCanal: `whatsapp-${phone}`
        });

        // Atualizar status online do contato
        await storage.updateContactOnlineStatus(contact.id, true);

        // Criar ou encontrar a conversa
        let conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
        if (!conversation) {
          conversation = await storage.createConversation({
            contactId: contact.id,
            channel: 'whatsapp',
            status: 'open',
            lastMessageAt: new Date()
          });
        }

        // Criar metadados enriquecidos para mensagens de mídia
        let enhancedMetadata = { ...webhookData };
        if (mediaUrl) {
          enhancedMetadata.mediaUrl = mediaUrl;
          enhancedMetadata.fileName = fileName;
        }

        // Criar a mensagem
        const message = await storage.createMessage({
          conversationId: conversation.id,
          content: mediaUrl || messageContent, // Para mídia, salvar a URL no content
          isFromContact: true,
          messageType,
          sentAt: new Date(),
          metadata: enhancedMetadata
        });

        console.log(`✅ Mensagem salva: ID ${message.id} na conversa ${conversation.id}`);

        // Fazer broadcast via Socket.IO para atualizar a interface em tempo real
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
          
          console.log(`🔄 Broadcast enviado com sucesso para conversa ${conversation.id}`);
        } catch (broadcastError) {
          console.error('❌ Erro no broadcast:', broadcastError);
        }

        // Criar negócio automático se necessário
        try {
          const detectedMacrosetor = storage.detectMacrosetor(messageContent, 'whatsapp');
          const existingDeals = await storage.getDealsByContact(contact.id);
          const hasActiveDeal = existingDeals.some(deal => 
            deal.macrosetor === detectedMacrosetor && deal.isActive
          );
          
          if (!hasActiveDeal) {
            console.log(`💼 Criando negócio automático para WhatsApp (${detectedMacrosetor}):`, contact.name);
            await storage.createAutomaticDeal(contact.id, 'whatsapp', undefined, messageContent);
          }
        } catch (dealError) {
          console.error('❌ Erro ao criar negócio automático:', dealError);
        }

        // Atribuição automática de equipes
        try {
          const detectedMacrosetor = storage.detectMacrosetor(messageContent, 'whatsapp');
          const team = await storage.getTeamByMacrosetor(detectedMacrosetor);
          
          if (team) {
            console.log(`🎯 Equipe encontrada para ${detectedMacrosetor}:`, team.name);
            await storage.assignConversationToTeam(conversation.id, team.id, 'automatic');
            
            const availableUser = await storage.getAvailableUserFromTeam(team.id);
            if (availableUser) {
              await storage.assignConversationToUser(conversation.id, availableUser.id, 'automatic');
              console.log(`👤 Conversa atribuída automaticamente ao usuário ${availableUser.displayName}`);
            }
          }
        } catch (assignmentError) {
          console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook Z-API:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
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

  // Send audio via Z-API - REST: POST /api/zapi/send-audio
  app.post('/api/zapi/send-audio', async (req, res) => {
    try {
      console.log('🎵 Enviando áudio via Z-API:', req.body);
      
      const { phone, audio, conversationId } = req.body;
      
      if (!phone || !audio) {
        return res.status(400).json({ 
          error: 'Phone e audio são obrigatórios' 
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
        audio: audio
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-audio`;
      console.log('🎵 Enviando áudio para Z-API:', { url: url.replace(token, '****'), payload: { ...payload, audio: '[AUDIO_DATA]' } });

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
      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao enviar áudio via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
}