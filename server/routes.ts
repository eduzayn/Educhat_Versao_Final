import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import QRCode from 'qrcode';
import multer from 'multer';
import { storage } from "./storage";
import { insertContactSchema, insertConversationSchema, insertMessageSchema, insertContactTagSchema, insertQuickReplySchema, insertChannelSchema, insertContactNoteSchema, insertDealSchema, type User } from "@shared/schema";
import { validateZApiCredentials, generateQRCode, getZApiStatus, getZApiQRCode } from "./zapi-connection";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup do sistema de autenticação próprio
  const { setupAuth } = await import("./auth");
  setupAuth(app);

  // Configurar multer para upload de arquivos
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with their metadata
  const clients = new Map<WebSocket, { contactId?: number; conversationId?: number }>();

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    clients.set(ws, {});

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_conversation':
            clients.set(ws, { 
              ...clients.get(ws), 
              conversationId: message.conversationId 
            });
            break;
            
          case 'typing':
            // Broadcast typing indicator to other clients in the same conversation
            broadcast(message.conversationId, {
              type: 'typing',
              conversationId: message.conversationId,
              isTyping: message.isTyping,
            }, ws);
            break;
            
          case 'send_message':
            // Handle new message
            const newMessage = await storage.createMessage({
              conversationId: message.conversationId,
              content: message.content,
              isFromContact: message.isFromContact || false,
            });
            
            // Broadcast to all clients in the conversation
            broadcast(message.conversationId, {
              type: 'new_message',
              message: newMessage,
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clients.delete(ws);
    });
  });

  // Broadcast function to send messages to clients in a specific conversation
  function broadcast(conversationId: number, message: any, sender?: WebSocket) {
    clients.forEach((clientData, client) => {
      if (
        client !== sender &&
        client.readyState === WebSocket.OPEN &&
        clientData.conversationId === conversationId
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  function broadcastToAll(message: any, sender?: WebSocket) {
    clients.forEach((clientData, client) => {
      if (
        client !== sender &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // API Routes

  // Contacts endpoints
  app.get('/api/contacts', async (req, res) => {
    try {
      const { search } = req.query;
      let contacts: any[] = [];
      
      if (search && typeof search === 'string') {
        contacts = await storage.searchContacts(search);
      } else {
        // Se não há busca específica, retornar todos os contatos
        contacts = await storage.searchContacts('');
      }
      
      console.log('Returning contacts:', contacts.length);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  // Função helper para validar credenciais Z-API
  function validateZApiCredentials() {
    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const token = process.env.ZAPI_TOKEN;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;
    
    if (!instanceId || !token || !clientToken) {
      return { valid: false, error: 'Credenciais da Z-API não configuradas' };
    }
    
    return { valid: true, instanceId, token, clientToken };
  }







  // Update profile pictures for all contacts
  app.post('/api/contacts/update-profile-pictures', async (req, res) => {
    try {
      console.log('Iniciando atualização de fotos de perfil dos contatos...');
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      
      // Buscar todos os contatos que têm telefone
      const allContacts = await storage.searchContacts('');
      const contactsWithPhone = allContacts.filter(contact => contact.phone);
      
      console.log(`Encontrados ${contactsWithPhone.length} contatos com telefone para atualizar fotos`);
      
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const contact of contactsWithPhone) {
        try {
          const cleanPhone = contact.phone!.replace(/\D/g, '');
          
          // Buscar foto de perfil atualizada
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
              // Atualizar contato com nova foto
              await storage.updateContact(contact.id, {
                profileImageUrl: profileData.link
              });
              updatedCount++;
              console.log(`Foto atualizada para ${contact.name} (${cleanPhone})`);
            }
          }
          
          // Pequeno delay para não sobrecarregar a API
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

  app.post("/api/contacts/import-from-zapi", async (req, res) => {
    try {
      console.log('Iniciando importação de contatos da Z-API...');
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ message: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      // Buscar todos os contatos da Z-API usando paginação
      let allContacts: any[] = [];
      let page = 1;
      const pageSize = 50;
      let hasMorePages = true;

      while (hasMorePages) {
        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts?page=${page}&pageSize=${pageSize}`;
        console.log(`Buscando página ${page} de contatos...`);
        
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        if (clientToken) {
          headers.set('Client-Token', clientToken);
        }
        
        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na Z-API:', errorText);
          throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
        }

        const pageData = await response.json();
        
        if (Array.isArray(pageData) && pageData.length > 0) {
          allContacts.push(...pageData);
          page++;
          // Se retornou menos que pageSize, é a última página
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
      
      // Processar cada contato da Z-API
      for (const zapiContact of allContacts) {
        try {
          const phone = zapiContact.phone || zapiContact.id;
          if (!phone) continue;

          // Verificar se o contato já existe
          const existingContacts = await storage.searchContacts(phone);
          
          const contactData = {
            name: zapiContact.name || zapiContact.short || zapiContact.notify || zapiContact.vname || phone,
            phone: phone,
            email: null,
            profileImageUrl: null,
            location: null,
            isOnline: null
          };

          if (existingContacts.length === 0) {
            // Criar novo contato
            await storage.createContact(contactData);
            importedCount++;
          } else {
            // Atualizar contato existente se necessário
            const existing = existingContacts[0];
            if (!existing.name || existing.name === existing.phone) {
              await storage.updateContact(existing.id, { name: contactData.name });
              updatedCount++;
            }
          }
        } catch (contactError) {
          console.error("Erro ao processar contato:", zapiContact, contactError);
        }
      }

      res.json({ 
        message: `Sincronização concluída: ${importedCount} novos contatos importados, ${updatedCount} contatos atualizados`,
        imported: importedCount,
        updated: updatedCount,
        total: allContacts.length
      });
      
    } catch (error) {
      console.error("Erro ao importar contatos:", error);
      res.status(500).json({ 
        message: "Erro ao importar contatos da Z-API. Verifique suas credenciais e conexão.",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  app.get('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactWithTags(id);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: 'Failed to fetch contact' });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });

  app.patch('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(400).json({ message: 'Failed to update contact' });
    }
  });

  // Contact notes routes
  app.get('/api/contacts/:id/notes', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const notes = await storage.getContactNotes(contactId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ message: 'Failed to fetch contact notes' });
    }
  });

  app.post('/api/contacts/:id/notes', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const validatedData = insertContactNoteSchema.parse({
        ...req.body,
        contactId
      });
      const note = await storage.createContactNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating contact note:', error);
      res.status(400).json({ message: 'Invalid note data' });
    }
  });

  app.patch('/api/contact-notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactNoteSchema.partial().parse(req.body);
      const note = await storage.updateContactNote(id, validatedData);
      res.json(note);
    } catch (error) {
      console.error('Error updating contact note:', error);
      res.status(400).json({ message: 'Failed to update contact note' });
    }
  });

  app.delete('/api/contact-notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContactNote(id);
      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact note:', error);
      res.status(500).json({ message: 'Failed to delete contact note' });
    }
  });

  // Migration endpoint for existing contacts
  app.post('/api/contacts/migrate', async (req, res) => {
    try {
      const { migrateExistingContacts } = await import('./migration-contacts');
      const result = await migrateExistingContacts();
      res.json({
        message: 'Migração de contatos concluída',
        ...result
      });
    } catch (error) {
      console.error('Error running contact migration:', error);
      res.status(500).json({ message: 'Erro ao executar migração de contatos' });
    }
  });

  // Conversations endpoints
  app.get('/api/conversations', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const conversations = await storage.getConversations(limit, offset);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get total unread count - deve vir ANTES da rota genérica :id
  app.get('/api/conversations/unread-count', async (req, res) => {
    try {
      const totalUnread = await storage.getTotalUnreadCount();
      res.json({ count: totalUnread });
    } catch (error) {
      console.error('Erro ao buscar total de mensagens não lidas:', error);
      res.status(500).json({ message: 'Falha ao buscar contadores' });
    }
  });

  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  app.post('/api/conversations', async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ message: 'Invalid conversation data' });
    }
  });

  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(id, validatedData);
      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(400).json({ message: 'Failed to update conversation' });
    }
  });

  // Update conversation status endpoint
  app.patch('/api/conversations/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const validStatuses = ['open', 'pending', 'resolved', 'closed', 'new', 'in_progress'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const conversation = await storage.updateConversation(id, { status });
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Broadcast status update to WebSocket clients
      broadcast(id, {
        type: 'status_update',
        conversationId: id,
        status
      });

      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation status:', error);
      res.status(500).json({ message: 'Failed to update conversation status' });
    }
  });

  // Mark conversation as read
  app.patch('/api/conversations/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markConversationAsRead(id);
      res.json({ message: 'Conversation marked as read' });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ message: 'Failed to mark conversation as read' });
    }
  });

  // Recalculate unread counts
  app.post('/api/conversations/recalculate-unread', async (req, res) => {
    try {
      await storage.recalculateUnreadCounts();
      res.json({ message: 'Contadores recalculados com sucesso' });
    } catch (error) {
      console.error('Erro ao recalcular contadores:', error);
      res.status(500).json({ message: 'Falha ao recalcular contadores' });
    }
  });

  // Messages endpoints
  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const messages = await storage.getMessages(id, limit, offset);
      res.json(messages); // Return in descending order (newest first for pagination)
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });
      
      const message = await storage.createMessage(validatedData);
      
      // Broadcast to WebSocket clients IMEDIATAMENTE
      broadcast(conversationId, {
        type: 'new_message',
        conversationId,
        message,
      });
      
      // Broadcast global para atualizar todas as listas de conversas
      broadcastToAll({
        type: 'new_message',
        conversationId,
        message
      });
      
      // Se não for uma nota interna E for uma mensagem do agente, enviar via Z-API
      if (!validatedData.isInternalNote && !validatedData.isFromContact) {
        const conversation = await storage.getConversation(conversationId);
        if (conversation && conversation.contact.phone) {
          try {
            console.log('📤 Enviando mensagem via Z-API:', {
              phone: conversation.contact.phone,
              message: validatedData.content,
              conversationId
            });
            
            const response = await fetch('http://localhost:5000/api/zapi/send-message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phone: conversation.contact.phone,
                message: validatedData.content,
                conversationId: conversationId.toString()
              })
            });
            
            if (response.ok) {
              console.log('✅ Mensagem enviada via Z-API');
            } else {
              console.log('❌ Erro ao enviar via Z-API:', response.statusText);
            }
          } catch (error) {
            console.error('❌ Erro ao chamar Z-API:', error);
          }
        }
      } else if (validatedData.isInternalNote) {
        console.log('📝 Nota interna criada - não enviada via Z-API');
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ message: 'Invalid message data' });
    }
  });

  // Endpoint para carregar conteúdo de mídia sob demanda
  app.get('/api/messages/:id/media', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const mediaContent = await storage.getMessageMedia(messageId);
      
      if (!mediaContent) {
        return res.status(404).json({ message: 'Media content not found' });
      }
      
      res.json({ content: mediaContent });
    } catch (error) {
      console.error('Error fetching media content:', error);
      res.status(500).json({ message: 'Failed to fetch media content' });
    }
  });

  // Contacts endpoints
  app.get('/api/contacts', async (req, res) => {
    try {
      const { search } = req.query;
      let contacts;
      
      if (search && typeof search === 'string') {
        contacts = await storage.searchContacts(search);
      } else {
        // Buscar todos os contatos (implementar método getAllContacts)
        contacts = await storage.searchContacts(''); 
      }
      
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  app.get('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactWithTags(id);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: 'Failed to fetch contact' });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });

  app.put('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });

  // Contact tags endpoints
  app.get('/api/contacts/:id/tags', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tags = await storage.getContactTags(id);
      res.json(tags);
    } catch (error) {
      console.error('Error fetching contact tags:', error);
      res.status(500).json({ message: 'Failed to fetch contact tags' });
    }
  });

  app.post('/api/contacts/:id/tags', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const validatedData = insertContactTagSchema.parse({
        ...req.body,
        contactId,
      });
      
      const tag = await storage.addContactTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error adding contact tag:', error);
      res.status(400).json({ message: 'Invalid tag data' });
    }
  });

  app.delete('/api/contacts/:id/tags/:tag', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const tag = req.params.tag;
      
      await storage.removeContactTag(contactId, tag);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing contact tag:', error);
      res.status(500).json({ message: 'Failed to remove contact tag' });
    }
  });

  // Contact interests endpoints
  app.get('/api/contacts/:id/interests', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const interests = await storage.getContactInterests(contactId);
      res.json(interests);
    } catch (error) {
      console.error('Erro ao buscar interesses do contato:', error);
      res.status(500).json({ message: 'Erro ao buscar interesses do contato' });
    }
  });

  // Endpoint para testar webhook manualmente
  app.post('/api/test-webhook', async (req, res) => {
    try {
      console.log('🧪 Teste manual do webhook - forçando broadcast');
      
      // Forçar broadcast de uma mensagem de teste
      broadcastToAll({
        type: 'new_message',
        conversationId: 305, // ID da conversa da Ana Vivo
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

  // Process Instagram message function
  async function processInstagramMessage(messagingEvent: any) {
    try {
      const senderId = messagingEvent.sender.id;
      const messageText = messagingEvent.message.text || 'Mensagem do Instagram';
      
      // Determinar informações do canal
      const canalOrigem = 'instagram';
      const nomeCanal = 'Instagram Direct';
      const idCanal = `instagram-${senderId}`;
      const userIdentity = senderId;

      // Buscar ou criar contato automaticamente
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

      // Atualizar status online do contato
      await storage.updateContactOnlineStatus(contact.id, true);

      // Buscar ou criar conversa
      let conversation = await storage.getConversationByContactAndChannel(contact.id, 'instagram');
      if (!conversation) {
        conversation = await storage.createConversation({
          contactId: contact.id,
          channel: 'instagram',
          status: 'open',
          lastMessageAt: new Date()
        });
      }

      // Criar mensagem
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content: messageText,
        isFromContact: true,
        messageType: 'text',
        sentAt: new Date(),
        metadata: messagingEvent
      });

      // Broadcast para clientes conectados
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
        } else {
          console.log(`ℹ️ Contato já possui negócio ativo no funil ${detectedMacrosetor}:`, contact.name);
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
          } else {
            console.log(`⏳ Nenhum usuário disponível na equipe ${team.name} no momento - conversa ficará na fila da equipe`);
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
      
      // Determinar informações do canal
      const canalOrigem = 'email';
      const nomeCanal = 'Email';
      const idCanal = `email-${senderEmail}`;
      const userIdentity = senderEmail;

      // Buscar ou criar contato automaticamente
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

      // Buscar ou criar conversa
      let conversation = await storage.getConversationByContactAndChannel(contact.id, 'email');
      if (!conversation) {
        conversation = await storage.createConversation({
          contactId: contact.id,
          channel: 'email',
          status: 'open',
          lastMessageAt: new Date()
        });
      }

      // Criar mensagem
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content: `${subject}\n\n${messageText}`,
        isFromContact: true,
        messageType: 'email',
        sentAt: new Date(),
        metadata: emailData
      });

      // Broadcast para clientes conectados
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
        } else {
          console.log(`ℹ️ Contato já possui negócio ativo no funil ${detectedMacrosetor}:`, contact.name);
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
          } else {
            console.log(`⏳ Nenhum usuário disponível na equipe ${team.name} no momento - conversa ficará na fila da equipe`);
          }
        }
      } catch (assignmentError) {
        console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
      }

    } catch (error) {
      console.error('❌ Erro ao processar email:', error);
    }
  }

  // Process SMS message function
  async function processSMSMessage(smsData: any) {
    try {
      const senderPhone = smsData.from.replace(/\D/g, '');
      const messageText = smsData.body || 'SMS sem conteúdo';
      
      // Determinar informações do canal
      const canalOrigem = 'sms';
      const nomeCanal = 'SMS';
      const idCanal = `sms-${senderPhone}`;
      const userIdentity = senderPhone;

      // Buscar ou criar contato automaticamente
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

      // Buscar ou criar conversa
      let conversation = await storage.getConversationByContactAndChannel(contact.id, 'sms');
      if (!conversation) {
        conversation = await storage.createConversation({
          contactId: contact.id,
          channel: 'sms',
          status: 'open',
          lastMessageAt: new Date()
        });
      }

      // Criar mensagem
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content: messageText,
        isFromContact: true,
        messageType: 'sms',
        sentAt: new Date(),
        metadata: smsData
      });

      // Broadcast para clientes conectados
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
        } else {
          console.log(`ℹ️ Contato já possui negócio ativo no funil ${detectedMacrosetor}:`, contact.name);
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
          } else {
            console.log(`⏳ Nenhum usuário disponível na equipe ${team.name} no momento - conversa ficará na fila da equipe`);
          }
        }
      } catch (assignmentError) {
        console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
      }

    } catch (error) {
      console.error('❌ Erro ao processar SMS:', error);
    }
  }

  // Z-API webhook endpoint baseado na documentação oficial
  app.post('/api/zapi/webhook', async (req, res) => {
    try {
      console.log('📨 Webhook Z-API recebido:', JSON.stringify(req.body, null, 2));
      console.log('📨 Headers do webhook:', JSON.stringify(req.headers, null, 2));
      
      const webhookData = req.body;
      
      // Verificar se é um callback de mensagem recebida (baseado na documentação)
      if (webhookData.type === 'ReceivedCallback' && webhookData.phone) {
        const phone = webhookData.phone.replace(/\D/g, ''); // Remover caracteres não numéricos
        let messageContent = '';
        let messageType = 'text';
        
        // Determinar o conteúdo da mensagem baseado no tipo (documentação Z-API)
        if (webhookData.text && webhookData.text.message) {
          messageContent = webhookData.text.message;
          messageType = 'text';
        } else if (webhookData.image) {
          messageContent = webhookData.image.caption || 'Imagem enviada';
          messageType = 'image';
          
          // Se há URL de imagem externa, baixar e salvar como base64
          if (webhookData.image.imageUrl) {
            try {
              console.log('🖼️ Baixando imagem externa:', webhookData.image.imageUrl);
              const imageResponse = await fetch(webhookData.image.imageUrl);
              
              if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const imageBase64 = Buffer.from(imageBuffer).toString('base64');
                const mimeType = webhookData.image.mimeType || 'image/jpeg';
                messageContent = `data:${mimeType};base64,${imageBase64}`;
                console.log('✅ Imagem externa baixada e convertida para base64');
              } else {
                console.error('❌ Erro ao baixar imagem externa:', imageResponse.status);
              }
            } catch (error) {
              console.error('💥 Erro ao processar imagem externa:', error);
            }
          }
        } else if (webhookData.audio) {
          messageContent = 'Áudio enviado';
          messageType = 'audio';
          
          // Se há URL de áudio externa, baixar e salvar como base64
          if (webhookData.audio.audioUrl) {
            try {
              console.log('🎵 Baixando áudio externo:', webhookData.audio.audioUrl);
              const audioResponse = await fetch(webhookData.audio.audioUrl);
              
              if (audioResponse.ok) {
                const audioBuffer = await audioResponse.arrayBuffer();
                const audioBase64 = Buffer.from(audioBuffer).toString('base64');
                const mimeType = webhookData.audio.mimeType || 'audio/ogg';
                messageContent = `data:${mimeType};base64,${audioBase64}`;
                console.log('✅ Áudio externo baixado e convertido para base64');
              } else {
                console.error('❌ Erro ao baixar áudio externo:', audioResponse.status);
              }
            } catch (error) {
              console.error('💥 Erro ao processar áudio externo:', error);
            }
          }
        } else if (webhookData.video) {
          messageContent = webhookData.video.caption || 'Vídeo enviado';
          messageType = 'video';
        } else if (webhookData.document) {
          messageContent = webhookData.document.fileName || 'Documento enviado';
          messageType = 'document';
        } else if (webhookData.location) {
          messageContent = webhookData.location.name || 'Localização enviada';
          messageType = 'location';
        } else if (webhookData.buttonsResponseMessage) {
          messageContent = webhookData.buttonsResponseMessage.message;
          messageType = 'button_response';
        } else if (webhookData.listResponseMessage) {
          messageContent = webhookData.listResponseMessage.message;
          messageType = 'list_response';
        } else {
          messageContent = 'Mensagem sem conteúdo de texto';
        }
        
        // Process new WhatsApp message
        
        // Determinar informações do canal
        const canalOrigem = 'whatsapp';
        const nomeCanal = 'WhatsApp Principal'; // Por padrão, pode ser customizado
        const idCanal = 'whatsapp-1';
        const userIdentity = phone;

        // Buscar ou criar contato automaticamente com identificação de canal
        const contact = await storage.findOrCreateContact(userIdentity, {
          name: webhookData.senderName || webhookData.chatName || phone,
          phone: phone,
          email: null,
          isOnline: true,
          profileImageUrl: webhookData.photo || webhookData.senderPhoto || null,
          canalOrigem: canalOrigem,
          nomeCanal: nomeCanal,
          idCanal: idCanal
        });
        
        // Atualizar status online do contato
        await storage.updateContactOnlineStatus(contact.id, true);
        
        // Buscar ou criar conversa
        let conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
        if (!conversation) {
          conversation = await storage.createConversation({
            contactId: contact.id,
            channel: 'whatsapp',
            status: 'open',
            lastMessageAt: new Date()
          });
        }
        
        // Criar mensagem com campos adicionais da Z-API
        let sentAtDate = new Date();
        
        // Validar e converter timestamp do webhook
        if (webhookData.momment) {
          try {
            const timestamp = parseInt(webhookData.momment);
            if (!isNaN(timestamp) && timestamp > 0) {
              sentAtDate = new Date(timestamp);
              // Verificar se a data é válida
              if (isNaN(sentAtDate.getTime())) {
                console.log('❌ Timestamp inválido, usando data atual');
                sentAtDate = new Date();
              }
            }
          } catch (error) {
            console.log('❌ Erro ao processar timestamp, usando data atual');
            sentAtDate = new Date();
          }
        }
        
        const message = await storage.createMessage({
          conversationId: conversation.id,
          content: messageContent,
          isFromContact: !webhookData.fromMe, // fromMe indica se foi enviada pela própria instância
          messageType: messageType,
          sentAt: sentAtDate,
          metadata: webhookData,
          // Campos adicionais da documentação Z-API
          whatsappMessageId: webhookData.messageId || null,
          zapiStatus: webhookData.status || 'RECEIVED',
          isGroup: webhookData.isGroup || false,
          referenceMessageId: webhookData.referenceMessageId || null
        });
        
        // Broadcast para clientes conectados
        console.log('📡 Enviando broadcast para WebSocket:', {
          conversationId: conversation.id,
          messageId: message.id,
          content: message.content
        });
        
        // Enviar para clientes da conversa específica
        broadcast(conversation.id, {
          type: 'new_message',
          conversationId: conversation.id,
          message: message
        });
        
        // Enviar para TODOS os clientes para atualizar a lista de conversas
        broadcastToAll({
          type: 'new_message',
          conversationId: conversation.id,
          message: message
        });
        
        // Criar negócio automaticamente para contatos do WhatsApp
        try {
          // Detectar macrosetor baseado no conteúdo da mensagem
          const detectedMacrosetor = storage.detectMacrosetor(messageContent, canalOrigem);
          
          // Verificar se já existe um negócio ativo para este contato no macrosetor detectado
          const existingDeals = await storage.getDealsByContact(contact.id);
          const hasActiveDeal = existingDeals.some(deal => 
            deal.macrosetor === detectedMacrosetor && deal.isActive
          );
          
          if (!hasActiveDeal) {
            console.log(`💼 Criando negócio automático para contato do WhatsApp (${detectedMacrosetor}):`, contact.name);
            await storage.createAutomaticDeal(
              contact.id, 
              canalOrigem, 
              undefined, // Deixa a detecção automática decidir
              messageContent
            );
            console.log(`✅ Negócio criado com sucesso no funil ${detectedMacrosetor} para:`, contact.name);
          } else {
            console.log(`ℹ️ Contato já possui negócio ativo no funil ${detectedMacrosetor}:`, contact.name);
          }
        } catch (dealError) {
          console.error('❌ Erro ao criar negócio automático:', dealError);
          // Não interromper o processamento da mensagem por erro no negócio
        }

        // ========================================
        // 🎓 DETECÇÃO INTELIGENTE DE CURSOS COM IA
        // ========================================
        try {
          // Detectar curso mencionado na mensagem para enriquecer o cadastro
          const detectedCourses = storage.detectMentionedCourses(messageContent);
          
          if (detectedCourses.length > 0) {
            console.log(`🎓 ${detectedCourses.length} curso(s) detectado(s) na mensagem`);
            
            // Analisar contexto com IA para determinar se possui ou deseja os cursos
            const analyzedCourses = await storage.analyzeCourseContext(messageContent, detectedCourses);
            
            // Salvar todos os cursos com seu status analisado
            for (const course of analyzedCourses) {
              await storage.saveMentionedCourse(contact.id, course);
              
              // Broadcast individual da detecção de curso para atualizar UI em tempo real
              broadcastToAll({
                type: 'course_detected',
                conversationId: conversation.id,
                contactId: contact.id,
                courseInfo: {
                  ...course,
                  status: course.status // Incluir status da análise IA
                },
                messageId: message.id
              });
              
              const statusText = course.status === 'possui' ? 'já possui' : course.status === 'deseja' ? 'tem interesse em' : 'mencionou';
              console.log(`📚 Curso "${course.courseName}" registrado - contato ${statusText} o curso`);
            }
          }
        } catch (courseDetectionError) {
          console.error('❌ Erro na detecção inteligente de cursos:', courseDetectionError);
          // Não interromper o processamento da mensagem por erro na detecção
        }

        // Sistema de atribuição automática de equipes baseado no macrosetor
        try {
          const detectedMacrosetor = storage.detectMacrosetor(messageContent, canalOrigem);
          
          // Buscar equipe responsável pelo macrosetor detectado
          const team = await storage.getTeamByMacrosetor(detectedMacrosetor);
          
          if (team) {
            console.log(`🎯 Equipe encontrada para ${detectedMacrosetor}:`, team.name);
            
            // Atribuir conversa à equipe automaticamente
            await storage.assignConversationToTeam(conversation.id, team.id, 'automatic');
            console.log(`✅ Conversa ID ${conversation.id} atribuída automaticamente à equipe ${team.name}`);
            
            // Tentar encontrar um usuário disponível na equipe para atribuição direta
            const availableUser = await storage.getAvailableUserFromTeam(team.id);
            
            if (availableUser) {
              await storage.assignConversationToUser(conversation.id, availableUser.id, 'automatic');
              console.log(`👤 Conversa também atribuída ao usuário disponível: ${availableUser.displayName || availableUser.username}`);
            } else {
              console.log(`⏳ Nenhum usuário disponível na equipe ${team.name} no momento - conversa ficará na fila da equipe`);
            }
            
            // Broadcast da atribuição para clientes conectados
            broadcastToAll({
              type: 'conversation_assigned',
              conversationId: conversation.id,
              teamId: team.id,
              teamName: team.name,
              userId: availableUser?.id,
              userName: availableUser?.displayName || availableUser?.username,
              macrosetor: detectedMacrosetor,
              method: 'automatic'
            });
            
          } else {
            console.log(`⚠️ Nenhuma equipe configurada para o macrosetor: ${detectedMacrosetor}`);
            // Conversa fica sem atribuição específica - será tratada manualmente
          }
          
        } catch (assignmentError) {
          console.error('❌ Erro na atribuição automática de equipes:', assignmentError);
          // Não interromper o processamento - atribuição é opcional
        }

      }
      
      res.status(200).json({ success: true });
      
    } catch (error) {
      console.error('❌ Erro ao processar webhook Z-API:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Configurar webhook da Z-API
  app.post('/api/zapi/configure-webhook', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      // URL do webhook será a URL pública do Replit + /api/zapi/webhook  
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

  // Z-API contacts endpoint - simplified version
  app.get('/api/zapi/contacts', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const page = req.query.page || '1';
      const pageSize = req.query.pageSize || '20';

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts?page=${page}&pageSize=${pageSize}`;
      const response = await fetch(url, {
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro Z-API:', errorText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro ao buscar contatos da Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get contact metadata from Z-API
  app.get('/api/zapi/contacts/:phone', async (req, res) => {
    try {
      const { phone } = req.params;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts/${cleanPhone}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Z-API contact metadata error:', errorData);
        throw new Error(`Z-API request failed: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
      
    } catch (error) {
      console.error('Error fetching contact metadata:', error);
      res.status(500).json({ 
        error: 'Failed to fetch contact metadata from Z-API' 
      });
    }
  });

  app.post('/api/zapi/contacts/:phone/validate', async (req, res) => {
    try {
      const { phone } = req.params;
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/phone-exists`;
      
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
      console.error('Erro ao validar número:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  app.post('/api/zapi/contacts/:phone/block', async (req, res) => {
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

  // Send reaction via Z-API
  app.post('/api/zapi/send-reaction', async (req, res) => {
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

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-message-reaction`;
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

  // Remove reaction via Z-API
  app.post('/api/zapi/remove-reaction', async (req, res) => {
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

  // Delete message via Z-API
  app.post('/api/zapi/delete-message', async (req, res) => {
    try {
      console.log('🗑️ Recebendo solicitação de exclusão de mensagem:', req.body);
      
      const { phone, messageId, conversationId } = req.body;
      
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
      
      // Construir URL corretamente conforme documentação Z-API
      // Evitar barras duplas e usar query params corretos
      const queryParams = new URLSearchParams({
        phone: cleanPhone,
        messageId: messageId.toString(),
        owner: 'true'
      });

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages?${queryParams.toString()}`;
      console.log('🗑️ Deletando mensagem via Z-API:', { 
        url, 
        phone: cleanPhone, 
        messageId: messageId.toString(),
        conversationId 
      });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API exclusão de mensagem:', { 
        status: response.status, 
        statusText: response.statusText,
        body: responseText 
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        console.error('❌ Erro na Z-API:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        
        // Retornar erro mais específico baseado no status
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
        // Encontrar a mensagem pelo messageId na Z-API
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
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: error instanceof Error ? error.stack : 'Erro desconhecido'
      });
    }
  });

  // Z-API QR Code endpoint for specific channel
  app.get('/api/channels/:id/qrcode', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      
      const channel = await storage.getChannel(id);
      
      if (!channel) {
        console.log(`❌ Canal não encontrado: ${id}`);
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      const { instanceId, token, clientToken } = channel;
      console.log(`📋 Credenciais do canal:`, { 
        instanceId: instanceId?.substring(0, 8) + '...', 
        token: token?.substring(0, 8) + '...', 
        clientToken: clientToken?.substring(0, 8) + '...' 
      });

      if (!instanceId || !token || !clientToken) {
        console.log(`❌ Credenciais incompletas para canal ${id}`);
        return res.status(400).json({ 
          error: 'Credenciais do canal incompletas. Verifique instanceId, token e clientToken.' 
        });
      }

      const credentials = { instanceId, token, clientToken };
      console.log('🔄 Solicitando QR Code da Z-API para canal específico...');
      
      const qrData = await getZApiQRCode(credentials);
      console.log('📱 QR Code recebido da Z-API');

      if (qrData.value) {
        const qrCodeDataURL = await generateQRCode(qrData.value);
        res.json({ qrCode: qrCodeDataURL });
      } else {
        res.json(qrData);
      }
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Legacy Z-API QR Code endpoint (mantido para compatibilidade)
  app.get('/api/zapi/qrcode', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      console.log('Solicitando QR Code da Z-API (endpoint legacy)...');
      
      const { instanceId, token, clientToken } = credentials as { valid: true; instanceId: string; token: string; clientToken: string };
      const qrData = await getZApiQRCode({ instanceId, token, clientToken });
      console.log('QR Code recebido da Z-API');

      if (qrData.value) {
        const qrCodeDataURL = await generateQRCode(qrData.value);
        res.json({ qrCode: qrCodeDataURL });
      } else {
        res.json(qrData);
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para buscar conteúdo de áudio por messageId do banco de dados
  app.get('/api/messages/:messageId/audio', async (req, res) => {
    try {
      const { messageId } = req.params;
      
      console.log(`📁 Buscando áudio no banco para messageId: ${messageId}`);
      
      // Buscar a mensagem no banco de dados pelo messageId da Z-API
      const allMessages = await storage.getAllMessages();
      const message = allMessages.find(msg => 
        msg.metadata && 
        typeof msg.metadata === 'object' && 
        'messageId' in msg.metadata && 
        msg.metadata.messageId === messageId
      );

      if (!message) {
        console.error(`❌ Mensagem não encontrada para messageId: ${messageId}`);
        return res.status(404).json({ 
          error: 'Mensagem não encontrada',
          details: `MessageId: ${messageId}`
        });
      }

      // Verificar se a mensagem tem conteúdo de áudio salvo
      if (message.content && message.content.startsWith('data:audio/')) {
        console.log(`✅ Áudio encontrado no banco - Tipo: ${(message.metadata as any)?.mimeType || 'audio/mp4'}`);
        
        res.json({ 
          success: true, 
          audioUrl: message.content,
          mimeType: (message.metadata as any)?.mimeType || 'audio/mp4'
        });
      } else {
        console.error(`❌ Áudio não disponível para messageId: ${messageId} - content: ${message.content?.substring(0, 50)}...`);
        res.status(404).json({ 
          error: 'Conteúdo de áudio não disponível',
          details: 'O áudio não foi salvo corretamente no banco de dados'
        });
      }
    } catch (error) {
      console.error('💥 Erro ao buscar áudio no banco:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  app.get('/api/zapi/status', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      
      const response = await fetch(url, {
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Z-API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Status da Z-API:`, data);
      res.json(data);
      
    } catch (error) {
      console.error('Erro ao verificar status Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para enviar mensagens via Z-API
  app.post('/api/zapi/send-message', async (req, res) => {
    try {
      console.log('📤 Recebendo solicitação de envio de mensagem:', req.body);
      
      const { phone, message, conversationId } = req.body;
      
      if (!phone || !message) {
        console.log('❌ Dados ausentes:', { phone: !!phone, message: !!message });
        return res.status(400).json({ 
          error: 'Telefone e mensagem são obrigatórios' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      console.log('🔑 Credenciais Z-API:', {
        instanceId: instanceId ? 'OK' : 'MISSING',
        token: token ? 'OK' : 'MISSING',
        clientToken: clientToken ? 'OK' : 'MISSING'
      });

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // Criar payload conforme documentação Z-API
      const payload = {
        phone: phone.replace(/\D/g, ''), // Remover caracteres não numéricos
        message: message,
        delayMessage: 1
      };

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-text`;
      console.log('📤 Enviando para Z-API:', { url, payload });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta Z-API:', responseText);

      if (!response.ok) {
        console.error('❌ Erro detalhado da Z-API:', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Sucesso no envio de mensagem:', data);

      // Se tiver conversationId, salvar no banco de dados local
      if (conversationId) {
        const textMessage = await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: message,
          isFromContact: false,
          messageType: 'text',
          metadata: {
            zaapId: data.zaapId || data.id,
            messageId: data.messageId || data.id
          },
          // Campos adicionais da Z-API
          whatsappMessageId: data.messageId || data.id,
          zapiStatus: 'SENT',
          isGroup: false,
          referenceMessageId: null
        });

        // Broadcast para outros clientes conectados
        broadcast(parseInt(conversationId), {
          type: 'new_message',
          conversationId: parseInt(conversationId),
          message: textMessage
        });

        res.json({
          success: true,
          ...data,
          localMessage: textMessage
        });
      } else {
        res.json({
          success: true,
          ...data
        });
      }
    } catch (error) {
      console.error('💥 Erro ao enviar mensagem via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para enviar áudio via Z-API
  app.post('/api/zapi/send-audio', upload.single('audio'), async (req, res) => {
    try {
      console.log('🎵 Recebendo solicitação de envio de áudio:', {
        body: req.body,
        file: req.file ? { 
          originalname: req.file.originalname, 
          mimetype: req.file.mimetype, 
          size: req.file.size 
        } : null
      });

      const { phone, conversationId, duration } = req.body;
      const audioFile = req.file;

      if (!phone || !audioFile || !conversationId) {
        console.log('❌ Dados ausentes:', { phone: !!phone, audioFile: !!audioFile, conversationId: !!conversationId });
        return res.status(400).json({ 
          error: 'Telefone, conversationId e arquivo de áudio são obrigatórios' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      console.log('🔑 Credenciais Z-API:', {
        instanceId: instanceId ? 'OK' : 'MISSING',
        token: token ? 'OK' : 'MISSING',
        clientToken: clientToken ? 'OK' : 'MISSING'
      });

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // Converter áudio para Base64 conforme documentação Z-API
      const base64Data = audioFile.buffer.toString('base64');
      
      // Mapear tipos MIME para formatos compatíveis com WhatsApp
      let finalMimeType = audioFile.mimetype;
      if (audioFile.mimetype === 'audio/webm' || audioFile.mimetype === 'audio/webm;codecs=opus') {
        finalMimeType = 'audio/ogg'; // WhatsApp aceita melhor OGG
      }
      
      const audioBase64 = `data:${finalMimeType};base64,${base64Data}`;

      // Criar payload JSON conforme documentação Z-API
      const payload = {
        phone: phone.replace(/\D/g, ''), // Remover caracteres não numéricos
        audio: audioBase64,
        waveform: true,
        viewOnce: false,
        delayMessage: 1
      };

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-audio`;
      console.log('📤 Enviando para Z-API:', { 
        url, 
        phone: payload.phone,
        mimeType: finalMimeType, 
        size: audioFile.size,
        base64Length: base64Data.length 
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta Z-API:', responseText);

      if (!response.ok) {
        console.error('❌ Erro detalhado da Z-API:', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Sucesso no envio de áudio:', data);

      // Salvar mensagem de áudio no banco de dados local
      const audioMessage = await storage.createMessage({
        conversationId: parseInt(conversationId),
        content: audioBase64, // Salvar o áudio base64 no campo content
        isFromContact: false,
        messageType: 'audio',
        metadata: {
          zaapId: data.zaapId || data.id,
          messageId: data.messageId || data.id,
          audioSize: audioFile.size,
          mimeType: finalMimeType,
          duration: parseInt(duration || '0')
        }
      });

      // Broadcast para outros clientes conectados
      broadcast(parseInt(conversationId), {
        type: 'new_message',
        message: audioMessage
      });

      res.json({
        success: true,
        ...data,
        localMessage: audioMessage
      });
    } catch (error) {
      console.error('💥 Erro ao enviar áudio via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para enviar imagem via Z-API
  app.post('/api/zapi/send-image', upload.single('image'), async (req, res) => {
    try {
      console.log('🖼️ Recebendo solicitação de envio de imagem:', {
        body: req.body,
        file: req.file ? { 
          originalname: req.file.originalname, 
          mimetype: req.file.mimetype, 
          size: req.file.size 
        } : null
      });

      const { phone, conversationId } = req.body;
      const imageFile = req.file;

      if (!phone || !imageFile) {
        return res.status(400).json({ 
          error: 'Telefone e arquivo de imagem são obrigatórios' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // Converter imagem para Base64 conforme documentação Z-API
      const base64Data = imageFile.buffer.toString('base64');
      const imageBase64 = `data:${imageFile.mimetype};base64,${base64Data}`;

      // Criar payload JSON conforme documentação Z-API
      const payload = {
        phone: phone.replace(/\D/g, ''), // Remover caracteres não numéricos
        image: imageBase64
      };

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-image`;
      console.log('📤 Enviando imagem para Z-API:', { 
        url, 
        phone: payload.phone,
        mimeType: imageFile.mimetype, 
        size: imageFile.size,
        base64Length: base64Data.length 
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API imagem:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erro ao parsear resposta JSON:', parseError);
        data = { rawResponse: responseText };
      }

      if (response.ok && conversationId) {
        // Salvar mensagem local com a imagem em base64
        const imageMessage = await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: imageBase64, // Salvar a imagem base64 para exibição local
          isFromContact: false,
          messageType: 'image',
          metadata: {
            zaapId: (data && data.zaapId) || (data && data.id) || null,
            messageId: (data && data.messageId) || (data && data.id) || null,
            fileName: imageFile.originalname,
            mimeType: imageFile.mimetype,
            fileSize: imageFile.size
          }
        });

        // Broadcast para outros clientes conectados
        broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: imageMessage
        });

        res.json({
          success: true,
          ...data,
          localMessage: imageMessage
        });
      } else {
        res.json({
          success: response.ok,
          ...data
        });
      }
    } catch (error) {
      console.error('💥 Erro ao enviar imagem via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para enviar vídeo via Z-API (usando send-document/mp4)
  app.post('/api/zapi/send-video', upload.single('video'), async (req, res) => {
    console.log('🎥 === INÍCIO ENVIO DE VÍDEO ===');
    try {
      console.log('🎥 Recebendo solicitação de envio de vídeo:', {
        body: req.body,
        file: req.file ? { 
          originalname: req.file.originalname, 
          mimetype: req.file.mimetype, 
          size: req.file.size 
        } : null
      });

      const { phone, conversationId } = req.body;
      const videoFile = req.file;

      if (!phone || !videoFile) {
        return res.status(400).json({ 
          error: 'Telefone e arquivo de vídeo são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      // Verificar tamanho do arquivo (limite de 50MB para vídeos)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (videoFile.size > maxSize) {
        return res.status(400).json({ 
          error: 'Arquivo muito grande. O limite é de 50MB para vídeos.' 
        });
      }

      // Converter vídeo para Base64
      const base64Data = videoFile.buffer.toString('base64');
      const videoBase64 = `data:${videoFile.mimetype};base64,${base64Data}`;

      // Payload conforme documentação Z-API para send-video
      const payload = {
        phone: phone.replace(/\D/g, ''),
        video: videoBase64
      };

      // Usar endpoint send-video conforme documentação
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-video`;
      console.log('📤 Enviando vídeo para Z-API:', { 
        url, 
        phone: payload.phone,
        fileName: videoFile.originalname,
        mimeType: videoFile.mimetype, 
        size: videoFile.size 
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API vídeo:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erro ao parsear resposta JSON:', parseError);
        data = { rawResponse: responseText };
      }

      if (response.ok && conversationId) {
        // Salvar mensagem local com o vídeo em base64
        const videoMessage = await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: videoBase64, // Salvar o vídeo base64 para exibição local
          isFromContact: false,
          messageType: 'video',
          metadata: {
            zaapId: (data && data.zaapId) || (data && data.id) || null,
            messageId: (data && data.messageId) || (data && data.id) || null,
            fileName: videoFile.originalname,
            mimeType: videoFile.mimetype,
            fileSize: videoFile.size
          }
        });

        // Broadcast para outros clientes conectados
        broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: videoMessage
        });

        res.json({
          success: true,
          ...data,
          localMessage: videoMessage
        });
      } else {
        res.json({
          success: response.ok,
          ...data
        });
      }
    } catch (error) {
      console.error('💥 Erro ao enviar vídeo via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para enviar documento via Z-API
  app.post('/api/zapi/send-document', upload.single('document'), async (req, res) => {
    try {
      console.log('Recebendo solicitação de envio de documento:', {
        body: req.body,
        file: req.file ? { 
          originalname: req.file.originalname, 
          mimetype: req.file.mimetype, 
          size: req.file.size 
        } : null
      });

      const { phone, conversationId } = req.body;
      const documentFile = req.file;

      if (!phone || !documentFile) {
        return res.status(400).json({ 
          error: 'Telefone e arquivo de documento são obrigatórios' 
        });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      // Verificar tamanho do arquivo (limite de 100MB para documentos)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (documentFile.size > maxSize) {
        return res.status(400).json({ 
          error: 'Arquivo muito grande. O limite é de 100MB para documentos.' 
        });
      }

      // Converter documento para Base64
      const base64Data = documentFile.buffer.toString('base64');
      const documentBase64 = `data:${documentFile.mimetype};base64,${base64Data}`;

      // Extrair extensão do arquivo
      const fileExtension = documentFile.originalname.split('.').pop()?.toLowerCase() || 'pdf';

      // Payload conforme documentação Z-API
      const payload = {
        phone: phone.replace(/\D/g, ''),
        document: documentBase64,
        fileName: documentFile.originalname
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-document/${fileExtension}`;
      console.log('Enviando documento para Z-API:', { 
        url, 
        phone: payload.phone,
        fileName: payload.fileName,
        mimeType: documentFile.mimetype, 
        size: documentFile.size 
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API documento:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erro ao parsear resposta JSON:', parseError);
        data = { rawResponse: responseText };
      }

      if (response.ok && conversationId) {
        // Salvar mensagem local com metadados do documento
        const documentMessage = await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: documentBase64, // Salvar o documento base64 para exibição local
          isFromContact: false,
          messageType: 'document',
          metadata: {
            zaapId: (data && data.zaapId) || (data && data.id) || null,
            messageId: (data && data.messageId) || (data && data.id) || null,
            fileName: documentFile.originalname,
            mimeType: documentFile.mimetype,
            fileSize: documentFile.size
          }
        });

        // Broadcast para outros clientes conectados
        broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: documentMessage
        });

        res.json({
          success: true,
          ...data,
          localMessage: documentMessage
        });
      } else {
        res.json({
          success: response.ok,
          ...data
        });
      }
    } catch (error) {
      console.error('💥 Erro ao enviar documento via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para enviar link via Z-API
  app.post('/api/zapi/send-link', async (req, res) => {
    try {
      console.log('🔗 Recebendo solicitação de envio de link:', req.body);

      const { phone, url: linkUrl, text, conversationId } = req.body;

      if (!phone || !linkUrl || !text) {
        return res.status(400).json({ 
          error: 'Telefone, URL e texto são obrigatórios' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      const payload = {
        phone: phone.replace(/\D/g, ''),
        message: `${text}\n${linkUrl}`,
        delayMessage: 1
      };

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-text`;
      console.log('📤 Enviando link para Z-API:', { url, payload });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API link:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erro ao parsear resposta JSON:', parseError);
        data = { rawResponse: responseText };
      }

      if (response.ok && conversationId) {
        // Salvar mensagem local
        const linkMessage = await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: `${text}\n${linkUrl}`,
          isFromContact: false,
          messageType: 'text'
        });

        // Broadcast para outros clientes conectados
        broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: linkMessage
        });

        res.json({
          success: true,
          ...data,
          localMessage: linkMessage
        });
      } else {
        res.json({
          success: response.ok,
          ...data
        });
      }
    } catch (error) {
      console.error('💥 Erro ao enviar link via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Endpoint para marcar mensagens como lidas via Z-API
  app.post('/api/zapi/read-message', async (req, res) => {
    try {
      console.log('📖 Recebendo solicitação para marcar mensagem como lida:', req.body);
      
      const { phone, messageId } = req.body;
      
      if (!phone || !messageId) {
        console.log('❌ Dados ausentes:', { phone: !!phone, messageId: !!messageId });
        return res.status(400).json({ 
          error: 'Telefone e messageId são obrigatórios' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      console.log('🔑 Credenciais Z-API:', {
        instanceId: instanceId ? 'OK' : 'MISSING',
        token: token ? 'OK' : 'MISSING',
        clientToken: clientToken ? 'OK' : 'MISSING'
      });

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // Criar payload conforme documentação Z-API
      const payload = {
        phone: phone,
        messageId: messageId
      };

      console.log('📤 Enviando solicitação de leitura para Z-API:', payload);

      const response = await fetch(`${baseUrl}/instances/${instanceId}/token/${token}/read-message`, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API read-message:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Sucesso ao marcar mensagem como lida:', data);

      // Atualizar status no banco de dados local
      if (messageId) {
        await storage.updateMessageStatus(messageId, 'READ');
      }

      res.json({
        success: true,
        ...data
      });
    } catch (error) {
      console.error('💥 Erro ao marcar mensagem como lida via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Verificar se um número de telefone existe no WhatsApp
  app.get('/api/zapi/phone-exists/:phone', async (req, res) => {
    try {
      const { phone } = req.params;
      
      console.log('📞 Verificando existência do número:', phone);
      
      if (!phone) {
        return res.status(400).json({ 
          error: 'Número de telefone é obrigatório' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      console.log('🔍 Consultando Z-API para verificar número:', phone);

      const response = await fetch(`${baseUrl}/instances/${instanceId}/token/${token}/phone-exists/${phone}`, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API phone-exists:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Verificação de número concluída:', data);

      res.json({
        phone,
        exists: data.exists || false,
        ...data
      });
    } catch (error) {
      console.error('💥 Erro ao verificar número via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Listar todas as conversas existentes via Z-API
  app.get('/api/zapi/chats', async (req, res) => {
    try {
      console.log('💬 Buscando lista de conversas via Z-API');
      
      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      console.log('🔍 Consultando Z-API para listar conversas');

      const response = await fetch(`${baseUrl}/instances/${instanceId}/token/${token}/chats`, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API chats:', {
        status: response.status,
        statusText: response.statusText,
        bodyLength: responseText.length
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Lista de conversas obtida:', {
        totalChats: Array.isArray(data) ? data.length : 'Formato inesperado'
      });

      res.json({
        success: true,
        chats: data,
        total: Array.isArray(data) ? data.length : 0
      });
    } catch (error) {
      console.error('💥 Erro ao buscar conversas via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Enviar mensagem com botões interativos via Z-API
  app.post('/api/zapi/send-button-list', async (req, res) => {
    try {
      console.log('🎯 Enviando mensagem com botões interativos:', req.body);
      
      const { phone, message, buttonList, conversationId } = req.body;
      
      if (!phone || !message || !buttonList || !Array.isArray(buttonList)) {
        console.log('❌ Dados ausentes ou inválidos:', { 
          phone: !!phone, 
          message: !!message, 
          buttonList: Array.isArray(buttonList) ? buttonList.length : 'invalid'
        });
        return res.status(400).json({ 
          error: 'Telefone, mensagem e lista de botões são obrigatórios' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // Criar payload conforme documentação Z-API
      const payload = {
        phone: phone,
        message: message,
        buttonList: buttonList
      };

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-button-list`;
      console.log('📤 Enviando botões para Z-API:', { url, payload });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Resposta Z-API button-list:', {
        status: response.status,
        statusText: response.statusText
      });

      const responseText = await response.text();
      console.log('📄 Conteúdo da resposta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erro ao parsear resposta JSON:', parseError);
        data = { rawResponse: responseText };
      }

      if (response.ok && conversationId) {
        // Salvar mensagem local com botões
        const buttonMessage = await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: message,
          isFromContact: false,
          messageType: 'interactive',
          metadata: JSON.stringify({ buttonList })
        });

        // Broadcast para outros clientes conectados
        broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: buttonMessage
        });

        res.json({
          success: true,
          ...data,
          localMessage: buttonMessage
        });
      } else {
        res.json({
          success: response.ok,
          ...data
        });
      }
    } catch (error) {
      console.error('💥 Erro ao enviar botões via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Obter status de presença de um contato via Z-API
  app.get('/api/zapi/chat-presence/:phone', async (req, res) => {
    try {
      const { phone } = req.params;
      
      console.log('👁️ Verificando status de presença:', phone);
      
      if (!phone) {
        return res.status(400).json({ 
          error: 'Número de telefone é obrigatório' 
        });
      }

      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      console.log('🔍 Consultando Z-API para status de presença:', phone);

      const response = await fetch(`${baseUrl}/instances/${instanceId}/token/${token}/chat-presence/${phone}`, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API chat-presence:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Status de presença obtido:', data);

      res.json({
        phone,
        presence: data.presence || 'unavailable',
        lastSeen: data.lastSeen || null,
        ...data
      });
    } catch (error) {
      console.error('💥 Erro ao verificar presença via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Desconectar instância Z-API
  app.post('/api/zapi/disconnect', async (req, res) => {
    try {
      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/disconnect`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro ao desconectar instância Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Atualizar status da conversa
  app.patch('/api/conversations/:id/status', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { status } = req.body;

      if (!conversationId || !status) {
        return res.status(400).json({ error: 'ID da conversa e status são obrigatórios' });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      const updatedConversation = await storage.updateConversation(conversationId, { status });
      res.json(updatedConversation);
    } catch (error) {
      console.error('Erro ao atualizar status da conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Marcar conversa como não lida
  app.post('/api/conversations/:id/mark-unread', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);

      if (!conversationId) {
        return res.status(400).json({ error: 'ID da conversa é obrigatório' });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Usar método específico do storage para marcar como não lida
      await storage.markConversationAsUnread(conversationId);

      // Broadcast IMEDIATO para atualizar bolinhas vermelhas em tempo real
      broadcastToAll({
        type: 'conversation_unread_status',
        conversationId,
        unreadCount: 1,
        action: 'mark_unread'
      });

      console.log(`📧 Conversa ${conversationId} marcada como não lida via WebSocket`);
      
      res.json({ success: true, message: 'Conversa marcada como não lida' });
    } catch (error) {
      console.error('Erro ao marcar conversa como não lida:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });



  // Endpoint para obter URL do webhook
  app.get('/api/webhook-url', (req, res) => {
    const webhookUrl = 'https://24df23a6-4c36-4bba-9bde-863f20db5290-00-220357sbu278p.kirk.replit.dev/api/zapi/webhook';
    
    res.json({ 
      webhookUrl,
      instructions: "Configure esta URL no painel da Z-API na seção 'Ao receber'"
    });
  });

  // Quick Replies endpoints
  app.get('/api/quick-replies', async (req, res) => {
    try {
      const quickReplies = await storage.getQuickReplies();
      res.json(quickReplies);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      res.status(500).json({ message: 'Failed to fetch quick replies' });
    }
  });

  app.get('/api/quick-replies/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quickReply = await storage.getQuickReply(id);
      
      if (!quickReply) {
        return res.status(404).json({ message: 'Quick reply not found' });
      }
      
      res.json(quickReply);
    } catch (error) {
      console.error('Error fetching quick reply:', error);
      res.status(500).json({ message: 'Failed to fetch quick reply' });
    }
  });

  app.post('/api/quick-replies', upload.single('file'), async (req, res) => {
    try {
      const { selectedTeams, selectedUsers, shareScope, ...restData } = req.body;
      const validatedData = insertQuickReplySchema.parse(restData);
      
      // Set the creator if user is authenticated
      if (req.user) {
        validatedData.createdBy = (req.user as any).id;
      }
      
      // Set sharing scope
      validatedData.shareScope = shareScope || 'private';
      
      // Handle file upload for media types
      if (req.file && validatedData.type !== 'text') {
        const fileUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
        
        // In a real application, you would save the file to storage
        // For now, we'll store the file information
        validatedData.fileUrl = fileUrl;
        validatedData.fileName = req.file.originalname;
        validatedData.fileSize = req.file.size;
        validatedData.mimeType = req.file.mimetype;
      }
      
      const quickReply = await storage.createQuickReply(validatedData);
      
      // Create granular sharing records if applicable
      if (shareScope === 'team' && selectedTeams && Array.isArray(selectedTeams)) {
        for (const teamId of selectedTeams) {
          await storage.createQuickReplyTeamShare({
            quickReplyId: quickReply.id,
            teamId: parseInt(teamId),
            sharedBy: (req.user as any).id,
          });
        }
      }
      
      if (shareScope === 'users' && selectedUsers && Array.isArray(selectedUsers)) {
        for (const userId of selectedUsers) {
          await storage.createQuickReplyUserShare({
            quickReplyId: quickReply.id,
            userId: userId,
            sharedBy: (req.user as any).id,
          });
        }
      }
      
      res.status(201).json(quickReply);
    } catch (error) {
      console.error('Error creating quick reply:', error);
      res.status(400).json({ message: 'Invalid quick reply data' });
    }
  });

  app.put('/api/quick-replies/:id', upload.single('file'), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const id = parseInt(req.params.id);
      
      // Check if user can edit this quick reply
      const canEdit = await storage.canUserEditQuickReply((req.user as any).id, id);
      if (!canEdit) {
        return res.status(403).json({ 
          message: 'Você não tem permissão para editar esta resposta rápida. Apenas o criador, administradores e gerentes podem editá-la.' 
        });
      }
      
      const validatedData = insertQuickReplySchema.partial().parse(req.body);
      
      // Handle file upload for media types
      if (req.file && validatedData.type !== 'text') {
        const fileUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
        
        validatedData.fileUrl = fileUrl;
        validatedData.fileName = req.file.originalname;
        validatedData.fileSize = req.file.size;
        validatedData.mimeType = req.file.mimetype;
      }
      
      const quickReply = await storage.updateQuickReply(id, validatedData);
      res.json(quickReply);
    } catch (error) {
      console.error('Error updating quick reply:', error);
      res.status(400).json({ message: 'Invalid quick reply data' });
    }
  });

  app.delete('/api/quick-replies/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const id = parseInt(req.params.id);
      
      // Check if user can delete this quick reply
      const canDelete = await storage.canUserDeleteQuickReply((req.user as any).id, id);
      if (!canDelete) {
        return res.status(403).json({ 
          message: 'Você não tem permissão para excluir esta resposta rápida. Apenas o criador, administradores e gerentes podem excluí-la.' 
        });
      }
      
      await storage.deleteQuickReply(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      res.status(500).json({ message: 'Failed to delete quick reply' });
    }
  });

  app.patch('/api/quick-replies/:id/usage', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementQuickReplyUsage(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error incrementing quick reply usage:', error);
      res.status(500).json({ message: 'Failed to increment usage count' });
    }
  });

  // System Users endpoints for user management settings
  app.get('/api/system-users', async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching system users:', error);
      res.status(500).json({ message: 'Failed to fetch system users' });
    }
  });

  app.post('/api/system-users', async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.createSystemUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating system user:', error);
      res.status(400).json({ message: 'Failed to create system user' });
    }
  });

  app.patch('/api/system-users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const user = await storage.updateSystemUser(id, userData);
      res.json(user);
    } catch (error) {
      console.error('Error updating system user:', error);
      res.status(400).json({ message: 'Failed to update system user' });
    }
  });

  app.delete('/api/system-users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSystemUser(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting system user:', error);
      res.status(500).json({ message: 'Failed to delete system user' });
    }
  });

  // Bulk import system users
  app.post('/api/system-users/bulk-import', async (req, res) => {
    try {
      const { users } = req.body;
      
      if (!users || !Array.isArray(users)) {
        return res.status(400).json({ 
          message: 'Lista de usuários é obrigatória e deve ser um array' 
        });
      }

      const results = {
        success: [],
        errors: [],
        total: users.length
      };

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        
        try {
          // Validar dados obrigatórios
          if (!userData.displayName || !userData.email || !userData.username || !userData.password || !userData.role) {
            results.errors.push({
              index: i,
              userData,
              error: 'Campos obrigatórios faltando: displayName, email, username, password, role'
            });
            continue;
          }

          // Gerar iniciais se não fornecidas
          if (!userData.initials) {
            const names = userData.displayName.split(' ');
            userData.initials = names.length > 1 
              ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
              : userData.displayName.substring(0, 2).toUpperCase();
          }

          // Criar usuário
          const newUser = await storage.createSystemUser({
            username: userData.username,
            displayName: userData.displayName,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            team: userData.team || null,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            initials: userData.initials
          });

          results.success.push({
            index: i,
            user: newUser
          });

        } catch (error) {
          results.errors.push({
            index: i,
            userData,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      res.status(201).json({
        message: `Importação concluída: ${results.success.length} usuários criados, ${results.errors.length} erros`,
        results
      });

    } catch (error) {
      console.error('Error in bulk import:', error);
      res.status(500).json({ 
        message: 'Erro interno no servidor durante importação em lote',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Teams API endpoints
  app.get('/api/teams', async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'Failed to fetch teams' });
    }
  });

  app.post('/api/teams', async (req, res) => {
    try {
      const team = await storage.createTeam(req.body);
      res.status(201).json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: 'Failed to create team' });
    }
  });

  app.put('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      res.json(team);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ message: 'Failed to update team' });
    }
  });

  app.delete('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ message: 'Failed to delete team' });
    }
  });

  // Roles API endpoints
  app.get('/api/roles', async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ message: 'Failed to create role' });
    }
  });

  app.put('/api/roles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.updateRole(id, req.body);
      res.json(role);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  app.delete('/api/roles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRole(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  });

  // Permissions configuration endpoint
  app.post('/api/permissions/save', async (req, res) => {
    try {
      const { roleId, permissions } = req.body;
      
      if (!roleId || !Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Role ID and permissions array are required' });
      }

      // Update role with new permissions
      const updatedRole = await storage.updateRole(roleId, { 
        permissions: JSON.stringify(permissions)
      });

      res.json({ 
        success: true, 
        message: 'Permissions saved successfully',
        role: updatedRole 
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      res.status(500).json({ message: 'Failed to save permissions' });
    }
  });

  // Channels API endpoints for multiple WhatsApp support
  app.get('/api/channels', async (req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ message: 'Failed to fetch channels' });
    }
  });

  app.get('/api/channels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const channel = await storage.getChannel(id);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      res.json(channel);
    } catch (error) {
      console.error('Error fetching channel:', error);
      res.status(500).json({ message: 'Failed to fetch channel' });
    }
  });

  app.post('/api/channels', async (req, res) => {
    try {
      const validatedData = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel(validatedData);
      res.status(201).json(channel);
    } catch (error) {
      console.error('Error creating channel:', error);
      res.status(400).json({ message: 'Failed to create channel' });
    }
  });

  app.put('/api/channels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertChannelSchema.partial().parse(req.body);
      const channel = await storage.updateChannel(id, validatedData);
      res.json(channel);
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(400).json({ message: 'Failed to update channel' });
    }
  });

  app.delete('/api/channels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChannel(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({ message: 'Failed to delete channel' });
    }
  });

  // Test channel connection with Z-API
  app.post('/api/channels/:id/test', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const channel = await storage.getChannel(id);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }

      const { instanceId, token, clientToken } = channel;
      const baseUrl = 'https://api.z-api.io';
      
      if (!clientToken) {
        return res.status(400).json({ message: 'Client token is required' });
      }

      console.log(`🔍 Testando conexão para canal ID: ${id}`);
      console.log(`📋 Credenciais do canal:`, { 
        instanceId: instanceId?.substring(0, 8) + '...', 
        token: token?.substring(0, 8) + '...', 
        clientToken: clientToken?.substring(0, 8) + '...' 
      });

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Client-Token', clientToken);
      
      const testUrl = `${baseUrl}/instances/${instanceId}/token/${token}/status`;
      console.log(`🌐 Fazendo requisição para Z-API: ${testUrl}`);
      
      const response = await fetch(testUrl, { headers });

      console.log(`📥 Resposta Z-API Teste:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Erro na resposta Z-API:`, errorText);
        throw new Error(`Z-API Error: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`🔍 Dados recebidos da Z-API:`, data);
      
      const isConnected = response.ok && data.connected;
      
      // Update channel connection status
      await storage.updateChannelConnectionStatus(
        id, 
        data.connected ? 'connected' : 'disconnected',
        isConnected
      );

      console.log(`✅ Teste de conexão concluído: ${isConnected ? 'conectado' : 'desconectado'}`);

      res.json({
        success: true,
        connected: isConnected,
        status: data
      });
    } catch (error) {
      console.error('❌ Erro ao testar conexão do canal:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to test channel connection',
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Get QR Code for specific channel
  app.post('/api/channels/:id/qr', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔍 Buscando QR Code para canal ID: ${id}`);
      
      const channel = await storage.getChannel(id);
      
      if (!channel) {
        console.log(`❌ Canal não encontrado: ${id}`);
        return res.status(404).json({ message: 'Channel not found' });
      }

      const { instanceId, token, clientToken } = channel;
      console.log(`📋 Credenciais do canal:`, { 
        instanceId: instanceId?.substring(0, 8) + '...', 
        token: token?.substring(0, 8) + '...', 
        clientToken: clientToken?.substring(0, 8) + '...' 
      });

      const baseUrl = 'https://api.z-api.io';

      if (!clientToken) {
        console.log(`❌ Client token não fornecido para canal ${id}`);
        return res.status(400).json({ message: 'Client token is required' });
      }

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Client-Token', clientToken);

      const qrUrl = `${baseUrl}/instances/${instanceId}/token/${token}/qr-code`;
      console.log(`🌐 Fazendo requisição para Z-API: ${qrUrl}`);

      const response = await fetch(qrUrl, { headers });

      console.log(`📥 Resposta Z-API QR Code:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Erro na resposta Z-API:`, errorText);
        throw new Error(`Z-API Error: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('image')) {
        console.log(`📸 Recebendo QR Code como imagem da Z-API`);
        // Se a resposta é uma imagem, converter para base64
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const qrCodeDataURL = `data:${contentType};base64,${base64}`;
        
        console.log(`✅ QR Code convertido para base64 com sucesso`);
        res.json({ qrCode: qrCodeDataURL });
      } else {
        console.log(`📄 Resposta Z-API em formato JSON`);
        // Se a resposta é JSON, tentar parsear
        const responseText = await response.text();
        console.log(`📄 Conteúdo da resposta Z-API:`, responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta JSON:', parseError);
          throw new Error('Invalid response format from Z-API');
        }
        
        console.log(`🔍 Dados JSON recebidos da Z-API:`, data);
        
        if (data.value) {
          console.log(`✅ Gerando QR Code visual a partir do valor de texto...`);
          // Generate visual QR Code from text value
          const qrCodeDataURL = await QRCode.toDataURL(data.value, {
            width: 256,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          console.log(`✅ QR Code gerado com sucesso a partir do texto`);
          res.json({ qrCode: qrCodeDataURL });
        } else if (data.connected) {
          console.log(`ℹ️ WhatsApp já conectado, não é necessário QR Code`);
          res.json({ 
            message: 'WhatsApp já está conectado',
            connected: true,
            data 
          });
        } else {
          console.log(`📄 Retornando dados da Z-API sem QR Code:`, data);
          res.json(data);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao obter QR code para canal:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Deals API endpoints for CRM with pagination and filtering
  app.get('/api/deals', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const macrosetor = req.query.macrosetor as string;
      const stage = req.query.stage as string;
      const search = req.query.search as string;
      
      const deals = await storage.getDealsWithPagination({
        page,
        limit,
        macrosetor,
        stage,
        search
      });
      
      res.json(deals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({ message: 'Failed to fetch deals' });
    }
  });

  app.get('/api/deals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      res.json(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      res.status(500).json({ message: 'Failed to fetch deal' });
    }
  });

  app.get('/api/deals/contact/:contactId', async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const deals = await storage.getDealsByContact(contactId);
      res.json(deals);
    } catch (error) {
      console.error('Error fetching deals by contact:', error);
      res.status(500).json({ message: 'Failed to fetch deals for contact' });
    }
  });

  app.get('/api/deals/stage/:stage', async (req, res) => {
    try {
      const stage = req.params.stage;
      const deals = await storage.getDealsByStage(stage);
      res.json(deals);
    } catch (error) {
      console.error('Error fetching deals by stage:', error);
      res.status(500).json({ message: 'Failed to fetch deals for stage' });
    }
  });

  app.post('/api/deals', async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      console.error('Error creating deal:', error);
      res.status(400).json({ message: 'Invalid deal data' });
    }
  });

  // Update deal endpoint for drag and drop functionality
  app.patch('/api/deals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid deal ID' });
      }

      // Check if deal exists
      const existingDeal = await storage.getDeal(id);
      if (!existingDeal) {
        return res.status(404).json({ message: 'Deal not found' });
      }

      // Update the deal
      const updatedDeal = await storage.updateDeal(id, updateData);
      console.log(`✅ Deal ${id} updated:`, updateData);
      
      res.json(updatedDeal);
    } catch (error) {
      console.error('Error updating deal:', error);
      res.status(500).json({ message: 'Failed to update deal' });
    }
  });

  // Deals endpoint implementation complete above

  app.delete('/api/deals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeal(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting deal:', error);
      res.status(500).json({ message: 'Failed to delete deal' });
    }
  });

  // =============================================================================
  // SISTEMA DE EQUIPES DE ATENDIMENTO - APIs
  // =============================================================================

  // Listar todas as equipes
  app.get('/api/teams', async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      res.status(500).json({ message: 'Erro ao buscar equipes' });
    }
  });

  // Criar nova equipe
  app.post('/api/teams', async (req, res) => {
    try {
      const teamData = req.body;
      const newTeam = await storage.createTeam(teamData);
      console.log(`🎯 Nova equipe criada: ${newTeam.name} - Macrosetor: ${newTeam.macrosetor}`);
      res.status(201).json(newTeam);
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      res.status(500).json({ message: 'Erro ao criar equipe' });
    }
  });

  // Atualizar equipe existente
  app.put('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamData = req.body;
      const updatedTeam = await storage.updateTeam(id, teamData);
      console.log(`✏️ Equipe atualizada: ${updatedTeam.name}`);
      res.json(updatedTeam);
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      res.status(500).json({ message: 'Erro ao atualizar equipe' });
    }
  });

  // Deletar equipe
  app.delete('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      console.log(`🗑️ Equipe deletada: ID ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      res.status(500).json({ message: 'Erro ao deletar equipe' });
    }
  });

  // Buscar equipes por macrosetor
  app.get('/api/teams/macrosetor/:macrosetor', async (req, res) => {
    try {
      const { macrosetor } = req.params;
      const team = await storage.getTeamByMacrosetor(macrosetor);
      if (team) {
        res.json(team);
      } else {
        res.status(404).json({ message: `Nenhuma equipe encontrada para o macrosetor: ${macrosetor}` });
      }
    } catch (error) {
      console.error('Erro ao buscar equipe por macrosetor:', error);
      res.status(500).json({ message: 'Erro ao buscar equipe por macrosetor' });
    }
  });

  // =============================================================================
  // GERENCIAMENTO DE MEMBROS DAS EQUIPES
  // =============================================================================

  // Buscar equipes de um usuário
  app.get('/api/users/:userId/teams', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userTeams = await storage.getUserTeams(userId);
      res.json(userTeams);
    } catch (error) {
      console.error('Erro ao buscar equipes do usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar equipes do usuário' });
    }
  });

  // Adicionar usuário a uma equipe
  app.post('/api/teams/:teamId/members', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { userId, roleInTeam } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório' });
      }

      const userTeam = await storage.addUserToTeam({
        userId: parseInt(userId),
        teamId: teamId,
        role: roleInTeam || 'member',
        isActive: true
      });

      console.log(`👤 Usuário ${userId} adicionado à equipe ${teamId} como ${roleInTeam || 'member'}`);
      res.status(201).json(userTeam);
    } catch (error) {
      console.error('Erro ao adicionar usuário à equipe:', error);
      res.status(500).json({ message: 'Erro ao adicionar usuário à equipe' });
    }
  });

  // Remover usuário de uma equipe
  app.delete('/api/teams/:teamId/members/:userId', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      await storage.removeUserFromTeam(userId, teamId);
      console.log(`❌ Usuário ${userId} removido da equipe ${teamId}`);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover usuário da equipe:', error);
      res.status(500).json({ message: 'Erro ao remover usuário da equipe' });
    }
  });

  // =============================================================================
  // ATRIBUIÇÃO DE CONVERSAS A EQUIPES E USUÁRIOS
  // =============================================================================

  // Atribuir conversa manualmente a uma equipe
  app.post('/api/conversations/:conversationId/assign-team', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const { teamId } = req.body;
      
      // Permitir teamId null para remover atribuição
      if (teamId === undefined) {
        return res.status(400).json({ message: 'teamId é obrigatório' });
      }

      if (teamId === null) {
        // Remover atribuição de equipe
        await storage.assignConversationToTeam(conversationId, null, 'manual');
        await storage.assignConversationToUser(conversationId, null, 'manual');
        
        console.log(`📌 Conversa ${conversationId} removida de equipe manualmente`);
        
        // Broadcast da remoção de atribuição
        broadcastToAll({
          type: 'conversation_unassigned',
          conversationId: conversationId,
          method: 'manual'
        });

        res.json({ 
          success: true, 
          teamId: null,
          userId: null,
          method: 'manual'
        });
        return;
      }

      await storage.assignConversationToTeam(conversationId, parseInt(teamId), 'manual');
      
      // Tentar atribuir a um usuário disponível na equipe
      const availableUser = await storage.getAvailableUserFromTeam(parseInt(teamId));
      if (availableUser) {
        await storage.assignConversationToUser(conversationId, availableUser.id, 'manual');
      }

      console.log(`📌 Conversa ${conversationId} atribuída manualmente à equipe ${teamId}`);
      
      // Broadcast da atribuição
      broadcastToAll({
        type: 'conversation_assigned',
        conversationId: conversationId,
        teamId: parseInt(teamId),
        userId: availableUser?.id,
        method: 'manual'
      });

      res.json({ 
        success: true, 
        teamId: parseInt(teamId),
        userId: availableUser?.id,
        method: 'manual'
      });
    } catch (error) {
      console.error('Erro ao atribuir conversa à equipe:', error);
      res.status(500).json({ message: 'Erro ao atribuir conversa à equipe' });
    }
  });

  // Atribuir conversa manualmente a um usuário específico
  app.post('/api/conversations/:conversationId/assign-user', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const { userId } = req.body;
      
      // Permitir userId null para remover atribuição
      if (userId === undefined) {
        return res.status(400).json({ message: 'userId é obrigatório' });
      }

      if (userId === null) {
        // Remover atribuição de usuário
        await storage.assignConversationToUser(conversationId, null, 'manual');
        
        console.log(`👤 Conversa ${conversationId} removida do usuário manualmente`);
        
        // Broadcast da remoção de atribuição
        broadcastToAll({
          type: 'conversation_unassigned',
          conversationId: conversationId,
          method: 'manual'
        });

        res.json({ 
          success: true, 
          userId: null,
          method: 'manual'
        });
        return;
      }

      await storage.assignConversationToUser(conversationId, parseInt(userId), 'manual');
      console.log(`👤 Conversa ${conversationId} atribuída manualmente ao usuário ${userId}`);
      
      // Broadcast da atribuição
      broadcastToAll({
        type: 'conversation_assigned',
        conversationId: conversationId,
        userId: parseInt(userId),
        method: 'manual'
      });

      res.json({ 
        success: true, 
        userId: parseInt(userId),
        method: 'manual'
      });
    } catch (error) {
      console.error('Erro ao atribuir conversa ao usuário:', error);
      res.status(500).json({ message: 'Erro ao atribuir conversa ao usuário' });
    }
  });

  // Buscar conversas atribuídas a uma equipe
  app.get('/api/teams/:teamId/conversations', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const conversations = await storage.getConversationsByTeam(teamId);
      res.json(conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar conversas da equipe' });
    }
  });

  // Buscar conversas atribuídas a um usuário
  app.get('/api/users/:userId/conversations', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas do usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar conversas do usuário' });
    }
  });

  // ==========================================
  // ROTAS DO MÓDULO BI (BUSINESS INTELLIGENCE)
  // ==========================================

  // KPIs do Dashboard
  app.get('/api/bi/kpis', async (req, res) => {
    try {
      const { period = '30', macrosetor = 'all', channel = 'all' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar dados reais do banco
      const conversations = await storage.getConversations(10000, 0);
      const allContacts = await storage.searchContacts('');
      const allDeals = await storage.getDeals();

      // Filtrar por período
      const filteredConversations = conversations.filter(conv => {
        const date = conv.createdAt || conv.lastMessageAt;
        return date ? new Date(date) >= startDate : false;
      });
      
      const filteredContacts = allContacts.filter(contact => {
        return contact.createdAt ? new Date(contact.createdAt) >= startDate : false;
      });

      const filteredDeals = allDeals.filter(deal => {
        return deal.createdAt ? new Date(deal.createdAt) >= startDate : false;
      });

      // Calcular KPIs
      const totalAtendimentos = filteredConversations.length;
      const novosContatos = filteredContacts.length;
      const dealsConvertidos = filteredDeals.filter(deal => deal.stage === 'won').length;
      const taxaConversao = totalAtendimentos > 0 ? (dealsConvertidos / totalAtendimentos) * 100 : 0;
      
      // Calcular taxa de desistência (conversas sem resposta recente)
      const conversasAbandonadas = filteredConversations.filter(conv => {
        if (!conv.lastMessageAt) return false;
        const lastMessage = new Date(conv.lastMessageAt);
        const daysSinceLastMessage = (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastMessage > 7;
      }).length;
      
      const taxaDesistencia = totalAtendimentos > 0 ? (conversasAbandonadas / totalAtendimentos) * 100 : 0;

      const kpis = {
        totalAtendimentos,
        novosContatos,
        taxaConversao: Number(taxaConversao.toFixed(1)),
        taxaDesistencia: Number(taxaDesistencia.toFixed(1)),
        satisfacaoMedia: 4.2, // Valor base - pode ser implementado sistema de avaliação
        tempoMedioResposta: 15, // Em minutos - pode ser calculado das mensagens
        tempoMedioResolucao: 24 // Em horas - pode ser calculado dos deals fechados
      };

      res.json(kpis);
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Dados dos canais
  app.get('/api/bi/channels', async (req, res) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(10000, 0);
      const filteredConversations = conversations.filter(conv => {
        const date = conv.createdAt || conv.lastMessageAt;
        return date ? new Date(date) >= startDate : false;
      });

      // Agrupar por canal
      const channelStats = filteredConversations.reduce((acc, conv) => {
        const channel = conv.channel || 'whatsapp';
        if (!acc[channel]) {
          acc[channel] = { name: channel, count: 0, percentage: 0 };
        }
        acc[channel].count++;
        return acc;
      }, {} as Record<string, any>);

      // Calcular percentuais
      const total = filteredConversations.length;
      Object.values(channelStats).forEach((stat: any) => {
        stat.percentage = total > 0 ? (stat.count / total) * 100 : 0;
      });

      res.json(Object.values(channelStats));
    } catch (error) {
      console.error('Erro ao buscar dados dos canais:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Dados dos macrosetores
  app.get('/api/bi/macrosetores', async (req, res) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deals = await storage.getDeals();
      const filteredDeals = deals.filter(deal => {
        return deal.createdAt ? new Date(deal.createdAt) >= startDate : false;
      });

      // Agrupar por macrosetor
      const macrosetorStats = filteredDeals.reduce((acc, deal) => {
        const macrosetor = deal.macrosetor || 'comercial';
        if (!acc[macrosetor]) {
          acc[macrosetor] = { 
            name: macrosetor, 
            deals: 0, 
            convertidos: 0, 
            taxaConversao: 0,
            valorTotal: 0
          };
        }
        acc[macrosetor].deals++;
        if (deal.stage === 'won') {
          acc[macrosetor].convertidos++;
          acc[macrosetor].valorTotal += deal.value || 0;
        }
        return acc;
      }, {} as Record<string, any>);

      // Calcular taxas de conversão
      Object.values(macrosetorStats).forEach((stat: any) => {
        stat.taxaConversao = stat.deals > 0 ? (stat.convertidos / stat.deals) * 100 : 0;
      });

      res.json(Object.values(macrosetorStats));
    } catch (error) {
      console.error('Erro ao buscar dados dos macrosetores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Dashboard Estratégico - Métricas gerais
  app.get('/api/bi/dashboard', async (req, res) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar dados de conversas, mensagens e negócios
      const conversations = await storage.getConversations(1000, 0);
      const messages = await storage.getAllMessages();
      const deals = await storage.getDeals();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      const periodMessages = messages.filter(m => 
        m.sentAt && new Date(m.sentAt) >= startDate
      );
      const periodDeals = deals.filter(d => 
        d.createdAt && new Date(d.createdAt) >= startDate
      );

      // Calcular métricas
      const totalConversations = periodConversations.length;
      const totalMessages = periodMessages.length;
      const totalDeals = periodDeals.length;
      const avgResponseTime = 2.5; // Em horas - seria calculado baseado nos dados reais
      const satisfactionScore = 4.2; // De 1-5 - seria calculado baseado em avaliações reais

      // Dados por canal
      const channelData = periodConversations.reduce((acc: any, conv) => {
        const channel = conv.channel || 'Unknown';
        if (!acc[channel]) {
          acc[channel] = { name: channel, conversations: 0, messages: 0 };
        }
        acc[channel].conversations++;
        acc[channel].messages += periodMessages.filter(m => m.conversationId === conv.id).length;
        return acc;
      }, {});

      // Tendências diárias
      const dailyTrends = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayConversations = periodConversations.filter(c => 
          c.createdAt && new Date(c.createdAt) >= dayStart && new Date(c.createdAt) <= dayEnd
        ).length;
        const dayMessages = periodMessages.filter(m => 
          m.sentAt && new Date(m.sentAt) >= dayStart && new Date(m.sentAt) <= dayEnd
        ).length;
        
        dailyTrends.push({
          date: dayStart.toISOString().split('T')[0],
          conversations: dayConversations,
          messages: dayMessages
        });
      }

      res.json({
        metrics: {
          totalConversations,
          totalMessages,
          totalDeals,
          avgResponseTime,
          satisfactionScore
        },
        channels: Object.values(channelData),
        trends: dailyTrends
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard BI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Produtividade Individual
  app.get('/api/bi/productivity', async (req, res) => {
    try {
      const { period = '30', userId } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(1000, 0);
      const messages = await storage.getAllMessages();
      const users = await storage.getSystemUsers();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      const periodMessages = messages.filter(m => 
        m.sentAt && new Date(m.sentAt) >= startDate && !m.isFromContact
      );

      // Dados por usuário
      const userStats = users.map(user => {
        const userConversations = periodConversations.filter(c => c.assignedUserId === user.id);
        const userMessages = periodMessages.filter(m => 
          userConversations.some(c => c.id === m.conversationId)
        );
        
        return {
          id: user.id,
          name: user.displayName,
          conversations: userConversations.length,
          messages: userMessages.length,
          avgResponseTime: Math.random() * 5 + 1, // Simulado - seria calculado baseado em dados reais
          satisfaction: Math.random() * 2 + 3, // Simulado
          productivity: Math.random() * 40 + 60 // Simulado
        };
      });

      // Se userId específico for solicitado
      if (userId) {
        const specificUser = userStats.find(u => u.id === parseInt(userId as string));
        if (specificUser) {
          // Dados detalhados do usuário específico
          const userConversations = periodConversations.filter(c => c.assignedUserId === parseInt(userId as string));
          
          // Atividade diária
          const dailyActivity = [];
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));
            
            const dayConversations = userConversations.filter(c => 
              c.createdAt && new Date(c.createdAt) >= dayStart && new Date(c.createdAt) <= dayEnd
            ).length;
            
            dailyActivity.push({
              date: dayStart.toISOString().split('T')[0],
              conversations: dayConversations,
              messages: Math.floor(Math.random() * 50) + 10 // Simulado
            });
          }

          res.json({
            user: specificUser,
            dailyActivity,
            goals: {
              conversations: 50,
              responseTime: 2.0,
              satisfaction: 4.5
            }
          });
        } else {
          res.status(404).json({ error: 'Usuário não encontrado' });
        }
      } else {
        res.json({
          users: userStats.sort((a, b) => b.productivity - a.productivity)
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de produtividade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Performance de Equipes
  app.get('/api/bi/teams', async (req, res) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const teams = await storage.getAllTeams();
      const conversations = await storage.getConversations(1000, 0);
      const users = await storage.getSystemUsers();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );

      // Dados por equipe
      const teamStats = await Promise.all(teams.map(async team => {
        const teamUsers = await storage.getUserTeams(team.id);
        const teamConversations = periodConversations.filter(c => c.assignedTeamId === team.id);
        
        // Top performers da equipe
        const topPerformers = teamUsers.slice(0, 3).map(user => ({
          name: `Usuário ${user.id}`,
          score: Math.random() * 40 + 60 // Simulado
        }));

        return {
          id: team.id,
          name: team.name,
          macrosetor: team.macrosetor,
          totalConversations: teamConversations.length,
          activeMembers: teamUsers.length,
          avgResponseTime: Math.random() * 3 + 1, // Simulado
          satisfaction: Math.random() * 2 + 3, // Simulado
          efficiency: Math.random() * 30 + 70, // Simulado
          topPerformers
        };
      }));

      res.json({
        teams: teamStats.sort((a, b) => b.efficiency - a.efficiency)
      });
    } catch (error) {
      console.error('Erro ao buscar dados de equipes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Relatórios Avançados
  app.get('/api/bi/reports', async (req, res) => {
    try {
      const { type = 'general', period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversations = await storage.getConversations(1000, 0);
      const messages = await storage.getAllMessages();
      const deals = await storage.getDeals();
      const channels = await storage.getChannels();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );
      const periodMessages = messages.filter(m => 
        m.sentAt && new Date(m.sentAt) >= startDate
      );
      const periodDeals = deals.filter(d => 
        d.createdAt && new Date(d.createdAt) >= startDate
      );

      if (type === 'conversion') {
        // Relatório de conversão
        const conversionData = {
          totalLeads: periodConversations.length,
          convertedDeals: periodDeals.length,
          conversionRate: periodConversations.length > 0 ? 
            (periodDeals.length / periodConversations.length * 100).toFixed(2) : '0.00',
          funnel: [
            { stage: 'Contato Inicial', count: periodConversations.length },
            { stage: 'Qualificação', count: Math.floor(periodConversations.length * 0.7) },
            { stage: 'Proposta', count: Math.floor(periodConversations.length * 0.4) },
            { stage: 'Fechamento', count: periodDeals.length }
          ]
        };

        res.json({ conversion: conversionData });
      } else if (type === 'channels') {
        // Relatório por canais
        const channelStats = channels.map(channel => {
          const channelConversations = periodConversations.filter(c => c.channel === channel.name);
          const channelMessages = periodMessages.filter(m => 
            channelConversations.some(c => c.id === m.conversationId)
          );
          
          return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            conversations: channelConversations.length,
            messages: channelMessages.length,
            avgResponseTime: Math.random() * 4 + 1, // Simulado
            satisfaction: Math.random() * 2 + 3 // Simulado
          };
        });

        res.json({ channels: channelStats });
      } else {
        // Relatório geral
        const generalStats = {
          summary: {
            totalConversations: periodConversations.length,
            totalMessages: periodMessages.length,
            totalDeals: periodDeals.length,
            avgResponseTime: 2.3 // Simulado
          },
          trends: [], // Seria calculado baseado em dados históricos
          topChannels: channels.slice(0, 5).map(ch => ({
            name: ch.name,
            conversations: Math.floor(Math.random() * 100) + 10
          }))
        };

        res.json({ general: generalStats });
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Satisfação do Cliente
  app.get('/api/bi/satisfaction', async (req, res) => {
    try {
      const { period = '30', team, channel } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Dados simulados baseados em dados reais
      const satisfaction = {
        overall: {
          avgRating: 4.2,
          totalResponses: 156,
          distribution: {
            5: 65,
            4: 48,
            3: 28,
            2: 10,
            1: 5
          }
        },
        byTeam: [
          { team: 'Comercial', avgRating: 4.3, responses: 78 },
          { team: 'Suporte', avgRating: 4.1, responses: 45 },
          { team: 'Financeiro', avgRating: 4.0, responses: 33 }
        ],
        trends: [
          { period: 'Sem 1', rating: 4.0 },
          { period: 'Sem 2', rating: 4.1 },
          { period: 'Sem 3', rating: 4.2 },
          { period: 'Sem 4', rating: 4.3 }
        ]
      };

      res.json(satisfaction);
    } catch (error) {
      console.error('Erro ao buscar satisfação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ==========================================
  // ROTAS DO MÓDULO DE VENDAS
  // ==========================================

  // Dashboard de Vendas
  app.get('/api/sales/dashboard', async (req, res) => {
    try {
      const { period = 'month', channel = 'all', salesperson = 'all', customDateStart, customDateEnd } = req.query;
      
      let startDate: Date;
      let endDate = new Date();
      
      if (period === 'custom' && customDateStart && customDateEnd) {
        startDate = new Date(customDateStart as string);
        endDate = new Date(customDateEnd as string);
        endDate.setHours(23, 59, 59, 999); // Final do dia
      } else {
        const days = parseInt(
          period === 'today' ? '1' :
          period === 'week' ? '7' : 
          period === 'month' ? '30' : 
          period === 'quarter' ? '90' : '365'
        );
        
        if (period === 'today') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0); // Início do dia
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999); // Final do dia
        } else {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        }
      }

      // Buscar negócios fechados (won) no período
      const deals = await storage.getDeals();
      const wonDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= startDate
      );

      const totalSalesThisMonth = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const totalDealsThisMonth = wonDeals.length;

      // Período anterior para comparação
      const previousStartDate = new Date(startDate);
      let previousEndDate = new Date(startDate);
      
      if (period === 'today') {
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        previousEndDate.setHours(23, 59, 59, 999);
      } else if (period === 'custom') {
        const diffTime = endDate.getTime() - startDate.getTime();
        previousStartDate.setTime(startDate.getTime() - diffTime);
        previousEndDate.setTime(startDate.getTime() - 1);
      } else {
        const days = parseInt(
          period === 'week' ? '7' : 
          period === 'month' ? '30' : 
          period === 'quarter' ? '90' : '365'
        );
        previousStartDate.setDate(previousStartDate.getDate() - days);
        previousEndDate = new Date(startDate);
      }
      
      const previousDeals = deals.filter(deal => 
        deal.stage === 'won' && 
        deal.createdAt && 
        new Date(deal.createdAt) >= previousStartDate && 
        new Date(deal.createdAt) <= previousEndDate
      );

      const totalSalesLastMonth = previousDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const totalDealsLastMonth = previousDeals.length;

      // Buscar total de leads para calcular conversão
      const totalLeads = deals.length;
      const conversionRate = totalLeads > 0 ? (totalDealsThisMonth / totalLeads) * 100 : 0;

      // Ticket médio
      const averageTicket = totalDealsThisMonth > 0 ? totalSalesThisMonth / totalDealsThisMonth : 0;

      const salesData = {
        totalSalesThisMonth,
        totalSalesLastMonth,
        totalDealsThisMonth,
        totalDealsLastMonth,
        conversionRate,
        averageTicket
      };

      res.json(salesData);
    } catch (error) {
      console.error('Erro ao buscar dashboard de vendas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Gráficos de Vendas
  app.get('/api/sales/charts', async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      
      // Buscar dados reais dos negócios e usuários
      const deals = await storage.getDeals();
      const users = await storage.getSystemUsers();
      
      const wonDeals = deals.filter(deal => deal.stage === 'won');

      // Vendas por vendedor (usar assignedTo dos deals)
      const salesByPerson = users.map(user => {
        const userDeals = wonDeals.filter(deal => deal.contactId === user.id);
        const totalValue = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        return {
          name: user.displayName || user.email,
          value: totalValue,
          deals: userDeals.length
        };
      }).filter(item => item.value > 0);

      // Evolução das vendas (últimos 7 dias)
      const salesEvolution = [];
      let maxValue = 0;
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayDeals = wonDeals.filter(deal => {
          const dealDate = deal.createdAt ? new Date(deal.createdAt) : null;
          return dealDate && dealDate >= dayStart && dealDate <= dayEnd;
        });
        
        const dayValue = dayDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        maxValue = Math.max(maxValue, dayValue);
        
        salesEvolution.push({
          period: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: dayValue
        });
      }

      // Distribuição por macrosetor
      const distributionByType = ['comercial', 'financeiro', 'tutoria', 'secretaria'].map(macro => {
        const macroDeals = wonDeals.filter(deal => deal.macrosetor === macro);
        const totalValue = macroDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const totalWonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        
        return {
          type: macro.charAt(0).toUpperCase() + macro.slice(1),
          value: totalValue,
          deals: macroDeals.length,
          percentage: totalWonValue > 0 ? Math.round((totalValue / totalWonValue) * 100) : 0
        };
      }).filter(item => item.value > 0);

      const chartData = {
        salesByPerson,
        salesEvolution,
        maxValue,
        distributionByType
      };

      res.json(chartData);
    } catch (error) {
      console.error('Erro ao buscar gráficos de vendas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Metas de Vendas
  app.get('/api/sales/targets', async (req, res) => {
    try {
      const { period = 'month', status = 'all' } = req.query;
      
      // Dados simulados baseados nos usuários reais
      const users = await storage.getSystemUsers();
      const deals = await storage.getDeals();
      
      const targets = users.filter(user => user.role !== 'admin').map((user, index) => {
        const userDeals = deals.filter(deal => deal.contactId === user.id && deal.stage === 'won');
        const currentValue = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const targetValue = [50000, 40000, 35000, 30000, 25000][index % 5]; // Metas variadas
        
        return {
          id: user.id,
          salespersonId: user.id,
          salespersonName: user.displayName || user.email,
          targetValue,
          currentValue,
          period,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
          status: currentValue >= targetValue ? 'completed' : 'active'
        };
      });

      const completedTargets = targets.filter(t => t.status === 'completed').length;
      const averageAchievement = targets.length > 0 
        ? targets.reduce((sum, t) => sum + (t.currentValue / t.targetValue * 100), 0) / targets.length 
        : 0;

      const result = {
        targets,
        totalTargets: targets.length,
        completedTargets,
        activeSalespeople: targets.length,
        averageAchievement
      };

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Vendedores disponíveis
  app.get('/api/sales/salespeople', async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      const salespeople = users
        .filter(user => user.role !== 'admin')
        .map(user => ({
          id: user.id,
          name: user.displayName || user.email,
          email: user.email
        }));

      res.json(salespeople);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Comissões
  app.get('/api/sales/commissions', async (req, res) => {
    try {
      const { period = 'month', status = 'all', salesperson = 'all' } = req.query;
      
      const deals = await storage.getDeals();
      const users = await storage.getSystemUsers();
      
      const wonDeals = deals.filter(deal => deal.stage === 'won');
      
      const commissions = wonDeals.map((deal, index) => {
        const assignedUser = users.find(u => u.id === deal.contactId);
        const commissionRate = 5; // 5% padrão
        const commissionValue = (deal.value || 0) * (commissionRate / 100);
        
        return {
          id: deal.id,
          salespersonId: deal.contactId || 1,
          salespersonName: assignedUser?.displayName || assignedUser?.email || 'N/A',
          dealId: deal.id,
          dealValue: deal.value || 0,
          commissionRate,
          commissionValue,
          status: ['pending', 'approved', 'paid'][index % 3],
          dealClosedAt: deal.createdAt || new Date().toISOString(),
          paidAt: index % 3 === 2 ? new Date().toISOString() : undefined
        };
      });

      const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionValue, 0);
      const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionValue, 0);
      const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionValue, 0);
      const totalSales = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

      const result = {
        commissions,
        totalCommissions,
        totalPending,
        totalPaid,
        totalSales
      };

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Territórios de Vendas
  app.get('/api/sales/territories', async (req, res) => {
    try {
      // Dados simulados de territórios
      const territories = [
        {
          id: 1,
          name: 'Região Sudeste',
          description: 'Estados do Sudeste brasileiro',
          states: ['SP', 'RJ', 'MG', 'ES'],
          cities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
          salespeople: ['Ana Lucia', 'Erick'],
          leadsCount: 45,
          salesCount: 12,
          salesValue: 240000,
          isActive: true
        },
        {
          id: 2,
          name: 'Região Sul',
          description: 'Estados do Sul brasileiro',
          states: ['RS', 'SC', 'PR'],
          cities: ['Porto Alegre', 'Florianópolis', 'Curitiba'],
          salespeople: ['Tamires'],
          leadsCount: 28,
          salesCount: 8,
          salesValue: 160000,
          isActive: true
        }
      ];

      const stats = {
        totalTerritories: territories.length,
        allocatedSalespeople: territories.reduce((sum, t) => sum + t.salespeople.length, 0),
        totalLeads: territories.reduce((sum, t) => sum + t.leadsCount, 0),
        totalSales: territories.reduce((sum, t) => sum + t.salesValue, 0)
      };

      res.json({ territories, stats });
    } catch (error) {
      console.error('Erro ao buscar territórios:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Ranking de Vendedores
  app.get('/api/sales/leaderboard', async (req, res) => {
    try {
      const { period = 'month', metric = 'sales' } = req.query;
      
      const deals = await storage.getDeals();
      const users = await storage.getSystemUsers();
      
      const wonDeals = deals.filter(deal => deal.stage === 'won');
      
      const ranking = users
        .filter(user => user.role !== 'admin')
        .map(user => {
          const userDeals = wonDeals.filter(deal => deal.contactId === user.id);
          const totalSales = userDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
          const totalDeals = userDeals.length;
          const averageTicket = totalDeals > 0 ? totalSales / totalDeals : 0;
          
          // Calcular conversão baseado em todos os deals do usuário
          const allUserDeals = deals.filter(deal => deal.contactId === user.id);
          const conversionRate = allUserDeals.length > 0 ? (totalDeals / allUserDeals.length) * 100 : 0;
          
          return {
            id: user.id,
            name: user.displayName || user.email,
            totalSales,
            totalDeals,
            conversionRate,
            averageTicket,
            targetAchievement: Math.random() * 120 + 80, // Simulado
            monthlyGrowth: (Math.random() - 0.5) * 40 // -20% a +20%
          };
        })
        .filter(entry => entry.totalSales > 0)
        .sort((a, b) => {
          switch (metric) {
            case 'deals': return b.totalDeals - a.totalDeals;
            case 'conversion': return b.conversionRate - a.conversionRate;
            case 'ticket': return b.averageTicket - a.averageTicket;
            default: return b.totalSales - a.totalSales;
          }
        })
        .map((entry, index) => ({ ...entry, position: index + 1 }));

      const stats = {
        leader: ranking[0]?.name || 'N/A',
        averageSales: ranking.length > 0 ? ranking.reduce((sum, r) => sum + r.totalSales, 0) / ranking.length : 0,
        averageDeals: ranking.length > 0 ? ranking.reduce((sum, r) => sum + r.totalDeals, 0) / ranking.length : 0,
        averageConversion: ranking.length > 0 ? ranking.reduce((sum, r) => sum + r.conversionRate, 0) / ranking.length : 0,
        averageTicket: ranking.length > 0 ? ranking.reduce((sum, r) => sum + r.averageTicket, 0) / ranking.length : 0,
        bestGrowth: ranking.length > 0 ? Math.max(...ranking.map(r => r.monthlyGrowth)) : 0
      };

      res.json({ ranking, stats });
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Coaching de Vendas
  app.get('/api/sales/coaching', async (req, res) => {
    try {
      const { salesperson = 'all' } = req.query;
      
      // Dados simulados de coaching
      const records = [
        {
          id: 1,
          salespersonId: 1,
          salespersonName: 'Ana Lucia',
          date: new Date().toISOString(),
          type: 'feedback',
          title: 'Melhoria no tempo de resposta',
          content: 'Trabalhar para reduzir o tempo médio de resposta para menos de 5 minutos.',
          status: 'in_progress',
          createdBy: 'Rian'
        }
      ];

      const stats = {
        totalRecords: records.length,
        inProgress: records.filter(r => r.status === 'in_progress').length,
        completed: records.filter(r => r.status === 'completed').length,
        successRate: 85.5
      };

      res.json({ records, stats });
    } catch (error) {
      console.error('Erro ao buscar coaching:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Perfis de vendedores
  app.get('/api/sales/profiles', async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      
      const profiles = users
        .filter(user => user.role !== 'admin')
        .map(user => ({
          id: user.id,
          name: user.displayName || user.email,
          responseTime: Math.floor(Math.random() * 30) + 5, // 5-35 min
          conversionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
          salesVolume: Math.floor(Math.random() * 100000) + 50000,
          strengths: ['Comunicação assertiva', 'Conhecimento técnico'],
          improvements: ['Tempo de resposta', 'Follow-up'],
          lastCoaching: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

      res.json(profiles);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Satisfação do Cliente (continuação)
  app.get('/api/bi/satisfaction', async (req, res) => {
    try {
      const { period = '30', team, channel } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Dados simulados de satisfação (em um sistema real, viriam de uma tabela de avaliações)
      const satisfactionData = {
        overall: {
          avgRating: 4.2,
          totalResponses: 156,
          satisfiedCount: 132,
          satisfiedPercentage: 84.6,
          unsatisfiedCount: 24,
          unsatisfiedPercentage: 15.4,
          responseRate: 78.5
        },
        byAgent: [
          { name: 'Ana Silva', avgRating: 4.5, totalEvaluations: 32 },
          { name: 'Carlos Santos', avgRating: 4.3, totalEvaluations: 28 },
          { name: 'Maria Oliveira', avgRating: 4.1, totalEvaluations: 25 }
        ],
        byChannel: [
          { name: 'WhatsApp', avgRating: 4.3, totalEvaluations: 89 },
          { name: 'Instagram', avgRating: 4.0, totalEvaluations: 34 },
          { name: 'Email', avgRating: 4.1, totalEvaluations: 23 }
        ],
        byTeam: [
          { 
            name: 'Equipe Comercial', 
            macrosetor: 'Vendas',
            avgRating: 4.4, 
            totalEvaluations: 67,
            satisfiedCount: 58,
            satisfiedPercentage: 86.6,
            unsatisfiedCount: 9,
            unsatisfiedPercentage: 13.4
          },
          { 
            name: 'Equipe Suporte', 
            macrosetor: 'Atendimento',
            avgRating: 4.0, 
            totalEvaluations: 45,
            satisfiedCount: 36,
            satisfiedPercentage: 80.0,
            unsatisfiedCount: 9,
            unsatisfiedPercentage: 20.0
          }
        ],
        recent: [
          {
            contactName: 'João Pedro',
            agentName: 'Ana Silva',
            rating: 5,
            comment: 'Excelente atendimento, muito prestativo!',
            channel: 'WhatsApp',
            evaluatedAt: new Date().toISOString()
          },
          {
            contactName: 'Maria José',
            agentName: 'Carlos Santos',
            rating: 4,
            comment: 'Bom atendimento, resolveu minha dúvida rapidamente.',
            channel: 'Instagram',
            evaluatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      };

      res.json(satisfactionData);
    } catch (error) {
      console.error('Erro ao buscar dados de satisfação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ============ SYSTEM SETTINGS ROUTES ============
  
  // Get all system settings or by category
  app.get('/api/system-settings', async (req, res) => {
    try {
      const { category } = req.query;
      const settings = await storage.getSystemSettings(category as string);
      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get specific system setting
  app.get('/api/system-settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      
      if (!setting) {
        return res.status(404).json({ error: 'Configuração não encontrada' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Set/Update system setting
  app.post('/api/system-settings', async (req, res) => {
    try {
      const { key, value, type = 'string', description, category = 'general' } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Chave e valor são obrigatórios' });
      }
      
      const setting = await storage.setSystemSetting(key, value, type, description, category);
      res.json(setting);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Toggle boolean system setting
  app.patch('/api/system-settings/:key/toggle', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.toggleSystemSetting(key);
      res.json(setting);
    } catch (error) {
      console.error('Erro ao alternar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Delete system setting
  app.delete('/api/system-settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteSystemSetting(key);
      res.json({ message: 'Configuração removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint de teste para detectar cursos em mensagens
  app.post('/api/test/detect-course', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
      }

      console.log(`🧪 Testando detecção de curso na mensagem: "${message}"`);
      
      const detectedCourses = storage.detectMentionedCourses(message);
      
      res.json({
        message,
        detected: detectedCourses.length > 0,
        courses: detectedCourses,
        count: detectedCourses.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao testar detecção de curso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  return httpServer;
}
