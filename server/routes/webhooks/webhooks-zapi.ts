import { storage } from "../../storage/index";
import { validateZApiCredentials } from "../../utils/zapi";
import { webhookHealthMonitor } from "../../webhookHealthCheck";

/**
 * Processa webhook principal Z-API para mensagens recebidas
 */
export async function processZApiWebhook(webhookData: any): Promise<{ success: boolean; type?: string; error?: string }> {
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
      
      // 🔒 CORREÇÃO CRÍTICA: Buscar ou criar conversa associando ao canal Z-API correto
      let conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
      let channelId = null;
      
      // Identificar canal correto baseado no instanceId do webhook
      if (webhookData.instanceId) {
        try {
          const channels = await storage.getChannelsByType('whatsapp');
          const matchingChannel = channels.find(ch => 
            ch.instanceId === webhookData.instanceId && ch.isActive
          );
          if (matchingChannel) {
            channelId = matchingChannel.id;
            console.log(`🔒 WEBHOOK-CANAL: Identificado canal ${channelId} para instanceId ${webhookData.instanceId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao identificar canal pelo instanceId:`, error);
        }
      }
      
      if (!conversation) {
        conversation = await storage.createConversation({
          contactId: contact.id,
          channel: 'whatsapp',
          channelId: channelId, // CRÍTICO: Associar canal desde a criação
          status: 'open'
        });
        console.log(`📌 WEBHOOK-NOVA-CONVERSA: Criada conversa ${conversation.id} com canal ${channelId}`);
      } else if (conversation && !conversation.channelId && channelId) {
        // Se conversa existe mas não tem canal, atualizar
        await storage.updateConversation(conversation.id, { channelId });
        conversation.channelId = channelId;
        console.log(`📌 WEBHOOK-CANAL-UPDATE: Conversa ${conversation.id} atualizada com canal ${channelId}`);
      }
      
      // Verificar se deve bloquear resposta automática antes de processar
      const { autoReplyBlocker } = await import('../../middleware/auto-reply-blocker');
      const blockResult = await autoReplyBlocker.shouldBlockMessage(messageContent, conversation.id);
      
      if (blockResult.blocked) {
        console.log(`🚫 [WEBHOOK] Mensagem automática bloqueada: ${blockResult.reason}`);
        await autoReplyBlocker.blockAutoReply(conversation.id, messageContent, blockResult.reason || 'Padrão bloqueado');
        return { success: true, type: 'auto_reply_blocked' };
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

      // Baixar e salvar arquivo de mídia se necessário
      if (messageType === 'audio' && mediaUrl) {
        try {
          console.log(`📤 Baixando áudio do webhook: ${mediaUrl}`);
          const response = await fetch(mediaUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64Data = Buffer.from(buffer).toString('base64');
            
            const { mediaFiles } = await import('@shared/schema');
            const { db } = await import('../../db');
            
            await db.insert(mediaFiles).values({
              messageId: message.id,
              fileName: fileName || `audio_${message.id}.ogg`,
              originalName: fileName || `audio_${message.id}.ogg`,
              mimeType: webhookData.audio?.mimeType || 'audio/ogg',
              fileSize: buffer.byteLength,
              fileData: base64Data,
              mediaType: 'audio',
              duration: webhookData.audio?.seconds || webhookData.audio?.duration || 0,
              isCompressed: false,
              zapiSent: false
            });
            
            console.log(`💾 Arquivo de áudio salvo no banco para mensagem ${message.id}`);
          }
        } catch (error) {
          console.error('Erro ao baixar e salvar áudio:', error);
        }
      }
      
      // MELHORIA 2: Broadcast garantido para WebSocket - WEBHOOK RECEIVED MESSAGE
      try {
        const { broadcast, broadcastToAll } = await import('../realtime');
        
        const broadcastData = {
          type: 'new_message',
          conversationId: conversation.id,
          message: message,
          source: 'webhook',
          timestamp: new Date().toISOString(),
          webhookType: webhookData.type
        };
        
        console.log(`📡 [PROD-AUDIT] WEBHOOK-BROADCAST: Enviando mensagem ${message.id} para conversa ${conversation.id}`);
        
        // MELHORIA: Broadcast garantido para mensagens de webhook
        const broadcastResult = await Promise.allSettled([
          broadcast(conversation.id, broadcastData),
          broadcastToAll(broadcastData)
        ]);
        
        // Verificar se broadcast foi bem-sucedido
        const specificBroadcastOk = broadcastResult[0].status === 'fulfilled';
        const globalBroadcastOk = broadcastResult[1].status === 'fulfilled';
        
        if (!specificBroadcastOk && !globalBroadcastOk) {
          console.error(`🚨 [PROD-CRITICAL] Falha total no broadcast para conversa ${conversation.id}`);
        }
        
        console.log(`📡 [PROD-AUDIT] WEBHOOK-BROADCAST: Resultado do broadcast - específico: ${broadcastResult[0].status}, global: ${broadcastResult[1].status}`);
        
        // Broadcast adicional para atualizar listas de conversas
        broadcastToAll({
          type: 'conversation_updated',
          conversationId: conversation.id,
          lastMessage: message,
          conversation: {
            id: conversation.id,
            channel: conversation.channel,
            status: conversation.status,
            lastMessageAt: message.sentAt,
            unreadCount: conversation.unreadCount || 0
          },
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ WEBHOOK: Broadcast enviado com sucesso para conversa ${conversation.id}`);
        
      } catch (wsError) {
        console.error('❌ WEBHOOK: Erro no broadcast:', wsError);
      }
      
      console.log(`📱 Mensagem processada para contato:`, contact.name);
      
      // ANÁLISE DE IA E TRANSFERÊNCIAS AUTOMÁTICAS
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
              conversationId: conversation.id,
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
            
            if (handoffResult.handoffCreated) {
              console.log(`🔄 Transferência automática executada com sucesso para conversa ${conversation.id}`);
            }
          } else {
            console.error(`❌ Erro na análise de IA:`, await handoffResponse.text());
          }
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
    
    // Processar webhooks de conexão/desconexão
    if (webhookData.type === 'ConnectedCallback') {
      console.log('📱 WhatsApp conectado via webhook');
      try {
        const channels = await storage.getChannels();
        const channel = channels.find(c => c.instanceId === webhookData.instanceId);
        if (channel) {
          await storage.updateChannel(channel.id, {
            isConnected: true,
            connectionStatus: 'connected'
          });
          console.log(`✅ Canal ${channel.id} marcado como conectado`);
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar status do canal:', error);
      }
      return { success: true, type: 'connection_updated' };
    }
    
    if (webhookData.type === 'DisconnectedCallback') {
      console.log('📱 WhatsApp desconectado via webhook');
      try {
        const channels = await storage.getChannels();
        const channel = channels.find(c => c.instanceId === webhookData.instanceId);
        if (channel) {
          await storage.updateChannel(channel.id, {
            isConnected: false,
            connectionStatus: 'disconnected'
          });
          console.log(`❌ Canal ${channel.id} marcado como desconectado`);
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar status do canal:', error);
      }
      return { success: true, type: 'disconnection_updated' };
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