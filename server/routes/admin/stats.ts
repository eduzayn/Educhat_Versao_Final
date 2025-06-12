
import { Express, Request, Response } from 'express';
import { db } from '../../core/db';
import { systemUsers, roles, permissions, teams, auditLogs } from '../../../shared/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { requirePermission, AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

/**
 * Módulo de Estatísticas do Sistema
 * Responsabilidades:
 * - Métricas de usuários
 * - Contagens de entidades
 * - Atividades recentes
 */
export function registerStatsRoutes(app: Express) {

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
}
