import { BaseStorage } from "../base/BaseStorage";
import { conversations } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ConversationAssignmentOperations extends BaseStorage {
  async assignConversation(conversationId: number, userId: number, teamId?: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        assignedUserId: userId,
        assignedTeamId: teamId || null,
        assignedAt: new Date(),
        assignmentMethod: 'manual',
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async unassignConversation(conversationId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        assignedUserId: null,
        assignedTeamId: null,
        assignedAt: null,
        assignmentMethod: null,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async assignConversationToTeam(conversationId: number, teamId: number, method: string = 'manual'): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        assignedTeamId: teamId,
        assignmentMethod: method,
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async assignConversationToUser(conversationId: number, userId: number, method: string = 'manual'): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        assignedUserId: userId,
        assignmentMethod: method,
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }
} 