import { Express, Response } from 'express';
import { db } from '../../core/db';
import { permissions, rolePermissions, customRules } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requirePermission, PermissionService, AuthenticatedRequest, updateLastActivity } from '../../core/permissionsRefactored';

export function registerPermissionRoutes(app: Express) {
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

  // Buscar permissões do usuário atual
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
} 