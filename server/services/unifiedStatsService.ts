import { db } from '../core/db';
import { conversations, handoffs, systemUsers, deals, messages, contacts } from '@shared/schema';
import { eq, and, sql, desc, count, avg, gte, lte } from 'drizzle-orm';

export interface StatsFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  teamId?: number;
  teamType?: string;
}

export interface UnifiedStats {
  overview: {
    totalConversations: number;
    totalDeals: number;
    totalHandoffs: number;
    activeUsers: number;
    totalMessages: number;
    totalContacts: number;
  };
  performance: {
    avgResponseTime: number;
    avgResolutionTime: number;
    conversationToDealsRatio: number;
    successfulHandoffs: number;
  };
  trends: {
    conversationsThisWeek: number;
    conversationsLastWeek: number;
    dealsThisWeek: number;
    dealsLastWeek: number;
  };
  moduleSpecific?: any;
}

export class UnifiedStatsService {
  /**
   * Obter estatísticas unificadas do sistema
   */
  async getUnifiedStats(filters: StatsFilters = {}, module?: string): Promise<UnifiedStats> {
    const { startDate, endDate, userId, teamId, teamType } = filters;
    
    // Construir condições WHERE baseado nos filtros
    const whereConditions = [];
    
    if (startDate) {
      whereConditions.push(gte(conversations.createdAt, startDate));
    }
    
    if (endDate) {
      whereConditions.push(lte(conversations.createdAt, endDate));
    }
    
    if (userId) {
      whereConditions.push(eq(conversations.assignedUserId, userId));
    }
    
    if (teamId) {
      whereConditions.push(eq(conversations.assignedTeamId, teamId));
    }
    
    if (teamType) {
      whereConditions.push(eq(conversations.teamType, teamType));
    }

    // Obter estatísticas básicas
    const [overview, performance, trends] = await Promise.all([
      this.getOverviewStats(whereConditions),
      this.getPerformanceStats(whereConditions),
      this.getTrendsStats()
    ]);

    const stats: UnifiedStats = {
      overview,
      performance,
      trends
    };

    // Adicionar estatísticas específicas do módulo se solicitado
    if (module) {
      stats.moduleSpecific = await this.getModuleSpecificStats(module, filters);
    }

    return stats;
  }

  /**
   * Estatísticas gerais do sistema
   */
  private async getOverviewStats(whereConditions: any[]): Promise<UnifiedStats['overview']> {
    const conversationWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [
      { totalConversations },
      { totalDeals },
      { totalHandoffs },
      { activeUsers },
      { totalMessages },
      { totalContacts }
    ] = await Promise.all([
      db.select({ totalConversations: count() })
        .from(conversations)
        .where(conversationWhere)
        .then(res => res[0]),
      
      db.select({ totalDeals: count() })
        .from(deals)
        .then(res => res[0]),
      
      db.select({ totalHandoffs: count() })
        .from(handoffs)
        .then(res => res[0]),
      
      db.select({ activeUsers: count() })
        .from(systemUsers)
        .where(eq(systemUsers.isActive, true))
        .then(res => res[0]),
      
      db.select({ totalMessages: count() })
        .from(messages)
        .then(res => res[0]),
      
      db.select({ totalContacts: count() })
        .from(contacts)
        .then(res => res[0])
    ]);

    return {
      totalConversations,
      totalDeals,
      totalHandoffs,
      activeUsers,
      totalMessages,
      totalContacts
    };
  }

