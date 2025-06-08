import { IStorage } from "./interfaces/IStorage";
import { AuthStorage } from "./modules/authStorage";
import { ContactStorage } from "./modules/contactStorage";
import { ConversationStorage } from "./modules/conversationStorage";
import { MessageStorage } from "./modules/messageStorage";
import { SystemStorage } from "./modules/systemStorage";
import { TeamStorage } from "./modules/teamStorage";

/**
 * Main Storage class that combines all storage modules
 * Maintains full compatibility with existing IStorage interface
 */
export class DatabaseStorage implements IStorage {
  private authStorage = new AuthStorage();
  private contactStorage = new ContactStorage();
  private conversationStorage = new ConversationStorage();
  private messageStorage = new MessageStorage();
  private systemStorage = new SystemStorage();
  private teamStorage = new TeamStorage();

  // Auth operations - delegate to AuthStorage
  async getUser(id: string) {
    return this.authStorage.getUser(id);
  }

  async getUserByEmail(email: string) {
    return this.authStorage.getUserByEmail(email);
  }

  async createUser(user: any) {
    return this.authStorage.createUser(user);
  }

  async upsertUser(user: any) {
    return this.authStorage.upsertUser(user);
  }

  // Contact operations - delegate to ContactStorage
  async getContact(id: number) {
    return this.contactStorage.getContact(id);
  }

  async getContactWithTags(id: number) {
    return this.contactStorage.getContactWithTags(id);
  }

  async createContact(contact: any) {
    const newContact = await this.contactStorage.createContact(contact);
    // Keep automatic deal creation logic - will be implemented in dealStorage later
    try {
      await this.createAutomaticDeal(newContact.id, contact.canalOrigem || undefined);
    } catch (error) {
      console.warn('Failed to create automatic deal:', error);
    }
    return newContact;
  }

  async updateContact(id: number, contact: any) {
    return this.contactStorage.updateContact(id, contact);
  }

  async searchContacts(query: string) {
    return this.contactStorage.searchContacts(query);
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean) {
    return this.contactStorage.updateContactOnlineStatus(id, isOnline);
  }

  async findOrCreateContact(userIdentity: string, contactData: any) {
    return this.contactStorage.findOrCreateContact(userIdentity, contactData);
  }

  async getContactTags(contactId: number) {
    return this.contactStorage.getContactTags(contactId);
  }

  async addContactTag(tag: any) {
    return this.contactStorage.addContactTag(tag);
  }

  async removeContactTag(contactId: number, tag: string) {
    return this.contactStorage.removeContactTag(contactId, tag);
  }

  async getContactInterests(contactId: number) {
    return this.contactStorage.getContactInterests(contactId);
  }

  // Conversation operations - delegate to ConversationStorage
  async getConversations(limit?: number, offset?: number) {
    return this.conversationStorage.getConversations(limit, offset);
  }

  async getConversation(id: number) {
    return this.conversationStorage.getConversation(id);
  }

  async createConversation(conversation: any) {
    return this.conversationStorage.createConversation(conversation);
  }

  async updateConversation(id: number, conversation: any) {
    return this.conversationStorage.updateConversation(id, conversation);
  }

  async getConversationByContactAndChannel(contactId: number, channel: string) {
    return this.conversationStorage.getConversationByContactAndChannel(contactId, channel);
  }

  async getConversationsByTeam(teamId: number) {
    return this.conversationStorage.getConversationsByTeam(teamId);
  }

  async getConversationsByUser(userId: number) {
    return this.conversationStorage.getConversationsByUser(userId);
  }

