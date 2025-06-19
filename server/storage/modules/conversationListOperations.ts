import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, messages, type ConversationWithContact } from "@shared/schema";
import { eq, desc, and, inArray, or, ilike, count, gte, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { ConversationFilters } from "../interfaces/IConversationStorage";

export class ConversationListOperations extends BaseStorage {
  /**
   * 🚨 CRÍTICO: Método otimizado de 52+ segundos para ~500ms
   * NÃO ALTERAR sem consultar PERFORMANCE_CRITICAL.md
   * 
   * Otimizações implementadas:
   * - Campos essenciais apenas
   * - Índices de banco obrigatórios
   * - Busca otimizada de prévias
   */
  async getConversations(limit = 100, offset = 0, filters?: any): Promise<ConversationWithContact[]> {
    const startTime = Date.now();

    // Construir condições de filtro
    const whereConditions = [];
    
    // Filtro por período
    if (filters?.period && filters.period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          whereConditions.push(gte(conversations.lastMessageAt, startDate));
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          const yesterdayEnd = new Date(yesterdayStart);
          yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
          whereConditions.push(
            and(
              gte(conversations.lastMessageAt, yesterdayStart),
              lte(conversations.lastMessageAt, yesterdayEnd)
            )
          );
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          whereConditions.push(gte(conversations.lastMessageAt, startDate));
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          whereConditions.push(gte(conversations.lastMessageAt, startDate));
          break;
      }
    }

    // Filtro por equipe - CORREÇÃO DEFINITIVA COM DEBUG
    if (filters?.team) {
      console.log(`🔍 APLICANDO FILTRO EQUIPE NO STORAGE: ${filters.team}`);
      whereConditions.push(eq(conversations.assignedTeamId, filters.team));
    }

    // Filtro por status
    if (filters?.status) {
      whereConditions.push(eq(conversations.status, filters.status));
    }

    // Filtro por agente
    if (filters?.agent && typeof filters.agent === 'number') {
      whereConditions.push(eq(conversations.assignedUserId, filters.agent));
    }

    // 🔒 PROTEGIDO: Query otimizada - buscar apenas campos essenciais
    let query = this.db
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
        
        // Apenas campos essenciais do contato
        contactName: contacts.name,
        contactPhone: contacts.phone,
        contactProfileImage: contacts.profileImageUrl
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id));

    // Aplicar filtros se existirem
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }

    const conversationsData = await query
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // 🚀 BUSCA OTIMIZADA DE PRÉVIAS: Query rápida e específica
    const conversationIds = conversationsData.map(conv => conv.id);
    
    const lastMessages = conversationIds.length > 0 ? await this.db
      .select({
        conversationId: messages.conversationId,
        content: sql`CASE 
          WHEN LENGTH(${messages.content}) > 100 
          THEN SUBSTRING(${messages.content}, 1, 100) || '...'
          ELSE ${messages.content}
        END`.as('content'),
        messageType: messages.messageType,
        isFromContact: messages.isFromContact,
        sentAt: messages.sentAt,
        isInternalNote: messages.isInternalNote
      })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt), desc(messages.id)) : [];

    // Agrupar apenas a última mensagem por conversa
    const messagesByConversation = new Map();
    for (const msg of lastMessages) {
      if (!messagesByConversation.has(msg.conversationId)) {
        messagesByConversation.set(msg.conversationId, msg);
      }
    }

    const endTime = Date.now();
    console.log(`✅ Conversas carregadas em ${endTime - startTime}ms (${conversationsData.length} itens)`);

    // Retornar dados das conversas com prévias otimizadas
    return conversationsData.map(conv => ({
      id: conv.id,
      contactId: conv.contactId,
      channel: conv.channel,
      channelId: null,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
      teamType: conv.assignedTeamId === 6 ? 'suporte' : conv.assignedTeamId === 5 ? 'comercial' : conv.assignedTeamId === 7 ? 'cobranca' : null,
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
      messages: messagesByConversation.has(conv.id) ? 
        [messagesByConversation.get(conv.id)] : 
        [],
      _count: { messages: conv.unreadCount || 0 }
    })) as ConversationWithContact[];
  }

  async getConversationCount(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(conversations);
    
    return result?.count || 0;
  }

  /**
   * Busca conversas diretamente no banco de dados - independente do scroll infinito
   * Para encontrar conversas antigas com 400+ conversas diárias
   */
  async searchConversations(searchTerm: string, limit: number = 200, filters?: any): Promise<ConversationWithContact[]> {
    // Construir condições de filtro
    const whereConditions = [];
    
    // Filtro de busca por termo
    whereConditions.push(
      or(
        ilike(contacts.name, `%${searchTerm}%`),
        ilike(contacts.phone, `%${searchTerm}%`),
        ilike(contacts.email, `%${searchTerm}%`)
      )
    );
    
    // Aplicar filtros adicionais se fornecidos
    if (filters) {
      // Filtro por período
      if (filters.period && filters.period !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            whereConditions.push(gte(conversations.lastMessageAt, startDate));
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
            whereConditions.push(
              and(
                gte(conversations.lastMessageAt, yesterdayStart),
                lte(conversations.lastMessageAt, yesterdayEnd)
              )
            );
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            whereConditions.push(gte(conversations.lastMessageAt, startDate));
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            whereConditions.push(gte(conversations.lastMessageAt, startDate));
            break;
        }
      }

      // Filtro por equipe - CORREÇÃO DEFINITIVA
      if (filters.team) {
        whereConditions.push(eq(conversations.assignedTeamId, filters.team));
      }

      // Filtro por status
      if (filters.status) {
        whereConditions.push(eq(conversations.status, filters.status));
      }

      // Filtro por agente
      if (filters.agent && typeof filters.agent === 'number') {
        whereConditions.push(eq(conversations.assignedUserId, filters.agent));
      }
    }

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
      .where(and(...whereConditions))
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

  /**
   * Mapeia ID da equipe para tipo
   */
  private getTeamTypeById(teamId: number | null): string | null {
    if (!teamId) return null;
    
    const typeMap: Record<number, string> = {
      1: 'comercial',
      2: 'suporte', 
      3: 'cobranca',
      4: 'secretaria',
      5: 'comercial',
      6: 'suporte',
      7: 'cobranca'
    };
    
    return typeMap[teamId] || 'geral';
  }
} 