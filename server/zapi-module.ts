import { Express, Request, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from './permissions';

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/avi', 'video/mov', 'video/webm',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  }
});

// Interface para validação de credenciais Z-API
interface ZApiCredentials {
  valid: boolean;
  instanceId?: string;
  token?: string;
  clientToken?: string;
  error?: string;
}

/**
 * Validação das credenciais Z-API
 */
function validateZApiCredentials(): ZApiCredentials {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token) {
    return {
      valid: false,
      error: 'Credenciais Z-API não configuradas. Verifique ZAPI_INSTANCE_ID e ZAPI_TOKEN.'
    };
  }

  return {
    valid: true,
    instanceId,
    token,
    clientToken
  };
}

/**
 * Classe principal do módulo Z-API
 */
export class ZApiModule {
  private storage: any;
  private broadcast: (conversationId: number, message: any, excludeSocketId?: string) => void;

  constructor(storage: any, broadcast: (conversationId: number, message: any, excludeSocketId?: string) => void) {
    this.storage = storage;
    this.broadcast = broadcast;
  }

  /**
   * Registra todas as rotas Z-API no aplicativo Express
   */
  registerRoutes(app: Express): void {
    // Webhook Z-API
    app.post('/api/zapi/webhook', this.handleWebhook.bind(this));
    
    // Configuração
    app.put('/api/zapi/webhook', this.configureWebhook.bind(this));
    app.get('/api/zapi/status', this.getStatus.bind(this));
    app.delete('/api/zapi/connection', this.disconnect.bind(this));
    
    // Mensagens
    app.post('/api/zapi/messages', this.sendMessage.bind(this));
    app.post('/api/zapi/reply-message', this.replyMessage.bind(this));
    app.delete('/api/zapi/messages/:messageId', this.deleteMessage.bind(this));
    app.patch('/api/zapi/messages/read', this.markAsRead.bind(this));
    
    // Reações
    app.post('/api/zapi/reactions', this.sendReaction.bind(this));
    app.delete('/api/zapi/reactions', this.removeReaction.bind(this));
    
    // Mídia
    app.post('/api/zapi/media/audio', upload.single('audio'), this.sendAudio.bind(this));
    app.post('/api/zapi/media/images', upload.single('image'), this.sendImage.bind(this));
    app.post('/api/zapi/media/videos', upload.single('video'), this.sendVideo.bind(this));
    app.post('/api/zapi/media/documents', upload.single('document'), this.sendDocument.bind(this));
    
    // Links
    app.post('/api/zapi/links', this.sendLink.bind(this));
    
    // Contatos
    app.post('/api/zapi/contacts/:phone/validate', this.validateContact.bind(this));
    app.patch('/api/zapi/contacts/:phone/block', this.blockContact.bind(this));
    app.post('/api/contacts/import-from-zapi', this.importContacts.bind(this));
    
    // QR Code
    app.get('/api/channels/:id/qrcode', this.getQRCode.bind(this));
  }

  /**
   * Manipulador do webhook Z-API
   */
  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('📨 Webhook Z-API recebido:', req.body);
      console.log('📨 Headers do webhook:', req.headers);

      const webhookData = req.body;

      // Processar diferentes tipos de webhook
      switch (webhookData.type) {
        case 'MessageStatusCallback':
          await this.processStatusUpdate(webhookData);
          break;
        case 'ReceivedCallback':
          await this.processReceivedMessage(webhookData);
          break;
        default:
          console.log('📨 Tipo de webhook não reconhecido:', webhookData.type);
      }

      res.json({ success: true, type: webhookData.type || 'unknown' });
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Processar atualizações de status de mensagem
   */
  private async processStatusUpdate(data: any): Promise<void> {
    const { status, phone, ids } = data;
    
    if (status && phone && ids?.length > 0) {
      console.log(`📋 Status da mensagem atualizado: ${status} para ${phone}`);
      // Aqui você pode atualizar o status no banco de dados se necessário
    }
  }

