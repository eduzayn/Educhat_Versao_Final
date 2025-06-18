import { Express, Response } from 'express';
import { db } from '../../core/db';
import { auditLogs, systemUsers } from '../../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requirePermission, AuthenticatedRequest, updateLastActivity } from '../../core/permissionsRefactored';

export function registerAuditRoutes(app: Express) {
  // Listar logs de auditoria
  app.get('/api/admin/audit-logs', 
    updateLastActivity(),
    requirePermission('auditoria:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { 
          startDate, 
          endDate, 
          userId, 
          action, 
          resource,
          page = 1,
          limit = 50
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // Construir query base
        let query = db
          .select({
            id: auditLogs.id,
            userId: auditLogs.userId,
            action: auditLogs.action,
            resource: auditLogs.resource,
            resourceId: auditLogs.resourceId,
            details: auditLogs.details,
            result: auditLogs.result,
            createdAt: auditLogs.createdAt,
            userDisplayName: systemUsers.displayName,
            userEmail: systemUsers.email
          })
          .from(auditLogs)
          .leftJoin(systemUsers, eq(auditLogs.userId, systemUsers.id));

        // Aplicar filtros
        const conditions = [];

        if (startDate) {
          conditions.push(sql`${auditLogs.createdAt} >= ${new Date(startDate as string)}`);
        }

        if (endDate) {
          conditions.push(sql`${auditLogs.createdAt} <= ${new Date(endDate as string)}`);
        }

        if (userId) {
          conditions.push(eq(auditLogs.userId, Number(userId)));
        }

        if (action) {
          conditions.push(eq(auditLogs.action, action as string));
        }

        if (resource) {
          conditions.push(eq(auditLogs.resource, resource as string));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        // Ordenar por data mais recente
        query = query.orderBy(desc(auditLogs.createdAt));

        // Aplicar paginação
        query = query.limit(Number(limit)).offset(offset);

        const logs = await query;

        // Contar total de registros para paginação
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        res.json({
          logs,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        });
      } catch (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Obter detalhes de um log específico
  app.get('/api/admin/audit-logs/:id', 
    updateLastActivity(),
    requirePermission('auditoria:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const logId = parseInt(req.params.id);

        const [log] = await db
          .select({
            id: auditLogs.id,
            userId: auditLogs.userId,
            action: auditLogs.action,
            resource: auditLogs.resource,
            resourceId: auditLogs.resourceId,
            details: auditLogs.details,
            result: auditLogs.result,
            createdAt: auditLogs.createdAt,
            userDisplayName: systemUsers.displayName,
            userEmail: systemUsers.email
          })
          .from(auditLogs)
          .leftJoin(systemUsers, eq(auditLogs.userId, systemUsers.id))
          .where(eq(auditLogs.id, logId))
          .limit(1);

        if (!log) {
          return res.status(404).json({ message: 'Log não encontrado' });
        }

        res.json(log);
      } catch (error) {
        console.error('Erro ao buscar detalhes do log:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Limpar logs antigos
  app.delete('/api/admin/audit-logs', 
    updateLastActivity(),
    requirePermission('auditoria:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { daysToKeep = 90 } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

        const result = await db
          .delete(auditLogs)
          .where(sql`${auditLogs.createdAt} < ${cutoffDate}`);

        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'audit_logs',
          details: {
            daysKept: daysToKeep,
            cutoffDate: cutoffDate.toISOString()
          },
          result: 'success'
        });

        res.json({ 
          message: 'Logs antigos removidos com sucesso',
          deletedCount: result.rowCount
        });
      } catch (error) {
        console.error('Erro ao limpar logs antigos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );
} 