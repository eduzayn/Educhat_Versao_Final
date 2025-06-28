import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, type Conversation, type InsertConversation, type ConversationWithContact } from "../../../shared/schema";
import { deals } from "../../../shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 */
export class ConversationStorage extends BaseStorage {
  
  /**
   * Método privado para centralizar a query base de conversas com contatos
   * Elimina duplicação de código SQL entre diferentes métodos
   */
  private getBaseConversationWithContactQuery() {
    return this.db.select({
      // Conversation fields
      id: conversations.id,
      contactId: conversations.contactId,
      channel: conversations.channel,
      channelId: conversations.channelId,
      status: conversations.status,
      lastMessageAt: conversations.lastMessageAt,
      unreadCount: conversations.unreadCount,
      assignedTeamId: conversations.assignedTeamId,
      assignedUserId: conversations.assignedUserId,
      assignmentMethod: conversations.assignmentMethod,
      assignedAt: conversations.assignedAt,
      isRead: conversations.isRead,
      markedUnreadManually: conversations.markedUnreadManually,
      priority: conversations.priority,
      tags: conversations.tags,
      metadata: conversations.metadata,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      teamType: sql<string | null>`null`.as('teamType'), // Campo adicionado para compatibilidade
      
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
    .innerJoin(contacts, eq(conversations.contactId, contacts.id));
  }
  async getConversations(limit = 50, offset = 0): Promise<ConversationWithContact[]> {
    // ABORDAGEM SIMPLIFICADA: Buscar conversas e depois suas últimas mensagens individualmente
    const conversationsResult = await this.db
      .select({
        // Conversation fields essenciais
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
        priority: conversations.priority,
        createdAt: conversations.createdAt,
        
        // Contact fields básicos
        contact: {
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          profileImageUrl: contacts.profileImageUrl,
          isOnline: contacts.isOnline
        }
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    if (conversationsResult.length === 0) {
      return [];
    }

    // OTIMIZAÇÃO: Buscar últimas mensagens usando Promise.allSettled para evitar falhas
    const lastMessagesPromises = conversationsResult.map(async (conv) => {
      try {
        const [lastMessage] = await this.db
          .select({
            id: messages.id,
            content: messages.content,
            sentAt: messages.sentAt,
            isFromContact: messages.isFromContact,
            messageType: messages.messageType
          })
          .from(messages)
          .where(and(
            eq(messages.conversationId, conv.id),
            eq(messages.isDeleted, false)
          ))
          .orderBy(desc(messages.sentAt))
          .limit(1);
        
        return { conversationId: conv.id, message: lastMessage };
      } catch (error) {
        console.warn(`Erro ao buscar última mensagem da conversa ${conv.id}:`, error);
        return { conversationId: conv.id, message: null };
      }
    });

    const lastMessagesResults = await Promise.allSettled(lastMessagesPromises);
    
    // Criar mapa de últimas mensagens
    const lastMessageMap = new Map();
    lastMessagesResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.message) {
        lastMessageMap.set(result.value.conversationId, result.value.message);
      }
    });

    // RESULTADO: Conversas com prévias das mensagens preservadas
    return conversationsResult.map(row => {
      const lastMsg = lastMessageMap.get(row.id);
      
      return {
        ...row,
        contact: {
          ...row.contact,
          // Lazy loading: dados complementares carregados sob demanda
          tags: [],
          deals: []
        },
        // Lazy loading: dados complementares removidos da carga inicial
        channelInfo: undefined,
        lastMessage: lastMsg?.content || '', // PRESERVADO: prévia da última mensagem
        // PRESERVADO: Frontend espera messages[0] para prévia da mensagem
        messages: lastMsg ? [{
          id: lastMsg.id,
          content: lastMsg.content,
          sentAt: lastMsg.sentAt,
          isFromContact: lastMsg.isFromContact,
          messageType: lastMsg.messageType || 'text',
          metadata: null
        }] : [],
        _count: { messages: row.unreadCount || 0 }
      } as unknown as ConversationWithContact;
    });
  }

  /**
   * LAZY LOADING: Carregar dados complementares do contato sob demanda
   */
  async getContactDetails(contactId: number) {
    const [contactTagsResult, contactDeals] = await Promise.allSettled([
      // Tags do contato
      this.db
        .select({ tag: contactTags.tag })
        .from(contactTags)
        .where(eq(contactTags.contactId, contactId)),
      
      // Deals ativos do contato
      this.db
        .select()
        .from(deals)
        .where(and(
          eq(deals.contactId, contactId),
          eq(deals.isActive, true)
        ))
        .orderBy(desc(deals.createdAt))
        .limit(10)
    ]);

    return {
      tags: contactTagsResult.status === 'fulfilled' ? contactTagsResult.value.map((t: any) => t.tag) : [],
      deals: contactDeals.status === 'fulfilled' ? contactDeals.value : []
    };
  }

  /**
   * LAZY LOADING: Carregar informações do canal sob demanda
   */
  async getChannelInfo(channelId: number) {
    const [result] = await this.db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);
    
    return result || null;
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    try {
      // Query otimizada com validação incorporada no WHERE (usando SQL para garantir integridade)
      const [result] = await this.getBaseConversationWithContactQuery()
        .where(and(
          eq(conversations.id, id),
          sql`${conversations.contactId} IS NOT NULL`,  // Garantir integridade na query
          sql`${contacts.id} IS NOT NULL`               // Garantir contato válido
        ))
        .limit(1);

      if (!result) {
        return undefined; // Silencioso - ID inválido ou dados corrompidos
      }

      // Executar todas as queries secundárias em paralelo para otimizar performance
      const [
        conversationMessages,
        channelInfo,
        contactTagsResult,
        contactDeals
      ] = await Promise.allSettled([
        // Buscar apenas as 50 mensagens mais recentes para evitar sobrecarga
        this.db
          .select()
          .from(messages)
          .where(and(
            eq(messages.conversationId, id),
            eq(messages.isDeleted, false)
          ))
          .orderBy(desc(messages.sentAt))
          .limit(50),
        
        // Buscar canal se disponível
        result.channelId ? this.db
          .select()
          .from(channels)
          .where(eq(channels.id, result.channelId))
          .limit(1) : Promise.resolve([]),
        
        // Buscar tags do contato
        this.db
          .select({ tag: contactTags.tag })
          .from(contactTags)
          .where(eq(contactTags.contactId, result.contact.id)),
        
        // Buscar deals ativos do contato
        this.db
          .select()
          .from(deals)
          .where(and(
            eq(deals.contactId, result.contact.id),
            eq(deals.isActive, true)
          ))
          .orderBy(desc(deals.createdAt))
          .limit(20) // Limitar a 20 deals para performance
      ]);

      // Processar resultados com fallbacks seguros
      const finalMessages = conversationMessages.status === 'fulfilled' ? conversationMessages.value : [];
      const finalChannelInfo = channelInfo.status === 'fulfilled' && channelInfo.value.length > 0 ? channelInfo.value[0] : null;
      const finalTags = contactTagsResult.status === 'fulfilled' ? contactTagsResult.value.map(t => t.tag) : [];
      const finalDeals = contactDeals.status === 'fulfilled' ? contactDeals.value : [];

      // Log apenas erros que não sejam de performance
      if (conversationMessages.status === 'rejected') {
        console.warn(`getConversation: Erro ao buscar mensagens da conversa ${id}:`, conversationMessages.reason);
      }
      if (channelInfo.status === 'rejected') {
        console.warn(`getConversation: Erro ao buscar canal ${result.channelId}:`, channelInfo.reason);
      }
      if (contactTagsResult.status === 'rejected') {
        console.warn(`getConversation: Erro ao buscar tags do contato ${result.contact.id}:`, contactTagsResult.reason);
      }
      if (contactDeals.status === 'rejected') {
        console.warn(`getConversation: Erro ao buscar deals do contato ${result.contact.id}:`, contactDeals.reason);
      }

      return {
        ...result,
        contact: {
          ...result.contact,
          tags: finalTags,
          deals: finalDeals
        },
        channelInfo: finalChannelInfo || undefined,
        messages: finalMessages,
        _count: { messages: result.unreadCount || 0 }
      } as unknown as ConversationWithContact;

    } catch (error) {
      console.error(`getConversation: Erro crítico ao buscar conversa ${id}:`, error);
      return undefined; // Retornar undefined ao invés de propagar o erro
    }
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

        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
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
    } as unknown as ConversationWithContact));
  }

  async getConversationsByContactId(contactId: number): Promise<ConversationWithContact[]> {
    const conversationsWithContacts = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        priority: conversations.priority,
        teamType: conversations.teamType,
        markedUnreadManually: conversations.markedUnreadManually,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        metadata: conversations.metadata,
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
      .where(eq(conversations.contactId, contactId))
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
    } as unknown as ConversationWithContact));
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

        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
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
    } as unknown as ConversationWithContact));
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
    console.log(`🔄 [DB] resetUnreadCount INÍCIO - Conversa ${conversationId}`);
    
    // Query única otimizada que marca conversa como lida e reseta flag manual
    const result = await this.db
      .update(conversations)
      .set({
        unreadCount: 0,
        isRead: true,
        // Sempre resetar markedUnreadManually quando conversa é marcada como lida
        markedUnreadManually: false,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId))
      .returning();
    
    console.log(`✅ [DB] resetUnreadCount SUCESSO - Conversa ${conversationId}:`, {
      rowsUpdated: result.length,
      updatedData: result[0] ? {
        id: result[0].id,
        unreadCount: result[0].unreadCount,
        isRead: result[0].isRead,
        markedUnreadManually: result[0].markedUnreadManually
      } : 'Nenhuma linha retornada'
    });
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
    // Query otimizada única que incorpora validações via SQL para evitar redundância
    const result = await this.db
      .update(conversations)
      .set({
        assignedUserId: userId,
        assignedTeamId: teamId || null,
        assignedAt: new Date(),
        assignmentMethod: 'manual',
        updatedAt: new Date()
      })
      .where(and(
        eq(conversations.id, conversationId),
        sql`${conversations.contactId} IS NOT NULL`  // Garantir integridade
      ))
      .returning({ id: conversations.id });

    if (result.length === 0) {
      throw new Error('Conversa não encontrada ou dados inconsistentes');
    }
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

  async markConversationAsUnread(conversationId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        unreadCount: 1,
        isRead: false,
        markedUnreadManually: true,
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

  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    // Query otimizada com LEFT JOIN para buscar última mensagem (igual ao método principal)
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
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
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
        },
        
        // Last message fields (mesma lógica do método principal)
        lastMessage: {
          id: messages.id,
          content: messages.content,
          sentAt: messages.sentAt,
          isFromContact: messages.isFromContact,
          messageType: messages.messageType,
          metadata: messages.metadata
        }
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(
        messages,
        and(
          eq(messages.conversationId, conversations.id),
          eq(messages.isDeleted, false),
          eq(messages.id, 
            sql`(
              SELECT m.id 
              FROM messages m 
              WHERE m.conversation_id = ${conversations.id} 
                AND m.is_deleted = false 
              ORDER BY m.sent_at DESC 
              LIMIT 1
            )`
          )
        )
      )
      .where(eq(conversations.assignedTeamId, teamId))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt));

    // Processar resultados para o formato esperado (incluindo mensagens)
    return conversationsWithContacts.map(conv => ({
      ...conv,
      contact: {
        ...conv.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      // Converter lastMessage de objeto para string para compatibilidade com frontend
      lastMessage: conv.lastMessage?.content || '',
      messages: conv.lastMessage?.id ? [conv.lastMessage] : [],
      _count: { messages: conv.unreadCount || 0 }
    } as unknown as ConversationWithContact));
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    // Query otimizada com LEFT JOIN para buscar última mensagem (igual ao método principal)
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
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
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
        },
        
        // Last message fields (mesma lógica do método principal)
        lastMessage: {
          id: messages.id,
          content: messages.content,
          sentAt: messages.sentAt,
          isFromContact: messages.isFromContact,
          messageType: messages.messageType,
          metadata: messages.metadata
        }
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(
        messages,
        and(
          eq(messages.conversationId, conversations.id),
          eq(messages.isDeleted, false),
          eq(messages.id, 
            sql`(
              SELECT m.id 
              FROM messages m 
              WHERE m.conversation_id = ${conversations.id} 
                AND m.is_deleted = false 
              ORDER BY m.sent_at DESC 
              LIMIT 1
            )`
          )
        )
      )
      .where(eq(conversations.assignedUserId, userId))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt));

    // Processar resultados para o formato esperado (incluindo mensagens)
    return conversationsWithContacts.map(conv => ({
      ...conv,
      contact: {
        ...conv.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      // Converter lastMessage de objeto para string para compatibilidade com frontend
      lastMessage: conv.lastMessage?.content || '',
      messages: conv.lastMessage?.id ? [conv.lastMessage] : [],
      _count: { messages: conv.unreadCount || 0 }
    } as unknown as ConversationWithContact));
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

        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
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
    } as unknown as ConversationWithContact;
  }

  /**
   * Busca conversas no banco de dados completo baseado em nome, telefone ou email do contato
   */
  async searchConversations(searchTerm: string): Promise<ConversationWithContact[]> {
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Query otimizada que busca em todo o banco de dados incluindo a última mensagem
    const results = await this.db
      .select({
        // Conversation fields
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        markedUnreadManually: conversations.markedUnreadManually,
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
        },
        
        // Last message fields (mesma lógica do método principal)
        lastMessage: {
          id: messages.id,
          content: messages.content,
          sentAt: messages.sentAt,
          isFromContact: messages.isFromContact,
          messageType: messages.messageType,
          metadata: messages.metadata
        }
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(
        messages,
        and(
          eq(messages.conversationId, conversations.id),
          eq(messages.isDeleted, false),
          eq(messages.id, 
            sql`(
              SELECT m.id 
              FROM messages m 
              WHERE m.conversation_id = ${conversations.id} 
                AND m.is_deleted = false 
              ORDER BY m.sent_at DESC 
              LIMIT 1
            )`
          )
        )
      )
      .where(
        // Busca flexível em nome, telefone e email
        sql`(
          LOWER(${contacts.name}) LIKE ${'%' + searchLower + '%'} OR
          ${contacts.phone} LIKE ${'%' + searchTerm + '%'} OR
          LOWER(${contacts.email}) LIKE ${'%' + searchLower + '%'}
        )`
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(100); // Limitar para evitar sobrecarga

    // Transformar resultados no formato esperado com mensagens incluídas
    return results.map(result => ({
      ...result,
      contact: {
        ...result.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      teamType: null,
      markedUnreadManually: false,
      // Converter lastMessage de objeto para string para compatibilidade com frontend
      lastMessage: result.lastMessage?.content || '',
      messages: result.lastMessage?.id ? [result.lastMessage] : [],
      _count: { messages: result.unreadCount || 0 }
    } as unknown)) as unknown as ConversationWithContact[];
  }
}