  /**
   * Processar mensagens recebidas
   */
  private async processReceivedMessage(data: any): Promise<void> {
    console.log('📥 Mensagem recebida via webhook:', data);
    
    try {
      const { phone, message, instanceId, messageId, fromMe, chatId } = data;
      
      if (fromMe) {
        console.log('📤 Mensagem enviada por mim, ignorando webhook');
        return;
      }

      if (!phone || !message) {
        console.log('❌ Dados incompletos no webhook:', { phone: !!phone, message: !!message });
        return;
      }

      // Buscar ou criar contato
      let contact = await this.storage.getContactByPhone(phone);
      if (!contact) {
        contact = await this.storage.createContact({
          name: phone,
          phone: phone,
          isFromWhatsApp: true,
          profileImageUrl: null,
          channelId: 1 // WhatsApp padrão
        });
        console.log('👤 Novo contato criado:', contact.name);
      }

      // Buscar ou criar conversa
      let conversation = await this.storage.getConversationByContactId(contact.id);
      if (!conversation) {
        conversation = await this.storage.createConversation({
          contactId: contact.id,
          channelId: 1,
          status: 'ACTIVE',
          lastMessageAt: new Date(),
          assignedUserId: null,
          assignedTeamId: null
        });
        console.log('💬 Nova conversa criada:', conversation.id);
      }

      // Determinar tipo de mensagem
      let messageType = 'text';
      let content = message.text || message.body || '';
      let mediaUrl = null;

      if (message.image) {
        messageType = 'image';
        content = message.image.caption || 'Imagem';
        mediaUrl = message.image.url;
      } else if (message.audio) {
        messageType = 'audio';
        content = 'Áudio';
        mediaUrl = message.audio.url;
      } else if (message.video) {
        messageType = 'video';
        content = message.video.caption || 'Vídeo';
        mediaUrl = message.video.url;
      } else if (message.document) {
        messageType = 'document';
        content = message.document.filename || 'Documento';
        mediaUrl = message.document.url;
      }

      // Criar mensagem no banco
      const newMessage = await this.storage.createMessage({
        conversationId: conversation.id,
        content: content,
        messageType: messageType as any,
        isFromContact: true,
        sentAt: new Date(),
        metadata: {
          whatsappMessageId: messageId,
          chatId: chatId,
          zapiInstanceId: instanceId,
          mediaUrl: mediaUrl
        }
      });

      // Atualizar última mensagem da conversa
      await this.storage.updateConversation(conversation.id, {
        lastMessageAt: new Date(),
        status: 'ACTIVE'
      });

      // Broadcast da nova mensagem
      this.broadcast(conversation.id, {
        type: 'new_message',
        conversationId: conversation.id,
        message: newMessage
      });

      // Broadcast global para atualizar lista de conversas
      this.broadcast(conversation.id, {
        type: 'conversation_updated',
        conversation: {
          ...conversation,
          lastMessageAt: new Date(),
          contact: contact
        }
      });

      console.log('✅ Mensagem processada com sucesso:', {
        conversationId: conversation.id,
        messageId: newMessage.id,
        type: messageType,
        from: phone
      });

    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
    }
  }

