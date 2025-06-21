/**
 * Integration Webhook Handlers - Manychat, Test webhooks, e utilidades
 * Consolidado do arquivo principal de webhooks
 */

import type { Request, Response, Express } from "express";
import { storage } from "../../../storage";
import { conversationAssignmentService } from '../../../services/conversationAssignmentService';

/**
 * Handler para webhook Manychat
 */
export async function handleManychatWebhook(req: Request, res: Response) {
  try {
    console.log('🤖 Webhook Manychat recebido:', req.body);
    
    const { trigger, user, ...eventData } = req.body;
    
    if (!user || !user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados do usuário são obrigatórios' 
      });
    }
    
    // Buscar ou criar contato
    let contact = await storage.getContact(user.id.toString());
    if (!contact) {
      contact = await storage.createContact({
        phone: user.phone || user.id.toString(),
        name: user.name || `Manychat User ${user.id}`,
        source: 'manychat',
        email: user.email
      });
    }
    
    // Buscar ou criar conversa
    let conversation = await storage.getConversationByContactAndChannel(contact.id, 'manychat');
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        channel: 'manychat',
        status: 'open'
      });
    }
    
    // Criar mensagem baseada no trigger
    const messageContent = `Trigger Manychat: ${trigger}`;
    await storage.createMessage({
      conversationId: conversation.id,
      content: messageContent,
      isFromContact: true,
      messageType: 'manychat_trigger',
      sentAt: new Date(),
      metadata: {
        manychatTrigger: trigger,
        manychatUser: user,
        eventData
      }
    });
    
    console.log('✅ Webhook Manychat processado com sucesso');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no webhook Manychat:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    });
  }
}

/**
 * Handler para teste de webhook
 */
export async function handleTestWebhook(req: Request, res: Response) {
  try {
    console.log('🧪 Webhook de teste recebido:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query
    });
    
    const testData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      bodyReceived: !!req.body,
      queryParams: req.query,
      bodySize: JSON.stringify(req.body).length
    };
    
    console.log('📊 Dados do teste processados:', testData);
    
    res.status(200).json({
      success: true,
      message: 'Webhook de teste processado com sucesso',
      data: testData,
      echo: req.body
    });
  } catch (error) {
    console.error('❌ Erro no webhook de teste:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    });
  }
}

/**
 * Função helper para atribuição manual de equipes
 */
export async function assignTeamManually(conversationId: number, teamId?: number) {
  try {
    // ISOLAMENTO: Validação estrita de entrada para evitar efeitos colaterais
    if (!conversationId || typeof conversationId !== 'number' || conversationId <= 0) {
      console.warn(`⚠️ conversationId inválido para atribuição manual: ${conversationId}`);
      return;
    }
    
    if (!teamId || typeof teamId !== 'number' || teamId <= 0) {
      console.warn(`⚠️ teamId inválido para atribuição manual: ${teamId}`);
      return;
    }
    
    console.log(`🔒 ISOLADO: Iniciando atribuição manual para conversa ${conversationId} → equipe ${teamId}`);
    
    // ISOLAMENTO: Buscar conversa específica com WHERE explícito
    const currentConversation = await storage.getConversation(conversationId);
    if (!currentConversation) {
      console.warn(`⚠️ Conversa ${conversationId} não encontrada para atribuição manual`);
      return;
    }
    
    const shouldReassign = !currentConversation?.assignedTeamId || 
                          currentConversation.assignedTeamId !== teamId;
    
    if (shouldReassign) {
      // ISOLAMENTO: Atribuição com conversationId específico
      await conversationAssignmentService.assignConversationToTeam(conversationId, teamId, { method: 'manual' });
      console.log(`✅ ISOLADO: Conversa ID ${conversationId} atribuída manualmente à equipe ${teamId}`);
      
      // ISOLAMENTO: Buscar usuário disponível apenas para esta equipe específica
      const availableUser = await storage.getAvailableUserFromTeam(teamId);
      if (availableUser) {
        // ISOLAMENTO: Atribuir usuário apenas para esta conversa específica
        await conversationAssignmentService.assignConversationToUser(conversationId, availableUser.id, { method: 'manual' });
        console.log(`👤 ISOLADO: Conversa ${conversationId} atribuída manualmente ao usuário ${availableUser.displayName} (ID: ${availableUser.id})`);
      }
    } else {
      console.log(`ℹ️ ISOLADO: Conversa ${conversationId} já está atribuída à equipe correta (${teamId})`);
    }
  } catch (assignmentError) {
    console.error(`❌ ISOLADO: Erro na atribuição manual para conversa ${conversationId}:`, assignmentError);
  }
}

/**
 * Registra rotas de integração
 */
export function registerIntegrationRoutes(app: Express) {
  app.post('/api/integrations/manychat/webhook', handleManychatWebhook);
  app.post('/api/test-webhook', handleTestWebhook);
}