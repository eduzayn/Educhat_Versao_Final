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
      
      // Broadcast to WebSocket clients
      broadcast(conversationId, {
        type: 'new_message',
        message,
      });
      
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
        const message = await storage.createMessage({
          conversationId: conversation.id,
          content: messageContent,
          isFromContact: !webhookData.fromMe, // fromMe indica se foi enviada pela própria instância
          messageType: messageType,
          sentAt: new Date(webhookData.momment || Date.now()),
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

      // Resetar o contador de mensagens não lidas da conversa
      await storage.updateConversation(conversationId, { unreadCount: 1 });

      console.log(`📧 Conversa ${conversationId} marcada como não lida`);
      
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
        roleInTeam: roleInTeam || 'member',
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
      
      if (!teamId) {
        return res.status(400).json({ message: 'teamId é obrigatório' });
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
      
      if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório' });
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

  return httpServer;
}
