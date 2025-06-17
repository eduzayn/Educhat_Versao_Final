import { db } from '../db';
import { handoffs, conversations, teams } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { InsertHandoff, Handoff } from '@shared/schema';
import { unifiedAssignmentService } from './unifiedAssignmentService';
import { HandoffRequest } from './handoff-types';

export class HandoffOperations {
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
    
    console.log(`🔄 Handoff criado: ${handoff.type} - Conversa ${handoff.conversationId} (ID: ${handoff.id})`);
    
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

    await db
      .update(handoffs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));

    if (handoff.toTeamId) {
      try {
        const conversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, handoff.conversationId)
        });

        if (conversation) {
          console.log(`🤖 Executando automação de deals para handoff...`);
          await unifiedAssignmentService.handleTeamAssignment(conversation, handoff.toTeamId);
        }
      } catch (error) {
        console.error(`❌ Erro na automação de deals para handoff:`, error);
      }
    }

    console.log(`✅ Handoff executado: ${handoff.type} - Conversa ${handoff.conversationId}`);
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
} 