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
import { storage } from '../core/storage';
import { funnelService } from './funnelService';
import type { InsertHandoff, Handoff } from '@shared/schema';

/**
 * SERVIÇO UNIFICADO DE ATRIBUIÇÃO
 * 
 * Consolida as responsabilidades anteriormente distribuídas entre:
 * - handoffService.ts (handoffs manuais/automáticos)
 * - intelligentHandoffService.ts (handoffs inteligentes com IA)
 * - dealAutomationService.ts (automação de deals)
 * 
 * Elimina duplicações e centraliza toda lógica de atribuição
 */

interface HandoffRequest {
  conversationId: number;
  fromUserId?: number;
  toUserId?: number;
  fromTeamId?: number;
  toTeamId?: number;
  type: 'manual' | 'automatic' | 'escalation' | 'intelligent';
  reason?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  aiClassification?: {
    confidence: number;
    suggestedTeam?: string;
    urgency: string;
    frustrationLevel: number;
    intent: string;
  };
  metadata?: {
    triggerEvent?: string;
    escalationReason?: string;
    customerSentiment?: string;
    previousHandoffs?: number;
  };
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

interface AssignmentResult {
  success: boolean;
  handoffId?: number;
  dealId?: number;
  recommendation?: HandoffRecommendation;
  message: string;
}

export class UnifiedAssignmentService {
  private aiService: AIService;
  
