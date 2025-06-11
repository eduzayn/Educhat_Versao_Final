// DEPRECATED: Este serviço foi consolidado em unifiedAssignmentService.ts
// Mantido para compatibilidade durante migração
import { db } from '../db';
import { handoffs, conversations, systemUsers, teams } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { InsertHandoff, Handoff } from '@shared/schema';
import { DealAutomationService } from './dealAutomationService';

export interface HandoffRequest {
  conversationId: number;
  fromUserId?: number;
  toUserId?: number;
  fromTeamId?: number;
  toTeamId?: number;
  type: 'manual' | 'automatic' | 'escalation';
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

export interface HandoffCriteria {
  frustrationThreshold: number;
  urgencyLevels: string[];
  confidenceThreshold: number;
  maxHandoffsPerDay: number;
  escalationPatterns: string[];
}

export class HandoffService {
  private defaultCriteria: HandoffCriteria = {
    frustrationThreshold: 7,
    urgencyLevels: ['high', 'critical'],
    confidenceThreshold: 60,
    maxHandoffsPerDay: 3,
    escalationPatterns: ['complaint', 'technical_support', 'billing_issue']
  };

  /**
   * Criar novo handoff
   */
  async createHandoff(handoffData: HandoffRequest): Promise<Handoff> {
    const insertData: InsertHandoff = {
      conversationId: handoffData.conversationId,
      fromUserId: handoffData.fromUserId || null,
      toUserId: handoffData.toUserId || null,
      fromTeamId: handoffData.fromTeamId || null,
      toTeamId: handoffData.toTeamId || null,
      type: handoffData.type,
      reason: handoffData.reason || null,
      priority: handoffData.priority || 'normal',
      status: 'pending',
      aiClassification: handoffData.aiClassification || null,
      metadata: handoffData.metadata || null
    };

    const [handoff] = await db.insert(handoffs).values(insertData).returning();
    
    // Log da criação
    console.log(`🔄 Handoff criado: ${handoff.type} - Conversa ${handoff.conversationId} (ID: ${handoff.id})`);
    
    // Executar a transferência automaticamente se for manual
    if (handoffData.type === 'manual') {
      await this.executeHandoff(handoff.id);
    }
    
    return handoff;
  }

  /**
   * Executar handoff (transferir conversa)
   */
  async executeHandoff(handoffId: number): Promise<void> {
    const handoff = await this.getHandoffById(handoffId);
    if (!handoff) {
      throw new Error('Handoff não encontrado');
    }

    if (handoff.status !== 'pending') {
      throw new Error('Handoff já foi processado');
    }

    // Atualizar conversa com nova atribuição
    const updateData: any = {};
    
    if (handoff.toUserId) {
      updateData.assignedUserId = handoff.toUserId;
    }
    
    if (handoff.toTeamId) {
      updateData.assignedTeamId = handoff.toTeamId;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(conversations)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, handoff.conversationId));
    }