  /**
   * Estatísticas de performance
   */
  private async getPerformanceStats(whereConditions: any[]): Promise<UnifiedStats['performance']> {
    const conversationWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [
      { avgResponseTime },
      { avgResolutionTime },
      { successfulHandoffs }
    ] = await Promise.all([
      db.select({ 
        avgResponseTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.lastMessageAt} - ${conversations.createdAt}))`)
      })
        .from(conversations)
        .where(and(
          conversationWhere,
          sql`${conversations.lastMessageAt} IS NOT NULL`
        ))
        .then(res => res[0]),

      db.select({ 
        avgResolutionTime: avg(sql<number>`EXTRACT(EPOCH FROM (${conversations.updatedAt} - ${conversations.createdAt}))`)
      })
        .from(conversations)
        .where(and(
          conversationWhere,
          sql`${conversations.status} = 'resolved'`
        ))
        .then(res => res[0]),

      db.select({ successfulHandoffs: count() })
        .from(handoffs)
        .where(eq(handoffs.status, 'completed'))
        .then(res => res[0])
    ]);

    // Calcular ratio de conversas para deals
    const [totalConvs] = await db.select({ count: count() })
      .from(conversations)
      .where(conversationWhere);
    
    const [totalDealsCount] = await db.select({ count: count() })
      .from(deals);

    const conversationToDealsRatio = totalConvs.count > 0 
      ? (totalDealsCount.count / totalConvs.count) * 100 
      : 0;

    return {
      avgResponseTime: avgResponseTime ? Math.round(Number(avgResponseTime)) : 0,
      avgResolutionTime: avgResolutionTime ? Math.round(Number(avgResolutionTime)) : 0,
      conversationToDealsRatio: Math.round(conversationToDealsRatio * 100) / 100,
      successfulHandoffs
    };
  }

  /**
   * Estatísticas de tendências (semana atual vs anterior)
   */
  private async getTrendsStats(): Promise<UnifiedStats['trends']> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);

    const [
      { conversationsThisWeek },
      { conversationsLastWeek },
      { dealsThisWeek },
      { dealsLastWeek }
    ] = await Promise.all([
      db.select({ conversationsThisWeek: count() })
        .from(conversations)
        .where(gte(conversations.createdAt, weekStart))
        .then(res => res[0]),

      db.select({ conversationsLastWeek: count() })
        .from(conversations)
        .where(and(
          gte(conversations.createdAt, lastWeekStart),
          lte(conversations.createdAt, weekStart)
        ))
        .then(res => res[0]),

      db.select({ dealsThisWeek: count() })
        .from(deals)
        .where(gte(deals.createdAt, weekStart))
        .then(res => res[0]),

      db.select({ dealsLastWeek: count() })
        .from(deals)
        .where(and(
          gte(deals.createdAt, lastWeekStart),
          lte(deals.createdAt, weekStart)
        ))
        .then(res => res[0])
    ]);

    return {
      conversationsThisWeek,
      conversationsLastWeek,
      dealsThisWeek,
      dealsLastWeek
    };
  }

  /**
   * Estatísticas específicas por módulo
   */
  private async getModuleSpecificStats(module: string, filters: StatsFilters): Promise<any> {
    switch (module) {
      case 'admin':
        return this.getAdminStats(filters);
      case 'analytics':
        return this.getAnalyticsStats(filters);
      case 'bi':
        return this.getBIStats(filters);
      case 'dashboard':
        return this.getDashboardStats(filters);
      default:
        return {};
    }
  }

  /**
   * Estatísticas específicas do módulo Admin
   */
  private async getAdminStats(filters: StatsFilters): Promise<any> {
    const [
      { inactiveUsers },
      { pendingHandoffs },
      { errorRate }
    ] = await Promise.all([
      db.select({ inactiveUsers: count() })
        .from(systemUsers)
        .where(eq(systemUsers.isActive, false))
        .then(res => res[0]),

      db.select({ pendingHandoffs: count() })
        .from(handoffs)
        .where(eq(handoffs.status, 'pending'))
        .then(res => res[0]),

      // Simular error rate baseado em handoffs rejeitados
      db.select({ errorRate: count() })
        .from(handoffs)
        .where(eq(handoffs.status, 'rejected'))
        .then(res => res[0])
    ]);

    return {
      userManagement: {
        inactiveUsers,
        totalUsers: inactiveUsers + (await this.getOverviewStats([])).activeUsers
      },
      systemHealth: {
        pendingHandoffs,
        errorRate: errorRate / Math.max(1, pendingHandoffs + errorRate) * 100
      }
    };
  }

  /**
   * Estatísticas específicas do módulo Analytics
   */
  private async getAnalyticsStats(filters: StatsFilters): Promise<any> {
    // Estatísticas mais detalhadas para analytics
    const channelStats = await db.select({
      channel: conversations.channel,
      count: count()
    })
      .from(conversations)
      .groupBy(conversations.channel);

    const teamStats = await db.select({
      teamType: conversations.teamType,
      count: count()
    })
      .from(conversations)
      .where(sql`${conversations.teamType} IS NOT NULL`)
      .groupBy(conversations.teamType);

    return {
      channelDistribution: channelStats,
      teamDistribution: teamStats,
      detailedMetrics: true
    };
  }

  /**
   * Estatísticas específicas do módulo BI
   */
  private async getBIStats(filters: StatsFilters): Promise<any> {
    // KPIs específicos para BI
    return {
      kpis: {
        conversionRate: 0, // Calcular conversão leads->deals
        customerSatisfaction: 0, // Baseado em feedbacks
        operationalEfficiency: 0 // Baseado em tempos de resposta
      },
      forecasting: {
        predictedDeals: 0,
        trendAnalysis: {}
      }
    };
  }

  /**
   * Estatísticas específicas do Dashboard
   */
  private async getDashboardStats(filters: StatsFilters): Promise<any> {
    // Estatísticas resumidas para dashboard principal
    const recentActivity = await db.select({
      id: conversations.id,
      contactId: conversations.contactId,
      status: conversations.status,
      lastActivity: conversations.lastMessageAt
    })
      .from(conversations)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(5);

    return {
      recentActivity,
      quickMetrics: {
        todayConversations: 0, // Calcular conversas de hoje
        todayDeals: 0, // Calcular deals de hoje
        activeAgents: 0 // Calcular agentes online
      }
    };
  }
}

export const unifiedStatsService = new UnifiedStatsService();