  private defaultCriteria = {
    frustrationThreshold: 7,
    urgencyLevels: ['high', 'critical'],
    confidenceThreshold: 60,
    maxHandoffsPerDay: 3,
    escalationPatterns: ['complaint', 'technical_support', 'billing_issue']
  };

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * MÉTODO PRINCIPAL - Processa atribuição completa com automação de deal
   */
  async processAssignment(
    conversationId: number,
    messageContent?: string,
    type: 'manual' | 'automatic' | 'intelligent' = 'automatic'
  ): Promise<AssignmentResult> {
    
    try {
      let recommendation: HandoffRecommendation | null = null;
      let handoffId: number | null = null;
      let dealId: number | null = null;

      // 1. Analisar se precisa de atribuição
      if (type === 'intelligent' && messageContent) {
        recommendation = await this.analyzeIntelligentAssignment(conversationId, messageContent);
        
        if (recommendation.confidence < this.defaultCriteria.confidenceThreshold) {
          return {
            success: true,
            recommendation,
            message: 'Atribuição não necessária - confiança baixa'
          };
        }
      } else {
        // Para tipos manual/automatic, usar lógica simples de balanceamento
        recommendation = await this.analyzeBestAssignment(conversationId);
      }

      // 2. Executar handoff se recomendação válida
      if (recommendation && (recommendation.teamId || recommendation.userId)) {
        handoffId = await this.executeAssignment(conversationId, recommendation, type);
      }

      // 3. Criar deal automático se conversa foi atribuída a equipe
      if (handoffId && recommendation?.teamId) {
        dealId = await this.createAutomaticDeal(conversationId, recommendation.teamId);
      }

      return {
        success: true,
        handoffId: handoffId || undefined,
        dealId: dealId || undefined,
        recommendation,
        message: 'Atribuição processada com sucesso'
      };

    } catch (error) {
      console.error('Erro no processamento de atribuição:', error);
      return {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Análise inteligente com IA para determinar melhor atribuição
   */
  async analyzeIntelligentAssignment(
    conversationId: number,
    messageContent: string
  ): Promise<HandoffRecommendation> {
    
    // Buscar contexto da conversa
    const conversation = await this.getConversationContext(conversationId);
    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    // Classificar mensagem com IA
    const aiClassification = await this.aiService.classifyMessage(
      messageContent,
      conversation.contactId,
      conversationId,
      []
    );

    // Analisar capacidades das equipes
    const teamCapacities = await this.analyzeTeamCapacities();

    // Determinar melhor equipe baseado na IA e capacidade
    const bestTeam = this.selectBestTeamForClassification(aiClassification, teamCapacities);
    
    if (!bestTeam) {
      return {
        confidence: 0,
        reason: 'Nenhuma equipe disponível',
        priority: 'low',
        estimatedWaitTime: 0,
        alternativeOptions: []
      };
    }

    // Calcular confiança baseada em múltiplos fatores
    const confidence = this.calculateAssignmentConfidence(
      aiClassification,
      bestTeam,
      conversation
    );

    return {
      teamId: bestTeam.teamId,
      confidence,
      reason: `IA detectou intenção: ${aiClassification.intent} • Equipe ${bestTeam.teamName} especializada em ${bestTeam.teamType} • Capacidade atual: ${Math.round(bestTeam.utilizationRate)}%`,
      priority: this.mapUrgencyToPriority(aiClassification.urgency),
      estimatedWaitTime: this.calculateWaitTime(bestTeam),
      alternativeOptions: this.getAlternativeTeams(teamCapacities, bestTeam.teamId)
    };
  }

  /**
   * Análise simples de melhor atribuição por balanceamento de carga
   */
  async analyzeBestAssignment(conversationId: number): Promise<HandoffRecommendation> {
    const teamCapacities = await this.analyzeTeamCapacities();
    
    // Selecionar equipe com menor utilização
    const bestTeam = teamCapacities
      .filter(team => team.isActive)
      .sort((a, b) => a.utilizationRate - b.utilizationRate)[0];

    if (!bestTeam) {
      throw new Error('Nenhuma equipe disponível');
    }

    return {
      teamId: bestTeam.teamId,
      confidence: 80, // Confiança alta para balanceamento simples
      reason: `Equipe ${bestTeam.teamName} com menor carga atual (${Math.round(bestTeam.utilizationRate)}%)`,
      priority: 'normal',
      estimatedWaitTime: this.calculateWaitTime(bestTeam),
      alternativeOptions: []
    };
  }

  /**
   * Executa a atribuição criando handoff e atualizando conversa
   */
  async executeAssignment(
    conversationId: number,
    recommendation: HandoffRecommendation,
    type: string
  ): Promise<number> {
    
    // Criar handoff
    const handoffData: any = {
      conversationId,
      toTeamId: recommendation.teamId || null,
      toUserId: recommendation.userId || null,
      type,
      reason: recommendation.reason,
      priority: recommendation.priority,
      status: 'pending',
      aiClassification: {
        confidence: recommendation.confidence
      },
      metadata: {
        triggerEvent: 'unified_assignment',
        estimatedWaitTime: recommendation.estimatedWaitTime
      }
    };

    const [handoff] = await db.insert(handoffs).values(handoffData).returning();

    // Atualizar conversa
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

    console.log(`✅ Atribuição executada: Conversa ${conversationId} → Equipe ${recommendation.teamId}`);

    return handoff.id;
  }

  /**
   * Cria deal automático quando conversa é atribuída a equipe
   */
  async createAutomaticDeal(conversationId: number, teamId: number): Promise<number | null> {
    try {
      // Buscar dados da conversa
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.log(`❌ Conversa ${conversationId} não encontrada para automação de deal`);
        return null;
      }

      // Buscar dados da equipe
      const team = await storage.getTeam(teamId);
      if (!team) {
        console.log(`❌ Equipe ${teamId} não encontrada para automação de deal`);
        return null;
      }

      // Usar teamType em vez de macrosetor (migração concluída)
      const teamType = team.teamType || 'geral';
      const canalOrigem = conversation.channel || 'unknown';

      console.log(`🔄 Criando deal automático: contato=${conversation.contactId}, canal=${canalOrigem}, teamType=${teamType}`);

      // Buscar estágio inicial correto do funil
      const initialStage = await funnelService.getInitialStageForMacrosetor(teamType);
      
      // Criar deal automático
      const deal = await storage.createAutomaticDeal(
        conversation.contactId,
        canalOrigem,
        teamType,
        initialStage
      );

      console.log(`✅ Deal criado automaticamente: ID ${deal.id} - ${deal.name}`);
      
      return deal.id;

    } catch (error) {
      console.error(`❌ Erro na automação de deal para conversa ${conversationId}:`, error);
      return null;
    }
  }

  /**
   * Analisa capacidades atuais de todas as equipes
   */
  async analyzeTeamCapacities(): Promise<TeamCapacity[]> {
    // Buscar todas as equipes ativas
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        teamType: teams.teamType,
        isActive: teams.isActive,
        priority: teams.priority
      })
      .from(teams)
      .where(eq(teams.isActive, true));

    const capacities: TeamCapacity[] = [];

    for (const team of teamsData) {
      // Contar usuários ativos na equipe
      const activeUsers = await db
        .select({ count: count() })
        .from(userTeams)
        .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
        .where(
          and(
            eq(userTeams.teamId, team.id),
            eq(systemUsers.isActive, true)
          )
        );

      // Contar conversas atribuídas à equipe
      const currentLoad = await db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.assignedTeamId, team.id),
            eq(conversations.status, 'open')
          )
        );

      const userCount = activeUsers[0]?.count || 0;
      const loadCount = currentLoad[0]?.count || 0;
      const maxCapacity = userCount * 10; // 10 conversas por usuário
      const utilizationRate = maxCapacity > 0 ? (loadCount / maxCapacity) * 100 : 0;

