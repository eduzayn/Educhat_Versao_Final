import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, messages, type ConversationWithContact } from "@shared/schema";
import { eq, desc, and, inArray, or, ilike, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

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
  async getConversations(limit = 100, offset = 0): Promise<ConversationWithContact[]> {
    const startTime = Date.now();

    // 🔒 PROTEGIDO: Query otimizada - buscar apenas campos essenciais
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
        
        // Apenas campos essenciais do contato
        contactName: contacts.name,
        contactPhone: contacts.phone,
        contactProfileImage: contacts.profileImageUrl
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
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
      .orderBy(desc(messages.sentAt)) : [];

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