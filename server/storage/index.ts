// Barrel exports para todos os módulos de storage
export type { IStorage } from './interfaces/IStorage';
export { BaseStorage } from './base/BaseStorage';

// Módulos de storage
export { AuthStorage } from './modules/authStorage';
export { ContactStorage } from './modules/contactStorage';
export { ConversationStorage } from './modules/conversationStorage';
export { ChannelStorage } from './modules/channelStorage';
export { DealStorage } from './modules/dealStorage';
export { NotesStorage } from './modules/notesStorage';
export { QuickReplyStorage } from './modules/quickReplyStorage';
export { TeamStorage } from './modules/teamStorage';
export { MessageStorage } from './modules/messageStorage';

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
import { TeamStorage } from './modules/teamStorage';
import { MessageStorage } from './modules/messageStorage';
import { SystemStorage } from './modules/systemStorage';

export class DatabaseStorage implements IStorage {
  private auth: AuthStorage;
  private contact: ContactStorage;
  private conversation: ConversationStorage;
  private channel: ChannelStorage;
  private deal: DealStorage;
  private notes: NotesStorage;
  private quickReply: QuickReplyStorage;
  private team: TeamStorage;
  private message: MessageStorage;
  private system: SystemStorage;

  constructor() {
    this.auth = new AuthStorage();
    this.contact = new ContactStorage();
    this.conversation = new ConversationStorage();
    this.channel = new ChannelStorage();
    this.deal = new DealStorage();
    this.notes = new NotesStorage();
    this.quickReply = new QuickReplyStorage();
    this.team = new TeamStorage();
    this.message = new MessageStorage();
    this.system = new SystemStorage();
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

  async getSystemUsers() {
    return this.auth.getSystemUsers();
  }

  async getSystemUser(id: number) {
    return this.auth.getSystemUser(id);
  }

  async createSystemUser(user: any) {
    return this.auth.createSystemUser(user);
  }

  async updateSystemUser(id: number, user: any) {
    return this.auth.updateSystemUser(id, user);
  }

  async deleteSystemUser(id: number) {
    return this.auth.deleteSystemUser(id);
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

  async markConversationAsRead(conversationId: number) {
    return this.conversation.markConversationAsRead(conversationId);
  }

  // ==================== CHANNEL OPERATIONS ====================
  async getChannels() {
    return this.channel.getChannels();
  }

  async getChannel(id: number) {
    return this.channel.getChannel(id);
  }

  async getChannelById(id: number) {
    return this.channel.getChannel(id);
  }

  async getAllChannels() {
    return this.channel.getChannels();
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

  async updateChannelConnectionStatus(id: number, connectionStatus: string, isConnected: boolean) {
    return this.channel.updateChannelConnectionStatus(id, connectionStatus, isConnected);
  }

  // ==================== MESSAGE OPERATIONS ====================
  async getMessages(conversationId: number, limit?: number, offset?: number) {
    return this.message.getMessages(conversationId, limit, offset);
  }

  async getMessage(id: number) {
    return this.message.getMessage(id);
  }

  async getMessageMedia(messageId: number) {
    return this.message.getMessageMedia(messageId);
  }

  async createMessage(message: any) {
    return this.message.createMessage(message);
  }

  async markMessageAsRead(id: number) {
    return this.message.markMessageAsRead(id);
  }

  async markMessageAsUnread(id: number) {
    return this.message.markMessageAsUnread(id);
  }

  async markMessageAsDelivered(id: number) {
    return this.message.markMessageAsDelivered(id);
  }

  async markMessageAsDeleted(id: number) {
    return this.message.markMessageAsDeleted(id);
  }

  async getMessageByZApiId(zapiMessageId: string) {
    return this.message.getMessageByZApiId(zapiMessageId);
  }

  async getMessagesByMetadata(key: string, value: string) {
    return this.message.getMessagesByMetadata(key, value);
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string) {
    return this.message.updateMessageZApiStatus(whatsappMessageId, status);
  }

  // ==================== DEAL OPERATIONS ====================
  async getDeals() {
    return this.deal.getDeals();
  }

  async getDealsWithPagination(params: { page: number; limit: number; macrosetor?: string; stage?: string; search?: string; }) {
    return this.deal.getDealsWithPagination(params);
  }

  async getDeal(id: number) {
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

  // ==================== TEAM OPERATIONS ====================
  async getTeams() {
    return this.team.getTeams();
  }

  async getTeam(id: number) {
    return this.team.getTeam(id);
  }

  async createTeam(team: any) {
    return this.team.createTeam(team);
  }

  async updateTeam(id: number, team: any) {
    return this.team.updateTeam(id, team);
  }

  async deleteTeam(id: number) {
    return this.team.deleteTeam(id);
  }

  async getTeamByMacrosetor(macrosetor: string) {
    return this.team.getTeamByMacrosetor(macrosetor);
  }

  async getAvailableUserFromTeam(teamId: number) {
    return this.team.getAvailableUserFromTeam(teamId);
  }

  async getUserTeams(userId: number) {
    return this.team.getUserTeams(userId);
  }

  async addUserToTeam(userTeam: { teamId: number; userId: number; isActive?: boolean | null; role?: string | null; }) {
    return this.team.addUserToTeam(userTeam);
  }

  async removeUserFromTeam(userId: number, teamId: number) {
    return this.team.removeUserFromTeam(userId, teamId);
  }

  async updateTeamMemberRole(userId: number, teamId: number, role: string) {
    return this.team.updateTeamMemberRole(userId, teamId, role);
  }

  async getTeamMembers(teamId: number) {
    return this.team.getTeamMembers(teamId);
  }

  async getTeamStatistics(teamId: number) {
    return this.team.getTeamStatistics(teamId);
  }

  // ==================== PERMISSIONS (padrão TRUE, customizar depois) ==========
  async canUserRespondToOthersConversations() {
    return true;
  }

  async canUserRespondToOwnConversations() {
    return true;
  }

  async canUserRespondToConversation() {
    return true;
  }

  // ==================== PLACEHOLDER METHODS ====================
  async getAllMessages(): Promise<any[]> {
    throw new Error("Método getAllMessages não implementado");
  }

  async getRole(): Promise<any> {
    throw new Error("Método getRole não implementado");
  }

  async getRoles(): Promise<any[]> {
    return this.system.getRoles();
  }

  async createRole(): Promise<any> {
    throw new Error("Método createRole não implementado");
  }

  async updateRole(): Promise<any> {
    throw new Error("Método updateRole não implementado");
  }

  async deleteRole(): Promise<any> {
    throw new Error("Método deleteRole não implementado");
  }

  // Placeholder methods for missing interface requirements
  async getQuickRepliesByCategory(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async searchQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getMostUsedQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getUserQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getSharedQuickReplies(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getQuickRepliesByUser(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getQuickRepliesByTeam(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  // ==================== MACROSETOR DETECTION ====================
  detectMacrosetor(content: string, channel?: string): string | null {
    try {
      // Import usando caminho relativo correto
      const { detectMacrosetor } = require('./utils/macrosetorUtils');
      const detection = detectMacrosetor(content);
      return detection ? detection.macrosetor : 'geral';
    } catch (error) {
      // Fallback simplificado se o import falhar
      const contentLower = content.toLowerCase();
      
      if (contentLower.includes('suporte') || contentLower.includes('problema') || contentLower.includes('ajuda')) {
        return 'suporte';
      }
      if (contentLower.includes('comercial') || contentLower.includes('venda') || contentLower.includes('curso')) {
        return 'comercial';
      }
      if (contentLower.includes('cobranca') || contentLower.includes('pagamento') || contentLower.includes('boleto')) {
        return 'cobranca';
      }
      if (contentLower.includes('tutoria') || contentLower.includes('professor') || contentLower.includes('aula')) {
        return 'tutoria';
      }
      if (contentLower.includes('secretaria') || contentLower.includes('documento') || contentLower.includes('certificado')) {
        return 'secretaria';
      }
      
      return 'geral';
    }
  }
}