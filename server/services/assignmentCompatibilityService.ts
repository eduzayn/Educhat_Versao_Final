import { db } from '../core/db';
import { eq } from 'drizzle-orm';
import { handoffs, conversations } from '../../shared/schema';
import { dealAutomationService } from './dealAutomationService';

export class AssignmentCompatibilityService {
  async createHandoff(handoffData: any, executeHandoffById: (id: number) => Promise<void>): Promise<any> {
    if (!handoffData.conversationId) throw new Error('conversationId é obrigatório');
    if (!handoffData.toTeamId && !handoffData.toUserId) throw new Error('Deve ser fornecido pelo menos toTeamId ou toUserId');
    const insertData: any = {
      conversationId: handoffData.conversationId,
      fromUserId: handoffData.fromUserId || null,
      toUserId: handoffData.toUserId || null,
      fromTeamId: handoffData.fromTeamId || null,
      toTeamId: handoffData.toTeamId || null,
      type: handoffData.type || 'manual',
      reason: handoffData.reason || null,
      priority: handoffData.priority || 'normal',
      status: 'pending',
      aiClassification: handoffData.aiClassification || null,
      metadata: handoffData.metadata || null
    };
    const [handoff] = await db.insert(handoffs).values(insertData).returning();
    await executeHandoffById(handoff.id);
    return handoff;
  }

  async executeHandoffById(handoffId: number): Promise<void> {
    const [handoff] = await db.select().from(handoffs).where(eq(handoffs.id, handoffId)).limit(1);
    if (!handoff) throw new Error('Handoff não encontrado');
    if (handoff.status !== 'pending') {
      console.log(`⚠️ Handoff ${handoffId} já foi processado (status: ${handoff.status})`);
      return;
    }
    const updateData: any = {
      updatedAt: new Date(),
      priority: handoff.priority || 'normal'
    };
    if (handoff.toTeamId) updateData.assignedTeamId = handoff.toTeamId;
    if (handoff.toUserId) {
      updateData.assignedUserId = handoff.toUserId;
      updateData.assignedAt = new Date();
    }
    await db.update(conversations).set(updateData).where(eq(conversations.id, handoff.conversationId));
    await db.update(handoffs).set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() }).where(eq(handoffs.id, handoffId));
    console.log(`✅ Handoff executado: ${handoff.type} - Conversa ${handoff.conversationId} → Equipe ${handoff.toTeamId || 'N/A'}, Usuário ${handoff.toUserId || 'N/A'}`);
    if (handoff.toTeamId) await dealAutomationService.createAutomaticDeal(handoff.conversationId, handoff.toTeamId);
  }

  async getHandoffStats(days: number = 7): Promise<any> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const allHandoffs = await db.select().from(handoffs);
    const recentHandoffs = allHandoffs.filter(h => h.createdAt && new Date(h.createdAt) >= dateThreshold);
    const totalHandoffs = recentHandoffs.length;
    const completedHandoffs = recentHandoffs.filter(h => h.status === 'completed').length;
    const pendingHandoffs = recentHandoffs.filter(h => h.status === 'pending').length;
    return {
      totalHandoffs,
      completedHandoffs,
      pendingHandoffs,
      completionRate: totalHandoffs > 0 ? Math.round((completedHandoffs / totalHandoffs) * 100) : 0,
      periodDays: days
    };
  }
}

export const assignmentCompatibilityService = new AssignmentCompatibilityService(); 