  async assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual') {
    return this.conversationStorage.assignConversationToTeam(conversationId, teamId, method);
  }

  async assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual') {
    return this.conversationStorage.assignConversationToUser(conversationId, userId, method);
  }

  // Message operations - delegate to MessageStorage
  async getAllMessages() {
    return this.messageStorage.getAllMessages();
  }

  async getMessages(conversationId: number, limit?: number, offset?: number) {
    return this.messageStorage.getMessages(conversationId, limit, offset);
  }

  async getMessageMedia(messageId: number) {
    return this.messageStorage.getMessageMedia(messageId);
  }

  async createMessage(message: any) {
    return this.messageStorage.createMessage(message);
  }

  async markMessageAsRead(id: number) {
    return this.messageStorage.markMessageAsRead(id);
  }

  async markMessageAsUnread(id: number) {
    return this.messageStorage.markMessageAsUnread(id);
  }

  async markMessageAsDelivered(id: number) {
    return this.messageStorage.markMessageAsDelivered(id);
  }

  async markMessageAsDeleted(id: number) {
    return this.messageStorage.markMessageAsDeleted(id);
  }

  async getMessageByZApiId(zapiMessageId: string) {
    return this.messageStorage.getMessageByZApiId(zapiMessageId);
  }

  async getMessagesByMetadata(key: string, value: string) {
    return this.messageStorage.getMessagesByMetadata(key, value);
  }

  // System operations - delegate to SystemStorage
  async getSystemUsers() {
    return this.systemStorage.getSystemUsers();
  }

  async getSystemUser(id: number) {
    return this.systemStorage.getSystemUser(id);
  }

  async createSystemUser(user: any) {
    return this.systemStorage.createSystemUser(user);
  }

  async updateSystemUser(id: number, user: any) {
    return this.systemStorage.updateSystemUser(id, user);
  }

  async deleteSystemUser(id: number) {
    return this.systemStorage.deleteSystemUser(id);
  }

  async getSystemSetting(key: string) {
    return this.systemStorage.getSystemSetting(key);
  }

  async getSystemSettings(category?: string) {
    return this.systemStorage.getSystemSettings(category);
  }

  async setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string) {
    return this.systemStorage.setSystemSetting(key, value, type, description, category);
  }

  async toggleSystemSetting(key: string) {
    return this.systemStorage.toggleSystemSetting(key);
  }

  async deleteSystemSetting(key: string) {
    return this.systemStorage.deleteSystemSetting(key);
  }

  // Team operations - delegate to TeamStorage
  async getTeams() {
    return this.teamStorage.getTeams();
  }

  async getAllTeams() {
    return this.teamStorage.getAllTeams();
  }

  async getTeam(id: number) {
    return this.teamStorage.getTeam(id);
  }

  async createTeam(team: any) {
    return this.teamStorage.createTeam(team);
  }

  async updateTeam(id: number, team: any) {
    return this.teamStorage.updateTeam(id, team);
  }

  async deleteTeam(id: number) {
    return this.teamStorage.deleteTeam(id);
  }

  async getTeamByMacrosetor(macrosetor: string) {
    return this.teamStorage.getTeamByMacrosetor(macrosetor);
  }

  async getAvailableUserFromTeam(teamId: number) {
    return this.teamStorage.getAvailableUserFromTeam(teamId);
  }

  async getUserTeams(userId: number) {
    return this.teamStorage.getUserTeams(userId);
  }

  async addUserToTeam(userTeam: any) {
    return this.teamStorage.addUserToTeam(userTeam);
  }

  async removeUserFromTeam(userId: number, teamId: number) {
    return this.teamStorage.removeUserFromTeam(userId, teamId);
  }

  async getRoles() {
    return this.teamStorage.getRoles();
  }

  async getRole(id: number) {
    return this.teamStorage.getRole(id);
  }

  async createRole(role: any) {
    return this.teamStorage.createRole(role);
  }

  async updateRole(id: number, role: any) {
    return this.teamStorage.updateRole(id, role);
  }

  async deleteRole(id: number) {
    return this.teamStorage.deleteRole(id);
  }

  // Temporary implementations for remaining methods
  // These will be implemented as the corresponding modules are created

  async getChannels(): Promise<any[]> {
    const { db } = await import("../core/db");
    const { desc } = await import("drizzle-orm");
    const { channels } = await import("../../shared/schema");
    return db.select().from(channels).orderBy(desc(channels.createdAt));
  }

  async getChannel(id: number): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { channels } = await import("../../shared/schema");
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async getChannelsByType(type: string): Promise<any[]> {
    const { db } = await import("../core/db");
    const { eq, desc } = await import("drizzle-orm");
    const { channels } = await import("../../shared/schema");
    return db.select().from(channels).where(eq(channels.type, type)).orderBy(desc(channels.createdAt));
  }

  async createChannel(channel: any): Promise<any> {
    const { db } = await import("../core/db");
    const { channels } = await import("../../shared/schema");
    const [newChannel] = await db.insert(channels).values(channel).returning();
    return newChannel;
  }

  async updateChannel(id: number, channelData: any): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { channels } = await import("../../shared/schema");
    const [channel] = await db
      .update(channels)
      .set({ ...channelData, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async deleteChannel(id: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { channels } = await import("../../shared/schema");
    await db.delete(channels).where(eq(channels.id, id));
  }

  async updateChannelConnectionStatus(id: number, status: string, isConnected: boolean): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { channels } = await import("../../shared/schema");
    await db
      .update(channels)
      .set({
        connectionStatus: status,
        isConnected,
        lastConnectionCheck: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(channels.id, id));
  }

  // Quick Reply operations
  async getQuickReplies(): Promise<any[]> {
    const { db } = await import("../core/db");
    const { desc } = await import("drizzle-orm");
    const { quickReplies } = await import("../../shared/schema");
    return await db.select().from(quickReplies).orderBy(desc(quickReplies.createdAt));
  }

  async getQuickReply(id: number): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { quickReplies } = await import("../../shared/schema");
    const [quickReply] = await db.select().from(quickReplies).where(eq(quickReplies.id, id));
    return quickReply;
  }

  async createQuickReply(quickReplyData: any): Promise<any> {
    const { db } = await import("../core/db");
    const { quickReplies } = await import("../../shared/schema");
    const [quickReply] = await db.insert(quickReplies).values(quickReplyData).returning();
    return quickReply;
  }

  async updateQuickReply(id: number, quickReplyData: any): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { quickReplies } = await import("../../shared/schema");
    const [quickReply] = await db
      .update(quickReplies)
      .set({ ...quickReplyData, updatedAt: new Date() })
      .where(eq(quickReplies.id, id))
      .returning();
    return quickReply;
  }

  async deleteQuickReply(id: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { quickReplies } = await import("../../shared/schema");
    await db.delete(quickReplies).where(eq(quickReplies.id, id));
  }

  async incrementQuickReplyUsage(id: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq, sql } = await import("drizzle-orm");
    const { quickReplies } = await import("../../shared/schema");
    await db
      .update(quickReplies)
      .set({ usageCount: sql`COALESCE(${quickReplies.usageCount}, 0) + 1` })
      .where(eq(quickReplies.id, id));
  }

  async createQuickReplyTeamShare(share: any): Promise<any> {
    const { db } = await import("../core/db");
    const { quickReplyTeamShares } = await import("../../shared/schema");
    const [newShare] = await db.insert(quickReplyTeamShares).values(share).returning();
    return newShare;
  }

  async createQuickReplyUserShare(share: any): Promise<any> {
    const { db } = await import("../core/db");
    const { quickReplyShares } = await import("../../shared/schema");
    const [newShare] = await db.insert(quickReplyShares).values(share).returning();
    return newShare;
  }

  async deleteQuickReplyTeamShares(quickReplyId: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { quickReplyTeamShares } = await import("../../shared/schema");
    await db.delete(quickReplyTeamShares).where(eq(quickReplyTeamShares.quickReplyId, quickReplyId));
  }

  async deleteQuickReplyUserShares(quickReplyId: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { quickReplyShares } = await import("../../shared/schema");
    await db.delete(quickReplyShares).where(eq(quickReplyShares.quickReplyId, quickReplyId));
  }

  // Contact Notes operations
  async getContactNotes(contactId: number): Promise<any[]> {
    const { db } = await import("../core/db");
    const { eq, desc } = await import("drizzle-orm");
    const { contactNotes } = await import("../../shared/schema");
    return await db
      .select()
      .from(contactNotes)
      .where(eq(contactNotes.contactId, contactId))
      .orderBy(desc(contactNotes.createdAt));
  }

  async createContactNote(note: any): Promise<any> {
    const { db } = await import("../core/db");
    const { contactNotes } = await import("../../shared/schema");
    const [newNote] = await db.insert(contactNotes).values(note).returning();
    return newNote;
  }

  async updateContactNote(id: number, note: any): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { contactNotes } = await import("../../shared/schema");
    const [updatedNote] = await db
      .update(contactNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(contactNotes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteContactNote(id: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { contactNotes } = await import("../../shared/schema");
    await db.delete(contactNotes).where(eq(contactNotes.id, id));
  }

  // Deal operations
  async getDeals(): Promise<any[]> {
    const { db } = await import("../core/db");
    const { eq, desc } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");
    return await db
      .select()
      .from(deals)
      .where(eq(deals.isActive, true))
      .orderBy(desc(deals.createdAt));
  }

  async getDealsWithPagination(params: any): Promise<any> {
    const { db } = await import("../core/db");
    const { eq, desc, and, sql } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");

    const { page, limit, macrosetor, stage, search } = params;
    const offset = (page - 1) * limit;

    const conditions = [eq(deals.isActive, true)];
    
    if (macrosetor) {
      conditions.push(eq(deals.macrosetor, macrosetor));
    }
    
    if (stage) {
      conditions.push(eq(deals.stage, stage));
    }
    
    if (search) {
      conditions.push(
        sql`(${deals.name} ILIKE ${'%' + search + '%'} OR ${deals.notes} ILIKE ${'%' + search + '%'})`
      );
    }

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(...conditions));
    
    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    const dealsResult = await db
      .select()
      .from(deals)
      .where(and(...conditions))
      .orderBy(desc(deals.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      deals: dealsResult,
      total,
      totalPages,
      currentPage: page
    };
  }

  async getDeal(id: number): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getDealsByContact(contactId: number): Promise<any[]> {
    const { db } = await import("../core/db");
    const { eq, desc, and } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");
    return await db
      .select()
      .from(deals)
      .where(and(eq(deals.contactId, contactId), eq(deals.isActive, true)))
      .orderBy(desc(deals.createdAt));
  }

  async getDealsByStage(stage: string): Promise<any[]> {
    const { db } = await import("../core/db");
    const { eq, desc, and } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");
    return await db
      .select()
      .from(deals)
      .where(and(eq(deals.stage, stage), eq(deals.isActive, true)))
      .orderBy(desc(deals.createdAt));
  }

  async createDeal(deal: any): Promise<any> {
    const { db } = await import("../core/db");
    const { deals } = await import("../../shared/schema");
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: number, deal: any): Promise<any> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<void> {
    const { db } = await import("../core/db");
    const { eq } = await import("drizzle-orm");
    const { deals } = await import("../../shared/schema");
    await db.update(deals).set({ isActive: false }).where(eq(deals.id, id));
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string): Promise<any> {
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const dealData = {
      name: `${contact.name || 'Contato'} - Novo Lead`,
      contactId: contactId,
      macrosetor: macrosetor || 'comercial',
      stage: 'prospecting',
      value: 100000,
      probability: 20,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'unknown',
      notes: `Deal criado automaticamente para ${contact.name || 'Contato'} via ${canalOrigem || 'sistema'}`,
      isActive: true
    };

    return await this.createDeal(dealData);
  }

  // Statistics operations
  async getTotalUnreadCount(): Promise<number> {
    const { db } = await import("../core/db");
    const { sql } = await import("drizzle-orm");
    const { conversations } = await import("../../shared/schema");
    const result = await db
      .select({ total: sql<number>`sum(${conversations.unreadCount})` })
      .from(conversations);
    
    return result[0]?.total || 0;
  }

  // Permission operations - simplified for now
  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    return true;
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    return true;
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    return true;
  }
}

// Export the storage instance
export const storage = new DatabaseStorage();

// Also export the interface and modules for testing and future use
export type { IStorage } from "./interfaces/IStorage";
export { AuthStorage } from "./modules/authStorage";
export { ContactStorage } from "./modules/contactStorage";
export { ConversationStorage } from "./modules/conversationStorage";
export { MessageStorage } from "./modules/messageStorage";
export { SystemStorage } from "./modules/systemStorage";
export { TeamStorage } from "./modules/teamStorage";