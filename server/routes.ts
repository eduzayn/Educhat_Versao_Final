import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import QRCode from 'qrcode';
import { storage } from "./storage";
import { insertContactSchema, insertConversationSchema, insertMessageSchema, insertContactTagSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup do sistema de autenticação próprio
  const { setupAuth } = await import("./auth");
  setupAuth(app);

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

  // Test Z-API connection
  app.get("/api/zapi/test", async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ message: credentials.error });
      }

      const { instanceId, token } = credentials;
      const statusResponse = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/status`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        return res.status(statusResponse.status).json({ 
          message: `Z-API connection failed: ${statusResponse.status}`,
          error: errorText
        });
      }

      const statusData = await statusResponse.json();
      res.json({ message: "Z-API connection successful", data: statusData });
      
    } catch (error) {
      console.error("Z-API test error:", error);
      res.status(500).json({ message: "Failed to test Z-API connection", error: (error as Error).message });
    }
  });

  // Add contact to Z-API WhatsApp
  app.post("/api/zapi/contacts/add", async (req, res) => {
    try {
      const { firstName, lastName, phone } = req.body;
      
      if (!firstName || !phone) {
        return res.status(400).json({ error: 'firstName and phone are required' });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const contactData = [{
        firstName,
        lastName: lastName || '',
        phone: cleanPhone
      }];

      const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/contacts/add`, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Z-API add contact error:', errorData);
        throw new Error(`Z-API add contact failed: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
      
    } catch (error) {
      console.error('Z-API add contact error:', error);
      res.status(500).json({ error: 'Failed to add contact to Z-API' });
    }
  });

  // Get contact profile picture from Z-API
  app.get('/api/zapi/profile-picture', async (req, res) => {
    try {
      const { phone } = req.query;
      
      if (!phone) {
        return res.status(400).json({ error: 'Phone parameter is required' });
      }
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = (phone as string).replace(/\D/g, '');
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-picture?phone=${cleanPhone}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Z-API profile picture error:', errorData);
        throw new Error(`Z-API request failed: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
      
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      res.status(500).json({ 
        error: 'Failed to fetch profile picture from Z-API' 
      });
    }
  });

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
      const conversations = await storage.getConversations();
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

  // Messages endpoints
  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessages(id, limit);
      res.json(messages.reverse()); // Return in chronological order
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

  // Z-API webhook endpoint
  app.post('/api/zapi/webhook', async (req, res) => {
    try {
      console.log('📨 Webhook Z-API recebido:', JSON.stringify(req.body, null, 2));
      
      const webhookData = req.body;
      
      // Processar mensagens recebidas
      if (webhookData.phone && webhookData.text) {
        console.log('📱 Nova mensagem via WhatsApp:', {
          de: webhookData.phone,
          mensagem: webhookData.text.message,
          timestamp: webhookData.timestamp
        });
        
        // Buscar ou criar contato pelo telefone
        const contacts = await storage.searchContacts(webhookData.phone);
        let contact = contacts.find(c => c.phone === webhookData.phone);
        
        if (!contact) {
          contact = await storage.createContact({
            name: webhookData.senderName || webhookData.phone,
            phone: webhookData.phone,
            isOnline: true,
            lastSeenAt: new Date()
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
          content: webhookData.text.message,
          isFromContact: true
        });
        
        // Broadcast para clientes conectados
        broadcast(conversation.id, {
          type: 'new_message',
          conversationId: conversation.id,
          message: message
        });
        
        console.log('✅ Mensagem processada e salva');
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
      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      // URL do webhook será a URL pública do Replit + /api/zapi/webhook  
      const host = req.get('host');
      const webhookUrl = host?.includes('replit.dev') 
        ? `https://${host}/api/zapi/webhook`
        : `${req.protocol}://${req.get('host')}/api/zapi/webhook`;
      
      const url = `${baseUrl}/instances/${instanceId}/token/${token}/update-webhook-received`;
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
      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Credenciais da Z-API não configuradas' 
        });
      }

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/block`;
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

  // Z-API integration routes
  app.get('/api/zapi/qrcode', async (req, res) => {
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

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/qr-code`;
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

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/status`;
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
      res.json(data);
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
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ 
          error: 'Telefone e mensagem são obrigatórios' 
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

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/send-text`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro ao enviar mensagem via Z-API:', error);
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
    const host = req.get('host');
    const webhookUrl = host?.includes('replit.dev') 
      ? `https://${host}/api/zapi/webhook`
      : `${req.protocol}://${req.get('host')}/api/zapi/webhook`;
    
    res.json({ 
      webhookUrl,
      instructions: "Configure esta URL no painel da Z-API na seção 'Ao receber'"
    });
  });

  return httpServer;
}
