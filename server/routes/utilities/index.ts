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
      
      // Criar conversa e mensagem no banco de dados imediatamente
      try {
        // Buscar contato pelo telefone
        const contact = await storage.getContactByPhone(cleanPhone);
        
        if (contact) {
          console.log('📋 Criando conversa e mensagem no banco para:', contact.name);
          
          // Verificar se já existe conversa para este contato
          let conversation = await storage.getConversationByContactId(contact.id);
          
          if (!conversation) {
            // Criar nova conversa
            conversation = await storage.createConversation({
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
          const savedMessage = await storage.createMessage({
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
          
          // Broadcast via WebSocket para atualizar interface
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
        // Não falhar o envio se houver erro no banco
      }
      
      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
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