import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import QRCode from 'qrcode';
import multer from 'multer';
import { storage } from "./storage";
import { insertContactSchema, insertConversationSchema, insertMessageSchema, insertContactTagSchema } from "@shared/schema";

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
              'Client-Token': clientToken,
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
        
        const response = await fetch(url, {
          headers: {
            'Client-Token': clientToken,
            'Content-Type': 'application/json'
          }
        });

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
        } else if (webhookData.audio) {
          messageContent = 'Áudio enviado';
          messageType = 'audio';
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
        
        const timestamp = webhookData.momment ? new Date(parseInt(webhookData.momment)) : new Date();
        
        console.log('📱 Nova mensagem via WhatsApp:', {
          de: phone,
          nome: webhookData.senderName || webhookData.chatName,
          mensagem: messageContent,
          tipo: messageType,
          timestamp: timestamp
        });
        
        // Buscar ou criar contato pelo telefone
        const contacts = await storage.searchContacts(phone);
        let contact = contacts.find(c => c.phone && c.phone.replace(/\D/g, '') === phone);
        
        if (!contact) {
          contact = await storage.createContact({
            name: webhookData.senderName || webhookData.chatName || phone,
            phone: phone,
            email: null,
            isOnline: true,
            profileImageUrl: webhookData.photo || webhookData.senderPhoto || null
          });
        } else {
          await storage.updateContactOnlineStatus(contact.id, true);
        }
        
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
        
        // Criar mensagem
        const message = await storage.createMessage({
          conversationId: conversation.id,
          content: messageContent,
          isFromContact: !webhookData.fromMe, // fromMe indica se foi enviada pela própria instância
          messageType: messageType,
          metadata: webhookData
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
        
        console.log(`✅ Mensagem processada: ${contact.name} (${phone}) - ${messageContent}`);
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
      const webhookUrl = 'https://omni-communicate-magonder.replit.app/api/zapi/webhook';
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/update-webhook-received`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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

  // Z-API integration routes
  app.get('/api/zapi/qrcode', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
      const response = await fetch(url, {
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.value) {
        // Gerar QR Code visual a partir do token
        const qrCodeDataURL = await QRCode.toDataURL(data.value, {
          width: 256,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Retornar o QR Code completo como data URL
        res.json({ qrCode: qrCodeDataURL });
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  app.get('/api/zapi/status', async (req, res) => {
    try {
      const baseUrl = 'https://api.z-api.io'; // URL fixa da Z-API
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // Tentar múltiplos endpoints para verificar status
      const endpoints = [
        `/instances/${instanceId}/token/${token}/status`,
        `/instances/${instanceId}/token/${token}/connection-status`,
        `/instances/${instanceId}/token/${token}`
      ];

      let finalData = null;
      let finalError = null;

      for (const endpoint of endpoints) {
        try {
          const url = `${baseUrl}${endpoint}`;
          const response = await fetch(url, {
            headers: {
              'Client-Token': clientToken,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            // Se este endpoint retornou dados úteis, use ele
            if (finalData === null || (data.session !== undefined)) {
              finalData = data;
            }
            
            // Log para debug
            console.log(`Status de ${endpoint}:`, JSON.stringify(data, null, 2));
          }
        } catch (err) {
          console.log(`Erro em ${endpoint}:`, err);
        }
      }

      if (finalData) {
        res.json(finalData);
      } else {
        throw new Error('Nenhum endpoint de status funcionou');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
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
          }
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
        content: audioBase64, // Salvar o áudio base64 para reprodução local
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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
          'Client-Token': clientToken,
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

  // Endpoint para obter URL do webhook
  app.get('/api/webhook-url', (req, res) => {
    const webhookUrl = 'https://omni-communicate-magonder.replit.app/api/zapi/webhook';
    
    res.json({ 
      webhookUrl,
      instructions: "Configure esta URL no painel da Z-API na seção 'Ao receber'"
    });
  });

  return httpServer;
}
