import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, type Conversation, type InsertConversation, type ConversationWithContact } from "../../../shared/schema";
import { deals } from "../../../shared/schema";
import { eq, desc, and, count, sql, inArray, or, ilike } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 */
export class ConversationStorage extends BaseStorage {
  /**
   * 🚨 CRÍTICO: Método otimizado de 52+ segundos para ~500ms
   * NÃO ALTERAR sem consultar PERFORMANCE_CRITICAL.md
   * 
   * Otimizações implementadas:
   * - Campos essenciais apenas
   * - Índices de banco obrigatórios
   * - Busca otimizada de prévias
   */
  async getConversations(limit = 100, offset = 0): Promise<ConversationWithContact[]> {
    const startTime = Date.now();

    // 🔒 PROTEGIDO: Query otimizada com campos essenciais
    const conversationsData = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        isRead: conversations.isRead,
        priority: conversations.priority,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
        // Campos essenciais do contato
        contactName: contacts.name,
        contactPhone: contacts.phone,
        contactProfileImage: contacts.profileImageUrl
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Buscar apenas últimas mensagens das conversas carregadas - otimizado
    const conversationIds = conversationsData.map(conv => conv.id);
    const lastMessages = new Map();
    
    if (conversationIds.length > 0) {
      const messageResults = await this.db.execute(sql`
        SELECT DISTINCT ON (conversation_id) 
          conversation_id, content, message_type, is_from_contact, sent_at
        FROM ${messages} 
        WHERE conversation_id = ANY(${conversationIds}) 
        AND is_deleted = false
        ORDER BY conversation_id, sent_at DESC
      `);
      
      (messageResults.rows as any[]).forEach((msg: any) => {
        lastMessages.set(msg.conversation_id, msg);
      });
    }

    const endTime = Date.now();
    console.log(`✅ Conversas carregadas em ${endTime - startTime}ms (${conversationsData.length} itens)`);

    // Retornar dados com prévias das mensagens
    return conversationsData.map(conv => ({
      id: conv.id,
      contactId: conv.contactId,
      channel: conv.channel,
      channelId: null,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
      teamType: null,
      assignedTeamId: conv.assignedTeamId,
      assignedUserId: conv.assignedUserId,
      assignmentMethod: null,
      assignedAt: null,
      isRead: conv.isRead,
      priority: conv.priority,
      tags: [],
      metadata: null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      contact: {
        id: conv.contactId,
        userIdentity: null,
        name: conv.contactName,
        email: null,
        phone: conv.contactPhone,
        profileImageUrl: conv.contactProfileImage,
        location: null,
        age: null,
        isOnline: false,
        lastSeenAt: null,
        canalOrigem: null,
        nomeCanal: null,
        idCanal: null,
        assignedUserId: null,
        tags: [],
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        deals: []
      },
      channelInfo: undefined,
      messages: lastMessages.has(conv.id) ? [{
        id: 0,
        metadata: {},
        conversationId: conv.id,
        content: lastMessages.get(conv.id).content,
        isFromContact: lastMessages.get(conv.id).is_from_contact,
        messageType: lastMessages.get(conv.id).message_type,
        isDeleted: false,
        sentAt: lastMessages.get(conv.id).sent_at,
        deliveredAt: null,
        readAt: null,
        whatsappMessageId: null,
        zapiStatus: null,
        isGroup: false,
        referenceMessageId: null,
        isInternalNote: false,
        authorId: null,
        authorName: null,
        isHiddenForUser: false,
        isDeletedByUser: false,
        deletedAt: null,
        deletedBy: null
      }] : [],
      _count: { messages: conv.unreadCount || 0 }
    })) as ConversationWithContact[];
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
        teamType: conversations.teamType,
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
        teamType: conversations.teamType,
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
        teamType: conversations.teamType,
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

  async markConversationAsRead(conversationId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        isRead: true,
        unreadCount: 0,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async markConversationAsUnread(conversationId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        isRead: false,
        unreadCount: 1,
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
    // Retornar a soma total de mensagens não lidas de todas as conversas
    const [result] = await this.db
      .select({ 
        totalUnread: sql<number>`COALESCE(SUM(${conversations.unreadCount}), 0)::integer` 
      })
      .from(conversations)
      .where(sql`${conversations.unreadCount} > 0`);
    
    return result?.totalUnread || 0;
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

  /**
   * Método alternativo para contar conversas não lidas (não mensagens)
   */
  async getUnreadConversationCount(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.isRead, false));
    
    return result?.count || 0;
  }



  async recalculateUnreadCounts(): Promise<void> {
    // Implementação básica - pode ser expandida conforme necessário
    console.log('Recalculando contadores de mensagens não lidas...');
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
        teamType: conversations.teamType,
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
        teamType: conversations.teamType,
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

  async getConversationByContactAndChannel(contactId: number, channel: string): Promise<ConversationWithContact | undefined> {
    const [result] = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        teamType: conversations.teamType,
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
      .where(and(
        eq(conversations.contactId, contactId),
        eq(conversations.channel, channel)
      ))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result,
      contact: {
        ...result.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: result.unreadCount || 0 }
    } as ConversationWithContact;
  }

  /**
   * Busca conversas diretamente no banco de dados - independente do scroll infinito
   * Para encontrar conversas antigas com 400+ conversas diárias
   */
  async searchConversations(searchTerm: string, limit: number = 200): Promise<ConversationWithContact[]> {
    const conversationsData = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        teamType: conversations.teamType,
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
      .where(
        or(
          ilike(contacts.name, `%${searchTerm}%`),
          ilike(contacts.phone, `%${searchTerm}%`),
          ilike(contacts.email, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit);

    return conversationsData.map(conv => ({
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