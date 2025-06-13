/**
 * Social Media Webhook Handlers - Instagram, Facebook, SMS, Email
 * Consolidado do arquivo principal de webhooks
 */

import type { Request, Response, Express } from "express";
import { storage } from "../../../storage";

/**
 * Processa mensagem do Instagram
 */
export async function processInstagramMessage(messagingEvent: any) {
  try {
    console.log('📱 Processando mensagem Instagram:', messagingEvent);
    
    const senderId = messagingEvent.sender.id;
    const message = messagingEvent.message;
    
    // Buscar ou criar contato
    let contact = await storage.getContact(senderId);
    if (!contact) {
      contact = await storage.createContact({
        phone: senderId,
        name: `Instagram User ${senderId}`,
        source: 'instagram'
      });
    }
    
    // Buscar ou criar conversa
    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'instagram');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'instagram',
        status: 'open'
      });
    }
    
    // Criar mensagem
    const messageContent = message.text || '[Mídia Instagram]';
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageContent,
      isFromContact: true,
      messageType: message.text ? 'text' : 'media',
      sentAt: new Date(),
      metadata: {
        instagramId: messagingEvent.message.mid,
        senderId: senderId
      }
    });
    
    console.log('✅ Mensagem Instagram processada com sucesso');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao processar mensagem Instagram:', error);
    throw error;
  }
}

/**
 * Processa mensagem de Email
 */
export async function processEmailMessage(emailData: any) {
  try {
    console.log('📧 Processando mensagem de email:', emailData);
    
    const fromEmail = emailData.from;
    const subject = emailData.subject || 'Sem assunto';
    const body = emailData.body || emailData.text || '';
    
    // Buscar ou criar contato
    let contact = await storage.getContact(fromEmail);
    if (!contact) {
      contact = await storage.createContact({
        email: fromEmail,
        name: emailData.fromName || fromEmail,
        source: 'email'
      });
    }
    
    // Buscar ou criar conversa
    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'email');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'email',
        status: 'open'
      });
    }
    
    // Criar mensagem
    const messageContent = `${subject}\n\n${body}`;
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageContent,
      isFromContact: true,
      messageType: 'email',
      sentAt: new Date(),
      metadata: {
        emailId: emailData.messageId,
        subject: subject,
        fromEmail: fromEmail
      }
    });
    
    console.log('✅ Mensagem de email processada com sucesso');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao processar mensagem de email:', error);
    throw error;
  }
}

/**
 * Processa mensagem SMS
 */
export async function processSMSMessage(smsData: any) {
  try {
    console.log('📲 Processando mensagem SMS:', smsData);
    
    const fromPhone = smsData.from;
    const messageBody = smsData.body || smsData.text || '';
    
    // Buscar ou criar contato
    let contact = await storage.getContact(fromPhone);
    if (!contact) {
      contact = await storage.createContact({
        phone: fromPhone,
        name: `SMS ${fromPhone}`,
        source: 'sms'
      });
    }
    
    // Buscar ou criar conversa
    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'sms');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'sms',
        status: 'open'
      });
    }
    
    // Criar mensagem
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageBody,
      isFromContact: true,
      messageType: 'text',
      sentAt: new Date(),
      metadata: {
        smsId: smsData.messageId,
        fromPhone: fromPhone
      }
    });
    
    console.log('✅ Mensagem SMS processada com sucesso');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao processar mensagem SMS:', error);
    throw error;
  }
}

/**
 * Handler para webhooks do Instagram
 */
export async function handleInstagramWebhook(req: Request, res: Response) {
  try {
    console.log('📱 Webhook Instagram recebido:', req.body);
    
    if (req.body.object === 'page') {
      const entries = req.body.entry || [];
      
      for (const entry of entries) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await processInstagramMessage(messagingEvent);
          }
        }
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no webhook Instagram:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    });
  }
}

/**
 * Handler para webhooks de Email
 */
export async function handleEmailWebhook(req: Request, res: Response) {
  try {
    console.log('📧 Webhook Email recebido:', req.body);
    
    await processEmailMessage(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no webhook Email:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    });
  }
}

/**
 * Handler para webhooks de SMS
 */
export async function handleSMSWebhook(req: Request, res: Response) {
  try {
    console.log('📲 Webhook SMS recebido:', req.body);
    
    await processSMSMessage(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no webhook SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    });
  }
}

/**
 * Registra rotas de webhooks sociais
 */
export function registerSocialWebhookRoutes(app: Express) {
  app.post('/api/instagram/webhook', handleInstagramWebhook);
  app.post('/api/email/webhook', handleEmailWebhook);
  app.post('/api/sms/webhook', handleSMSWebhook);
}