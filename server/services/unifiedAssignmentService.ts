import { assignmentAnalysisService, HandoffRecommendation } from './assignmentAnalysisService';
import { assignmentExecutionService } from './assignmentExecutionService';
import { dealAutomationService } from './dealAutomationService';
import { teamCapacityService } from './teamCapacityService';
import {
  selectBestTeamForClassification,
  calculateAssignmentConfidence,
  mapUrgencyToPriority,
  calculateWaitTime,
  getAlternativeTeams
} from './assignmentUtils';
import { assignmentCompatibilityService } from './assignmentCompatibilityService';
import { db } from '../core/db';
import { eq } from 'drizzle-orm';
import { conversations } from '../../shared/schema';

export class UnifiedAssignmentService {
  async processAssignment(
    conversationId: number,
    messageContent?: string,
    type: 'manual' | 'automatic' | 'intelligent' = 'automatic'
  ): Promise<any> {
    try {
      let recommendation: HandoffRecommendation | null = null;
      let handoffId: number | null = null;
      let dealId: number | null = null;

      if (type === 'intelligent' && messageContent) {
        recommendation = await assignmentAnalysisService.analyzeIntelligentAssignment(
          conversationId,
          messageContent,
          this.getConversationContext,
          teamCapacityService.analyzeTeamCapacities,
          selectBestTeamForClassification,
          calculateAssignmentConfidence,
          mapUrgencyToPriority,
          calculateWaitTime,
          getAlternativeTeams
        );

        if (recommendation.confidence < 60) {
          return {
            success: true,
            recommendation,
            message: 'Atribuição não necessária - confiança baixa'
          };
        }
      } else {
        recommendation = await assignmentAnalysisService.analyzeBestAssignment(
          teamCapacityService.analyzeTeamCapacities
        );
      }

      if (recommendation && (recommendation.teamId || recommendation.userId)) {
        handoffId = await assignmentExecutionService.executeAssignment(
          conversationId,
          recommendation,
          type
        );
      }

      if (handoffId && recommendation?.teamId) {
        dealId = await dealAutomationService.createAutomaticDeal(conversationId, recommendation.teamId);
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

  // Métodos de compatibilidade
  async createHandoff(handoffData: any) {
    return assignmentCompatibilityService.createHandoff(
      handoffData,
      assignmentCompatibilityService.executeHandoffById
    );
  }

  async executeHandoffById(handoffId: number) {
    return assignmentCompatibilityService.executeHandoffById(handoffId);
  }

  async getHandoffStats(days: number = 7) {
    return assignmentCompatibilityService.getHandoffStats(days);
  }
}

export const unifiedAssignmentService = new UnifiedAssignmentService(); 