    // Marcar handoff como completado
    await db
      .update(handoffs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));

    // Executar automação de deals quando conversa é atribuída a uma equipe
    if (handoff.toTeamId) {
      try {
        const automationService = new DealAutomationService();
        const conversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, handoff.conversationId)
        });

        if (conversation) {
          console.log(`🤖 Executando automação de deals para handoff...`);
          await automationService.handleTeamAssignment(conversation, handoff.toTeamId);
        }
      } catch (error) {
        console.error(`❌ Erro na automação de deals para handoff:`, error);
      }
    }

    console.log(`✅ Handoff executado: ${handoff.type} - Conversa ${handoff.conversationId}`);
  }

  /**
   * Avaliar se conversa precisa de handoff automático
   */
  async evaluateForAutoHandoff(
    conversationId: number,
    aiClassification: {
      confidence: number;
      suggestedTeam?: string;
      urgency: string;
      frustrationLevel: number;
      intent: string;
    }
  ): Promise<boolean> {
    const criteria = this.defaultCriteria;
    
    // Verificar se já há muitos handoffs hoje para esta conversa
    const todayHandoffs = await this.getHandoffsForConversation(conversationId, 1);
    if (todayHandoffs.length >= criteria.maxHandoffsPerDay) {
      return false;
    }

    // Critérios para handoff automático
    const shouldHandoff = 
      aiClassification.frustrationLevel >= criteria.frustrationThreshold ||
      criteria.urgencyLevels.includes(aiClassification.urgency) ||
      aiClassification.confidence < criteria.confidenceThreshold ||
      criteria.escalationPatterns.includes(aiClassification.intent);

    if (shouldHandoff) {
      console.log(`🤖 Handoff automático recomendado para conversa ${conversationId}:`, {
        frustration: aiClassification.frustrationLevel,
        urgency: aiClassification.urgency,
        confidence: aiClassification.confidence,
        intent: aiClassification.intent
      });
    }

    return shouldHandoff;
  }

  /**
   * Sugerir melhor equipe/usuário para handoff
   */
  async suggestBestTarget(
    conversationId: number,
    aiClassification: any
  ): Promise<{ teamId?: number; userId?: number; reason: string }> {
    // Buscar conversa atual
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    // Lógica de sugestão baseada na classificação da IA
    let suggestedTeamId: number | undefined;
    let reason = 'Baseado na análise da IA';

    // Mapear intents para equipes específicas
    const intentTeamMapping: Record<string, string> = {
      'technical_support': 'suporte',
      'billing_issue': 'financeiro',
      'complaint': 'suporte',
      'sales_inquiry': 'comercial',
      'course_information': 'comercial',
      'enrollment': 'secretaria'
    };

    const suggestedTeamType = intentTeamMapping[aiClassification.intent];
    
    if (suggestedTeamType) {
      // Buscar equipe do tipo sugerido
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.macrosetor, suggestedTeamType))
        .limit(1);
      
      if (team) {
        suggestedTeamId = team.id;
        reason = `Transferido para ${team.name} devido a: ${aiClassification.intent}`;
      }
    }

    // Se urgência alta, escalar para equipe de suporte
    if (aiClassification.urgency === 'critical' && !suggestedTeamId) {
      const [supportTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.macrosetor, 'suporte'))
        .limit(1);
      
      if (supportTeam) {
        suggestedTeamId = supportTeam.id;
        reason = 'Escalado para suporte devido à urgência crítica';
      }
    }

    return {
      teamId: suggestedTeamId,
      reason
    };
  }

  /**
   * Buscar handoffs de uma conversa
   */
  async getHandoffsForConversation(conversationId: number, days?: number): Promise<Handoff[]> {
    let query = db
      .select()
      .from(handoffs)
      .where(eq(handoffs.conversationId, conversationId))
      .orderBy(desc(handoffs.createdAt));

    if (days) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      
      query = query.where(
        and(
          eq(handoffs.conversationId, conversationId),
          // Note: adicionar filtro de data se necessário
        )
      );
    }

    return await query;
  }

  /**
   * Buscar handoff por ID
   */
  async getHandoffById(handoffId: number): Promise<Handoff | null> {
    const [handoff] = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.id, handoffId))
      .limit(1);

    return handoff || null;
  }

  /**
   * Buscar handoffs pendentes para um usuário
   */
  async getPendingHandoffsForUser(userId: number): Promise<Handoff[]> {
    return await db
      .select()
      .from(handoffs)
      .where(
        and(
          eq(handoffs.toUserId, userId),
          eq(handoffs.status, 'pending')
        )
      )
      .orderBy(desc(handoffs.priority), asc(handoffs.createdAt));
  }

  /**
   * Buscar handoffs pendentes para uma equipe
   */
  async getPendingHandoffsForTeam(teamId: number): Promise<Handoff[]> {
    return await db
      .select()
      .from(handoffs)
      .where(
        and(
          eq(handoffs.toTeamId, teamId),
          eq(handoffs.status, 'pending')
        )
      )
      .orderBy(desc(handoffs.priority), asc(handoffs.createdAt));
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

    // Executar a transferência
    await this.executeHandoff(handoffId);
  }

  /**
   * Rejeitar handoff
   */
  async rejectHandoff(handoffId: number, reason?: string): Promise<void> {
    const updateData: any = {
      status: 'rejected',
      updatedAt: new Date()
    };

    if (reason) {
      updateData.metadata = { rejectionReason: reason };
    }

    await db
      .update(handoffs)
      .set(updateData)
      .where(eq(handoffs.id, handoffId));
  }

  /**
   * Obter estatísticas de handoffs
   */
  async getHandoffStats(days: number = 7): Promise<{
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const allHandoffs = await db
      .select()
      .from(handoffs)
      .where(
        // Note: adicionar filtro de data se necessário
      );

    const stats = {
      total: allHandoffs.length,
      pending: allHandoffs.filter(h => h.status === 'pending').length,
      completed: allHandoffs.filter(h => h.status === 'completed').length,
      rejected: allHandoffs.filter(h => h.status === 'rejected').length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    // Agrupar por tipo
    allHandoffs.forEach(handoff => {
      stats.byType[handoff.type] = (stats.byType[handoff.type] || 0) + 1;
      if (handoff.priority) {
        stats.byPriority[handoff.priority] = (stats.byPriority[handoff.priority] || 0) + 1;
      }
    });

    return stats;
  }
}

export const handoffService = new HandoffService();