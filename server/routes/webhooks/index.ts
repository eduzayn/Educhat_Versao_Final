/**
 * Sistema de Webhooks Consolidado - EduChat
 * Arquivo principal que integra todos os handlers modulares
 * Reduzido de 1950 linhas para uma arquitetura modular organizada
 */

import type { Express } from "express";
import { storage } from "../../storage/index";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../utils/zapi";
import { webhookHealthMonitor, validateWebhookData } from "../../webhookHealthCheck";
import { gamificationService } from "../../services/gamificationService";
import { dealAutomationService } from "../../services/dealAutomationService";

// Importar handlers modulares
import { registerZApiMediaRoutes } from './handlers/zapi';
import { registerSocialWebhookRoutes } from './handlers/social';
import { registerIntegrationRoutes, assignTeamManually } from './handlers/integration';
import { autoAssignIfNeeded } from '../../services/immediate-ai-assignment.js';

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
        messageType = 'image';
        // Para imagens, armazenar a URL no content para exibição direta
        const imageUrl = webhookData.image.imageUrl || webhookData.image.url;
        let finalFileName = webhookData.image.fileName || 'image.jpg';
        
        // Detectar GIFs baseado no tipo MIME ou extensão do arquivo
        if (webhookData.image.mimeType === 'image/gif' || finalFileName.toLowerCase().endsWith('.gif')) {
          messageType = 'gif';
          messageContent = imageUrl || `🎬 ${webhookData.image.caption || 'GIF'}`;
        } else {
          messageContent = imageUrl || `📷 ${webhookData.image.caption || 'Imagem'}`;
        }
        
        mediaUrl = imageUrl;
        fileName = finalFileName;
      } else if (webhookData.audio) {
        messageType = 'audio';
        const audioSeconds = webhookData.audio.seconds || webhookData.audio.duration || 0;
        const audioUrl = webhookData.audio.audioUrl || webhookData.audio.url;
        // Para áudios, armazenar a URL no content para reprodução direta
        messageContent = audioUrl || `🎵 Áudio (${audioSeconds}s)`;
        mediaUrl = audioUrl;
        fileName = webhookData.audio.fileName || 'audio.ogg';
      } else if (webhookData.video) {
        messageType = 'video';
        const videoUrl = webhookData.video.videoUrl || webhookData.video.url;
        // Para vídeos, armazenar a URL no content
        messageContent = videoUrl || `🎥 ${webhookData.video.caption || 'Vídeo'}`;
        mediaUrl = videoUrl;
        fileName = webhookData.video.fileName || 'video.mp4';
      } else if (webhookData.document) {
        messageType = 'document';
        const documentUrl = webhookData.document.documentUrl || webhookData.document.url;
        messageContent = documentUrl || `📄 ${webhookData.document.fileName || 'Documento'}`;
        mediaUrl = documentUrl;
        fileName = webhookData.document.fileName;
      } else if (webhookData.sticker) {
        messageType = 'sticker';
        const stickerUrl = webhookData.sticker.stickerUrl || webhookData.sticker.url;
        messageContent = stickerUrl || '🎭 Figurinha';
        mediaUrl = stickerUrl;
        fileName = webhookData.sticker.fileName || 'sticker.webp';
      } else if (webhookData.location) {
        messageType = 'location';
        messageContent = `📍 Localização: ${webhookData.location.latitude}, ${webhookData.location.longitude}`;
      } else if (webhookData.contact) {
        messageType = 'contact';
        messageContent = `👤 Contato: ${webhookData.contact.displayName || webhookData.contact.name || 'Contato compartilhado'}`;
      } else if (webhookData.reaction) {
        messageType = 'reaction';
        messageContent = `${webhookData.reaction.emoji || '👍'} Reação à mensagem`;
      } else if (webhookData.poll) {
        messageType = 'poll';
        messageContent = `📊 Enquete: ${webhookData.poll.name || 'Nova enquete'}`;
      } else if (webhookData.button) {
        messageType = 'button';
        messageContent = `🔘 Botão: ${webhookData.button.text || 'Botão clicado'}`;
      } else if (webhookData.list) {
        messageType = 'list';
        messageContent = `📋 Lista: ${webhookData.list.title || 'Lista interativa'}`;
      } else if (webhookData.template) {
        messageType = 'template';
        messageContent = `📨 Template: ${webhookData.template.name || 'Mensagem template'}`;
      } else {
        // Para tipos verdadeiramente desconhecidos, registrar no log para análise
        console.log('🔍 Tipo de mensagem não reconhecido:', JSON.stringify(webhookData, null, 2));
        messageContent = `⚠️ Tipo de mensagem ainda não suportado pelo sistema`;
        messageType = 'unsupported';
      }
      
      // Buscar ou criar contato
      let contact = await storage.getContactByPhone(phone);
      if (!contact) {
        contact = await storage.createContact({
          phone: phone,
          name: webhookData.senderName || `WhatsApp ${phone}`,
          canalOrigem: 'whatsapp',
          userIdentity: phone
        });
      }
      
      // Buscar ou criar conversa
      let conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
      let isNewConversation = false;
      if (!conversation) {
        conversation = await storage.createConversation({
          contactId: contact.id,
          channel: 'whatsapp',
          status: 'open'
        });
        isNewConversation = true;
        console.log(`✅ Nova conversa criada: ID ${conversation.id} para contato ${contact.name} (${contact.phone})`);
      }
      
      // Garantir que a conversa foi criada com sucesso
      if (!conversation || !conversation.id) {
        throw new Error('Falha ao criar ou recuperar conversa');
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
          originalContent: messageContent,
          // Metadados específicos por tipo de mídia
          ...(messageType === 'image' && webhookData.image ? {
            image: {
              imageUrl: webhookData.image.imageUrl || webhookData.image.url,
              url: webhookData.image.imageUrl || webhookData.image.url,
              fileName: webhookData.image.fileName || 'image.jpg',
              mimeType: webhookData.image.mimeType || 'image/jpeg',
              caption: webhookData.image.caption
            }
          } : {}),
          ...(messageType === 'audio' && webhookData.audio ? {
            audio: {
              audioUrl: webhookData.audio.audioUrl || webhookData.audio.url,
              url: webhookData.audio.audioUrl || webhookData.audio.url,
              duration: webhookData.audio.seconds || webhookData.audio.duration || 0,
              seconds: webhookData.audio.seconds || webhookData.audio.duration || 0,
              fileName: webhookData.audio.fileName || 'audio.ogg',
              mimeType: webhookData.audio.mimeType || 'audio/ogg'
            }
          } : {}),
          ...(messageType === 'video' && webhookData.video ? {
            video: {
              videoUrl: webhookData.video.videoUrl || webhookData.video.url,
              url: webhookData.video.videoUrl || webhookData.video.url,
              fileName: webhookData.video.fileName || 'video.mp4',
              mimeType: webhookData.video.mimeType || 'video/mp4',
              caption: webhookData.video.caption
            }
          } : {}),
          ...(messageType === 'document' && webhookData.document ? {
            document: {
              documentUrl: webhookData.document.documentUrl || webhookData.document.url,
              url: webhookData.document.documentUrl || webhookData.document.url,
              fileName: webhookData.document.fileName || 'document.pdf',
              mimeType: webhookData.document.mimeType || 'application/pdf'
            }
          } : {}),
          ...(messageType === 'sticker' && webhookData.sticker ? {
            sticker: {
              stickerUrl: webhookData.sticker.stickerUrl || webhookData.sticker.url,
              url: webhookData.sticker.stickerUrl || webhookData.sticker.url,
              fileName: webhookData.sticker.fileName || 'sticker.webp',
              mimeType: webhookData.sticker.mimeType || 'image/webp'
            }
          } : {})
        }
      });
      
      // CORREÇÃO CRÍTICA: Atualizar conversa com unreadCount e lastMessageAt
      try {
        await storage.updateConversation(conversation.id, {
          lastMessageAt: new Date(),
          unreadCount: (conversation.unreadCount || 0) + 1,
          isRead: false,
          updatedAt: new Date()
        });
        console.log(`✅ Conversa ${conversation.id} atualizada com nova mensagem`);
      } catch (updateError) {
        console.error('❌ Erro ao atualizar conversa:', updateError);
      }

      // CORREÇÃO CRÍTICA: WebSocket broadcast robusto com fallbacks
      try {
        const { broadcast, broadcastToAll } = await import('../realtime');
        
        // Dados completos da conversa para sincronização
        const conversationData = {
          id: conversation.id,
          contactId: contact.id,
          contactName: contact.name,
          contactPhone: contact.phone,
          channel: 'whatsapp',
          lastMessage: {
            id: message.id,
            content: messageContent,
            sentAt: new Date().toISOString(),
            isFromContact: true,
            messageType: messageType
          },
          unreadCount: (conversation.unreadCount || 0) + 1,
          lastMessageAt: new Date().toISOString(),
          isRead: false
        };
        
        // Se é uma nova conversa, enviar evento de criação PRIMEIRO
        if (isNewConversation) {
          console.log(`📡 Broadcasting nova conversa criada: ID ${conversation.id}`);
          broadcastToAll({
            type: 'conversation_list_update',
            action: 'new_conversation',
            conversation: conversationData
          });
          
          // Aguardar para garantir ordem de eventos
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Broadcast da nova mensagem para todos os clientes
        broadcastToAll({
          type: 'conversation_list_update',
          action: 'message_received',
          conversationId: conversation.id,
          conversation: conversationData,
          message: message
        });
        
        // Broadcast específico para a sala da conversa
        broadcast(conversation.id, {
          type: 'new_message',
          conversationId: conversation.id,
          message: message
        });
        
        console.log(`📡 WebSocket broadcast enviado para conversa ${conversation.id}`);
      } catch (wsError) {
        console.error('❌ CRÍTICO: Falha no WebSocket broadcast:', wsError);
        
        // FALLBACK: Forçar invalidação de cache via evento alternativo
        try {
          const { broadcastToAll } = await import('../realtime');
          broadcastToAll({
            type: 'force_conversation_refresh',
            timestamp: new Date().toISOString()
          });
        } catch (fallbackError) {
          console.error('❌ CRÍTICO: Falha no fallback do WebSocket:', fallbackError);
        }
      }
      
      console.log(`📱 Mensagem processada para contato:`, contact.name);
      
      // **PROCESSAMENTO AUTOMÁTICO IMEDIATO COM IA**
      // Apenas para mensagens de texto relevantes
      if (messageType === 'text' && messageContent && messageContent.length > 10) {
        await autoAssignIfNeeded(conversation.id, messageContent);
      }

      // **CRIAÇÃO AUTOMÁTICA DE DEALS PARA CONVERSAS NÃO ATRIBUÍDAS**
      // Verificar se a conversa não possui atribuição e criar deal se necessário
      if (!conversation.assignedUserId && !conversation.assignedTeamId && messageType === 'text') {
        try {
          console.log(`💼 Verificando necessidade de deal automático para conversa não atribuída ${conversation.id}`);
          // Usar equipe comercial como padrão para conversas não atribuídas
          // Buscar equipe comercial dinamicamente
          const comercialTeam = await storage.getTeamByType('comercial');
          const teamId = comercialTeam?.id || 1;
          const dealId = await dealAutomationService.createAutomaticDeal(conversation.id, teamId);
          if (dealId) {
            console.log(`✅ Deal automático criado para conversa não atribuída: ID ${dealId}`);
          }
        } catch (dealError) {
          console.error(`❌ Erro ao criar deal para conversa não atribuída:`, dealError);
        }
      }
      
      // ANÁLISE DE IA E TRANSFERÊNCIAS AUTOMÁTICAS (Sistema Legado)
      try {
        // Só processar mensagens de texto para IA (evitar sobrecarga)
        if (messageType === 'text' && messageContent && messageContent.length > 5) {
          console.log(`🤖 Iniciando análise de IA para mensagem: "${messageContent}"`);
          
          // Chamar endpoint de handoff inteligente
          const handoffResponse = await fetch('http://localhost:5000/api/handoffs/intelligent/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-call': 'true'
            },
            body: JSON.stringify({
              conversationId: parseInt(conversation.id.toString()),
              messageContent: messageContent,
              type: 'automatic'
            })
          });

          if (handoffResponse.ok) {
            const handoffResult = await handoffResponse.json();
            console.log(`✅ Análise de IA concluída:`, {
              handoffCreated: handoffResult.handoffCreated,
              confidence: handoffResult.recommendation?.confidence,
              reason: handoffResult.recommendation?.reason
            });
            
            if (handoffResult.handoffCreated && handoffResult.assignedUserId) {
              console.log(`🔄 Transferência automática executada com sucesso para conversa ${conversation.id}`);
              
              // Atualizar gamificação para o usuário que recebeu a conversa
              try {
                await gamificationService.updateUserStats(handoffResult.assignedUserId, 'daily', new Date());
                await gamificationService.updateUserStats(handoffResult.assignedUserId, 'weekly', new Date());
                await gamificationService.updateUserStats(handoffResult.assignedUserId, 'monthly', new Date());
                console.log(`🎮 Gamificação atualizada via webhook para usuário ${handoffResult.assignedUserId}`);
              } catch (gamError) {
                console.error(`❌ Erro ao atualizar gamificação via webhook:`, gamError);
              }
              
              // Criar deal automático quando conversa é atribuída
              if (handoffResult.assignedTeamId) {
                try {
                  console.log(`💼 Iniciando criação automática de deal para conversa ${conversation.id}`);
                  const dealId = await dealAutomationService.createAutomaticDeal(conversation.id, handoffResult.assignedTeamId);
                  if (dealId) {
                    console.log(`✅ Deal automático criado com sucesso: ID ${dealId}`);
                  } else {
                    console.log(`ℹ️ Deal automático não criado (pode já existir ou não atender critérios)`);
                  }
                } catch (dealError) {
                  console.error(`❌ Erro ao criar deal automático:`, dealError);
                  // Não falhar o webhook por causa do deal
                }
              }
            }
          } else {
            console.error(`❌ Erro na análise de IA:`, await handoffResponse.text());
          }

          // RESPOSTA AUTOMÁTICA DA PROF. ANA - TEMPORARIAMENTE DESABILITADA
          // A Prof. Ana está configurada para responder apenas internamente no sistema
          console.log(`ℹ️ Resposta automática da Prof. Ana desabilitada para WhatsApp - apenas respostas internas ativas`);
        }
      } catch (aiError) {
        console.error('❌ Erro na análise de IA para transferências:', aiError);
        // Não falhar o webhook por causa da IA
      }
      
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
    
    // Validar credenciais Z-API
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      console.error('❌ Credenciais Z-API inválidas:', credentials.error);
      return res.status(400).json({ 
        error: `Configuração Z-API inválida: ${credentials.error}`,
        details: 'Verifique as variáveis de ambiente ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN'
      });
    }

    const { instanceId, token, clientToken } = credentials;
    console.log(`🔗 Conectando à Z-API - Instance: ${instanceId}`);
    
    const url = buildZApiUrl(instanceId, token, 'contacts');
    console.log(`📡 URL da requisição: ${url}`);
    
    const headers = getZApiHeaders(clientToken);
    console.log('📋 Headers configurados para requisição');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`📊 Status da resposta Z-API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na resposta Z-API: ${response.status} - ${errorText}`);
      
      let errorMessage = 'Erro na conexão com WhatsApp';
      if (response.status === 401) {
        errorMessage = 'Token de autenticação inválido ou expirado';
      } else if (response.status === 403) {
        errorMessage = 'Acesso negado. Verifique as permissões do token';
      } else if (response.status === 404) {
        errorMessage = 'Instância do WhatsApp não encontrada';
      } else if (response.status >= 500) {
        errorMessage = 'Erro interno do servidor Z-API';
      }
      
      return res.status(response.status).json({ 
        error: errorMessage,
        details: `Status: ${response.status} - ${response.statusText}`
      });
    }

    const data = await response.json();
    console.log(`📦 Dados recebidos da Z-API:`, {
      isArray: Array.isArray(data),
      length: data?.length || 0,
      type: typeof data
    });

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    if (data && Array.isArray(data)) {
      console.log(`🔄 Processando ${data.length} contatos...`);
      
      for (const zapiContact of data) {
        try {
          // Validar dados básicos do contato
          if (!zapiContact.id) {
            console.warn('⚠️ Contato sem ID, pulando...', zapiContact);
            errorCount++;
            continue;
          }

          const phone = zapiContact.id.replace(/\D/g, '');
          if (!phone || phone.length < 10) {
            console.warn('⚠️ Telefone inválido, pulando...', { id: zapiContact.id, phone });
            errorCount++;
            continue;
          }

          // Verificar se já existe
          const existingContact = await storage.getContact(phone);
          if (existingContact) {
            skippedCount++;
            continue;
          }

          // Criar novo contato
          const contactData = {
            phone: phone,
            name: zapiContact.name || zapiContact.pushname || `WhatsApp ${phone}`,
            profileImageUrl: zapiContact.profilePicUrl || null,
            source: 'zapi_import'
          };

          await storage.createContact(contactData);
          console.log(`✅ Contato importado: ${contactData.name} (${phone})`);
          importedCount++;
          
        } catch (contactError) {
          console.error('❌ Erro ao processar contato individual:', {
            contact: zapiContact,
            error: contactError instanceof Error ? contactError.message : contactError
          });
          errorCount++;
        }
      }
    } else {
      console.error('❌ Formato de dados inválido da Z-API:', typeof data);
      return res.status(500).json({ 
        error: 'Formato de resposta inválido da Z-API',
        details: `Esperado: array, Recebido: ${typeof data}`
      });
    }

    const summary = {
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: data?.length || 0
    };

    console.log(`✅ Importação concluída:`, summary);
    res.json(summary);
    
  } catch (error) {
    console.error('❌ Erro crítico na importação de contatos:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    let errorMessage = 'Erro interno do servidor';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão com a Z-API. Verifique a conectividade';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na conexão com Z-API. Tente novamente';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: 'Verifique os logs do servidor para mais informações'
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

// ❌ HANDLER DE STATUS REMOVIDO - CONSOLIDADO EM handlers/zapi.ts

/**
 * Registra todas as rotas de webhooks
 */
export function registerWebhookRoutes(app: Express) {
  // Webhook principal Z-API (ambas as rotas para compatibilidade)
  const webhookHandler = async (req: any, res: any) => {
    console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    try {
      const result = await processZApiWebhook(req.body);
      
      if (result.success) {
        res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com sucesso',
          type: result.type 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || 'Erro no processamento do webhook' 
        });
      }
    } catch (error) {
      console.error('❌ Erro crítico no webhook:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  };

  app.post('/api/webhook', webhookHandler);
  app.post('/api/zapi/webhook', webhookHandler);
  
  // Rotas Z-API auxiliares
  app.post('/api/zapi/import-contacts', handleImportContacts);
  // ❌ Rota duplicada /api/webhooks/zapi/import-contacts removida - usar apenas /api/zapi/import-contacts
  app.get('/api/zapi/qrcode', handleGetQRCode);
  // ❌ Status handler removido - consolidado em handlers/zapi.ts
  
  // Registrar rotas de mídia Z-API
  registerZApiMediaRoutes(app);
  
  // QR Code para canal específico
  app.get('/api/channels/:id/qrcode', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channel = await storage.getChannel(channelId);
      
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

// Exportar função auxiliar
export { assignTeamManually };