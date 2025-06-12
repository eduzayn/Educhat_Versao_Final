
import { Express, Request, Response } from 'express';
import { db } from '../../core/db';
import { auditLogs, systemUsers } from '../../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requirePermission, AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

/**
 * Módulo de Logs de Auditoria
 * Responsabilidades:
 * - Busca de logs com filtros
 * - Paginação
 * - Análise de atividades do sistema
 */
export function registerAuditRoutes(app: Express) {

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
}
