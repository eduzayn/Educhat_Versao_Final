import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, type Conversation, type InsertConversation, type ConversationWithContact } from "../../../shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 */
export class ConversationStorage extends BaseStorage {
  async getConversations(limit = 50, offset = 0): Promise<ConversationWithContact[]> {
    // Otimizar consulta usando uma subquery para buscar apenas a última mensagem
    const conversationsWithLastMessage = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        macrosetor: conversations.macrosetor,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        contact: {
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email,
          profileImageUrl: contacts.profileImageUrl,
          location: contacts.location,
          age: contacts.age,
          isOnline: contacts.isOnline,
          lastSeenAt: contacts.lastSeenAt,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          userIdentity: contacts.userIdentity,
          assignedUserId: contacts.assignedUserId,
          tags: contacts.tags,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        },
        channelInfo: channels,
        lastMessage: {
          id: messages.id,
          conversationId: messages.conversationId,
          content: messages.content,
          type: messages.type,
          direction: messages.direction,
          sentAt: messages.sentAt,
          isFromUser: messages.isFromUser,
          messageId: messages.messageId,
          metadata: messages.metadata
        }
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .leftJoin(
        messages, 
        and(
          eq(messages.conversationId, conversations.id),
          eq(messages.isDeleted, false),
          // Subquery para pegar apenas a última mensagem
          eq(messages.sentAt, 
            sql`(SELECT MAX(sent_at) FROM messages m2 WHERE m2.conversation_id = ${conversations.id} AND m2.is_deleted = false)`
          )
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Agrupar os resultados para criar a estrutura esperada
    const groupedResults = new Map();
    
    for (const row of conversationsWithLastMessage) {
      const convId = row.id;
      
      if (!groupedResults.has(convId)) {
        groupedResults.set(convId, {
          ...row,
          messages: row.lastMessage.id ? [row.lastMessage] : [],
          _count: { messages: 0 }
        });
      }
    }

    return Array.from(groupedResults.values()) as ConversationWithContact[];
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    const [result] = await this.db
      .select({
        // Conversation fields
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        macrosetor: conversations.macrosetor,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        // Contact fields
        contact: {
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email,
          profileImageUrl: contacts.profileImageUrl,
          location: contacts.location,
          age: contacts.age,
          isOnline: contacts.isOnline,
          lastSeenAt: contacts.lastSeenAt,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          userIdentity: contacts.userIdentity,
          assignedUserId: contacts.assignedUserId,
          tags: contacts.tags,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        },
        // Channel info
        channelInfo: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(eq(conversations.id, id));

    if (!result) return undefined;

    return {
      ...result,
      messages: [], // Messages loaded separately when needed
      _count: { messages: 0 }
    } as ConversationWithContact;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await this.db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id: number, conversationData: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await this.db.update(conversations)
      .set({ ...conversationData, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined> {
    const [conversation] = await this.db.select().from(conversations)
      .where(and(
        eq(conversations.contactId, contactId),
        eq(conversations.channel, channel)
      ));
    return conversation;
  }

  async assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual'): Promise<void> {
    await this.db.update(conversations)
      .set({
        assignedTeamId: teamId,
        assignmentMethod: method,
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual'): Promise<void> {
    await this.db.update(conversations)
      .set({
        assignedUserId: userId,
        assignmentMethod: method,
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    const result = await this.db
      .select({
        // Similar structure as getConversations but filtered by team
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        macrosetor: conversations.macrosetor,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        contact: {
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email,
          profileImageUrl: contacts.profileImageUrl,
          location: contacts.location,
          age: contacts.age,
          isOnline: contacts.isOnline,
          lastSeenAt: contacts.lastSeenAt,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          userIdentity: contacts.userIdentity,
          assignedUserId: contacts.assignedUserId,
          tags: contacts.tags,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        },
        channelInfo: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(eq(conversations.assignedTeamId, teamId))
      .orderBy(desc(conversations.lastMessageAt));

    return result.map(row => ({
      ...row,
      messages: [],
      _count: { messages: 0 }
    })) as ConversationWithContact[];
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    const result = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        macrosetor: conversations.macrosetor,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        contact: {
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email,
          profileImageUrl: contacts.profileImageUrl,
          location: contacts.location,
          age: contacts.age,
          isOnline: contacts.isOnline,
          lastSeenAt: contacts.lastSeenAt,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          userIdentity: contacts.userIdentity,
          assignedUserId: contacts.assignedUserId,
          tags: contacts.tags,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        },
        channelInfo: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(eq(conversations.assignedUserId, userId))
      .orderBy(desc(conversations.lastMessageAt));

    return result.map(row => ({
      ...row,
      messages: [],
      _count: { messages: 0 }
    })) as ConversationWithContact[];
  }

  async getTotalUnreadCount(): Promise<number> {
    const [result] = await this.db
      .select({ total: sql<number>`sum(${conversations.unreadCount})` })
      .from(conversations);
    
    return result?.total || 0;
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    await this.db.update(conversations)
      .set({ 
        unreadCount: 0,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }
}