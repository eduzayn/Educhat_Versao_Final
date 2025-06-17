import { Express, Response } from 'express';
import { db } from '../../core/db';
import { conversations, messages, handoffs, auditLogs } from '../../../shared/schema';
import { sql, and } from 'drizzle-orm';
import { requirePermission, AuthenticatedRequest, updateLastActivity, PermissionService } from '../../core/permissionsRefactored';

export function registerCleanupRoutes(app: Express) {
  // Limpar dados antigos
  app.post('/api/admin/cleanup', 
    updateLastActivity(),
    requirePermission('sistema:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { 
          daysToKeep = 90,
          includeAuditLogs = true,
          includeHandoffs = true
        } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

        // Limpar mensagens antigas
        const messagesResult = await db
          .delete(messages)
          .where(sql`${messages.createdAt} < ${cutoffDate}`);

        // Limpar conversas antigas
        const conversationsResult = await db
          .delete(conversations)
          .where(sql`${conversations.createdAt} < ${cutoffDate}`);

        // Limpar handoffs antigos se solicitado
        let handoffsResult = { rowCount: 0 };
        if (includeHandoffs) {
          handoffsResult = await db
            .delete(handoffs)
            .where(sql`${handoffs.createdAt} < ${cutoffDate}`);
        }

        // Limpar logs de auditoria se solicitado
        let auditLogsResult = { rowCount: 0 };
        if (includeAuditLogs) {
          auditLogsResult = await db
            .delete(auditLogs)
            .where(sql`${auditLogs.createdAt} < ${cutoffDate}`);
        }

        // Registrar a ação de limpeza
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'system',
          details: {
            daysKept: daysToKeep,
            cutoffDate: cutoffDate.toISOString(),
            includeAuditLogs,
            includeHandoffs,
            deletedCounts: {
              messages: messagesResult.rowCount,
              conversations: conversationsResult.rowCount,
              handoffs: handoffsResult.rowCount,
              auditLogs: auditLogsResult.rowCount
            }
          },
          result: 'success'
        });

        res.json({
          message: 'Limpeza concluída com sucesso',
          deletedCounts: {
            messages: messagesResult.rowCount,
            conversations: conversationsResult.rowCount,
            handoffs: handoffsResult.rowCount,
            auditLogs: auditLogsResult.rowCount
          }
        });
      } catch (error) {
        console.error('Erro ao realizar limpeza:', error);
        
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'system',
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            ...req.body
          },
          result: 'failure'
        });
        
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Obter estatísticas de dados antigos
  app.get('/api/admin/cleanup/stats', 
    updateLastActivity(),
    requirePermission('sistema:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { days = 90 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(days));

        // Contar mensagens antigas
        const [{ oldMessages }] = await db
          .select({ oldMessages: sql<number>`count(*)` })
          .from(messages)
          .where(sql`${messages.createdAt} < ${cutoffDate}`);

        // Contar conversas antigas
        const [{ oldConversations }] = await db
          .select({ oldConversations: sql<number>`count(*)` })
          .from(conversations)
          .where(sql`${conversations.createdAt} < ${cutoffDate}`);

        // Contar handoffs antigos
        const [{ oldHandoffs }] = await db
          .select({ oldHandoffs: sql<number>`count(*)` })
          .from(handoffs)
          .where(sql`${handoffs.createdAt} < ${cutoffDate}`);

        // Contar logs de auditoria antigos
        const [{ oldAuditLogs }] = await db
          .select({ oldAuditLogs: sql<number>`count(*)` })
          .from(auditLogs)
          .where(sql`${auditLogs.createdAt} < ${cutoffDate}`);

        // Calcular tamanho estimado
        const [{ totalSize }] = await db
          .select({ 
            totalSize: sql<number>`
              (SELECT pg_size_pretty(pg_total_relation_size('messages'))::text)::bigint +
              (SELECT pg_size_pretty(pg_total_relation_size('conversations'))::text)::bigint +
              (SELECT pg_size_pretty(pg_total_relation_size('handoffs'))::text)::bigint +
              (SELECT pg_size_pretty(pg_total_relation_size('audit_logs'))::text)::bigint
            `
          });

        res.json({
          cutoffDate: cutoffDate.toISOString(),
          oldData: {
            messages: oldMessages,
            conversations: oldConversations,
            handoffs: oldHandoffs,
            auditLogs: oldAuditLogs
          },
          totalSize
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas de limpeza:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );
} 