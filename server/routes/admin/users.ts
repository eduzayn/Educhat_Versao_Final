import { Express, Response } from 'express';
import { db } from '../../core/db';
import { systemUsers, roles, userTeams, conversations, handoffs } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission, PermissionService, AuthenticatedRequest, updateLastActivity } from '../../core/permissionsRefactored';

export function registerUserRoutes(app: Express) {
  // Listar usuários com informações de permissões
  app.get('/api/admin/users', 
    updateLastActivity(),
    requirePermission('usuario:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const users = await db
          .select({
            id: systemUsers.id,
            username: systemUsers.username,
            displayName: systemUsers.displayName,
            email: systemUsers.email,
            role: systemUsers.role,
            roleId: systemUsers.roleId,
            teamId: systemUsers.teamId,
            team: systemUsers.team,
            dataKey: systemUsers.dataKey,
            channels: systemUsers.channels,
            teamTypes: systemUsers.teamTypes,
            isActive: systemUsers.isActive,
            status: systemUsers.status,
            isOnline: systemUsers.isOnline,
            lastLoginAt: systemUsers.lastLoginAt,
            lastActivityAt: systemUsers.lastActivityAt,
            createdAt: systemUsers.createdAt,
            roleName: roles.name,
            roleDescription: roles.displayName
          })
          .from(systemUsers)
          .leftJoin(roles, eq(systemUsers.roleId, roles.id))
          .orderBy(systemUsers.displayName);

        // Aplicar filtro de dataKey se necessário
        const filteredUsers = req.user!.role === 'admin' 
          ? users 
          : users.filter(user => {
              if (!req.user!.dataKey || !user.dataKey) return true;
              return user.dataKey.startsWith(req.user!.dataKey);
            });

        res.json(filteredUsers);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Buscar usuário específico por ID
  app.get('/api/admin/users/:id', 
    updateLastActivity(),
    requirePermission('usuario:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        
        if (!userId || isNaN(userId)) {
          return res.status(400).json({ message: 'ID do usuário inválido' });
        }

        const [user] = await db
          .select({
            id: systemUsers.id,
            username: systemUsers.username,
            displayName: systemUsers.displayName,
            email: systemUsers.email,
            role: systemUsers.role,
            roleId: systemUsers.roleId,
            teamId: systemUsers.teamId,
            team: systemUsers.team,
            dataKey: systemUsers.dataKey,
            channels: systemUsers.channels,
            teamTypes: systemUsers.teamTypes,
            isActive: systemUsers.isActive,
            status: systemUsers.status,
            isOnline: systemUsers.isOnline,
            lastLoginAt: systemUsers.lastLoginAt,
            lastActivityAt: systemUsers.lastActivityAt,
            createdAt: systemUsers.createdAt,
            roleName: roles.name,
            roleDescription: roles.displayName
          })
          .from(systemUsers)
          .leftJoin(roles, eq(systemUsers.roleId, roles.id))
          .where(eq(systemUsers.id, userId))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Aplicar filtro de dataKey se necessário
        if (req.user!.role !== 'admin' && req.user!.dataKey && user.dataKey) {
          if (!user.dataKey.startsWith(req.user!.dataKey)) {
            return res.status(403).json({ message: 'Acesso negado' });
          }
        }

        res.json(user);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Criar novo usuário
  app.post('/api/admin/users', 
    updateLastActivity(),
    requirePermission('usuario:criar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      console.log('🔥 POST /api/admin/users endpoint hit:', req.body);
      try {
        const { 
          displayName, 
          username,
          email,
          password,
          role,
          team,
          roleId, 
          teamId, 
          dataKey, 
          channels, 
          teams 
        } = req.body;

        // Validar campos obrigatórios
        if (!displayName || !username || !email || !password) {
          return res.status(400).json({ 
            message: 'Nome, usuário, email e senha são obrigatórios' 
          });
        }

        // Verificar se email já existe
        const [existingEmail] = await db
          .select()
          .from(systemUsers)
          .where(eq(systemUsers.email, email))
          .limit(1);

        if (existingEmail) {
          return res.status(400).json({ 
            message: 'Este email já está em uso' 
          });
        }

        // Verificar se username já existe
        const [existingUsername] = await db
          .select()
          .from(systemUsers)
          .where(eq(systemUsers.username, username))
          .limit(1);

        if (existingUsername) {
          return res.status(400).json({ 
            message: 'Este nome de usuário já está em uso' 
          });
        }

        // Hash da senha
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.default.hash(password, 10);

        // Criar usuário
        const [newUser] = await db
          .insert(systemUsers)
          .values({
            displayName,
            username,
            email,
            password: passwordHash,
            role: role || 'user',
            team: team || null,
            roleId: roleId || 1,
            teamId: teamId || null,
            dataKey: dataKey || null,
            channels: channels || [],
            teamTypes: Array.isArray(teams) ? teams : [],
            isActive: true,
            status: 'active'
          })
          .returning();

        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'create',
          resource: 'user',
          resourceId: newUser.id.toString(),
          details: {
            displayName,
            username,
            email,
            role: role || 'user'
          },
          result: 'success'
        });

        // Não retornar o hash da senha na resposta
        const { password: _, ...userResponse } = newUser;

        res.status(201).json(userResponse);
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Request body:', req.body);
        res.status(500).json({ 
          message: 'Erro interno do servidor',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
  );

  // Atualizar usuário
  app.put('/api/admin/users/:id', 
    updateLastActivity(),
    requirePermission('usuario:editar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const { 
          displayName, 
          username,
          email,
          role,
          team,
          password,
          roleId, 
          teamId, 
          dataKey, 
          channels, 
          teams, 
          status,
          isActive
        } = req.body;

        // Verificar se o usuário existe
        const [existingUser] = await db
          .select()
          .from(systemUsers)
          .where(eq(systemUsers.id, userId))
          .limit(1);

        if (!existingUser) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const updateData: any = {};
        
        if (displayName !== undefined) updateData.displayName = displayName;
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (team !== undefined) updateData.team = team;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (teamId !== undefined) updateData.teamId = teamId;
        if (dataKey !== undefined) updateData.dataKey = dataKey;
        if (channels !== undefined) updateData.channels = channels;
        if (teams !== undefined) updateData.teams = teams;
        if (status !== undefined) updateData.status = status;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Atualizar senha se fornecida
        if (password && password.trim() !== '') {
          const bcrypt = await import('bcryptjs');
          updateData.passwordHash = await bcrypt.default.hash(password, 10);
        }

        updateData.updatedAt = new Date();

        const [updatedUser] = await db
          .update(systemUsers)
          .set(updateData)
          .where(eq(systemUsers.id, userId))
          .returning();

        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'update',
          resource: 'user',
          resourceId: userId.toString(),
          details: {
            displayName: updateData.displayName,
            username: updateData.username,
            email: updateData.email,
            role: updateData.role,
            team: updateData.team,
            passwordChanged: !!password
          },
          result: 'success'
        });

        // Não retornar o hash da senha na resposta
        const { password: _, ...userResponse } = updatedUser;

        res.json(userResponse);
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Excluir usuário
  app.delete('/api/admin/users/:id', 
    updateLastActivity(),
    requirePermission('usuario:excluir'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const { transferToUserId } = req.body;

        if (!userId || isNaN(userId)) {
          return res.status(400).json({ message: 'ID do usuário inválido' });
        }

        // Verificar se o usuário existe
        const [existingUser] = await db
          .select()
          .from(systemUsers)
          .where(eq(systemUsers.id, userId))
          .limit(1);

        if (!existingUser) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Não permitir que o usuário exclua a si mesmo
        if (userId === req.user!.id) {
          return res.status(400).json({ message: 'Não é possível excluir seu próprio usuário' });
        }

        // Verificar se o usuário de transferência existe (se fornecido)
        if (transferToUserId) {
          const [transferUser] = await db
            .select()
            .from(systemUsers)
            .where(eq(systemUsers.id, transferToUserId))
            .limit(1);

          if (!transferUser) {
            return res.status(400).json({ message: 'Usuário de transferência não encontrado' });
          }
        }

        // Primeiro, remover todas as vinculações do usuário com equipes
        await db
          .delete(userTeams)
          .where(eq(userTeams.userId, userId));

        // Transferir ou remover conversas atribuídas ao usuário
        if (transferToUserId) {
          // Transferir conversas para o usuário especificado
          await db
            .update(conversations)
            .set({ assignedUserId: transferToUserId })
            .where(eq(conversations.assignedUserId, userId));
        } else {
          // Remover atribuição das conversas (definir assignedUserId como null)
          await db
            .update(conversations)
            .set({ assignedUserId: null })
            .where(eq(conversations.assignedUserId, userId));
        }

        // Limpar referências em handoffs antes da exclusão
        await db
          .update(handoffs)
          .set({ fromUserId: null })
          .where(eq(handoffs.fromUserId, userId));
          
        await db
          .update(handoffs)
          .set({ toUserId: null })
          .where(eq(handoffs.toUserId, userId));

        // Realizar a exclusão física do usuário
        await db
          .delete(systemUsers)
          .where(eq(systemUsers.id, userId));

        // Log da ação
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'delete',
          resource: 'user',
          resourceId: userId.toString(),
          details: { 
            deletedUser: {
              id: existingUser.id,
              username: existingUser.username,
              displayName: existingUser.displayName,
              email: existingUser.email
            }
          },
          result: 'success'
        });

        console.log(`🗑️ Usuário ${existingUser.displayName} (ID: ${userId}) excluído com sucesso por ${req.user!.displayName}`);

        const message = transferToUserId 
          ? 'Usuário excluído com sucesso e contatos transferidos'
          : 'Usuário excluído com sucesso';

        res.json({ 
          success: true, 
          message,
          deletedUser: {
            id: existingUser.id,
            displayName: existingUser.displayName,
            email: existingUser.email
          }
        });
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'delete',
          resource: 'user',
          resourceId: req.params.id,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          result: 'failure'
        });
        
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );
} 