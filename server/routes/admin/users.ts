
import { Express, Request, Response } from 'express';
import { db } from '../../core/db';
import { systemUsers, roles } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { requirePermission, PermissionService, AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

/**
 * Módulo de Gestão de Usuários
 * Responsabilidades:
 * - Listagem de usuários
 * - Atualização de usuários
 * - Aplicação de filtros de dataKey
 */
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
            teams: systemUsers.teams,
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
}
