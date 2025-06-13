// DEPRECATED: Este serviço foi consolidado em unifiedAssignmentService.ts
// Mantido para compatibilidade durante migração
import { db } from '../core/db';
import { eq, and, desc, asc, or, count, isNull, gte, sql } from 'drizzle-orm';
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
  teamType: string;
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
        teamType: conversations.teamType,
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
    
    // 3. Mapear intenção da IA para tipo de equipe
    const suggestedTeamType = this.mapIntentToTeamType(aiClassification);
    
    // 4. Buscar contexto histórico do contato
    const contactHistory = await this.getContactHistory(conversation.contactId);
    
    // 5. Calcular recomendação inteligente
    const recommendation = await this.calculateBestRecommendation(
      aiClassification,
      suggestedTeamType,
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
      teamType: suggestedTeamType
    });

    return recommendation;
  }

  /**
   * Mapeia intenção da IA para tipo de equipe apropriado
   */
  private mapIntentToTeamType(classification: MessageClassification): string {
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
  async analyzeTeamCapacities(): Promise<TeamCapacity[]> {
    const teamCapacities = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        teamType: teams.teamType,
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
          teamType: team.teamType,
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
   * Verifica se está no horário comercial (09:00 às 19:00 - horário de Brasília)
   */
  private isBusinessHours(): boolean {
    const now = new Date();
    const brasiliaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const hour = brasiliaTime.getHours();
    return hour >= 9 && hour < 19;
  }

  /**
   * Busca usuários disponíveis em uma equipe específica com lógica de distribuição inteligente
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

    // Aplicar lógica de distribuição baseada no horário comercial
    const isBusinessTime = this.isBusinessHours();
    
    if (isBusinessTime) {
      // Durante horário comercial: priorizar usuários online
      const onlineUsers = usersWithLoad.filter(user => user.isOnline);
      
      if (onlineUsers.length > 0) {
        // Ordenar usuários online por menor carga de trabalho (rodízio equilibrado)
        return onlineUsers.sort((a, b) => a.currentConversations - b.currentConversations);
      }
      
      // Se nenhum usuário online, usar todos os usuários ordenados por carga
      return usersWithLoad.sort((a, b) => a.currentConversations - b.currentConversations);
    } else {
      // Fora do horário comercial: implementar rodízio para distribuição equilibrada
      console.log('🌙 Fora do horário comercial - aplicando distribuição em rodízio');
      
      // Verificar se há usuários online
      const onlineUsers = usersWithLoad.filter(user => user.isOnline);
      
      if (onlineUsers.length === 0) {
        console.log('⏰ Nenhum usuário online - distribuindo em rodízio para próximo dia útil');
        
        // Implementar rodízio real baseado em histórico de distribuições
        return await this.applyRoundRobinDistribution(usersWithLoad, teamId);
      }
      
      // Se há usuários online mesmo fora do horário, usar distribuição normal
      return usersWithLoad.sort((a, b) => a.currentConversations - b.currentConversations);
    }
  }

  /**
   * Aplica distribuição em rodízio real para equipes fora do horário comercial
   */
  private async applyRoundRobinDistribution(users: UserAvailability[], teamId: number): Promise<UserAvailability[]> {
    try {
      // Buscar histórico de distribuições recentes para esta equipe
      const recentDistributions = await db
        .select({
          toUserId: handoffs.toUserId,
          count: sql<number>`count(*)`.as('count')
        })
        .from(handoffs)
        .where(
          and(
            eq(handoffs.toTeamId, teamId),
            gte(handoffs.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Últimos 7 dias
          )
        )
        .groupBy(handoffs.toUserId);

      // Criar mapa de distribuições por usuário
      const distributionMap = new Map<number, number>();
      recentDistributions.forEach((dist: any) => {
        if (dist.toUserId) {
          distributionMap.set(dist.toUserId, dist.count);
        }
      });

      // Ordenar usuários por menor número de distribuições recentes (rodízio real)
      const sortedUsers = users.sort((a, b) => {
        const aDistributions = distributionMap.get(a.userId) || 0;
        const bDistributions = distributionMap.get(b.userId) || 0;
        
        // Primeiro critério: menor número de distribuições
        if (aDistributions !== bDistributions) {
          return aDistributions - bDistributions;
        }
        
        // Segundo critério: menor carga atual
        return a.currentConversations - b.currentConversations;
      });

      console.log('🎯 Rodízio aplicado:', {
        teamId,
        totalUsers: users.length,
        distributionHistory: Object.fromEntries(distributionMap),
        nextUser: sortedUsers[0]?.displayName
      });

      return sortedUsers;
    } catch (error) {
      console.error('❌ Erro ao aplicar rodízio:', error);
      // Fallback para distribuição simples por carga
      return users.sort((a, b) => a.currentConversations - b.currentConversations);
    }
  }

  /**
   * Seleciona o melhor usuário da equipe usando rodízio inteligente
   */
  private selectBestUserFromTeam(users: UserAvailability[]): UserAvailability | null {
    if (users.length === 0) return null;

    const isBusinessTime = this.isBusinessHours();
    
    if (isBusinessTime) {
      // Durante horário comercial: priorizar usuários online com menor carga
      const onlineUsers = users.filter(user => user.isOnline);
      
      if (onlineUsers.length > 0) {
        // Encontrar a menor carga entre usuários online
        const minLoad = Math.min(...onlineUsers.map(u => u.currentConversations));
        const availableOnlineUsers = onlineUsers.filter(u => 
          u.currentConversations === minLoad && u.currentConversations < u.roleCapacity
        );
        
        // Retornar usuário aleatório entre os com menor carga (rodízio)
        return availableOnlineUsers.length > 0 
          ? availableOnlineUsers[Math.floor(Math.random() * availableOnlineUsers.length)]
          : null;
      }
    }
    
    // Fora do horário ou sem usuários online: usar rodízio geral equilibrado
    const minLoad = Math.min(...users.map(u => u.currentConversations));
    const availableUsers = users.filter(u => 
      u.currentConversations === minLoad && u.currentConversations < u.roleCapacity
    );
    
    // Retornar usuário aleatório entre os com menor carga
    return availableUsers.length > 0 
      ? availableUsers[Math.floor(Math.random() * availableUsers.length)]
      : null;
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
    suggestedTeamType: string,
    teamCapacities: TeamCapacity[],
    contactHistory: any,
    conversation: any
  ): Promise<HandoffRecommendation> {
    
    // Filtrar equipes por tipo sugerido
    const preferredTeams = teamCapacities.filter(t => t.teamType === suggestedTeamType);
    const fallbackTeams = teamCapacities.filter(t => t.teamType !== suggestedTeamType);

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

    // Buscar melhor usuário na equipe usando lógica de rodízio inteligente
    const availableUsers = await this.getAvailableUsersInTeam(bestTeam.teamId);
    const bestUser = this.selectBestUserFromTeam(availableUsers);

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
        reason: `Equipe ${t.teamName} (${t.teamType}) - ${t.utilizationRate.toFixed(0)}% ocupada`,
        confidence: confidence * 0.8
      }));

    return {
      teamId: bestTeam.teamId,
      userId: bestUser?.userId,
      confidence,
      reason: this.buildRecommendationReason(aiClassification, bestTeam, bestUser || undefined),
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
    const isBusinessTime = this.isBusinessHours();
    
    reasons.push(`IA detectou intenção: ${classification.intent}`);
    reasons.push(`Equipe ${team.teamName} especializada em ${team.teamType}`);
    reasons.push(`Capacidade atual: ${team.utilizationRate.toFixed(0)}%`);
    
    if (classification.frustrationLevel > 6) {
      reasons.push('Cliente com alta frustração - prioridade elevada');
    }
    
    if (user) {
      const userStatus = user.isOnline ? 'online' : 'offline';
      reasons.push(`Usuário ${user.displayName} ${userStatus} com ${user.currentConversations} conversas`);
      
      // Adicionar informação sobre a lógica de distribuição
      if (isBusinessTime) {
        if (user.isOnline) {
          reasons.push('Selecionado por estar online no horário comercial');
        } else {
          reasons.push('Selecionado por menor carga (nenhum usuário online disponível)');
        }
      } else {
        reasons.push('Distribuição equilibrada para próximo dia útil');
      }
    } else {
      // Se não há usuário específico selecionado
      if (isBusinessTime) {
        reasons.push('Aguardando atendente online no horário comercial');
      } else {
        reasons.push('Aguardando distribuição para próximo dia útil');
      }
    }

    return reasons.join(' • ');
  }

  /**
   * Buscar handoffs de uma conversa
   */
  async getHandoffsForConversation(conversationId: number, days?: number): Promise<any[]> {
    let query = db
      .select()
      .from(handoffs)
      .where(eq(handoffs.conversationId, conversationId))
      .orderBy(desc(handoffs.createdAt));

    // Aplicar filtro de dias se fornecido (simplificado)
    const result = await query;
    
    if (days) {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      return result.filter(h => h.createdAt && new Date(h.createdAt) >= dateLimit);
    }

    return result;
  }

  /**
   * Buscar handoffs pendentes para usuário
   */
  async getPendingHandoffsForUser(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(handoffs)
      .where(and(
        eq(handoffs.toUserId, userId),
        eq(handoffs.status, 'pending')
      ))
      .orderBy(desc(handoffs.createdAt));
  }

  /**
   * Buscar handoffs pendentes para equipe
   */
  async getPendingHandoffsForTeam(teamId: number): Promise<any[]> {
    return await db
      .select()
      .from(handoffs)
      .where(and(
        eq(handoffs.toTeamId, teamId),
        eq(handoffs.status, 'pending')
      ))
      .orderBy(desc(handoffs.createdAt));
  }

  /**
   * Aceitar handoff
   */
  async acceptHandoff(handoffId: number, userId: number): Promise<void> {
    await db
      .update(handoffs)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));

    console.log(`✅ Handoff ${handoffId} aceito pelo usuário ${userId}`);
  }

  /**
   * Rejeitar handoff
   */
  async rejectHandoff(handoffId: number, userId: number, reason?: string): Promise<void> {
    const metadata = reason ? { 
      triggerEvent: 'rejection',
      escalationReason: reason 
    } : null;

    await db
      .update(handoffs)
      .set({
        status: 'rejected',
        metadata,
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));

    console.log(`❌ Handoff ${handoffId} rejeitado pelo usuário ${userId}`);
  }

  /**
   * Avaliar para handoff automático
   */
  async evaluateForAutoHandoff(conversationId: number, messageContent: string): Promise<boolean> {
    try {
      const classification = await this.aiService.classifyMessage(messageContent);
      return classification.confidence > 80 && classification.intent !== 'general_info';
    } catch (error) {
      console.error('Erro ao avaliar handoff automático:', error);
      return false;
    }
  }

  /**
   * Sugerir melhor destino
   */
  async suggestBestTarget(conversationId: number, messageContent: string): Promise<any> {
    try {
      const classification = await this.aiService.classifyMessage(messageContent);
      return await this.analyzeAndRecommendHandoff(conversationId, messageContent, classification);
    } catch (error) {
      console.error('Erro ao sugerir destino:', error);
      return null;
    }
  }

  /**
   * Criar handoff
   */
  async createHandoff(data: any): Promise<any> {
    const [newHandoff] = await db
      .insert(handoffs)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return newHandoff;
  }

  /**
   * Executar handoff
   */
  async executeHandoff(handoffId: number): Promise<void> {
    await db
      .update(handoffs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));

    console.log(`🔄 Handoff ${handoffId} executado com sucesso`);
  }

  /**
   * Buscar estatísticas de handoffs
   */
  async getHandoffStats(): Promise<any> {
    const [totalHandoffs] = await db
      .select({ count: count() })
      .from(handoffs);

    const [pendingHandoffs] = await db
      .select({ count: count() })
      .from(handoffs)
      .where(eq(handoffs.status, 'pending'));

    const [completedHandoffs] = await db
      .select({ count: count() })
      .from(handoffs)
      .where(eq(handoffs.status, 'completed'));

    const [rejectedHandoffs] = await db
      .select({ count: count() })
      .from(handoffs)
      .where(eq(handoffs.status, 'rejected'));

    return {
      totalHandoffs: totalHandoffs.count,
      pendingHandoffs: pendingHandoffs.count,
      completedHandoffs: completedHandoffs.count,
      rejectedHandoffs: rejectedHandoffs.count
    };
  }

  /**
   * Buscar handoff por ID
   */
  async getHandoffById(handoffId: number): Promise<any> {
    const [handoff] = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.id, handoffId))
      .limit(1);

    return handoff;
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
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // Buscar handoffs automáticos simples
      const automaticHandoffs = await db
        .select()
        .from(handoffs)
        .where(eq(handoffs.type, 'automatic'));

      // Filtrar por data no código (mais simples que SQL complexo)
      const recentHandoffs = automaticHandoffs.filter(h => 
        h.createdAt && new Date(h.createdAt) >= dateThreshold
      );

      const totalHandoffs = recentHandoffs.length;
      const completedHandoffs = recentHandoffs.filter(h => h.status === 'completed').length;
      const successRate = totalHandoffs > 0 ? (completedHandoffs / totalHandoffs) * 100 : 0;

      // Estatísticas por equipe
      const teamStats = recentHandoffs.reduce((acc, h) => {
        const teamId = h.toTeamId;
        if (!teamId) return acc;
        
        if (!acc[teamId]) {
          acc[teamId] = { total: 0, completed: 0 };
        }
        acc[teamId].total++;
        if (h.status === 'completed') {
          acc[teamId].completed++;
        }
        return acc;
      }, {} as Record<number, { total: number; completed: number }>);

      // Confiança média baseada em classificações reais de IA
      let avgConfidence = 85; // Padrão para handoffs automáticos
      if (recentHandoffs.length > 0) {
        const handoffsWithClassification = recentHandoffs.filter(h => h.aiClassification);
        if (handoffsWithClassification.length > 0) {
          const confidenceSum = handoffsWithClassification.reduce((sum, h) => {
            try {
              const classification = typeof h.aiClassification === 'string' 
                ? JSON.parse(h.aiClassification) 
                : h.aiClassification;
              return sum + (classification?.confidence || 85);
            } catch {
              return sum + 85;
            }
          }, 0);
          avgConfidence = confidenceSum / handoffsWithClassification.length;
        }
      }

      return {
        totalIntelligentHandoffs: totalHandoffs,
        successRate: Math.round(successRate * 100) / 100,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        teamStats,
        teamUtilization: await this.analyzeTeamCapacities(),
        period: `${days} dias`,
        dateRange: {
          from: dateThreshold.toISOString(),
          to: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas inteligentes:', error);
      // Retornar estatísticas básicas em caso de erro
      return {
        totalIntelligentHandoffs: 0,
        successRate: 0,
        avgConfidence: 0,
        teamStats: {},
        teamUtilization: [],
        period: `${days} dias`,
        error: 'Não foi possível carregar estatísticas detalhadas'
      };
    }
  }
}

export const intelligentHandoffService = new IntelligentHandoffService();