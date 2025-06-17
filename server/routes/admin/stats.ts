import { Express, Response } from 'express';
import { db } from '../../core/db';
import { conversations, handoffs, systemUsers } from '@shared/schema';
import { eq, and, sql, desc, count, avg } from 'drizzle-orm';
import { requirePermission, AuthenticatedRequest, updateLastActivity } from '../../core/permissionsRefactored';

export function registerStatsRoutes(app: Express) {
  // Obter estatísticas gerais
  app.get('/api/admin/stats', 
    updateLastActivity(),
    requirePermission('estatisticas:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Total de conversas
        const [{ totalConversations }] = await db
          .select({ totalConversations: count() })
          .from(conversations);

        // Total de handoffs
        const [{ totalHandoffs }] = await db
          .select({ totalHandoffs: count() })
          .from(handoffs);

        // Total de usuários ativos
        const [{ activeUsers }] = await db
          .select({ activeUsers: count() })
          .from(systemUsers)
          .where(eq(systemUsers.isActive, true));

        // Tempo médio de resposta
        const [{ avgResponseTime }] = await db
          .select({ 
            avgResponseTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.firstResponseAt} - ${conversations.createdAt}))`)
          })
          .from(conversations)
          .where(sql`${conversations.firstResponseAt} IS NOT NULL`);

        // Tempo médio de resolução
        const [{ avgResolutionTime }] = await db
          .select({ 
            avgResolutionTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.closedAt} - ${conversations.createdAt}))`)
          })
          .from(conversations)
          .where(sql`${conversations.closedAt} IS NOT NULL`);

        res.json({
          totalConversations,
          totalHandoffs,
          activeUsers,
          avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : 0,
          avgResolutionTime: avgResolutionTime ? Math.round(avgResolutionTime) : 0
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Obter estatísticas por período
  app.get('/api/admin/stats/period', 
    updateLastActivity(),
    requirePermission('estatisticas:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
          return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        // Conversas por período
        const conversationsByPeriod = await db
          .select({
            date: sql<string>`DATE_TRUNC('day', ${conversations.createdAt})::date`,
            count: count()
          })
          .from(conversations)
          .where(
            and(
              sql`${conversations.createdAt} >= ${start}`,
              sql`${conversations.createdAt} <= ${end}`
            )
          )
          .groupBy(sql`DATE_TRUNC('day', ${conversations.createdAt})::date`)
          .orderBy(sql`DATE_TRUNC('day', ${conversations.createdAt})::date`);

        // Handoffs por período
        const handoffsByPeriod = await db
          .select({
            date: sql<string>`DATE_TRUNC('day', ${handoffs.createdAt})::date`,
            count: count()
          })
          .from(handoffs)
          .where(
            and(
              sql`${handoffs.createdAt} >= ${start}`,
              sql`${handoffs.createdAt} <= ${end}`
            )
          )
          .groupBy(sql`DATE_TRUNC('day', ${handoffs.createdAt})::date`)
          .orderBy(sql`DATE_TRUNC('day', ${handoffs.createdAt})::date`);

        // Tempo médio de resposta por período
        const responseTimeByPeriod = await db
          .select({
            date: sql<string>`DATE_TRUNC('day', ${conversations.createdAt})::date`,
            avgTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.firstResponseAt} - ${conversations.createdAt}))`)
          })
          .from(conversations)
          .where(
            and(
              sql`${conversations.createdAt} >= ${start}`,
              sql`${conversations.createdAt} <= ${end}`,
              sql`${conversations.firstResponseAt} IS NOT NULL`
            )
          )
          .groupBy(sql`DATE_TRUNC('day', ${conversations.createdAt})::date`)
          .orderBy(sql`DATE_TRUNC('day', ${conversations.createdAt})::date`);

        res.json({
          conversations: conversationsByPeriod,
          handoffs: handoffsByPeriod,
          responseTime: responseTimeByPeriod.map(item => ({
            date: item.date,
            avgTime: item.avgTime ? Math.round(item.avgTime) : 0
          }))
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas por período:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );

  // Obter estatísticas por usuário
  app.get('/api/admin/stats/users', 
    updateLastActivity(),
    requirePermission('estatisticas:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { startDate, endDate } = req.query;

        const conditions = [];
        if (startDate && endDate) {
          conditions.push(
            and(
              sql`${conversations.createdAt} >= ${new Date(startDate as string)}`,
              sql`${conversations.createdAt} <= ${new Date(endDate as string)}`
            )
          );
        }

        // Estatísticas por usuário
        const userStats = await db
          .select({
            userId: systemUsers.id,
            displayName: systemUsers.displayName,
            email: systemUsers.email,
            totalConversations: count(conversations.id),
            avgResponseTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.firstResponseAt} - ${conversations.createdAt}))`),
            avgResolutionTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.closedAt} - ${conversations.createdAt}))`),
            totalHandoffs: count(handoffs.id)
          })
          .from(systemUsers)
          .leftJoin(conversations, eq(conversations.assignedUserId, systemUsers.id))
          .leftJoin(handoffs, eq(handoffs.fromUserId, systemUsers.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .groupBy(systemUsers.id, systemUsers.displayName, systemUsers.email)
          .orderBy(desc(sql`count(${conversations.id})`));

        res.json(userStats.map(stat => ({
          ...stat,
          avgResponseTime: stat.avgResponseTime ? Math.round(stat.avgResponseTime) : 0,
          avgResolutionTime: stat.avgResolutionTime ? Math.round(stat.avgResolutionTime) : 0
        })));
      } catch (error) {
        console.error('Erro ao buscar estatísticas por usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  );
} 