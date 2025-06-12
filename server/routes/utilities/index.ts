import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from '../../core/storage';
import { funnelService } from '../../services/funnelService';

import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from '../../core/zapi-utils';

export function registerUtilitiesRoutes(app: Express) {
  
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
          
          const config = channel.configuration || {};
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

      console.log('✅ Mensagem enviada com sucesso via Z-API:', data);
      
      // Se conversationId foi fornecido, significa que a mensagem já foi criada pelo frontend
      // Apenas atualizar metadados da mensagem existente com dados da Z-API
      if (conversationId) {
        try {
          const messages = await storage.messages.getMessages(parseInt(conversationId));
          // Encontrar a mensagem mais recente sem zaapId para associar com a resposta da Z-API
          const recentMessage = messages
            .filter(msg => !msg.isFromContact && !msg.metadata?.zaapId)
            .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];
          
          if (recentMessage) {
            await storage.messages.updateMessage(recentMessage.id, {
              metadata: {
                ...recentMessage.metadata,
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
          
          // Verificar se já existe conversa para este contato usando query direta
          const db = storage.conversations.db;
          const { conversations } = await import('../../../shared/schema');
          const { eq } = await import('drizzle-orm');
          
          const [existingConversation] = await db.select()
            .from(conversations)
            .where(eq(conversations.contactId, contact.id))
            .limit(1);
          
          let conversation = existingConversation;
          
          if (!conversation) {
            // Criar nova conversa
            conversation = await storage.conversations.createConversation({
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
      console.log('🗑️ Recebendo solicitação de exclusão de mensagem:', {
        params: req.params,
        body: req.body,
        headers: req.headers
      });
      
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
        const messages = await storage.messages.getMessages(parseInt(conversationId));
        const messageToDelete = messages.find(msg => {
          const metadata = msg.metadata && typeof msg.metadata === 'object' ? msg.metadata : {};
          const msgId = 'messageId' in metadata ? metadata.messageId : 
                       'zaapId' in metadata ? metadata.zaapId : 
                       'id' in metadata ? metadata.id : null;
          return msgId === messageId.toString();
        });

        if (messageToDelete) {
          await storage.messages.markMessageAsDeleted(messageToDelete.id);
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
      
      res.status(200).json({
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

  // Sistema robusto de proxy para imagens WhatsApp - REST: GET /api/proxy/whatsapp-image
  app.get('/api/proxy/whatsapp-image', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL é obrigatória' });
      }

      // Verificar se é uma URL válida do WhatsApp
      if (!url.includes('pps.whatsapp.net') && !url.includes('mmg.whatsapp.net') && !url.includes('media.whatsapp.net')) {
        return res.status(400).json({ error: 'URL não é do WhatsApp' });
      }

      console.log('🖼️ Tentando carregar imagem WhatsApp:', url.substring(0, 100) + '...');

      // Estratégias de requisição com diferentes User-Agents e headers
      const strategies = [
        {
          name: 'WhatsApp Web',
          headers: {
            'User-Agent': 'WhatsApp/2.23.24.76 A',
            'Accept': 'image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://web.whatsapp.com/',
            'Origin': 'https://web.whatsapp.com',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          timeout: 8000
        },
        {
          name: 'Chrome Desktop',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Pragma': 'no-cache'
          },
          timeout: 10000
        },
        {
          name: 'Safari Mobile',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
          },
          timeout: 12000
        }
      ];

      let lastError: Error | null = null;

      // Tentar cada estratégia
      for (const strategy of strategies) {
        try {
          console.log(`🔄 Tentando estratégia: ${strategy.name}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), strategy.timeout);

          const response = await fetch(url, {
            method: 'GET',
            headers: strategy.headers,
            signal: controller.signal,
            redirect: 'follow'
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log(`✅ Sucesso com estratégia: ${strategy.name}`);
            
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const contentLength = response.headers.get('content-length');
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            
            if (contentLength) {
              res.setHeader('Content-Length', contentLength);
            }

            const arrayBuffer = await response.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }

          // URL expirou (404, 403, 410)
          if (response.status === 404 || response.status === 403 || response.status === 410) {
            console.log(`⚠️ URL WhatsApp expirada (${response.status}) com ${strategy.name}`);
            throw new Error(`WhatsApp URL expired: ${response.status}`);
          }

          console.log(`⚠️ Falha ${response.status} com ${strategy.name}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
          lastError = error as Error;
          console.log(`❌ Estratégia ${strategy.name} falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          continue;
        }
      }

      // Todas as estratégias falharam - URL definitivamente expirada
      console.log('⚠️ Todas as tentativas falharam - URL WhatsApp expirada, retornando placeholder');
      
      const placeholderSvg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
          </linearGradient>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#e2e8f0" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="300" height="200" fill="url(#bgGrad)" stroke="#e2e8f0" stroke-width="1" rx="8"/>
        <rect width="300" height="200" fill="url(#dots)" opacity="0.3"/>
        <g transform="translate(150, 70)">
          <circle r="25" fill="#cbd5e1" opacity="0.7"/>
          <g transform="translate(-12, -8)">
            <rect x="0" y="0" width="24" height="16" fill="none" stroke="#64748b" stroke-width="2" rx="2"/>
            <circle cx="8" cy="6" r="3" fill="none" stroke="#64748b" stroke-width="1.5"/>
            <polyline points="2,12 8,8 14,12 22,6" fill="none" stroke="#64748b" stroke-width="1.5"/>
          </g>
        </g>
        <text x="150" y="130" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748b">
          Imagem não disponível
        </text>
        <text x="150" y="150" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8">
          URL do WhatsApp expirou
        </text>
        <text x="150" y="170" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#cbd5e1">
          As imagens do WhatsApp expiram após alguns dias
        </text>
      </svg>`;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(placeholderSvg);

    } catch (error) {
      console.error('❌ Erro crítico no proxy WhatsApp:', error);
      
      // Placeholder para erro de sistema
      const errorSvg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#fef2f2" stroke="#fecaca" stroke-width="1" rx="8"/>
        <g transform="translate(150, 70)">
          <circle r="25" fill="#f87171"/>
          <g transform="translate(-8, -8)" stroke="#dc2626" stroke-width="3" fill="none">
            <line x1="0" y1="0" x2="16" y2="16"/>
            <line x1="16" y1="0" x2="0" y2="16"/>
          </g>
        </g>
        <text x="150" y="130" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#dc2626">
          Erro ao carregar imagem
        </text>
        <text x="150" y="150" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#ef4444">
          Falha no sistema de proxy
        </text>
      </svg>`;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(errorSvg);
    }
  });

  // System Users endpoints - REST: CRUD operations
  app.get('/api/system-users', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getSystemUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching system users:', error);
      res.status(500).json({ message: 'Failed to fetch system users' });
    }
  });

  app.post('/api/system-users', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userData = req.body;
      const user = await storage.createSystemUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating system user:', error);
      res.status(400).json({ message: 'Failed to create system user' });
    }
  });

  app.patch('/api/system-users/:id', async (req: AuthenticatedRequest, res: Response) => {
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

  app.delete('/api/system-users/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSystemUser(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting system user:', error);
      res.status(500).json({ message: 'Failed to delete system user' });
    }
  });

  // Bulk import system users - REST: POST /api/system-users/bulk-import
  app.post('/api/system-users/bulk-import', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { users } = req.body;
      
      if (!users || !Array.isArray(users)) {
        return res.status(400).json({ 
          message: 'Lista de usuários é obrigatória e deve ser um array' 
        });
      }

      const results: {
        success: { index: number; user: any }[];
        errors: { index: number; userData: any; error: string }[];
        total: number;
      } = {
        success: [],
        errors: [],
        total: users.length
      };

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        
        try {
          // Validar dados obrigatórios
          if (!userData.displayName || !userData.email || !userData.username || !userData.password || !userData.role) {
            results.errors.push({
              index: i,
              userData,
              error: 'Campos obrigatórios faltando: displayName, email, username, password, role'
            });
            continue;
          }

          // Gerar iniciais se não fornecidas
          if (!userData.initials) {
            const names = userData.displayName.split(' ');
            userData.initials = names.length > 1 
              ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
              : userData.displayName.substring(0, 2).toUpperCase();
          }

          // Criar usuário
          const newUser = await storage.createSystemUser({
            username: userData.username,
            displayName: userData.displayName,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            team: userData.team || null,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            initials: userData.initials
          });

          results.success.push({
            index: i,
            user: newUser
          });

        } catch (error) {
          results.errors.push({
            index: i,
            userData,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      res.status(201).json({
        message: `Importação concluída: ${results.success.length} usuários criados, ${results.errors.length} erros`,
        results
      });

    } catch (error) {
      console.error('Error in bulk import:', error);
      res.status(500).json({ 
        message: 'Erro interno no servidor durante importação em lote',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Update specific user - REST: PUT /api/system-users/:id
  app.put('/api/system-users/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, displayName, email, role, team, isActive } = req.body;
      
      const updateData: any = {};
      
      if (username !== undefined) updateData.username = username;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (team !== undefined) updateData.team = team;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await storage.updateSystemUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      console.log(`👤 Usuário atualizado: ${updatedUser.displayName} (ID: ${userId})`);
      res.json(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Profile API endpoints - REST: User profile management
  app.patch('/api/profile', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { displayName, email, phone, location, bio } = req.body;
      const updateData: any = {};
      
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;
      if (bio !== undefined) updateData.bio = bio;

      const updatedUser = await storage.updateSystemUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ 
        message: 'Perfil atualizado com sucesso',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Change password - REST: POST /api/profile/change-password
  app.post('/api/profile/change-password', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Senha atual e nova senha são obrigatórias' 
        });
      }

      // Verificar senha atual
      const bcrypt = await import('bcryptjs');
      const user = await storage.getSystemUser(req.user.id);
      
      if (!user || !user.password) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      // Atualizar com nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      await storage.updateSystemUser(req.user.id, { 
        password: hashedNewPassword 
      });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Teams API endpoints - REST: CRUD operations
  app.get('/api/teams', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'Failed to fetch teams' });
    }
  });

  app.post('/api/teams', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const team = await storage.createTeam(req.body);
      
      // Criar funil automaticamente para a nova equipe
      try {
        await funnelService.createFunnelForTeam(team.id);
        console.log(`✅ Funil criado automaticamente para nova equipe: ${team.name} (ID: ${team.id})`);
      } catch (funnelError) {
        console.warn(`⚠️ Erro ao criar funil automático para equipe ${team.name}:`, funnelError);
        // Não falhar a criação da equipe se houver erro no funil
      }
      
      res.status(201).json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: 'Failed to create team' });
    }
  });

  app.put('/api/teams/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      res.json(team);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ message: 'Failed to update team' });
    }
  });

  app.delete('/api/teams/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ message: 'Failed to delete team' });
    }
  });

  // Roles API endpoints - REST: CRUD operations  
  app.get('/api/roles', async (req: Request, res: Response) => {
    try {
      // Retornar dados estáticos até resolver o problema de storage
      const staticRoles = [
        { id: 1, name: 'Administrador', displayName: 'Administrador', isActive: true },
        { id: 2, name: 'Gerente', displayName: 'Gerente', isActive: true },
        { id: 3, name: 'Atendente', displayName: 'Atendente', isActive: true },
        { id: 4, name: 'Visualizador', displayName: 'Visualizador', isActive: true }
      ];
      res.json(staticRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role = await storage.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ message: 'Failed to create role' });
    }
  });

  app.put('/api/roles/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.updateRole(id, req.body);
      res.json(role);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  app.delete('/api/roles/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRole(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  });

  // Permissions configuration - REST: POST /api/permissions/save
  app.post('/api/permissions/save', async (req: AuthenticatedRequest, res: Response) => {
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

  // Channels API endpoints - REST: CRUD operations for multiple WhatsApp support
  app.get('/api/channels', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ message: 'Failed to fetch channels' });
    }
  });

  app.get('/api/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
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

  app.post('/api/channels', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const channelData = req.body;
      
      // Basic validation
      if (!channelData.name || !channelData.type) {
        return res.status(400).json({ message: 'Name and type are required' });
      }

      const channel = await storage.createChannel(channelData);
      res.status(201).json(channel);
    } catch (error) {
      console.error('Error creating channel:', error);
      res.status(400).json({ message: 'Failed to create channel' });
    }
  });

  app.put('/api/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const channelData = req.body;
      
      const channel = await storage.updateChannel(id, channelData);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      res.json(channel);
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(400).json({ message: 'Failed to update channel' });
    }
  });

  app.delete('/api/channels/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChannel(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({ message: 'Failed to delete channel' });
    }
  });

  // Channel status check - REST: GET /api/channels/:id/status
  app.get('/api/channels/:id/status', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const status = await storage.getChannelStatus(id);
      res.json(status);
    } catch (error) {
      console.error('Error checking channel status:', error);
      res.status(500).json({ message: 'Failed to check channel status' });
    }
  });

  // Channel activation/deactivation - REST: PATCH /api/channels/:id/toggle
  app.patch('/api/channels/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const channel = await storage.updateChannel(id, { isActive });
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      res.json({ 
        message: `Channel ${isActive ? 'activated' : 'deactivated'} successfully`,
        channel 
      });
    } catch (error) {
      console.error('Error toggling channel status:', error);
      res.status(500).json({ message: 'Failed to toggle channel status' });
    }
  });
}