import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, type Conversation, type InsertConversation, type ConversationWithContact } from "../../../shared/schema";
import { deals } from "../../../shared/schema";
import { eq, desc, and, count, sql, gte, lte } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 */
export class ConversationStorage extends BaseStorage {
  async getConversations(limit = 50, offset = 0, filters?: { period?: string; channel?: string; user?: string; team?: string }): Promise<ConversationWithContact[]> {
    // Calcular datas de filtro por período
    const now = new Date();
    let dateFilter: Date | null = null;
    
    if (filters?.period) {
      switch (filters.period) {
        case 'today':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case 'last7days':
          dateFilter = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'last30days':
          dateFilter = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'last90days':
          dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        case 'last6months':
          dateFilter = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
          break;
        case 'lastyear':
          dateFilter = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
          break;
      }
    }

    // Construir condições WHERE
    const whereConditions = [];
    
    // Filtro por período
    if (dateFilter) {
      if (filters?.period === 'today' || filters?.period === 'yesterday') {
        // Para hoje e ontem, filtrar exato por dia
        const endDate = new Date(dateFilter);
        endDate.setDate(endDate.getDate() + 1);
        whereConditions.push(
          and(
            gte(conversations.lastMessageAt, dateFilter),
            lte(conversations.lastMessageAt, endDate)
          )
        );
      } else {
        // Para outros períodos, filtrar desde a data até agora
        whereConditions.push(gte(conversations.lastMessageAt, dateFilter));
      }
    }
    
    // Filtro por canal
    if (filters?.channel) {
      whereConditions.push(eq(conversations.channel, filters.channel));
    }
    
    // Filtro por usuário responsável
    if (filters?.user) {
      if (filters.user === 'unassigned') {
        whereConditions.push(eq(conversations.assignedUserId, null));
      } else {
        whereConditions.push(eq(conversations.assignedUserId, parseInt(filters.user)));
      }
    }
    
    // Filtro por equipe
    if (filters?.team) {
      if (filters.team === 'unassigned') {
        whereConditions.push(eq(conversations.assignedTeamId, null));
      } else {
        whereConditions.push(eq(conversations.assignedTeamId, parseInt(filters.team)));
      }
    }

    // Query otimizada com LEFT JOIN para buscar última mensagem em uma única consulta
    let query = this.db
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
        
        // Last message fields
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
      );

    // Aplicar filtros WHERE se houver condições
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Finalizar query com ordenação, limite e offset
    query = query
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    const results = await query;

    // Processar resultados para o formato esperado
    return results.map(row => ({
      ...row,
      contact: {
        ...row.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      // Converter lastMessage de objeto para string para compatibilidade com frontend
      lastMessage: row.lastMessage?.content || '',
      messages: row.lastMessage?.id ? [row.lastMessage] : [],
      _count: { messages: row.unreadCount || 0 }
    } as ConversationWithContact));
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    try {
      // Validação básica do ID
      if (!id || isNaN(id) || id <= 0) {
        console.warn(`getConversation: ID inválido fornecido: ${id}`);
        return undefined;
      }

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

      if (!result) {
        console.info(`getConversation: Conversa ${id} não encontrada`);
        return undefined;
      }

      // Validação de integridade dos dados principais
      if (!result.contact?.id || !result.contactId) {
        console.error(`getConversation: Dados corrompidos na conversa ${id} - contato ausente`);
        return undefined;
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
      } as ConversationWithContact;

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
        markedUnreadManually: false,
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
   * Busca conversas no banco de dados completo baseado em nome, telefone ou email do contato
   */
  async searchConversations(searchTerm: string): Promise<ConversationWithContact[]> {
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Query otimizada que busca em todo o banco de dados
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

    // Transformar resultados no formato esperado
    return results.map(result => ({
      ...result,
      contact: {
        ...result.contact,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: result.unreadCount || 0 }
    })) as ConversationWithContact[];
  }
}