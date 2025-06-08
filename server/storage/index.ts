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
    // Keep automatic deal creation logic
    const newContact = await this.contactStorage.createContact(contact);
    await this.createAutomaticDeal(newContact.id, contact.canalOrigem || undefined);
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

  // Placeholder methods for remaining functionality (to be implemented in future modules)
  async getChannels(): Promise<any[]> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  async getChannel(id: number): Promise<any> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  async getChannelsByType(type: string): Promise<any[]> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  async createChannel(channel: any): Promise<any> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  async updateChannel(id: number, channel: any): Promise<any> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteChannel(id: number): Promise<void> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  async updateChannelConnectionStatus(id: number, status: string, isConnected: boolean): Promise<void> {
    // TODO: Implement in channelStorage module
    throw new Error('Method not yet implemented in modular storage');
  }

  // Quick Reply operations - TODO: Implement in quickReplyStorage module
  async getQuickReplies(): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getQuickReply(id: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createQuickReply(quickReply: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async updateQuickReply(id: number, quickReply: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteQuickReply(id: number): Promise<void> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async incrementQuickReplyUsage(id: number): Promise<void> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createQuickReplyTeamShare(share: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createQuickReplyUserShare(share: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteQuickReplyTeamShares(quickReplyId: number): Promise<void> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteQuickReplyUserShares(quickReplyId: number): Promise<void> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Contact Notes operations - TODO: Implement in notesStorage module
  async getContactNotes(contactId: number): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createContactNote(note: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async updateContactNote(id: number, note: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteContactNote(id: number): Promise<void> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Deal operations - TODO: Implement in dealStorage module
  async getDeals(): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealsWithPagination(params: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDeal(id: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealsByContact(contactId: number): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealsByStage(stage: string): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createDeal(deal: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async updateDeal(id: number, deal: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteDeal(id: number): Promise<void> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Statistics operations
  async getTotalUnreadCount(): Promise<number> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Permission operations - TODO: Implement in permissionStorage module
  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Extended operations - TODO: Implement in respective modules
  async getDealById(id: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async addDealNote(dealId: number, note: string, userId: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealNotes(dealId: number): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealStatistics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Analytics operations - TODO: Implement in analyticsStorage module
  async getConversationAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getMessageAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getResponseTimeAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getChannelAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getUserPerformanceAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getTeamPerformanceAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getDealConversionAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getSalesFunnelAnalytics(filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async generateAnalyticsReport(reportType: string, filters?: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async sendAnalyticsReport(reportId: string, recipients: string[]): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async executeCustomAnalyticsQuery(query: string): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getRealtimeAnalytics(): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getAnalyticsTrends(metric: string, period: string): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getAnalyticsAlerts(): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async createAnalyticsAlert(alert: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async updateAnalyticsAlert(alertId: string, alert: any): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async deleteAnalyticsAlert(alertId: string): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Team extended operations
  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getTeamStatistics(teamId: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getTeamWorkload(teamId: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Quick reply extended operations
  async getQuickRepliesByCategory(category: string): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async searchQuickReplies(query: string): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getMostUsedQuickReplies(limit?: number): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getUserQuickReplies(userId: number): Promise<any[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getQuickReplyCategories(): Promise<string[]> {
    throw new Error('Method not yet implemented in modular storage');
  }

  async getQuickReplyStatistics(): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }

  // Channel status operations
  async getChannelStatus(channelId: number): Promise<any> {
    throw new Error('Method not yet implemented in modular storage');
  }
}

// Export the storage instance
export const storage = new DatabaseStorage();

// Also export the interface and modules for testing and future use
export { IStorage } from "./interfaces/IStorage";
export { AuthStorage } from "./modules/authStorage";
export { ContactStorage } from "./modules/contactStorage";
export { ConversationStorage } from "./modules/conversationStorage";
export { MessageStorage } from "./modules/messageStorage";
export { SystemStorage } from "./modules/systemStorage";
export { TeamStorage } from "./modules/teamStorage";