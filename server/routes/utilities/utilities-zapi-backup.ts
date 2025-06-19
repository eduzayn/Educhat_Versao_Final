import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { validateZApiCredentials } from '../../utils/zapi';

export function registerZApiRoutes(app: Express) {
  // Cache para o status Z-API (10 segundos)
  let statusCache: { data: any; timestamp: number } | null = null;
  const CACHE_DURATION = 10000; // 10 segundos para reduzir ainda mais a carga

  // Z-API Status endpoint - REST: GET /api/zapi/status
  app.get('/api/zapi/status', async (req, res) => {
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (statusCache && (now - statusCache.timestamp) < CACHE_DURATION) {
        return res.json(statusCache.data);
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Atualizar cache
      statusCache = { data, timestamp: now };
      
      // Só logar se houver mudança de status ou erro real
      if (data.error && data.error !== 'You are already connected.') {
        console.log('⚠️ Z-API Status:', data);
      }
      
      res.json(data);
      
    } catch (error) {
      console.error('Erro ao obter status Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Send message via Z-API - REST: POST /api/zapi/send-message
  app.post('/api/zapi/send-message', async (req, res) => {
    try {
      console.log('📤 Enviando mensagem via Z-API:', req.body);
      
      const { phone, message, conversationId, channelId } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ 
          error: 'Phone e message são obrigatórios' 
        });
      }

      let credentials;
      
      // Se channelId foi fornecido, buscar credenciais específicas do canal
      if (channelId) {
        try {
          const channel = await storage.getChannel(channelId);
          if (!channel || !channel.isActive || channel.type !== 'whatsapp') {
            return res.status(400).json({ 
              error: 'Canal WhatsApp não encontrado ou inativo' 
            });
          }
          
          const config = (channel.configuration as any) || {};
          credentials = {
            valid: true,
            instanceId: config.instanceId || channel.instanceId,
            token: config.token || channel.token,
            clientToken: config.clientToken || channel.clientToken
          };
          
          if (!credentials.instanceId || !credentials.token || !credentials.clientToken) {
            return res.status(400).json({ 
              error: 'Canal WhatsApp não configurado corretamente' 
            });
          }
          
          console.log(`📱 Usando canal específico: ${channel.name} (ID: ${channelId})`);
        } catch (error) {
          console.error('❌ Erro ao buscar canal:', error);
          return res.status(500).json({ 
            error: 'Erro ao buscar configurações do canal' 
          });
        }
      } else {
        // Fallback para credenciais padrão (compatibilidade)
        credentials = validateZApiCredentials();
        if (!credentials.valid) {
          return res.status(400).json({ error: credentials.error });
        }
        console.log('📱 Usando credenciais padrão Z-API');
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const payload = {
        phone: cleanPhone,
        message: message.toString()
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
      console.log('📤 Enviando para Z-API:', { url: url.replace(token!, '****'), payload });

      // Configurar timeout de 15 segundos para requisições Z-API (otimizado para velocidade)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Client-Token': clientToken || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

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
        
        console.log('✅ Mensagem enviada com sucesso via Z-API:', data);
        
        // Se conversationId foi fornecido, significa que a mensagem já foi criada pelo frontend
        // Apenas atualizar metadados da mensagem existente com dados da Z-API (execução assíncrona para velocidade)
        if (conversationId) {
          // Executar em background para não atrasar resposta
          setImmediate(async () => {
            try {
              const messages = await storage.messages.getMessages(parseInt(conversationId));
              // Encontrar a mensagem mais recente sem zaapId para associar com a resposta da Z-API
              const recentMessage = messages
                .filter(msg => !msg.isFromContact && !(msg.metadata as any)?.zaapId)
                .sort((a, b) => new Date(b.sentAt || new Date()).getTime() - new Date(a.sentAt || new Date()).getTime())[0];
              
              if (recentMessage) {
                await storage.messages.updateMessage(recentMessage.id, {
                  metadata: {
                    ...(recentMessage.metadata as any || {}),
                    zaapId: data.messageId || data.id,
                    messageId: data.messageId || data.id,
                    phone: cleanPhone,
                    instanceId: instanceId
                  }
                });
                console.log('✅ Metadados Z-API atualizados na mensagem:', recentMessage.id);
              }
            } catch (dbError) {
              console.error('❌ Erro ao atualizar metadados da mensagem:', dbError);
            }
          });
        }
      } else {
        // Fluxo original para mensagens enviadas diretamente via API (sem frontend)
        try {
          let contact = await storage.contacts.getContactByPhone(cleanPhone);
          if (!contact && cleanPhone.startsWith('+55')) {
            contact = await storage.contacts.getContactByPhone(cleanPhone.replace('+55', ''));
          }
          if (!contact && !cleanPhone.startsWith('+55')) {
            contact = await storage.contacts.getContactByPhone(`+55${cleanPhone}`);
          }
          
          if (contact) {
            console.log('📋 Criando conversa e mensagem no banco para:', contact.name);
          
          // Verificar se já existe conversa para este contato
          let conversation = await storage.conversation.getConversationByContactId(contact.id);
          
          if (!conversation) {
            // Criar nova conversa
            conversation = await storage.conversation.createConversation({
              contactId: contact.id,
              channel: 'whatsapp',
              status: 'active',
              priority: 'normal',
              assignedUserId: null,
              teamType: null,
              isRead: false,
              tags: [],
              metadata: {
                phone: cleanPhone,
                instanceId: instanceId
              }
            });
            console.log('✅ Conversa criada:', conversation.id);
          } else {
            console.log('📋 Usando conversa existente:', conversation.id);
          }
          
          // Criar mensagem enviada no banco
          const savedMessage = await storage.messages.createMessage({
            conversationId: conversation.id,
            content: message.toString(),
            isFromContact: false,
            messageType: 'text',
            sentAt: new Date(),
            metadata: {
              zaapId: data.messageId || data.id,
              phone: cleanPhone,
              instanceId: instanceId,
              originalContent: message.toString()
            }
          });
          
            console.log('✅ Mensagem salva no banco:', savedMessage.id);
            
            const { broadcast } = await import('../realtime');
            broadcast(conversation.id, {
              type: 'new_message',
              conversationId: conversation.id,
              message: savedMessage
            });
            
            console.log('📡 Broadcast enviado para conversa:', conversation.id);
          } else {
            console.log('⚠️ Contato não encontrado para telefone:', cleanPhone);
          }
        } catch (dbError) {
          console.error('❌ Erro ao salvar mensagem no banco:', dbError);
        }
      }
      
      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Delete message via Z-API - REST: DELETE /api/zapi/messages/:messageId
  app.delete('/api/zapi/messages/:messageId', async (req, res) => {
    try {
      console.log('🗑️ Recebendo solicitação de exclusão de mensagem:', req.body);
      
      const { phone, conversationId } = req.body;
      const messageId = req.params.messageId;
      
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
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages?phone=${cleanPhone}&messageId=${messageId.toString()}&owner=true`;
      
      console.log('🗑️ Deletando mensagem via Z-API:', { 
        url,
        conversationId 
      });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Client-Token': clientToken || ''
        }
      });

      const responseText = await response.text();
      console.log('📥 Resposta Z-API exclusão de mensagem:', { 
        status: response.status, 
        statusText: response.statusText,
        body: responseText 
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        
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
        const messages = await storage.getMessages(parseInt(conversationId));
        const messageToDelete = messages.find(msg => {
          const metadata = msg.metadata && typeof msg.metadata === 'object' ? msg.metadata : {};
          const msgId = 'messageId' in metadata ? metadata.messageId : 
                       'zaapId' in metadata ? metadata.zaapId : 
                       'id' in metadata ? metadata.id : null;
          return msgId === messageId.toString();
        });

        if (messageToDelete) {
          await storage.message.markMessageAsDelivered(messageToDelete.id);
        }

        const { broadcast } = await import('../realtime');
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
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Z-API Delete Message (Mensagens Enviadas) - POST /api/zapi/delete-message
  app.post('/api/zapi/delete-message', async (req, res) => {
    try {
      const { phone, messageId, conversationId } = req.body;

      if (!phone || !messageId) {
        return res.status(400).json({ error: 'phone e messageId são obrigatórios' });
      }

      console.log('🗑️ Z-API DELETE - Iniciando processo para mensagem enviada:', {
        phone,
        messageId,
        conversationId,
        comportamento: 'Deleta localmente + Remove do WhatsApp via Z-API'
      });

      // Validar credenciais Z-API
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Tentar deletar via Z-API primeiro
      let zapiDeletionSuccess = false;
      
      try {
        // URL correta da API Z-API para deletar mensagem
        const deleteUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages?phone=${cleanPhone}&messageId=${messageId}&owner=true`;
        
        console.log('🌐 Z-API DELETE - Fazendo requisição para:', deleteUrl);

        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Client-Token': clientToken || ''
          }
        });

        const responseText = await deleteResponse.text();
        console.log('📥 Z-API DELETE - Resposta recebida:', {
          status: deleteResponse.status,
          statusText: deleteResponse.statusText,
          body: responseText
        });

        let deleteResult;
        try {
          deleteResult = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('❌ Z-API DELETE - Erro ao parsear JSON:', parseError);
          deleteResult = { rawResponse: responseText };
        }
        
        if (deleteResponse.ok) {
          console.log('✅ Z-API DELETE - Mensagem deletada com sucesso do WhatsApp:', deleteResult);
          zapiDeletionSuccess = true;
        } else {
          console.error('❌ Z-API DELETE - Falha ao deletar no WhatsApp:', {
            status: deleteResponse.status,
            body: deleteResult
          });
        }
      } catch (zapiError) {
        console.error('❌ Z-API DELETE - Erro na requisição:', zapiError);
      }

      // Sempre marcar como deletada no sistema local (mesmo se Z-API falhar)
      if (conversationId) {
        try {
          // Buscar mensagem pelo messageId da Z-API
          const messages = await storage.message.getMessagesByConversation(parseInt(conversationId));
          const localMessage = messages.find(msg => {
            const metadata = msg.metadata as any;
            return metadata?.zaapId === messageId || 
                   metadata?.messageId === messageId || 
                   metadata?.id === messageId;
          });

          if (localMessage) {
            await storage.markMessageAsDeletedByUser(localMessage.id, true);
            console.log('✅ Z-API DELETE - Mensagem marcada como deletada localmente:', localMessage.id);

            // Broadcast para atualizar interface
            const { broadcast } = await import('../realtime');
            broadcast(localMessage.conversationId, {
              type: 'message_deleted',
              conversationId: localMessage.conversationId,
              messageId: localMessage.id,
              deletedAt: new Date().toISOString(),
              deletedForEveryone: zapiDeletionSuccess // True se deletou do WhatsApp também
            });
          } else {
            console.warn('⚠️ Z-API DELETE - Mensagem não encontrada no banco local');
          }
        } catch (localError) {
          console.error('❌ Z-API DELETE - Erro ao deletar localmente:', localError);
        }
      }

      res.json({ 
        success: true, 
        message: zapiDeletionSuccess 
          ? 'Mensagem deletada da conversa e do WhatsApp'
          : 'Mensagem deletada localmente (falha na Z-API)',
        type: 'zapi_delete',
        deletedForEveryone: zapiDeletionSuccess,
        zapiSuccess: zapiDeletionSuccess
      });
      
    } catch (error) {
      console.error('❌ Erro geral no Z-API delete:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 