// Barrel exports para todos os módulos de storage
export { IStorage } from './interfaces/IStorage';
export { BaseStorage } from './base/BaseStorage';

// Módulos de storage
export { AuthStorage } from './modules/authStorage';
export { ContactStorage } from './modules/contactStorage';
export { ConversationStorage } from './modules/conversationStorage';
export { ChannelStorage } from './modules/channelStorage';
export { DealStorage } from './modules/dealStorage';
export { NotesStorage } from './modules/notesStorage';
export { QuickReplyStorage } from './modules/quickReplyStorage';

// Utilitários
export * from './utils/macrosetorUtils';

/**
 * Classe principal do Storage que implementa a interface IStorage
 * Agrega todos os módulos especializados de storage
 */
import { IStorage } from './interfaces/IStorage';
import { AuthStorage } from './modules/authStorage';
import { ContactStorage } from './modules/contactStorage';
import { ConversationStorage } from './modules/conversationStorage';
import { ChannelStorage } from './modules/channelStorage';
import { DealStorage } from './modules/dealStorage';
import { NotesStorage } from './modules/notesStorage';
import { QuickReplyStorage } from './modules/quickReplyStorage';

export class DatabaseStorage implements IStorage {
  private auth: AuthStorage;
  private contact: ContactStorage;
  private conversation: ConversationStorage;
  private channel: ChannelStorage;
  private deal: DealStorage;
  private notes: NotesStorage;
  private quickReply: QuickReplyStorage;

  constructor() {
    this.auth = new AuthStorage();
    this.contact = new ContactStorage();
    this.conversation = new ConversationStorage();
    this.channel = new ChannelStorage();
    this.deal = new DealStorage();
    this.notes = new NotesStorage();
    this.quickReply = new QuickReplyStorage();
  }

  // ==================== AUTH OPERATIONS ====================
  async getUser(id: string) {
    return this.auth.getUser(id);
  }

  async getUserByEmail(email: string) {
    return this.auth.getUserByEmail(email);
  }

  async createUser(user: any) {
    return this.auth.createUser(user);
  }

  async upsertUser(user: any) {
    return this.auth.upsertUser(user);
  }

  // ==================== CONTACT OPERATIONS ====================
  async getContact(id: number) {
    return this.contact.getContact(id);
  }

  async getContactWithTags(id: number) {
    return this.contact.getContactWithTags(id);
  }

  async createContact(contact: any) {
    return this.contact.createContact(contact);
  }

  async updateContact(id: number, contact: any) {
    return this.contact.updateContact(id, contact);
  }

  async searchContacts(query: string) {
    return this.contact.searchContacts(query);
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean) {
    return this.contact.updateContactOnlineStatus(id, isOnline);
  }

  async findOrCreateContact(userIdentity: string, contactData: any) {
    return this.contact.findOrCreateContact(userIdentity, contactData);
  }

  async getContactInterests(contactId: number) {
    return this.contact.getContactInterests(contactId);
  }

  async getContactTags(contactId: number) {
    return this.contact.getContactTags(contactId);
  }

  async addContactTag(tag: any) {
    return this.contact.addContactTag(tag);
  }

  async removeContactTag(contactId: number, tag: string) {
    return this.contact.removeContactTag(contactId, tag);
  }

  // ==================== CONVERSATION OPERATIONS ====================
  async getConversations(limit?: number, offset?: number) {
    return this.conversation.getConversations(limit, offset);
  }

  async getConversation(id: number) {
    return this.conversation.getConversation(id);
  }

  async createConversation(conversation: any) {
    return this.conversation.createConversation(conversation);
  }

  async updateConversation(id: number, conversation: any) {
    return this.conversation.updateConversation(id, conversation);
  }

  async getConversationByContactAndChannel(contactId: number, channel: string) {
    return this.conversation.getConversationByContactAndChannel(contactId, channel);
  }

