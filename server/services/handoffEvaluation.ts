import { db } from '../db';
import { conversations, teams } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { HandoffCriteria } from './handoff-types';

export class HandoffEvaluation {
  private defaultCriteria: HandoffCriteria = {
    frustrationThreshold: 7,
    urgencyLevels: ['high', 'critical'],
    confidenceThreshold: 60,
    maxHandoffsPerDay: 3,
    escalationPatterns: ['complaint', 'technical_support', 'billing_issue']
  };

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

    // MAPEAMENTO CORRIGIDO: Nunca enviar comercial para suporte
    const intentTeamMapping: Record<string, string> = {
      // VENDAS/COMERCIAL
      'lead_generation': 'comercial',
      'sales_interest': 'comercial',
      'sales_inquiry': 'comercial',
      'course_inquiry': 'comercial',
      'course_information': 'comercial',
      'pricing_question': 'comercial',
      'enrollment_interest': 'comercial',
      
      // FINANCEIRO
      'billing_inquiry': 'financeiro',
      'billing_issue': 'financeiro',
      'payment_issue': 'financeiro',
      'invoice_request': 'financeiro',
      
      // SUPORTE TÉCNICO (não comercial!)
      'technical_support': 'suporte',
      'platform_issue': 'suporte',
      'login_problem': 'suporte',
      'complaint': 'suporte', // Reclamações vão para suporte, não comercial
      
      // TUTORIA
      'student_support': 'tutoria',
      'course_question': 'tutoria',
      'academic_support': 'tutoria',
      
      // SECRETARIA
      'general_info': 'secretaria',
      'schedule_request': 'secretaria',
      'document_request': 'secretaria',
      'enrollment': 'secretaria'
    };

    const suggestedTeamType = intentTeamMapping[aiClassification.intent];
    
    if (suggestedTeamType) {
      // Buscar equipe do tipo sugerido
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.teamType, suggestedTeamType))
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
        .where(eq(teams.teamType, 'suporte'))
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
  async getHandoffsForConversation(conversationId: number, days?: number): Promise<any[]> {
    let query = db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (days) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      
      query = query.where(
        and(
          eq(conversations.id, conversationId)
        )
      );
    }

    return await query;
  }
} 