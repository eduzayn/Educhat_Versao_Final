import { db } from '../db';
import { 
  gamificationUserStats, 
  gamificationBadges, 
  gamificationUserBadges, 
  gamificationAchievements,
  gamificationChallenges,
  gamificationChallengeParticipants,
  systemUsers,
  conversations,
  messages,
  teams
} from '@shared/schema';
import { eq, and, desc, gte, lte, sql, count, avg } from 'drizzle-orm';

export interface UserStats {
  userId: number;
  period: string;
  conversationsAssigned: number;
  conversationsClosed: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  messagesExchanged: number;
  workingHours: number;
  totalPoints: number;
}

export interface BadgeProgress {
  badgeId: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  progress: number;
  maxProgress: number;
  isEarned: boolean;
  earnedAt?: Date;
  points: number;
  rarity: string;
}

export interface Achievement {
  id: number;
  type: string;
  title: string;
  description: string;
  points: number;
  earnedAt: Date;
}

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  teamName?: string;
  value: number;
  position: number;
  points: number;
  change?: number; // mudança de posição
}

export class GamificationService {
  
  /**
   * Atualiza as estatísticas do usuário para um período específico
   */
  async updateUserStats(userId: number, period: 'daily' | 'weekly' | 'monthly', date: Date): Promise<void> {
    try {
      const periodDate = this.normalizePeriodDate(date, period);
      
      // Buscar dados existentes
      const existingStats = await db
        .select()
        .from(gamificationUserStats)
        .where(
          and(
            eq(gamificationUserStats.userId, userId),
            eq(gamificationUserStats.period, period),
            eq(gamificationUserStats.periodDate, periodDate)
          )
        )
        .limit(1);

      // Calcular estatísticas do período
      const stats = await this.calculateUserStatsForPeriod(userId, period, periodDate);
      
      const statsData = {
        userId,
        period,
        periodDate,
        ...stats,
        updatedAt: new Date()
      };

      if (existingStats.length > 0) {
        // Atualizar estatísticas existentes
        await db
          .update(gamificationUserStats)
          .set(statsData)
          .where(eq(gamificationUserStats.id, existingStats[0].id));
      } else {
        // Criar novas estatísticas
        await db.insert(gamificationUserStats).values(statsData);
      }

      // Verificar badges e achievements
      await this.checkBadgesAndAchievements(userId);
      
    } catch (error) {
      console.error('Erro ao atualizar estatísticas do usuário:', error);
    }
  }

