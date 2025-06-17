import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels } from "@shared/schema";
import { eq, desc, and, count, sql, inArray, or, ilike, gte, lte } from "drizzle-orm";

/**
 * Conversation filter operations - handles filtering and searching conversations
 */
export class ConversationFilterOperations extends BaseStorage {
  
  async getConversationsByStatus(status: string, limit = 100, offset = 0) {
    return this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channelId: conversations.channelId,
        channel: conversations.channel,
        status: conversations.status,
        priority: conversations.priority,
        teamType: conversations.teamType,
        assignedUserId: conversations.assignedUserId,
        assignedTeamId: conversations.assignedTeamId,
        unreadCount: conversations.unreadCount,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        tags: conversations.tags,
        metadata: conversations.metadata,
        contact: {
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email
        }
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.status, status))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversationsByTeam(teamId: number, limit = 100, offset = 0) {
    return this.db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.assignedTeamId, teamId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversationsByUser(userId: number, limit = 100, offset = 0) {
    return this.db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.assignedUserId, userId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversationsByPriority(priority: string, limit = 100, offset = 0) {
    return this.db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.priority, priority))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnassignedConversations(limit = 100, offset = 0) {
    return this.db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(and(
        sql`${conversations.assignedUserId} IS NULL`,
        sql`${conversations.assignedTeamId} IS NULL`
      ))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
  }

  async getConversationByContactAndChannel(contactId: number, channel: string) {
    const result = await this.db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(and(
        eq(conversations.contactId, contactId),
        eq(conversations.channel, channel)
      ))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }
}