  async assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual') {
    return this.conversation.assignConversationToTeam(conversationId, teamId, method);
  }

  async assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual') {
    return this.conversation.assignConversationToUser(conversationId, userId, method);
  }

  async getConversationsByTeam(teamId: number) {
    return this.conversation.getConversationsByTeam(teamId);
  }

  async getConversationsByUser(userId: number) {
    return this.conversation.getConversationsByUser(userId);
  }

  async getTotalUnreadCount() {
    return this.conversation.getTotalUnreadCount();
  }

  // ==================== CHANNEL OPERATIONS ====================
  async getChannels() {
    return this.channel.getChannels();
  }

  async getChannel(id: number) {
    return this.channel.getChannel(id);
  }

  async getChannelsByType(type: string) {
    return this.channel.getChannelsByType(type);
  }

  async createChannel(channel: any) {
    return this.channel.createChannel(channel);
  }

  async updateChannel(id: number, channel: any) {
    return this.channel.updateChannel(id, channel);
  }

  async deleteChannel(id: number) {
    return this.channel.deleteChannel(id);
  }

  async updateChannelConnectionStatus(id: number, status: string, isConnected: boolean) {
    return this.channel.updateChannelConnectionStatus(id, status, isConnected);
  }

  // ==================== DEAL OPERATIONS ====================
  async getDeals() {
    return this.deal.getDeals();
  }

  async getDealsWithPagination(params: any) {
    return this.deal.getDealsWithPagination(params);
  }

  async getDeal(id: number) {
    return this.deal.getDeal(id);
  }

  async getDealById(id: number) {
    return this.deal.getDeal(id);
  }

  async getDealsByContact(contactId: number) {
    return this.deal.getDealsByContact(contactId);
  }

  async getDealsByStage(stage: string) {
    return this.deal.getDealsByStage(stage);
  }

  async createDeal(deal: any) {
    return this.deal.createDeal(deal);
  }

  async updateDeal(id: number, deal: any) {
    return this.deal.updateDeal(id, deal);
  }

  async deleteDeal(id: number) {
    return this.deal.deleteDeal(id);
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string) {
    return this.deal.createAutomaticDeal(contactId, canalOrigem, macrosetor);
  }

  // ==================== NOTES OPERATIONS ====================
  async getContactNotes(contactId: number) {
    return this.notes.getContactNotes(contactId);
  }

  async createContactNote(note: any) {
    return this.notes.createContactNote(note);
  }

  async updateContactNote(id: number, note: any) {
    return this.notes.updateContactNote(id, note);
  }

  async deleteContactNote(id: number) {
    return this.notes.deleteContactNote(id);
  }

  // ==================== QUICK REPLY OPERATIONS ====================
  async getQuickReplies() {
    return this.quickReply.getQuickReplies();
  }

  async getQuickReply(id: number) {
    return this.quickReply.getQuickReply(id);
  }

  async createQuickReply(quickReply: any) {
    return this.quickReply.createQuickReply(quickReply);
  }

  async updateQuickReply(id: number, quickReply: any) {
    return this.quickReply.updateQuickReply(id, quickReply);
  }

  async deleteQuickReply(id: number) {
    return this.quickReply.deleteQuickReply(id);
  }

  async incrementQuickReplyUsage(id: number) {
    return this.quickReply.incrementQuickReplyUsage(id);
  }

  async createQuickReplyTeamShare(share: any) {
    return this.quickReply.createQuickReplyTeamShare(share);
  }

  async createQuickReplyUserShare(share: any) {
    return this.quickReply.createQuickReplyUserShare(share);
  }

  async deleteQuickReplyTeamShares(quickReplyId: number) {
    return this.quickReply.deleteQuickReplyTeamShares(quickReplyId);
  }

  async deleteQuickReplyUserShares(quickReplyId: number) {
    return this.quickReply.deleteQuickReplyUserShares(quickReplyId);
  }

  // ==================== PLACEHOLDER METHODS ====================
  // Métodos que ainda precisam ser implementados nos módulos específicos
  
  async getAllMessages(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getMessages(conversationId: number, limit?: number, offset?: number): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getMessageMedia(messageId: number): Promise<string | null> {
    throw new Error("Método não implementado");
  }

  async createMessage(message: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async markMessageAsRead(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async markMessageAsUnread(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async getMessageByZApiId(zapiMessageId: string): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getMessagesByMetadata(key: string, value: string): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  // System Users, Teams, Roles, etc. também precisam ser implementados
  async getSystemUsers(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getSystemUser(id: number): Promise<any> {
    throw new Error("Método não implementado");
  }

  async createSystemUser(user: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async updateSystemUser(id: number, user: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async deleteSystemUser(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  // Placeholder para outras operações não implementadas ainda
  async getTeams(): Promise<any[]> { throw new Error("Método não implementado"); }
  async getAllTeams(): Promise<any[]> { throw new Error("Método não implementado"); }
  async getTeam(id: number): Promise<any> { throw new Error("Método não implementado"); }
  async createTeam(team: any): Promise<any> { throw new Error("Método não implementado"); }
  async updateTeam(id: number, team: any): Promise<any> { throw new Error("Método não implementado"); }
  async deleteTeam(id: number): Promise<void> { throw new Error("Método não implementado"); }
  async getTeamByMacrosetor(macrosetor: string): Promise<any> { throw new Error("Método não implementado"); }
  async getAvailableUserFromTeam(teamId: number): Promise<any> { throw new Error("Método não implementado"); }
  async getUserTeams(userId: number): Promise<any[]> { throw new Error("Método não implementado"); }
  async addUserToTeam(userTeam: any): Promise<any> { throw new Error("Método não implementado"); }
  async removeUserFromTeam(userId: number, teamId: number): Promise<void> { throw new Error("Método não implementado"); }
  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<any> { throw new Error("Método não implementado"); }
  async getTeamMembers(teamId: number): Promise<any[]> { throw new Error("Método não implementado"); }
  async getTeamStatistics(teamId: number): Promise<any> { throw new Error("Método não implementado"); }
  async getTeamWorkload(teamId: number): Promise<any> { throw new Error("Método não implementado"); }
  async transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number): Promise<any> { throw new Error("Método não implementado"); }

  async getRoles(): Promise<any[]> { throw new Error("Método não implementado"); }
  async getRole(id: number): Promise<any> { throw new Error("Método não implementado"); }
  async createRole(role: any): Promise<any> { throw new Error("Método não implementado"); }
  async updateRole(id: number, role: any): Promise<any> { throw new Error("Método não implementado"); }
  async deleteRole(id: number): Promise<void> { throw new Error("Método não implementado"); }

  async getChannelStatus(channelId: number): Promise<any> { throw new Error("Método não implementado"); }
  async addDealNote(dealId: number, note: string, userId: number): Promise<any> { throw new Error("Método não implementado"); }
  async getDealNotes(dealId: number): Promise<any[]> { throw new Error("Método não implementado"); }
  async getDealStatistics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }

  async getSystemSetting(key: string): Promise<any> { throw new Error("Método não implementado"); }
  async getSystemSettings(category?: string): Promise<any[]> { throw new Error("Método não implementado"); }
  async setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<any> { throw new Error("Método não implementado"); }
  async toggleSystemSetting(key: string): Promise<any> { throw new Error("Método não implementado"); }
  async deleteSystemSetting(key: string): Promise<void> { throw new Error("Método não implementado"); }

  async canUserRespondToOthersConversations(userId: number): Promise<boolean> { throw new Error("Método não implementado"); }
  async canUserRespondToOwnConversations(userId: number): Promise<boolean> { throw new Error("Método não implementado"); }
  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> { throw new Error("Método não implementado"); }

  async getQuickRepliesByCategory(category: string): Promise<any[]> { throw new Error("Método não implementado"); }
  async searchQuickReplies(query: string): Promise<any[]> { throw new Error("Método não implementado"); }
  async getMostUsedQuickReplies(limit?: number): Promise<any[]> { throw new Error("Método não implementado"); }
  async getUserQuickReplies(userId: number): Promise<any[]> { throw new Error("Método não implementado"); }
  async getQuickReplyCategories(): Promise<string[]> { throw new Error("Método não implementado"); }
  async getQuickReplyStatistics(): Promise<any> { throw new Error("Método não implementado"); }

  // Analytics placeholders
  async getConversationAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getMessageAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getDealAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getResponseTimeAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getChannelAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getUserPerformanceAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getTeamPerformanceAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getDealConversionAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async getSalesFunnelAnalytics(filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async generateAnalyticsReport(reportType: string, filters?: any): Promise<any> { throw new Error("Método não implementado"); }
  async sendAnalyticsReport(reportId: string, recipients: string[]): Promise<any> { throw new Error("Método não implementado"); }
  async executeCustomAnalyticsQuery(query: string): Promise<any> { throw new Error("Método não implementado"); }
  async getRealtimeAnalytics(): Promise<any> { throw new Error("Método não implementado"); }
  async getAnalyticsTrends(metric: string, period: string): Promise<any> { throw new Error("Método não implementado"); }
  async getAnalyticsAlerts(): Promise<any> { throw new Error("Método não implementado"); }
  async createAnalyticsAlert(alert: any): Promise<any> { throw new Error("Método não implementado"); }
  async updateAnalyticsAlert(alertId: string, alert: any): Promise<any> { throw new Error("Método não implementado"); }
  async deleteAnalyticsAlert(alertId: string): Promise<any> { throw new Error("Método não implementado"); }
}