  /**
   * Configurar webhook
   */
  private async configureWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        res.status(400).json({ error: credentials.error });
        return;
      }

      const { instanceId, token, clientToken } = credentials;
      const webhookUrl = `${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}/api/zapi/webhook`;

      // Configurar webhook usando a API correta da Z-API
      const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/webhook/${encodeURIComponent(webhookUrl)}`, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.text();
      console.log('🔗 Webhook configurado:', result);

      res.json({ success: true, webhookUrl, response: result });
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter status da conexão Z-API
   */
  private async getStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 Solicitação recebida em /api/zapi/status');
      
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      console.log('🔑 Variáveis Z-API:', { 
        instanceId: instanceId?.substring(0, 4) + '...', 
        token: token?.substring(0, 4) + '...', 
        clientToken: clientToken?.substring(0, 4) + '...' 
      });

      if (!instanceId || !token) {
        return res.status(400).json({ 
          error: 'Credenciais Z-API não configuradas',
          connected: false 
        });
      }

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      console.log('🔍 URL da API Z-API:', url.replace(token, '****'));

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Resposta Z-API:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta Z-API:', errorText);
        return res.status(response.status).json({ 
          error: 'Erro ao verificar status Z-API',
          details: errorText,
          connected: false 
        });
      }

      const data = await response.json();
      console.log('✅ Status da Z-API obtido com sucesso:', data);

      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao obter status Z-API:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        connected: false 
      });
    }
  }

  /**
   * Desconectar instância Z-API
   */
  private async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = 'https://api.z-api.io';
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token) {
        return res.status(400).json({ error: 'Credenciais Z-API não configuradas' });
      }

      const url = `${baseUrl}/instances/${instanceId}/token/${token}/logout`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.text();
      console.log('🔌 Desconexão Z-API:', result);

      res.json({ success: true, message: 'Instância desconectada', response: result });
    } catch (error) {
      console.error('❌ Erro ao desconectar Z-API:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Enviar mensagem de texto
   */
  private async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📤 Recebendo solicitação de envio de mensagem:', req.body);
      
      const { phone, message, conversationId } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ 
          error: 'Phone e message são obrigatórios' 
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
        message: message
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
      console.log('📤 Enviando mensagem via Z-API:', { url: url.replace(token, '****'), payload, conversationId });

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
        return res.status(response.status).json({ 
          error: 'Erro ao enviar mensagem',
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

      // Salvar mensagem no banco de dados se conversationId foi fornecido
      // Mesmo sem messageId da Z-API, salvamos a mensagem para aparecer na interface
      if (conversationId) {
        const messageId = data.messageId || `zapi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newMessage = await this.storage.createMessage({
          conversationId: parseInt(conversationId),
          content: message,
          messageType: 'text',
          isFromContact: false,
          sentAt: new Date(),
          metadata: {
            messageId: messageId,
            zaapId: messageId,
            zapiResponse: data
          }
        });

        this.broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: newMessage
        });
        
        console.log('💾 Mensagem salva no banco de dados:', {
          id: newMessage.id,
          conversationId: parseInt(conversationId),
          content: message
        });
      }

      console.log('✅ Mensagem enviada com sucesso via Z-API:', data);
      
      res.json({
        success: true,
        messageId: data.messageId,
        sentAt: new Date().toISOString(),
        ...data
      });
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: error instanceof Error ? error.stack : 'Erro desconhecido'
      });
    }
  }

  /**
   * Responder a uma mensagem específica
   */
  private async replyMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('↩️ Recebendo solicitação de resposta à mensagem:', req.body);
      
      const { phone, messageId, replyText, conversationId } = req.body;
      
      if (!phone || !messageId || !replyText) {
        return res.status(400).json({ 
          error: 'Phone, messageId e replyText são obrigatórios' 
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
        message: replyText,
        messageId: messageId.toString()
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-reply-message`;
      console.log('↩️ Respondendo mensagem via Z-API:', { 
        url: url.replace(token, '****'), 
        payload,
        conversationId 
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
      console.log('📥 Resposta Z-API reply:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API:', responseText);
        return res.status(response.status).json({ 
          error: 'Erro ao responder mensagem',
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

      // Salvar mensagem de resposta no banco
      if (conversationId && data.messageId) {
        const replyMessage = await this.storage.createMessage({
          conversationId: parseInt(conversationId),
          content: replyText,
          messageType: 'text',
          isFromContact: false,
          sentAt: new Date(),
          metadata: {
            messageId: data.messageId,
            replyToMessageId: messageId.toString(),
            zaapId: data.messageId
          }
        });

        this.broadcast(parseInt(conversationId), {
          type: 'new_message',
          message: replyMessage
        });
      }

      console.log('✅ Resposta enviada com sucesso via Z-API:', data);
      
      res.json({
        success: true,
        messageId: data.messageId,
        replyToMessageId: messageId.toString(),
        sentAt: new Date().toISOString(),
        ...data
      });
      
    } catch (error) {
      console.error('❌ Erro ao responder mensagem:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: error instanceof Error ? error.stack : 'Erro desconhecido'
      });
    }
  }

  private async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de exclusão de mensagens
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de marcar como lida
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async sendReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de envio de reações
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async removeReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de remoção de reações
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async sendAudio(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de envio de áudio
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async sendImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de envio de imagem
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async sendVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de envio de vídeo
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async sendDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de envio de documento
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async sendLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de envio de link
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async validateContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de validação de contato
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async blockContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de bloqueio de contato
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async importContacts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de importação de contatos
    res.status(501).json({ error: 'Método em implementação' });
  }

  private async getQRCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementação de obtenção de QR Code
    res.status(501).json({ error: 'Método em implementação' });
  }
}