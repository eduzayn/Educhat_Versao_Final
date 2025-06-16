import { Express, Response } from 'express';
import { db } from '../../core/db';
import { roles, rolePermissions, permissions } from '../../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requirePermission, PermissionService, AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

export function registerRoleRoutes(app: Express) {
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
              createdAt: new Date()
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
            createdAt: new Date()
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
} 