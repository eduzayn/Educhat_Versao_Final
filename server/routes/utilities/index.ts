import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { storage } from '../../core/storage';

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
      console.log('📥 RECEBENDO REQUISIÇÃO Z-API SEND-MESSAGE (CRIAÇÃO CONTATO):', {
        body: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent']
        },
        timestamp: new Date().toISOString()
      });

      const { phone, message, conversationId, channelId } = req.body;
      
      // Validação aprimorada com logs específicos
      if (!phone) {
        console.error('❌ TELEFONE FALTANDO:', { body: req.body });
        return res.status(400).json({ 
          error: 'Telefone é obrigatório',
          details: 'Campo phone não fornecido'
        });
      }
      
      if (!message) {
        console.error('❌ MENSAGEM FALTANDO:', { body: req.body });
        return res.status(400).json({ 
          error: 'Mensagem é obrigatória',
          details: 'Campo message não fornecido'
        });
      }

      // Buscar credenciais do canal específico no banco de dados
      let credentials: {
        valid: boolean;
        error?: string;
        instanceId?: string;
        token?: string;
        clientToken?: string;
      } = { valid: false, error: 'Canal não encontrado' };
      let targetChannel = 'desconhecido';

      if (channelId) {
        try {
          const channel = await storage.getChannel(parseInt(channelId));
          if (channel && channel.instanceId && channel.token && channel.clientToken) {
            credentials = {
              valid: true,
              instanceId: channel.instanceId,
              token: channel.token,
              clientToken: channel.clientToken
            };
            targetChannel = channel.name?.toLowerCase() || 'canal-sem-nome';
            
            console.log('🎯 CREDENCIAIS DO BANCO ENCONTRADAS:', {
              channelId,
              channelName: targetChannel,
              instanceId: channel.instanceId.substring(0, 8) + '...',
              hasToken: !!channel.token,
              hasClientToken: !!channel.clientToken,
              phone: phone.replace(/\D/g, '').substring(0, 5) + '...'
            });
          } else {
            console.error('❌ Canal encontrado mas sem credenciais completas:', {
              channelId,
              hasChannel: !!channel,
              hasInstanceId: !!channel?.instanceId,
              hasToken: !!channel?.token,
              hasClientToken: !!channel?.clientToken
            });
            credentials = { valid: false, error: 'Canal sem credenciais Z-API configuradas' };
          }
        } catch (error) {
          console.error('❌ Erro ao buscar canal no banco:', error);
          credentials = { valid: false, error: 'Erro ao acessar dados do canal' };
        }
      } else {
        console.log('⚠️ ChannelId não informado, usando credenciais padrão do .env');
        credentials = validateZApiCredentials();
        targetChannel = 'padrão-env';
      }
      
      if (!credentials.valid) {
        console.error('❌ CREDENCIAIS Z-API INVÁLIDAS:', {
          canal: targetChannel,
          channelId,
          error: credentials.error
        });
        return res.status(400).json({ 
          error: `Credenciais Z-API não configuradas para canal ${targetChannel}`,
          details: credentials.error
        });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      console.log('🔑 CREDENCIAIS Z-API VALIDADAS:', {
        instanceId: instanceId ? `${instanceId.substring(0, 8)}...` : 'MISSING',
        hasToken: !!token,
        hasClientToken: !!clientToken,
        cleanPhone
      });
      
      // Importar logs padronizados
      const { logZApiAttempt, logZApiSuccess, logZApiError } = await import('../../lib/zapiLogger');
      
      // Log de tentativa
      logZApiAttempt({
        phone: cleanPhone,
        messageType: 'TEXTO'
      });
      
      const payload = {
        phone: cleanPhone,
        message: message.toString()
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

      console.log('📤 ENVIANDO PARA Z-API:', {
        url: url.substring(0, 50) + '...',
        payload: { phone: cleanPhone, message: message.substring(0, 50) + '...' }
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

      console.log('📥 RESPOSTA Z-API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      });

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText,
          phone: cleanPhone,
          message: message.substring(0, 100),
          url: url.substring(0, 50) + '...',
          timestamp: new Date().toISOString()
        };
        
        console.error('❌ ERRO DETALHADO Z-API (CRIAÇÃO CONTATO):', errorDetails);
        
        // Log de erro padronizado
        logZApiError({
          phone: cleanPhone,
          messageType: 'TEXTO',
          error: `${response.status} - ${response.statusText}: ${responseText}`
        });
        
        return res.status(400).json({ 
          error: 'Falha ao enviar mensagem via Z-API',
          details: `${response.status} - ${response.statusText}`,
          response: responseText,
          phone: cleanPhone
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ DADOS Z-API PARSEADOS:', data);
      } catch (parseError) {
        logZApiError({
          phone: cleanPhone,
          messageType: 'TEXTO',
          error: `Resposta inválida da Z-API: ${responseText}`
        });
        console.error('❌ ERRO NO PARSE Z-API:', { parseError, responseText });
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      // Log de sucesso padronizado
      logZApiSuccess({
        phone: cleanPhone,
        messageType: 'TEXTO',
        messageId: data.messageId || data.id
      });
      
      console.log('✅ ENVIADO COM SUCESSO VIA Z-API:', {
        messageId: data.messageId || data.id,
        phone: cleanPhone,
        conversationId
      });
      
      // Salvar mensagem no banco de dados se conversationId foi fornecido
      let savedMessage = null;
      if (conversationId) {
        try {
          savedMessage = await storage.createMessage({
            conversationId: parseInt(conversationId),
            content: message.toString(),
            isFromContact: false,
            messageType: 'text',
            sentAt: new Date(),
            whatsappMessageId: data.messageId || data.id,
            metadata: {
              zaapId: data.messageId || data.id,
              messageId: data.messageId || data.id,
              textSent: true,
              channel: targetChannel,
              phone: cleanPhone
            }
          });

          console.log('💾 MENSAGEM SALVA NO BANCO:', {
            messageId: savedMessage.id,
            zaapId: data.messageId || data.id,
            conversationId: parseInt(conversationId)
          });

          // Broadcast para WebSocket com dados da mensagem para renderização imediata
          const { broadcastToAll } = await import('../realtime');
          broadcastToAll({
            type: 'new_message',
            conversationId: parseInt(conversationId),
            message: savedMessage
          });
        } catch (dbError) {
          console.error('❌ Erro ao salvar mensagem de texto no banco:', dbError);
          // Não falhar o endpoint se salvar no banco falhar - mensagem já foi enviada
        }
      }
      
      // Retornar no formato padronizado esperado pelo frontend
      res.json({
        success: true,
        data: data,
        message: 'Mensagem enviada com sucesso via Z-API',
        savedMessage: savedMessage // Incluir mensagem salva para renderização imediata
      });
    } catch (error) {
      const { logZApiError } = await import('../../lib/zapiLogger');
      logZApiError({
        phone: req.body.phone || 'unknown',
        messageType: 'TEXTO',
        error: error instanceof Error ? error.message : error
      });
      
      console.error('❌ ERRO CRÍTICO NO ENDPOINT Z-API (CRIAÇÃO CONTATO):', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
      
      // Retornar status 400 com formato JSON válido ao invés de 500
      res.status(400).json({ 
        success: false,
        error: 'Não foi possível enviar mensagem via Z-API',
        message: error instanceof Error ? error.message : 'Erro na comunicação com Z-API',
        details: {
          phone: req.body.phone,
          timestamp: new Date().toISOString(),
          originalError: error instanceof Error ? error.message : 'Erro interno do servidor'
        }
      });
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
      console.log(`🗑️ Tentando excluir usuário ID: ${id}`);
      
      // Verificar se o ID é válido
      if (isNaN(id) || id <= 0) {
        console.log(`❌ ID inválido: ${req.params.id}`);
        return res.status(400).json({ message: 'ID de usuário inválido' });
      }
      
      // Verificar se o usuário existe
      const existingUser = await storage.getSystemUser(id);
      if (!existingUser) {
        console.log(`❌ Usuário não encontrado: ${id}`);
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      console.log(`✅ Usuário encontrado: ${existingUser.displayName} (${existingUser.email})`);
      
      // Excluir o usuário
      await storage.deleteSystemUser(id);
      console.log(`✅ Usuário ID ${id} excluído com sucesso`);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('🔥 Error deleting system user:', error);
      console.error('🔥 Stack trace:', error?.stack);
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