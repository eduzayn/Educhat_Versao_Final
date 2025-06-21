import { BaseStorage } from "../base/BaseStorage";
import { conversations } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ConversationAssignmentOperations extends BaseStorage {
  async assignConversation(
    conversationId: number,
    userId: number,
    teamId?: number,
  ): Promise<void> {
    if (!conversationId || !userId) return;

    await this.db
      .update(conversations)
      .set({
        assignedUserId: userId,
        assignedTeamId: teamId || null,
        assignedAt: new Date(),
        assignmentMethod: "manual",
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async unassignConversation(conversationId: number): Promise<void> {
    if (!conversationId) return;

    await this.db
      .update(conversations)
      .set({
        assignedUserId: null,
        assignedTeamId: null,
        assignedAt: null,
        assignmentMethod: null,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async assignConversationToTeam(
    conversationId: number,
    teamId: number,
    method: string = "manual",
  ): Promise<void> {
    // ISOLAMENTO: Validação rigorosa para evitar efeitos colaterais
    if (!conversationId || typeof conversationId !== 'number' || conversationId <= 0) {
      console.warn(`⚠️ ISOLAMENTO: conversationId inválido na atribuição de equipe: ${conversationId}`);
      return;
    }
    
    if (!teamId || typeof teamId !== 'number' || teamId <= 0) {
      console.warn(`⚠️ ISOLAMENTO: teamId inválido na atribuição de equipe: ${teamId}`);
      return;
    }

    console.log(`🔒 ISOLAMENTO: Atualizando apenas conversa ${conversationId} com equipe ${teamId}`);

    // ISOLAMENTO: UPDATE com WHERE específico e explícito
    const result = await this.db
      .update(conversations)
      .set({
        assignedTeamId: teamId,
        assignmentMethod: method,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    console.log(`✅ ISOLAMENTO: Atribuição de equipe concluída para conversa ${conversationId}`);
  }

  async assignConversationToUser(
    conversationId: number,
    userId: number,
    method: string = "manual",
  ): Promise<void> {
    // ISOLAMENTO: Validação rigorosa para evitar efeitos colaterais
    if (!conversationId || typeof conversationId !== 'number' || conversationId <= 0) {
      console.warn(`⚠️ ISOLAMENTO: conversationId inválido na atribuição de usuário: ${conversationId}`);
      return;
    }
    
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      console.warn(`⚠️ ISOLAMENTO: userId inválido na atribuição de usuário: ${userId}`);
      return;
    }

    console.log(`🔒 ISOLAMENTO: Atualizando apenas conversa ${conversationId} com usuário ${userId}`);

    // ISOLAMENTO: UPDATE com WHERE específico e explícito
    const result = await this.db
      .update(conversations)
      .set({
        assignedUserId: userId,
        assignmentMethod: method,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    console.log(`✅ ISOLAMENTO: Atribuição de usuário concluída para conversa ${conversationId}`);
  }
}
