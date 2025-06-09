import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, type Conversation, type InsertConversation, type ConversationWithContact } from "../../../shared/schema";
import { deals } from "../../../shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 */
export class ConversationStorage extends BaseStorage {
  async getConversations(limit = 1000, offset = 0): Promise<ConversationWithContact[]> {
    // Buscar conversas com contatos usando JOIN otimizado
    const conversationsWithContacts = await this.db
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
        isRead: conversations.isRead,
        priority: conversations.priority,
        tags: conversations.tags,
        metadata: conversations.metadata,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
        // Contact fields
        contact: {
          id: contacts.id,
          userIdentity: contacts.userIdentity,
          name: contacts.name,
          email: contacts.email,
          phone: contacts.phone,
          profileImageUrl: contacts.profileImageUrl,
          location: contacts.location,
          age: contacts.age,
          isOnline: contacts.isOnline,
          lastSeenAt: contacts.lastSeenAt,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          assignedUserId: contacts.assignedUserId,
          tags: contacts.tags,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        }
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    // OTIMIZAÇÃO: Buscar apenas as últimas mensagens em uma consulta otimizada
    const conversationIds = conversationsWithContacts.map(c => c.id);
    
    // Buscar todas as últimas mensagens de uma vez (otimizado)
    const latestMessages = await this.db
      .select({
        conversationId: messages.conversationId,
        id: messages.id,
        content: messages.content,
        sentAt: messages.sentAt,
        isFromContact: messages.isFromContact,
        messageType: messages.messageType,
        metadata: messages.metadata
      })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));

    // Agrupar mensagens por conversa e pegar apenas a mais recente
    const messagesByConversation = latestMessages.reduce((acc, msg) => {
      if (!acc[msg.conversationId] || msg.sentAt > acc[msg.conversationId].sentAt) {
        acc[msg.conversationId] = msg;
      }
      return acc;
    }, {} as Record<number, any>);

    // Construir resultado final com mensagens
    const optimizedConversations = conversationsWithContacts.map((conv) => {
      const lastMessage = messagesByConversation[conv.id];
      
      return {
        ...conv,
        contact: {
          ...conv.contact,
          tags: [], // Carregado sob demanda para performance
          deals: [] // Carregado sob demanda para performance
        },
        channelInfo: undefined, // Carregado sob demanda
        messages: lastMessage ? [lastMessage] : [],
        _count: { messages: conv.unreadCount || 0 },
        // Campos obrigatórios para ConversationWithContact
        priority: conv.priority || null,
        tags: conv.tags || [],
        isRead: conv.isRead || false,
        metadata: conv.metadata || {}
      } as ConversationWithContact;
    });

    return optimizedConversations;
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