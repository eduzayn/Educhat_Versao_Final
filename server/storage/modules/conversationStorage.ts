import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, type Conversation, type InsertConversation, type ConversationWithContact } from "@shared/schema";
import { deals } from "@shared/schema";
import { eq, desc, and, count, sql, inArray, or, ilike } from "drizzle-orm";

/**
 * Conversation storage module - manages conversations and assignments
 * Refatorado para usar módulos menores
 */
export class ConversationStorage extends BaseStorage {
  // Basic Operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.createConversation(conversation);
  }

  async getConversation(id: number): Promise<any> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.getConversation(id);
  }

  /**
   * Busca conversa com dados do contato - otimizado para Z-API
   */
  async getConversationWithContact(id: number): Promise<any> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.getConversationWithContact(id);
  }

  async updateConversation(id: number, conversationData: Partial<InsertConversation>): Promise<Conversation> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.updateConversation(id, conversationData);
  }

  async deleteConversation(id: number): Promise<void> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.deleteConversation(id);
  }

  async getConversationByContactId(contactId: number): Promise<Conversation | null> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.getConversationByContactId(contactId);
  }

  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.updateConversationStatus(conversationId, status);
  }

  async updateLastMessage(conversationId: number, messageId: number): Promise<void> {
    const { ConversationBasicOperations } = await import('./conversationBasicOperations');
    const basicOps = new ConversationBasicOperations(this.db);
    return basicOps.updateLastMessage(conversationId, messageId);
  }

  // List Operations
  async getConversations(limit = 100, offset = 0, filters?: any): Promise<ConversationWithContact[]> {
    const { ConversationListOperations } = await import('./conversationListOperations');
    const listOps = new ConversationListOperations(this.db);
    return listOps.getConversations(limit, offset, filters);
  }

  async searchConversations(searchTerm: string, limit?: number, filters?: any): Promise<ConversationWithContact[]> {
    const { ConversationListOperations } = await import('./conversationListOperations');
    const listOps = new ConversationListOperations(this.db);
    return listOps.searchConversations(searchTerm, limit, filters);
  }

  async getConversationCount(): Promise<number> {
    const { ConversationListOperations } = await import('./conversationListOperations');
    const listOps = new ConversationListOperations(this.db);
    return listOps.getConversationCount();
  }

  // Método específico para BI sem limitações de performance
  async getConversationsForBI(days: number): Promise<ConversationWithContact[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
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
      .where(gte(conversations.createdAt, startDate))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsData.map(conv => ({
      ...conv,
      contact: {
        id: conv.contact.id,
        name: conv.contact.name,
        phone: conv.contact.phone,
        email: conv.contact.email,
        profileImageUrl: conv.contact.profileImageUrl,
        avatarCacheUrl: null,
        avatarLastFetch: null,
        avatarFetchAttempts: null,
        hasValidAvatar: null,
        userIdentity: conv.contact.userIdentity,
        location: conv.contact.location,
        age: conv.contact.age,
        isOnline: conv.contact.isOnline,
        lastSeenAt: conv.contact.lastSeenAt,
        canalOrigem: conv.contact.canalOrigem,
        nomeCanal: conv.contact.nomeCanal,
        idCanal: conv.contact.idCanal,
        assignedUserId: conv.contact.assignedUserId,
        createdAt: conv.contact.createdAt,
        updatedAt: conv.contact.updatedAt,
        tags: [],
        deals: []
      },
      channelInfo: undefined,
      messages: [],
      _count: { messages: conv.unreadCount || 0 }
    } as ConversationWithContact));
  }

  // Status Operations
  async markConversationAsRead(conversationId: number): Promise<void> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.markConversationAsRead(conversationId);
  }

  async markConversationAsUnread(conversationId: number): Promise<void> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.markConversationAsUnread(conversationId);
  }

  async incrementUnreadCount(conversationId: number): Promise<void> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.incrementUnreadCount(conversationId);
  }

  async resetUnreadCount(conversationId: number): Promise<void> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.resetUnreadCount(conversationId);
  }

  async getUnreadCount(): Promise<number> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.getUnreadCount();
  }

  async getTotalUnreadCount(): Promise<number> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.getTotalUnreadCount();
  }

  async getUnreadConversationCount(): Promise<number> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.getUnreadConversationCount();
  }

  async recalculateUnreadCounts(): Promise<void> {
    const { ConversationStatusOperations } = await import('./conversationStatusOperations');
    const statusOps = new ConversationStatusOperations(this.db);
    return statusOps.recalculateUnreadCounts();
  }

  // Assignment Operations
  async assignConversation(conversationId: number, userId: number, teamId?: number): Promise<void> {
    const { ConversationAssignmentOperations } = await import('./conversationAssignmentOperations');
    const assignmentOps = new ConversationAssignmentOperations(this.db);
    return assignmentOps.assignConversation(conversationId, userId, teamId);
  }

  async unassignConversation(conversationId: number): Promise<void> {
    const { ConversationAssignmentOperations } = await import('./conversationAssignmentOperations');
    const assignmentOps = new ConversationAssignmentOperations(this.db);
    return assignmentOps.unassignConversation(conversationId);
  }

  async assignConversationToTeam(conversationId: number, teamId: number, method: string = 'manual'): Promise<void> {
    const { ConversationAssignmentOperations } = await import('./conversationAssignmentOperations');
    const assignmentOps = new ConversationAssignmentOperations(this.db);
    return assignmentOps.assignConversationToTeam(conversationId, teamId, method);
  }

  async assignConversationToUser(conversationId: number, userId: number, method: string = 'manual'): Promise<void> {
    const { ConversationAssignmentOperations } = await import('./conversationAssignmentOperations');
    const assignmentOps = new ConversationAssignmentOperations(this.db);
    return assignmentOps.assignConversationToUser(conversationId, userId, method);
  }

  // Tag Operations
  async addConversationTag(conversationId: number, tag: string): Promise<void> {
    const { ConversationTagOperations } = await import('./conversationTagOperations');
    const tagOps = new ConversationTagOperations(this.db);
    return tagOps.addConversationTag(conversationId, tag);
  }

  async removeConversationTag(conversationId: number, tag: string): Promise<void> {
    const { ConversationTagOperations } = await import('./conversationTagOperations');
    const tagOps = new ConversationTagOperations(this.db);
    return tagOps.removeConversationTag(conversationId, tag);
  }

  // Filter Operations
  async getConversationsByChannel(channel: string): Promise<ConversationWithContact[]> {
    const { ConversationFilterOperations } = await import('./conversationFilterOperations');
    const filterOps = new ConversationFilterOperations(this.db);
    return filterOps.getConversationsByChannel(channel);
  }

  async getConversationsByStatus(status: string): Promise<ConversationWithContact[]> {
    const { ConversationFilterOperations } = await import('./conversationFilterOperations');
    const filterOps = new ConversationFilterOperations(this.db);
    return filterOps.getConversationsByStatus(status);
  }

  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    const { ConversationFilterOperations } = await import('./conversationFilterOperations');
    const filterOps = new ConversationFilterOperations(this.db);
    return filterOps.getConversationsByTeam(teamId);
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    const { ConversationFilterOperations } = await import('./conversationFilterOperations');
    const filterOps = new ConversationFilterOperations(this.db);
    return filterOps.getConversationsByUser(userId);
  }

  async getConversationByContactAndChannel(contactId: number, channel: string): Promise<ConversationWithContact | undefined> {
    const { ConversationFilterOperations } = await import('./conversationFilterOperations');
    const filterOps = new ConversationFilterOperations(this.db);
    return filterOps.getConversationByContactAndChannel(contactId, channel);
  }

  // Detail Operations
  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    const { ConversationDetailOperations } = await import('./conversationDetailOperations');
    const detailOps = new ConversationDetailOperations(this.db);
    return detailOps.getConversation(id);
  }
}