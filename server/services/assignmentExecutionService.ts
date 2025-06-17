import { db } from '../core/db';
import { eq } from 'drizzle-orm';
import { handoffs, conversations } from '../../shared/schema';
import { HandoffRecommendation } from './assignmentAnalysisService';

export class AssignmentExecutionService {
  async executeAssignment(
    conversationId: number,
    recommendation: HandoffRecommendation,
    type: string
  ): Promise<number> {
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
}

export const assignmentExecutionService = new AssignmentExecutionService(); 