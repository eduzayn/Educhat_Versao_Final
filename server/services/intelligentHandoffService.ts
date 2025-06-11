import { db } from '../core/db';
import { eq, and, desc, asc, or, count, isNull } from 'drizzle-orm';
import { 
  handoffs, 
  conversations, 
  teams, 
  systemUsers, 
  userTeams,
  contacts,
  aiMemory 
} from '../../shared/schema';
import { AIService, MessageClassification } from './aiService';

interface TeamCapacity {
  teamId: number;
  teamName: string;
  macrosetor: string;
  activeUsers: number;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number;
  priority: number;
  isActive: boolean;
}

interface UserAvailability {
  userId: number;
  username: string;
  displayName: string;
  teamId: number;
  currentConversations: number;
  isOnline: boolean;
  lastActivity: Date | null;
  roleCapacity: number;
}

interface HandoffRecommendation {
  teamId?: number;
  userId?: number;
  confidence: number;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedWaitTime: number;
  alternativeOptions: Array<{
    teamId?: number;
    userId?: number;
    reason: string;
    confidence: number;
  }>;
}

/**
 * Serviço inteligente de handoffs que integra IA com dados reais de equipes
 */
export class IntelligentHandoffService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Analisa e recomenda o melhor destino para handoff baseado em IA e capacidade real
   */
  async analyzeAndRecommendHandoff(
    conversationId: number,
    messageContent: string,
    aiClassification: MessageClassification
  ): Promise<HandoffRecommendation> {
    
    // 1. Buscar contexto da conversa
    const [conversation] = await db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        currentTeamId: conversations.assignedTeamId,
        currentUserId: conversations.assignedUserId,
        macrosetor: conversations.macrosetor,
        priority: conversations.priority,
        tags: conversations.tags
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    // 2. Analisar capacidade atual das equipes
    const teamCapacities = await this.analyzeTeamCapacities();
    
    // 3. Mapear intenção da IA para macrosetor
    const suggestedMacrosetor = this.mapIntentToMacrosetor(aiClassification);
    
    // 4. Buscar contexto histórico do contato
    const contactHistory = await this.getContactHistory(conversation.contactId);
    
    // 5. Calcular recomendação inteligente
    const recommendation = await this.calculateBestRecommendation(
      aiClassification,
      suggestedMacrosetor,
      teamCapacities,
      contactHistory,
      conversation
    );

    console.log(`🧠 Recomendação inteligente para conversa ${conversationId}:`, {
      suggestedTeam: recommendation.teamId,
      suggestedUser: recommendation.userId,
      confidence: recommendation.confidence,
      reason: recommendation.reason,
      aiIntent: aiClassification.intent,
      macrosetor: suggestedMacrosetor
    });

    return recommendation;
  }

  /**
   * Mapeia intenção da IA para macrosetor apropriado
   */
  private mapIntentToMacrosetor(classification: MessageClassification): string {
    const intentMapping: Record<string, string> = {
      'lead_generation': 'comercial',
      'course_inquiry': 'comercial', 
      'financial': 'financeiro',
      'complaint': 'suporte',
      'technical_support': 'suporte',
      'student_support': 'tutoria',
      'general_info': 'secretaria',
      'spam': 'suporte'
    };

    // Considerar também a sugestão direta da IA
    if (classification.suggestedTeam) {
      const teamMapping: Record<string, string> = {
        'comercial': 'comercial',
        'suporte': 'suporte', 
        'pedagogico': 'tutoria',
        'financeiro': 'financeiro',
        'supervisao': 'suporte'
      };
      return teamMapping[classification.suggestedTeam] || 'comercial';
    }

    return intentMapping[classification.intent] || 'comercial';
  }

  /**
   * Analisa capacidade atual de todas as equipes
   */
  private async analyzeTeamCapacities(): Promise<TeamCapacity[]> {
    const teamCapacities = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        macrosetor: teams.macrosetor,
        maxCapacity: teams.maxCapacity,
        priority: teams.priority,
        isActive: teams.isActive,
        autoAssignment: teams.autoAssignment
      })
      .from(teams)
      .where(eq(teams.isActive, true));

    const capacitiesWithLoad = await Promise.all(
      teamCapacities.map(async (team) => {
        // Contar usuários ativos na equipe
        const [activeUsersResult] = await db
          .select({ count: count() })
          .from(userTeams)
          .leftJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
          .where(
            and(
              eq(userTeams.teamId, team.teamId),
              eq(userTeams.isActive, true),
              eq(systemUsers.isActive, true)
            )
          );

        // Contar conversas atualmente atribuídas à equipe
        const [currentLoadResult] = await db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedTeamId, team.teamId),
              or(
                eq(conversations.status, 'open'),
                eq(conversations.status, 'pending')
              )
            )
          );

        const activeUsers = activeUsersResult?.count || 0;
        const currentLoad = currentLoadResult?.count || 0;
        const maxCapacity = team.maxCapacity || 100;
        const utilizationRate = maxCapacity > 0 ? (currentLoad / maxCapacity) * 100 : 0;

        return {
          teamId: team.teamId,
          teamName: team.teamName,
          macrosetor: team.macrosetor,
          activeUsers,
          currentLoad,
          maxCapacity,
          utilizationRate,
          priority: team.priority || 1,
          isActive: Boolean(team.isActive && team.autoAssignment)
        };
      })
    );

    return capacitiesWithLoad.sort((a, b) => a.utilizationRate - b.utilizationRate);
  }

  /**
   * Busca usuários disponíveis em uma equipe específica
   */
  private async getAvailableUsersInTeam(teamId: number): Promise<UserAvailability[]> {
    const users = await db
      .select({
        userId: systemUsers.id,
        username: systemUsers.username,
        displayName: systemUsers.displayName,
        isOnline: systemUsers.isOnline,
        lastActivity: systemUsers.lastActivityAt,
        role: systemUsers.role
      })
      .from(systemUsers)
      .leftJoin(userTeams, eq(systemUsers.id, userTeams.userId))
      .where(
        and(
          eq(userTeams.teamId, teamId),
          eq(userTeams.isActive, true),
          eq(systemUsers.isActive, true)
        )
      );

    const usersWithLoad = await Promise.all(
      users.map(async (user) => {
        // Contar conversas atualmente atribuídas ao usuário
        const [currentConversationsResult] = await db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedUserId, user.userId),
              or(
                eq(conversations.status, 'open'),
                eq(conversations.status, 'pending')
              )
            )
          );

        // Capacidade baseada no role
        const roleCapacityMapping: Record<string, number> = {
          'admin': 20,
          'gerente': 15,
          'atendente': 10,
          'viewer': 5
        };

        return {
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          teamId,
          currentConversations: currentConversationsResult?.count || 0,
          isOnline: user.isOnline || false,
          lastActivity: user.lastActivity,
          roleCapacity: roleCapacityMapping[user.role] || 10
        };
      })
    );

    // Ordenar por disponibilidade (online primeiro, menor carga)
    return usersWithLoad.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.currentConversations - b.currentConversations;
    });
  }

  /**
   * Busca histórico relevante do contato para melhorar recomendação
   */
  private async getContactHistory(contactId: number): Promise<any> {
    // Buscar memórias de IA do contato
    const memories = await db
      .select()
      .from(aiMemory)
      .where(
        and(
          eq(aiMemory.contactId, contactId),
          eq(aiMemory.isActive, true)
        )
      )
      .orderBy(desc(aiMemory.updatedAt))
      .limit(10);

    // Buscar handoffs anteriores
    const previousHandoffs = await db
      .select({
        id: handoffs.id,
        toTeamId: handoffs.toTeamId,
        type: handoffs.type,
        reason: handoffs.reason,
        status: handoffs.status,
        createdAt: handoffs.createdAt
      })
      .from(handoffs)
      .leftJoin(conversations, eq(handoffs.conversationId, conversations.id))
      .where(eq(conversations.contactId, contactId))
      .orderBy(desc(handoffs.createdAt))
      .limit(5);

    return {
      memories,
      previousHandoffs,
      hasHistoryWithTeam: (teamId: number) => 
        previousHandoffs.some(h => h.toTeamId === teamId && h.status === 'completed')
    };
  }

  /**
   * Calcula a melhor recomendação baseada em todos os fatores
   */
  private async calculateBestRecommendation(
    aiClassification: MessageClassification,
    suggestedMacrosetor: string,
    teamCapacities: TeamCapacity[],
    contactHistory: any,
    conversation: any
  ): Promise<HandoffRecommendation> {
    
    // Filtrar equipes por macrosetor sugerido
    const preferredTeams = teamCapacities.filter(t => t.macrosetor === suggestedMacrosetor);
    const fallbackTeams = teamCapacities.filter(t => t.macrosetor !== suggestedMacrosetor);

    let bestTeam: TeamCapacity | null = null;
    let confidence = aiClassification.confidence;

    // Priorizar equipe baseada em capacidade e histórico
    if (preferredTeams.length > 0) {
      bestTeam = preferredTeams.find(t => t.utilizationRate < 80) || preferredTeams[0];
    } else {
      bestTeam = fallbackTeams.find(t => t.utilizationRate < 60) || fallbackTeams[0];
      confidence *= 0.7; // Reduzir confiança se não há equipe ideal
    }

    if (!bestTeam) {
      throw new Error('Nenhuma equipe disponível para handoff');
    }

    // Buscar melhor usuário na equipe
    const availableUsers = await this.getAvailableUsersInTeam(bestTeam.teamId);
    const bestUser = availableUsers.find(u => 
      u.isOnline && u.currentConversations < u.roleCapacity
    ) || availableUsers[0];

    // Calcular prioridade baseada em urgência e frustração
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
    if (aiClassification.urgency === 'critical' || aiClassification.frustrationLevel >= 8) {
      priority = 'urgent';
    } else if (aiClassification.urgency === 'high' || aiClassification.frustrationLevel >= 6) {
      priority = 'high';
    } else if (aiClassification.frustrationLevel <= 2) {
      priority = 'low';
    }

    // Estimar tempo de espera
    const estimatedWaitTime = this.calculateWaitTime(bestTeam, availableUsers);

    // Preparar alternativas
    const alternativeOptions = teamCapacities
      .filter(t => t.teamId !== bestTeam.teamId)
      .slice(0, 2)
      .map(t => ({
        teamId: t.teamId,
        reason: `Equipe ${t.teamName} (${t.macrosetor}) - ${t.utilizationRate.toFixed(0)}% ocupada`,
        confidence: confidence * 0.8
      }));

    return {
      teamId: bestTeam.teamId,
      userId: bestUser?.userId,
      confidence,
      reason: this.buildRecommendationReason(aiClassification, bestTeam, bestUser),
      priority,
      estimatedWaitTime,
      alternativeOptions
    };
  }

  /**
   * Constrói explicação da recomendação
   */
  private buildRecommendationReason(
    classification: MessageClassification,
    team: TeamCapacity,
    user?: UserAvailability
  ): string {
    const reasons = [];
    
    reasons.push(`IA detectou intenção: ${classification.intent}`);
    reasons.push(`Equipe ${team.teamName} especializada em ${team.macrosetor}`);
    reasons.push(`Capacidade atual: ${team.utilizationRate.toFixed(0)}%`);
    
    if (classification.frustrationLevel > 6) {
      reasons.push('Cliente com alta frustração - prioridade elevada');
    }
    
    if (user) {
      reasons.push(`Usuário ${user.displayName} ${user.isOnline ? 'online' : 'offline'} com ${user.currentConversations} conversas`);
    }

    return reasons.join(' • ');
  }

  /**
   * Calcula tempo estimado de espera
   */
  private calculateWaitTime(team: TeamCapacity, users: UserAvailability[]): number {
    const onlineUsers = users.filter(u => u.isOnline).length;
    const avgConversationsPerUser = users.length > 0 
      ? users.reduce((sum, u) => sum + u.currentConversations, 0) / users.length 
      : 0;

    if (onlineUsers === 0) return 30; // 30 min se ninguém online
    if (team.utilizationRate < 50) return 2; // 2 min se baixa utilização
    if (team.utilizationRate < 80) return 5; // 5 min se média utilização
    
    return Math.min(15, avgConversationsPerUser * 2); // Max 15 min
  }

  /**
   * Executa handoff inteligente baseado na recomendação
   */
  async executeIntelligentHandoff(
    conversationId: number,
    recommendation: HandoffRecommendation,
    aiClassification: MessageClassification,
    type: 'automatic' | 'manual' = 'automatic'
  ): Promise<number> {
    
    const handoffData = {
      conversationId,
      toTeamId: recommendation.teamId,
      toUserId: recommendation.userId,
      type,
      reason: recommendation.reason,
      priority: recommendation.priority,
      aiClassification: {
        confidence: recommendation.confidence,
        suggestedTeam: aiClassification.suggestedTeam,
        urgency: aiClassification.urgency,
        frustrationLevel: aiClassification.frustrationLevel,
        intent: aiClassification.intent
      },
      metadata: {
        triggerEvent: 'intelligent_handoff',
        estimatedWaitTime: recommendation.estimatedWaitTime,
        aiVersion: 'v2.0',
        alternativeOptions: recommendation.alternativeOptions
      }
    };

    const [handoff] = await db.insert(handoffs).values(handoffData).returning();

    // Atualizar conversa imediatamente
    const updateData: any = {
      updatedAt: new Date(),
      priority: recommendation.priority
    };

    if (recommendation.teamId) {
      updateData.assignedTeamId = recommendation.teamId;
      
      // Buscar macrosetor da equipe
      const [team] = await db
        .select({ macrosetor: teams.macrosetor })
        .from(teams)
        .where(eq(teams.id, recommendation.teamId))
        .limit(1);
      
      if (team) {
        updateData.macrosetor = team.macrosetor;
      }
    }

    if (recommendation.userId) {
      updateData.assignedUserId = recommendation.userId;
      updateData.assignedAt = new Date();
    }

    await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId));

    // Marcar handoff como completado
    await db
      .update(handoffs)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(handoffs.id, handoff.id));

    console.log(`✅ Handoff inteligente executado: ${handoff.type} - Conversa ${conversationId} → Equipe ${recommendation.teamId}`);

    return handoff.id;
  }

  /**
   * Obtém estatísticas de performance do sistema inteligente
   */
  async getIntelligentHandoffStats(days: number = 7): Promise<any> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const stats = await db
      .select({
        totalHandoffs: count(),
        avgConfidence: handoffs.aiClassification,
        successRate: handoffs.status
      })
      .from(handoffs)
      .where(
        and(
          eq(handoffs.type, 'automatic'),
          // Note: adicionar filtro de data quando necessário
        )
      );

    return {
      totalIntelligentHandoffs: stats.length,
      avgSuccessRate: stats.filter(s => s.successRate === 'completed').length / stats.length * 100,
      teamUtilization: await this.analyzeTeamCapacities()
    };
  }
}

export const intelligentHandoffService = new IntelligentHandoffService();