      capacities.push({
        teamId: team.id,
        teamName: team.name,
        teamType: team.teamType || 'geral',
        activeUsers: userCount,
        currentLoad: loadCount,
        maxCapacity,
        utilizationRate,
        priority: team.priority || 1,
        isActive: team.isActive
      });
    }

    return capacities.sort((a, b) => a.utilizationRate - b.utilizationRate);
  }

  /**
   * Seleciona melhor equipe baseada na classificação da IA
   */
  private selectBestTeamForClassification(
    aiClassification: MessageClassification,
    teamCapacities: TeamCapacity[]
  ): TeamCapacity | null {
    
    // Mapear intenções para tipos de equipe
    const intentToTeamType: { [key: string]: string } = {
      'billing_inquiry': 'financeiro',
      'technical_support': 'suporte',
      'complaint': 'suporte',
      'sales_interest': 'comercial',
      'general_info': 'tutoria',
      'course_question': 'tutoria',
      'schedule_request': 'secretaria'
    };

    const preferredTeamType = intentToTeamType[aiClassification.intent];
    
    // Filtrar equipes disponíveis (menos de 80% de utilização)
    const availableTeams = teamCapacities.filter(team => 
      team.isActive && team.utilizationRate < 80
    );

    if (availableTeams.length === 0) {
      return null;
    }

    // Priorizar equipe especializada se disponível
    if (preferredTeamType) {
      const specializedTeam = availableTeams.find(team => 
        team.teamType === preferredTeamType
      );
      
      if (specializedTeam) {
        return specializedTeam;
      }
    }

    // Senão, retornar equipe com menor utilização
    return availableTeams[0];
  }

  /**
   * Calcula confiança da atribuição baseada em múltiplos fatores
   */
  private calculateAssignmentConfidence(
    aiClassification: MessageClassification,
    team: TeamCapacity,
    conversation: any
  ): number {
    let confidence = 50; // Base

    // Boost por especialização da equipe
    if (aiClassification.intent && this.teamSpecializedInIntent(team.teamType, aiClassification.intent)) {
      confidence += 30;
    }

    // Boost por disponibilidade da equipe
    if (team.utilizationRate < 50) {
      confidence += 15;
    } else if (team.utilizationRate < 80) {
      confidence += 5;
    }

    // Boost por urgência
    if (aiClassification.urgency === 'high' || aiClassification.urgency === 'critical') {
      confidence += 10;
    }

    // Redução por alta frustração sem especialização
    if (aiClassification.frustrationLevel > 7 && !this.teamSpecializedInIntent(team.teamType, aiClassification.intent)) {
      confidence -= 20;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  private teamSpecializedInIntent(teamType: string, intent: string): boolean {
    const specializations: { [key: string]: string[] } = {
      'financeiro': ['billing_inquiry'],
      'suporte': ['technical_support', 'complaint'],
      'comercial': ['sales_interest'],
      'tutoria': ['general_info', 'course_question'],
      'secretaria': ['schedule_request']
    };

    return specializations[teamType]?.includes(intent) || false;
  }

  private mapUrgencyToPriority(urgency: string): 'low' | 'normal' | 'high' | 'urgent' {
    const mapping: { [key: string]: 'low' | 'normal' | 'high' | 'urgent' } = {
      'low': 'low',
      'normal': 'normal',
      'high': 'high',
      'critical': 'urgent'
    };
    return mapping[urgency] || 'normal';
  }

  private calculateWaitTime(team: TeamCapacity): number {
    if (team.utilizationRate < 30) return 2; // 2 min se baixa utilização
    if (team.utilizationRate < 70) return 5; // 5 min se média utilização
    return Math.min(15, team.activeUsers * 2); // Max 15 min
  }

  private getAlternativeTeams(
    teamCapacities: TeamCapacity[],
    excludeTeamId: number
  ): Array<{ teamId: number; reason: string; confidence: number }> {
    return teamCapacities
      .filter(team => team.teamId !== excludeTeamId && team.isActive && team.utilizationRate < 90)
      .slice(0, 2)
      .map(team => ({
        teamId: team.teamId,
        reason: `${team.teamName} - ${Math.round(team.utilizationRate)}% utilização`,
        confidence: Math.max(0, 70 - team.utilizationRate)
      }));
  }

  private async getConversationContext(conversationId: number) {
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
      .where(eq(conversations.id, conversationId))
      .limit(1);

    return conversation;
  }

  /**
   * MÉTODOS DE COMPATIBILIDADE - Para manter compatibilidade com código existente
   */

  // Compatibilidade com handoffService
  async createHandoff(handoffData: HandoffRequest): Promise<Handoff> {
    const result = await this.processAssignment(
      handoffData.conversationId,
      undefined,
      handoffData.type === 'intelligent' ? 'intelligent' : handoffData.type
    );

    if (!result.success || !result.handoffId) {
      throw new Error(result.message);
    }

    const handoff = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.id, result.handoffId))
      .limit(1);

    return handoff[0];
  }

  // Compatibilidade com intelligentHandoffService
  async analyzeAndRecommendHandoff(
    conversationId: number,
    messageContent: string,
    aiClassification: MessageClassification
  ): Promise<HandoffRecommendation> {
    return this.analyzeIntelligentAssignment(conversationId, messageContent);
  }

  // Compatibilidade com dealAutomationService
  async onConversationAssigned(
    conversationId: number,
    teamId: number,
    assignmentMethod: 'manual' | 'automatic'
  ) {
    return this.createAutomaticDeal(conversationId, teamId);
  }
}

// Instância singleton
export const unifiedAssignmentService = new UnifiedAssignmentService();