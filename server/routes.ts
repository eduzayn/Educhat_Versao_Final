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

  // Z-API Integration endpoints
  app.get("/api/zapi/contacts", async (req, res) => {
    try {
      console.log('Z-API Base URL:', process.env.ZAPI_BASE_URL);
      console.log('Z-API Token exists:', !!process.env.ZAPI_CLIENT_TOKEN);
      
      const response = await fetch(`${process.env.ZAPI_BASE_URL}/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_CLIENT_TOKEN}/contacts`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Z-API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Z-API Error response:', errorText);
        throw new Error(`Z-API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching Z-API contacts:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp contacts" });
    }
  });

  // Test Z-API connection
  app.get("/api/zapi/test", async (req, res) => {
    try {
      console.log('Testing Z-API connection...');
      console.log('Base URL:', process.env.ZAPI_BASE_URL);
      
      if (!process.env.ZAPI_BASE_URL || !process.env.ZAPI_CLIENT_TOKEN) {
        return res.status(400).json({ 
          message: "Z-API credentials not configured",
          hasBaseUrl: !!process.env.ZAPI_BASE_URL,
          hasToken: !!process.env.ZAPI_CLIENT_TOKEN
        });
      }

      // Test with a simple status endpoint first  
      const statusResponse = await fetch(`${process.env.ZAPI_BASE_URL}/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_CLIENT_TOKEN}/status`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status response:', statusResponse.status);
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Status error:', errorText);
        return res.status(statusResponse.status).json({ 
          message: `Z-API connection failed: ${statusResponse.status}`,
          error: errorText
        });
      }

      const statusData = await statusResponse.json();
      res.json({ message: "Z-API connection successful", data: statusData });
      
    } catch (error) {
      console.error("Z-API test error:", error);
      res.status(500).json({ message: "Failed to test Z-API connection", error: error.message });
    }
  });

  app.post("/api/contacts/import-from-zapi", async (req, res) => {
    try {
      console.log('Starting Z-API contact import...');
      
      if (!process.env.ZAPI_BASE_URL || !process.env.ZAPI_CLIENT_TOKEN || !process.env.ZAPI_INSTANCE_ID) {
        return res.status(400).json({ 
          message: "Z-API credentials not configured. Please provide ZAPI_BASE_URL, ZAPI_CLIENT_TOKEN and ZAPI_INSTANCE_ID." 
        });
      }

      try {
        // Buscar contatos da Z-API
        const response = await fetch(`${process.env.ZAPI_BASE_URL}/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_CLIENT_TOKEN}/contacts`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Contacts response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Contacts error response:', errorText);
          throw new Error(`Z-API error: ${response.status} - ${errorText}`);
        }

        const zapiData = await response.json();
        console.log('Received contacts from Z-API:', zapiData?.length || 0);
        
        let importedCount = 0;
        
        // Processar cada contato da Z-API
        if (Array.isArray(zapiData)) {
          for (const zapiContact of zapiData) {
            try {
              // Verificar se o contato já existe
              const existingContacts = await storage.searchContacts(zapiContact.phone || zapiContact.id);
              
              if (existingContacts.length === 0) {
                // Criar contato no banco local
                await storage.createContact({
                  name: zapiContact.name || zapiContact.pushname || zapiContact.id,
                  phone: zapiContact.phone || zapiContact.id,
                  email: null,
                  profileImageUrl: zapiContact.profilePicThumbObj?.eurl || null,
                  location: null,
                  isOnline: null
                });
                
                importedCount++;
              }
            } catch (contactError) {
              console.error("Error importing contact:", zapiContact.id, contactError);
            }
          }
        }

        res.json({ 
          message: `${importedCount} contatos importados com sucesso do WhatsApp`,
          imported: importedCount 
        });

      } catch (apiError) {
        // Se há erro na API, criar alguns contatos de demonstração
        console.log('Z-API not available, creating demo contacts...');
        
        const demoContacts = [
          {
            name: "João Silva",
            phone: "+55 11 99999-1111",
            email: "joao.silva@email.com"
          },
          {
            name: "Maria Santos", 
            phone: "+55 11 99999-2222",
            email: "maria.santos@email.com"
          },
          {
            name: "Pedro Oliveira",
            phone: "+55 11 99999-3333", 
            email: "pedro.oliveira@email.com"
          },
          {
            name: "Ana Costa",
            phone: "+55 11 99999-4444",
            email: "ana.costa@email.com"
          },
          {
            name: "Carlos Ferreira",
            phone: "+55 11 99999-5555",
            email: "carlos.ferreira@email.com"
          }
        ];

        let importedCount = 0;
        
        for (const contact of demoContacts) {
          try {
            const existing = await storage.searchContacts(contact.phone);
            if (existing.length === 0) {
              await storage.createContact({
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                profileImageUrl: null,
                location: null,
                isOnline: Math.random() > 0.5
              });
              importedCount++;
            }
          } catch (error) {
            console.error("Error creating demo contact:", error);
          }
        }

        res.json({ 
          message: `${importedCount} contatos de demonstração criados. Configure as credenciais Z-API para importar contatos reais do WhatsApp.`,
          imported: importedCount,
          demo: true
        });
      }
      
    } catch (error) {
      console.error("Error importing contacts:", error);
      res.status(500).json({ message: "Erro ao importar contatos" });
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

      // URL do webhook será a URL do Replit + /api/zapi/webhook
      const webhookUrl = `${req.protocol}://${req.get('host')}/api/zapi/webhook`;
      
      const url = `${baseUrl}/instances/${instanceId}/token/${token}/webhook`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          enabled: true,
          webhookByEvents: false
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

  // Z-API contacts endpoints
  app.get('/api/zapi/contacts', async (req, res) => {
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

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/contacts`;
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
      console.error('Erro ao buscar contatos da Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  app.get('/api/zapi/contacts/:phone/metadata', async (req, res) => {
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

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/phone-number/${phone}`;
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
      console.error('Erro ao buscar metadata do contato:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  app.post('/api/zapi/contacts/:phone/validate', async (req, res) => {
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

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/phone-exists`;
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
  app.get('/api/zapi/qr-code', async (req, res) => {
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
        
        // Extrair apenas a parte base64
        const base64Data = qrCodeDataURL.split(',')[1];
        
        res.json({ value: base64Data });
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

  return httpServer;
}
