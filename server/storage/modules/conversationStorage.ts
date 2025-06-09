import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, type Conversation, type InsertConversation, type ConversationWithContact } from "../../../shared/schema";
import { deals } from "../../../shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 */
export class ConversationStorage extends BaseStorage {
  async getConversations(limit = 50, offset = 0): Promise<ConversationWithContact[]> {
    // Consulta principal otimizada - buscar conversas com contatos
    const conversationsWithContacts = await this.db
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

    // Buscar últimas mensagens individualmente para evitar problemas
    const result = [];
    for (const conv of conversationsWithContacts) {
      // Buscar última mensagem
      const [lastMessage] = await this.db
        .select({
          id: messages.id,
          content: messages.content,
          sentAt: messages.sentAt,
          isFromContact: messages.isFromContact,
          messageType: messages.messageType,
          metadata: messages.metadata
        })
        .from(messages)
        .where(and(
          eq(messages.conversationId, conv.id),
          eq(messages.isDeleted, false)
        ))
        .orderBy(desc(messages.sentAt))
        .limit(1);

      result.push({
        ...conv,
        contact: {
          ...conv.contact,
          tags: [],
          deals: []
        },
        channelInfo: undefined,
        messages: lastMessage ? [lastMessage] : [],
        _count: { messages: conv.unreadCount || 0 }
      } as ConversationWithContact);
    }

    return result;
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    const [result] = await this.db
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
      .where(eq(conversations.id, id))
      .limit(1);

    if (!result) return undefined;

    // Buscar mensagens da conversa
    const conversationMessages = await this.db
      .select()
      .from(messages)
      .where(and(
        eq(messages.conversationId, id),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));

    // Buscar canal se disponível
    let channelInfo = null;
    if (result.channelId) {
      [channelInfo] = await this.db
        .select()
        .from(channels)
        .where(eq(channels.id, result.channelId));
    }

    // Buscar tags do contato
    const contactTagsResult = await this.db
      .select({ tag: contactTags.tag })
      .from(contactTags)
      .where(eq(contactTags.contactId, result.contact.id));

    const tagsArray = contactTagsResult.map(t => t.tag);

    // Buscar deals do contato
    const contactDeals = await this.db
      .select()
      .from(deals)
      .where(and(
        eq(deals.contactId, result.contact.id),
        eq(deals.isActive, true)
      ))
      .orderBy(desc(deals.createdAt));

    return {
      ...result,
      contact: {
        ...result.contact,
        tags: tagsArray,
        deals: contactDeals
      },
      channelInfo: channelInfo || undefined,
      messages: conversationMessages || [],
      _count: { messages: result.unreadCount || 0 }
    } as ConversationWithContact;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await this.db
      .insert(conversations)
      .values(conversation)
      .returning();
    return created;
  }

  async updateConversation(id: number, conversationData: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await this.db
      .update(conversations)
      .set({
        ...conversationData,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async deleteConversation(id: number): Promise<void> {
    await this.db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }

  async getConversationsByChannel(channel: string): Promise<ConversationWithContact[]> {
    const conversationsWithContacts = await this.db
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
        isRead: conversations.isRead,
        priority: conversations.priority,
        tags: conversations.tags,
        metadata: conversations.metadata,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
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
      .where(eq(conversations.channel, channel))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsWithContacts.map(conv => ({
      ...conv,
      contact: {
        ...conv.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: conv.unreadCount || 0 }
    } as ConversationWithContact));
  }

  async getConversationsByStatus(status: string): Promise<ConversationWithContact[]> {
    const conversationsWithContacts = await this.db
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
        isRead: conversations.isRead,
        priority: conversations.priority,
        tags: conversations.tags,
        metadata: conversations.metadata,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
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
      .where(eq(conversations.status, status))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsWithContacts.map(conv => ({
      ...conv,
      contact: {
        ...conv.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: conv.unreadCount || 0 }
    } as ConversationWithContact));
  }

  async updateLastMessage(conversationId: number, messageId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async incrementUnreadCount(conversationId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        unreadCount: sql`${conversations.unreadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async resetUnreadCount(conversationId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        unreadCount: 0,
        isRead: true,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async getUnreadCount(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.isRead, false));
    
    return result?.count || 0;
  }

  async getConversationCount(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(conversations);
    
    return result?.count || 0;
  }

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

  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async addConversationTag(conversationId: number, tag: string): Promise<void> {
    const [conversation] = await this.db
      .select({ tags: conversations.tags })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (conversation) {
      const currentTags = conversation.tags || [];
      if (!currentTags.includes(tag)) {
        await this.db
          .update(conversations)
          .set({
            tags: [...currentTags, tag],
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId));
      }
    }
  }

  async removeConversationTag(conversationId: number, tag: string): Promise<void> {
    const [conversation] = await this.db
      .select({ tags: conversations.tags })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (conversation) {
      const currentTags = conversation.tags || [];
      const updatedTags = currentTags.filter(t => t !== tag);
      
      await this.db
        .update(conversations)
        .set({
          tags: updatedTags,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));
    }
  }

  // Métodos adicionais necessários para compatibilidade
  async getTotalUnreadCount(): Promise<number> {
    return this.getUnreadCount();
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    await this.resetUnreadCount(conversationId);
  }

  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    const conversationsWithContacts = await this.db
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
        isRead: conversations.isRead,
        priority: conversations.priority,
        tags: conversations.tags,
        metadata: conversations.metadata,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
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
      .where(eq(conversations.assignedTeamId, teamId))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsWithContacts.map(conv => ({
      ...conv,
      contact: {
        ...conv.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: conv.unreadCount || 0 }
    } as ConversationWithContact));
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    const conversationsWithContacts = await this.db
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
        isRead: conversations.isRead,
        priority: conversations.priority,
        tags: conversations.tags,
        metadata: conversations.metadata,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
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
      .where(eq(conversations.assignedUserId, userId))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsWithContacts.map(conv => ({
      ...conv,
      contact: {
        ...conv.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: conv.unreadCount || 0 }
    } as ConversationWithContact));
  }
}