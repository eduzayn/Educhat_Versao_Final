import { Express, Request, Response } from 'express';
import { db } from '../../core/db';
import { 
  systemUsers, 
  roles, 
  permissions, 
  rolePermissions, 
  customRules, 
  auditLogs,
  teams,
  userTeams,
  conversations
} from '../../../shared/schema';
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm';
import { requirePermission, PermissionService, AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

/**
 * Módulo Admin - Sistema de Administração
 * 
 * Funcionalidades:
 * - Gestão de permissões e roles
 * - Gerenciamento de usuários
 * - Logs de auditoria
 * - Estatísticas do sistema
 * - Configurações administrativas
 */
export function registerAdminRoutes(app: Express) {

  // ==================== GESTÃO DE PERMISSÕES ====================

  // Listar todas as permissões
  app.get('/api/admin/permissions', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const allPermissions = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            resource: permissions.resource,
            action: permissions.action,
            description: permissions.description,
            category: permissions.category,
            isActive: permissions.isActive,
            createdAt: permissions.createdAt
          })
          .from(permissions)
          .orderBy(permissions.category, permissions.resource, permissions.action);

        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'view',
          resource: 'permissions',
          result: 'success'
        });

        res.json(allPermissions);
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Criar nova permissão
  app.post('/api/admin/permissions', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { name, resource, action, description, category } = req.body;

        if (!name || !resource || !action) {
          return res.status(400).json({ message: 'Nome, recurso e ação são obrigatórios' });
        }

        const [newPermission] = await db
          .insert(permissions)
          .values({
            name,
            resource,
            action,
            description,
            category: category || 'general'
          })
          .returning();

        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'create',
          resource: 'permission',
          resourceId: newPermission.id.toString(),
          details: { name, resource, action },
          result: 'success'
        });

        res.status(201).json(newPermission);
      } catch (error) {
        console.error('Erro ao criar permissão:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // ==================== GESTÃO DE FUNÇÕES ====================

  // Listar funções com permissões
  app.get('/api/admin/roles', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const rolesWithPermissions = await db
          .select({
            id: roles.id,
            name: roles.name,
            displayName: roles.displayName,
            isActive: roles.isActive,
            createdAt: roles.createdAt,
            permissionId: permissions.id,
            permissionName: permissions.name,
            permissionResource: permissions.resource,
            permissionAction: permissions.action,
            permissionDescription: permissions.description
          })
          .from(roles)
          .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
          .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(roles.isActive, true))
          .orderBy(roles.name);

        // Agrupar permissões por função
        const groupedRoles = rolesWithPermissions.reduce((acc, row) => {
          const roleId = row.id;
          if (!acc[roleId]) {
            acc[roleId] = {
              id: row.id,
              name: row.name,
              description: row.displayName,
              isActive: row.isActive,
              createdAt: row.createdAt,
              permissions: []
            };
          }
          
          if (row.permissionId) {
            acc[roleId].permissions.push({
              id: row.permissionId,
              name: row.permissionName,
              resource: row.permissionResource,
              action: row.permissionAction,
              description: row.permissionDescription
            });
          }
          
          return acc;
        }, {} as Record<number, any>);

        res.json(Object.values(groupedRoles));
      } catch (error) {
        console.error('Erro ao buscar funções:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Criar nova função
  app.post('/api/admin/roles', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { name, description, permissionIds } = req.body;

        if (!name) {
          return res.status(400).json({ message: 'Nome da função é obrigatório' });
        }

        const [newRole] = await db
          .insert(roles)
          .values({
            name,
            displayName: name,
            permissions: []
          })
          .returning();

        // Associar permissões à nova função
        if (permissionIds && permissionIds.length > 0) {
          const rolePermissionValues = permissionIds.map((permissionId: number) => ({
            roleId: newRole.id,
            permissionId
          }));

          await db.insert(rolePermissions).values(rolePermissionValues);
        }

        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'create',
          resource: 'role',
          resourceId: newRole.id.toString(),
          details: { name, permissionIds },
          result: 'success'
        });

        res.status(201).json(newRole);
      } catch (error) {
        console.error('Erro ao criar função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Atualizar permissões de uma função
  app.put('/api/admin/roles/:id/permissions', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const roleId = parseInt(req.params.id);
        const { permissionIds, permissionNames } = req.body;

        // Suporte para IDs ou nomes de permissões
        let finalPermissionIds: number[] = [];

        if (permissionNames && Array.isArray(permissionNames)) {
          // Converter nomes para IDs
          const permissionsData = await db
            .select()
            .from(permissions)
            .where(inArray(permissions.name, permissionNames));
          
          finalPermissionIds = permissionsData.map((p: any) => p.id);
        } else if (permissionIds && Array.isArray(permissionIds)) {
          finalPermissionIds = permissionIds;
        } else {
          return res.status(400).json({ message: 'Lista de permissões é obrigatória' });
        }

        // Remover todas as permissões atuais da função
        await db
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId));

        // Adicionar novas permissões
        if (finalPermissionIds.length > 0) {
          const rolePermissionValues = finalPermissionIds.map((permissionId: number) => ({
            roleId,
            permissionId
          }));

          await db.insert(rolePermissions).values(rolePermissionValues);
        }

        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'update',
          resource: 'role_permissions',
          resourceId: roleId.toString(),
          details: { permissionIds: finalPermissionIds, permissionNames },
          result: 'success'
        });

        res.json({ message: 'Permissões atualizadas com sucesso' });
      } catch (error) {
        console.error('Erro ao atualizar permissões da função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // ==================== GESTÃO DE USUÁRIOS ====================

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

  // Atualizar usuário
  app.put('/api/admin/users/:id', 
    updateLastActivity(),
    requirePermission('usuario:editar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const { 
          displayName, 
          roleId, 
          teamId, 
          dataKey, 
          channels, 
          teams, 
          status 
        } = req.body;

        const updateData: any = {};
        
        if (displayName !== undefined) updateData.displayName = displayName;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (teamId !== undefined) updateData.teamId = teamId;
        if (dataKey !== undefined) updateData.dataKey = dataKey;
        if (channels !== undefined) updateData.channels = channels;
        if (teams !== undefined) updateData.teams = teams;
        if (status !== undefined) updateData.status = status;

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
          details: updateData,
          result: 'success'
        });

        res.json(updatedUser);
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

        // Primeiro, remover todas as vinculações do usuário com equipes
        await db
          .delete(userTeams)
          .where(eq(userTeams.userId, userId));

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

        res.json({ 
          success: true, 
          message: 'Usuário excluído com sucesso',
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
          result: 'error'
        });
        
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // ==================== LOGS DE AUDITORIA ====================

  // Buscar logs de auditoria
  app.get('/api/admin/audit-logs', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { 
          page = 1, 
          limit = 50, 
          userId, 
          action, 
          resource, 
          startDate, 
          endDate 
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        
        let query = db
          .select({
            id: auditLogs.id,
            userId: auditLogs.userId,
            action: auditLogs.action,
            resource: auditLogs.resource,
            resourceId: auditLogs.resourceId,
            channel: auditLogs.channel,
            teamType: auditLogs.teamType,
            dataKey: auditLogs.dataKey,
            details: auditLogs.details,
            ipAddress: auditLogs.ipAddress,
            result: auditLogs.result,
            createdAt: auditLogs.createdAt,
            userName: systemUsers.displayName,
            userEmail: systemUsers.email
          })
          .from(auditLogs)
          .leftJoin(systemUsers, eq(auditLogs.userId, systemUsers.id))
          .orderBy(desc(auditLogs.createdAt))
          .limit(Number(limit))
          .offset(offset);

        // Aplicar filtros
        let whereConditions = [];
        if (userId) whereConditions.push(eq(auditLogs.userId, Number(userId)));
        if (action) whereConditions.push(eq(auditLogs.action, String(action)));
        if (resource) whereConditions.push(eq(auditLogs.resource, String(resource)));
        if (startDate) whereConditions.push(sql`${auditLogs.createdAt} >= ${startDate}`);
        if (endDate) whereConditions.push(sql`${auditLogs.createdAt} <= ${endDate}`);

        if (whereConditions.length > 0) {
          query = query.where(and(...whereConditions)) as any;
        }

        const logs = await query;

        res.json(logs);
      } catch (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // ==================== CONFIGURAÇÕES DO SISTEMA ====================

  // Buscar estatísticas do sistema
  app.get('/api/admin/stats', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const [usersStats] = await db
          .select({
            total: sql<number>`count(*)`,
            active: sql<number>`count(*) filter (where status = 'active')`,
            online: sql<number>`count(*) filter (where is_online = true)`
          })
          .from(systemUsers);

        const [rolesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(roles)
          .where(eq(roles.isActive, true));

        const [permissionsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(permissions)
          .where(eq(permissions.isActive, true));

        const [teamsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(teams)
          .where(eq(teams.isActive, true));

        const recentLogs = await db
          .select({
            action: auditLogs.action,
            resource: auditLogs.resource,
            createdAt: auditLogs.createdAt
          })
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(10);

        res.json({
          users: usersStats,
          roles: rolesCount.count,
          permissions: permissionsCount.count,
          teams: teamsCount.count,
          recentActivity: recentLogs
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Verificar permissões do usuário atual
  app.get('/api/admin/my-permissions', 
    updateLastActivity(),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Não autenticado' });
        }

        // Buscar permissões diretas da função
        const userRolePermissions = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            resource: permissions.resource,
            action: permissions.action,
            description: permissions.description,
            category: permissions.category
          })
          .from(permissions)
          .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
          .where(and(
            eq(rolePermissions.roleId, req.user.roleId || 0),
            eq(permissions.isActive, true),
            eq(rolePermissions.isActive, true)
          ));

        // Buscar regras customizadas
        const customPermissions = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            resource: permissions.resource,
            action: permissions.action,
            description: permissions.description,
            category: permissions.category,
            conditions: customRules.conditions
          })
          .from(permissions)
          .innerJoin(customRules, eq(permissions.id, customRules.permissionId))
          .where(and(
            eq(customRules.userId, req.user.id),
            eq(customRules.isActive, true)
          ));

        res.json({
          isAdmin: req.user.role === 'admin',
          rolePermissions: userRolePermissions,
          customPermissions,
          user: {
            id: req.user.id,
            role: req.user.role,
            dataKey: req.user.dataKey,
            channels: req.user.channels,
            teams: req.user.teams
          }
        });
      } catch (error) {
        console.error('Erro ao buscar permissões do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // ==================== PERMISSÕES DE FUNÇÃO ====================

  // Buscar permissões de uma função específica
  app.get('/api/admin/role-permissions/:roleId', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const roleId = parseInt(req.params.roleId);
        
        const rolePermissionsData = await db
          .select({
            id: rolePermissions.id,
            permissionId: rolePermissions.permissionId,
            roleId: rolePermissions.roleId,
            permissionName: permissions.name,
            permission: {
              id: permissions.id,
              name: permissions.name,
              resource: permissions.resource,
              action: permissions.action,
              description: permissions.description,
              category: permissions.category
            }
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.isActive, true),
            eq(permissions.isActive, true)
          ));

        res.json(rolePermissionsData);
      } catch (error) {
        console.error('Erro ao buscar permissões da função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Atualizar permissões de uma função
  app.post('/api/admin/role-permissions',
    updateLastActivity(),
    requirePermission('permissao:gerenciar'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        console.log('📝 Dados recebidos no POST role-permissions:', JSON.stringify(req.body, null, 2));
        
        const { roleId, permissionId, permissions: permissionNames } = req.body;

        // Suporte para múltiplos formatos de requisição
        if (roleId && permissionId) {
          // Formato individual: { roleId, permissionId }
          const existingPermission = await db
            .select()
            .from(rolePermissions)
            .where(and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permissionId)
            ));

          if (existingPermission.length === 0) {
            await db.insert(rolePermissions).values({
              roleId,
              permissionId,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          return res.json({ success: true, message: 'Permissão adicionada com sucesso' });
        }

        if (!roleId || (!permissionNames && !Array.isArray(permissionNames))) {
          console.log('❌ Validação falhou:', { 
            roleId, 
            permissionNames, 
            hasRoleId: !!roleId, 
            isArray: Array.isArray(permissionNames),
            bodyKeys: Object.keys(req.body)
          });
          return res.status(400).json({ message: 'Formato de dados inválido para atualização de permissões' });
        }

        // Buscar IDs das permissões pelos nomes
        const permissionIds = await db
          .select({ id: permissions.id })
          .from(permissions)
          .where(and(
            inArray(permissions.name, permissionNames),
            eq(permissions.isActive, true)
          ));

        // Remover todas as permissões existentes da função
        await db
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId));

        // Adicionar as novas permissões
        if (permissionIds.length > 0) {
          const newRolePermissions = permissionIds.map(p => ({
            roleId: roleId,
            permissionId: p.id,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          await db.insert(rolePermissions).values(newRolePermissions);
        }

        // Log da ação
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'update',
          resource: 'role_permissions',
          resourceId: roleId.toString(),
          details: { permissions: permissionNames },
          result: 'success'
        });

        res.json({ success: true, message: 'Permissões atualizadas com sucesso' });
      } catch (error) {
        console.error('Erro ao atualizar permissões da função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Remover permissão específica de uma função
  app.delete('/api/admin/role-permissions',
    updateLastActivity(),
    requirePermission('permissao:gerenciar'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        console.log('📝 Dados recebidos no DELETE role-permissions:', JSON.stringify(req.body, null, 2));
        
        const { roleId, permissionId } = req.body;

        if (!roleId || !permissionId) {
          console.log('❌ Validação falhou no DELETE:', { roleId, permissionId });
          return res.status(400).json({ message: 'roleId e permissionId são obrigatórios' });
        }

        // Remover a permissão específica
        await db
          .delete(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId)
          ));

        // Log da ação
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'delete',
          resource: 'role_permission',
          resourceId: `${roleId}-${permissionId}`,
          details: { roleId, permissionId },
          result: 'success'
        });

        res.json({ success: true, message: 'Permissão removida com sucesso' });
      } catch (error) {
        console.error('Erro ao remover permissão da função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Endpoint para buscar permissões do usuário atual (para o frontend)
  app.get('/api/admin/user-permissions',
    updateLastActivity(),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Não autenticado' });
        }

        // Buscar permissões diretas da função
        const userRolePermissions = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            resource: permissions.resource,
            action: permissions.action,
            description: permissions.description,
            category: permissions.category
          })
          .from(permissions)
          .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
          .where(and(
            eq(rolePermissions.roleId, req.user.roleId || 0),
            eq(permissions.isActive, true),
            eq(rolePermissions.isActive, true)
          ));

        // Buscar regras customizadas (se existirem)
        const customPermissions: any[] = [];

        res.json({
          isAdmin: req.user.role === 'admin',
          rolePermissions: userRolePermissions,
          customPermissions,
          user: {
            id: req.user.id,
            role: req.user.role,
            dataKey: req.user.dataKey,
            channels: req.user.channels,
            teams: req.user.teams
          }
        });
      } catch (error) {
        console.error('Erro ao buscar permissões do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // ==================== FERRAMENTA DE LIMPEZA DE NEGÓCIOS ====================
  
  // Limpar negócios duplicados
  app.post('/api/admin/cleanup-duplicate-deals', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { storage } = await import('../../storage');
        
        console.log(`🧹 Iniciando limpeza de deals duplicados por usuário ${req.user!.displayName}`);
        
        const result = await storage.cleanupDuplicateDeals();
        
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'deals',
          details: { 
            removedCount: result.removed,
            cleanupType: 'duplicate_deals'
          },
          result: 'success'
        });

        res.json({
          success: true,
          message: `Limpeza concluída: ${result.removed} negócios duplicados removidos`,
          details: result
        });
      } catch (error) {
        console.error('Erro na limpeza de negócios duplicados:', error);
        
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'deals',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          result: 'error'
        });
        
        res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor durante a limpeza',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}