  /**
   * Calcula estatísticas do usuário para um período específico
   */
  private async calculateUserStatsForPeriod(userId: number, period: string, periodDate: Date): Promise<Partial<UserStats>> {
    const { startDate, endDate } = this.getPeriodRange(periodDate, period);

    // Conversas atribuídas
    const conversationsAssignedResult = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.assignedUserId, userId),
          gte(conversations.createdAt, startDate),
          lte(conversations.createdAt, endDate)
        )
      );
    
    // Conversas fechadas
    const conversationsClosedResult = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.assignedUserId, userId),
          eq(conversations.status, 'resolved'),
          gte(conversations.updatedAt, startDate),
          lte(conversations.updatedAt, endDate)
        )
      );

    // Mensagens trocadas
    const messagesExchangedResult = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.assignedUserId, userId),
          gte(messages.sentAt, startDate),
          lte(messages.sentAt, endDate)
        )
      );

    // Calcular pontos baseados nas métricas
    const conversationsAssigned = conversationsAssignedResult[0]?.count || 0;
    const conversationsClosed = conversationsClosedResult[0]?.count || 0;
    const messagesExchanged = messagesExchangedResult[0]?.count || 0;
    
    // Sistema de pontuação
    const totalPoints = 
      (conversationsAssigned * 10) +
      (conversationsClosed * 25) +
      (messagesExchanged * 2);

    return {
      conversationsAssigned: Number(conversationsAssigned),
      conversationsClosed: Number(conversationsClosed),
      messagesExchanged: Number(messagesExchanged),
      averageResponseTime: 0, // TODO: implementar cálculo de tempo de resposta
      averageResolutionTime: 0, // TODO: implementar cálculo de tempo de resolução
      satisfactionScore: 85, // TODO: implementar cálculo de satisfação
      workingHours: 480, // TODO: implementar cálculo de horas trabalhadas
      totalPoints
    };
  }

  /**
   * Verifica e concede badges e achievements
   */
  private async checkBadgesAndAchievements(userId: number): Promise<void> {
    // Buscar todos os badges ativos
    const activeBadges = await db
      .select()
      .from(gamificationBadges)
      .where(eq(gamificationBadges.isActive, true));

    // Buscar badges já conquistados pelo usuário
    const userBadges = await db
      .select()
      .from(gamificationUserBadges)
      .where(eq(gamificationUserBadges.userId, userId));

    const earnedBadgeIds = userBadges.map(ub => ub.badgeId);

    for (const badge of activeBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      const hasEarned = await this.checkBadgeCondition(userId, badge);
      
      if (hasEarned) {
        await this.awardBadge(userId, badge.id);
        await this.createAchievement(userId, {
          type: 'badge',
          title: `Badge conquistado: ${badge.name}`,
          description: badge.description,
          points: badge.points || 100
        });
      }
    }
  }

  /**
   * Verifica se usuário atende condição de um badge
   */
  private async checkBadgeCondition(userId: number, badge: any): Promise<boolean> {
    const condition = badge.condition;
    
    if (!condition) return false;

    try {
      switch (condition.type) {
        case 'count':
          return await this.checkCountCondition(userId, condition);
        case 'streak':
          return await this.checkStreakCondition(userId, condition);
        case 'percentage':
          return await this.checkPercentageCondition(userId, condition);
        default:
          return false;
      }
    } catch (error) {
      console.error('Erro ao verificar condição do badge:', error);
      return false;
    }
  }

  /**
   * Verifica condição de contagem
   */
  private async checkCountCondition(userId: number, condition: any): Promise<boolean> {
    const period = condition.period || 'all_time';
    const metric = condition.metric;
    const targetValue = condition.value;

    let query;
    const currentDate = new Date();

    switch (metric) {
      case 'conversations_closed':
        query = db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedUserId, userId),
              eq(conversations.status, 'resolved'),
              period !== 'all_time' ? gte(conversations.updatedAt, this.getPeriodStart(currentDate, period)) : undefined
            )
          );
        break;
      
      case 'conversations_assigned':
        query = db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedUserId, userId),
              period !== 'all_time' ? gte(conversations.createdAt, this.getPeriodStart(currentDate, period)) : undefined
            )
          );
        break;

      default:
        return false;
    }

    const result = await query;
    const actualValue = result[0]?.count || 0;
    
    return Number(actualValue) >= targetValue;
  }

  /**
   * Verifica condição de sequência
   */
  private async checkStreakCondition(userId: number, condition: any): Promise<boolean> {
    // TODO: Implementar lógica de streak
    return false;
  }

  /**
   * Verifica condição de porcentagem
   */
  private async checkPercentageCondition(userId: number, condition: any): Promise<boolean> {
    // TODO: Implementar lógica de porcentagem
    return false;
  }

  /**
   * Concede um badge ao usuário
   */
  private async awardBadge(userId: number, badgeId: number): Promise<void> {
    await db.insert(gamificationUserBadges).values({
      userId,
      badgeId,
      earnedAt: new Date(),
      progress: 100,
      maxProgress: 100
    });
  }

  /**
   * Cria um achievement para o usuário
   */
  private async createAchievement(userId: number, achievement: {
    type: string;
    title: string;
    description: string;
    points: number;
  }): Promise<void> {
    await db.insert(gamificationAchievements).values({
      userId,
      ...achievement,
      earnedAt: new Date()
    });
  }

  /**
   * Busca badges do usuário com progresso
   */
  async getUserBadges(userId: number): Promise<BadgeProgress[]> {
    const userBadgesQuery = await db
      .select({
        badge: gamificationBadges,
        userBadge: gamificationUserBadges
      })
      .from(gamificationBadges)
      .leftJoin(
        gamificationUserBadges,
        and(
          eq(gamificationUserBadges.badgeId, gamificationBadges.id),
          eq(gamificationUserBadges.userId, userId)
        )
      )
      .where(eq(gamificationBadges.isActive, true));

    return userBadgesQuery.map(row => ({
      badgeId: row.badge.id,
      name: row.badge.name,
      description: row.badge.description,
      icon: row.badge.icon,
      color: row.badge.color || '#3B82F6',
      category: row.badge.category,
      progress: row.userBadge?.progress || 0,
      maxProgress: row.userBadge?.maxProgress || 100,
      isEarned: !!row.userBadge,
      earnedAt: row.userBadge?.earnedAt || undefined,
      points: row.badge.points || 100,
      rarity: row.badge.rarity || 'common'
    }));
  }

  /**
   * Busca achievements do usuário
   */
  async getUserAchievements(userId: number, limit: number = 10): Promise<Achievement[]> {
    const achievements = await db
      .select()
      .from(gamificationAchievements)
      .where(eq(gamificationAchievements.userId, userId))
      .orderBy(desc(gamificationAchievements.earnedAt))
      .limit(limit);

    return achievements.map(a => ({
      ...a,
      points: a.points || 0,
      earnedAt: a.earnedAt || new Date()
    }));
  }

  /**
   * Busca leaderboard por métrica e período
   */
  async getLeaderboard(
    metric: string, 
    period: 'daily' | 'weekly' | 'monthly', 
    teamId?: number,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    const currentDate = new Date();
    const periodDate = this.normalizePeriodDate(currentDate, period);

    let query = db
      .select({
        userId: gamificationUserStats.userId,
        userName: systemUsers.displayName,
        teamName: teams.name,
        value: this.getMetricField(metric),
        totalPoints: gamificationUserStats.totalPoints
      })
      .from(gamificationUserStats)
      .innerJoin(systemUsers, eq(gamificationUserStats.userId, systemUsers.id))
      .leftJoin(teams, eq(systemUsers.id, teams.id)) // TODO: corrigir join com user_teams
      .where(
        and(
          eq(gamificationUserStats.period, period),
          eq(gamificationUserStats.periodDate, periodDate),
          teamId ? eq(teams.id, teamId) : undefined
        )
      )
      .orderBy(desc(this.getMetricField(metric)))
      .limit(limit);

    const results = await query;

    return results.map((row, index) => ({
      userId: row.userId,
      userName: row.userName || 'Usuário',
      teamName: row.teamName || undefined,
      value: Number(row.value) || 0,
      position: index + 1,
      points: row.totalPoints || 0
    }));
  }

  /**
   * Busca estatísticas gerais do usuário
   */
  async getUserStats(userId: number, period: 'daily' | 'weekly' | 'monthly'): Promise<UserStats | null> {
    const currentDate = new Date();
    const periodDate = this.normalizePeriodDate(currentDate, period);

    const stats = await db
      .select()
      .from(gamificationUserStats)
      .where(
        and(
          eq(gamificationUserStats.userId, userId),
          eq(gamificationUserStats.period, period),
          eq(gamificationUserStats.periodDate, periodDate)
        )
      )
      .limit(1);

    if (!stats[0]) return null;
    
    const stat = stats[0];
    return {
      ...stat,
      conversationsAssigned: stat.conversationsAssigned || 0,
      conversationsClosed: stat.conversationsClosed || 0,
      averageResponseTime: stat.averageResponseTime || 0,
      averageResolutionTime: stat.averageResolutionTime || 0,
      satisfactionScore: stat.satisfactionScore || 0,
      messagesExchanged: stat.messagesExchanged || 0,
      workingHours: stat.workingHours || 0,
      totalPoints: stat.totalPoints || 0
    };
  }

  // Métodos auxiliares

  private normalizePeriodDate(date: Date, period: string): Date {
    const normalized = new Date(date);
    
    switch (period) {
      case 'daily':
        normalized.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        const dayOfWeek = normalized.getDay();
        const diff = normalized.getDate() - dayOfWeek;
        normalized.setDate(diff);
        normalized.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        normalized.setDate(1);
        normalized.setHours(0, 0, 0, 0);
        break;
    }
    
    return normalized;
  }

  private getPeriodRange(periodDate: Date, period: string): { startDate: Date; endDate: Date } {
    const startDate = new Date(periodDate);
    const endDate = new Date(periodDate);
    
    switch (period) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    return { startDate, endDate };
  }

  private getPeriodStart(date: Date, period: string): Date {
    const start = new Date(date);
    
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return start;
  }

  private getMetricField(metric: string) {
    switch (metric) {
      case 'conversations_closed':
        return gamificationUserStats.conversationsClosed;
      case 'conversations_assigned':
        return gamificationUserStats.conversationsAssigned;
      case 'total_points':
        return gamificationUserStats.totalPoints;
      case 'satisfaction_score':
        return gamificationUserStats.satisfactionScore;
      default:
        return gamificationUserStats.totalPoints;
    }
  }
}

export const gamificationService = new GamificationService();