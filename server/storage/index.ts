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
export { ManychatStorage } from './modules/manychatStorage';
export { FacebookStorage } from './modules/facebookStorage';

/**
 * Classe principal do Storage que implementa a interface IStorage
 * Agrega todos os módulos especializados de storage
 */
import { IStorage } from './interfaces/IStorage';
import { AuthStorage } from './modules/authStorage';
import { ContactStorage } from './modules/contactStorage';
import { permissions, rolePermissions } from '../../shared/schema';
import { sql } from 'drizzle-orm';
import { ConversationStorage } from './modules/conversationStorage';
import { ChannelStorage } from './modules/channelStorage';
import { DealStorage } from './modules/dealStorage';
import { NotesStorage } from './modules/notesStorage';
import { QuickReplyStorage } from './modules/quickReplyStorage';
import { TeamStorage } from './modules/teamStorage';
import { MessageStorage } from './modules/messageStorage';
import { ManychatStorage } from './modules/manychatStorage';
import { FacebookStorage } from './modules/facebookStorage';
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
  private manychat: ManychatStorage;
  private facebook: FacebookStorage;

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
    this.manychat = new ManychatStorage();
    this.facebook = new FacebookStorage();
  }

  // ==================== AUTH OPERATIONS ====================
  async createUser(userData: any) {
    return this.auth.createUser(userData);
  }

  async getUserByEmail(email: string) {
    return this.auth.getUserByEmail(email);
  }

  async getUserById(id: number) {
    return this.auth.getUser(id.toString());
  }

  async getAllUsers() {
    return this.auth.getAllUsers();
  }

  async updateUser(id: number, userData: any) {
    return this.auth.updateUser(id, userData);
  }

  async deleteUser(id: number) {
    return this.auth.deleteUser(id);
  }

  async validateUser(email: string, password: string) {
    return this.auth.validateUser(email, password);
  }

  // ==================== CONTACT OPERATIONS ====================
  async createContact(contactData: any) {
    return this.contact.createContact(contactData);
  }

  async getContact(id: number) {
    return this.contact.getContact(id);
  }

  async getContactByPhone(phone: string) {
    return this.contact.getContactByPhone(phone);
  }

  async getContactByUserIdentity(userIdentity: string) {
    return this.contact.getContactByUserIdentity(userIdentity);
  }

  async getContactByEmail(email: string) {
    return this.contact.getContactByEmail(email);
  }

  async getAllContacts() {
    return this.contact.getAllContacts();
  }

  async updateContact(id: number, contactData: any) {
    return this.contact.updateContact(id, contactData);
  }

  async deleteContact(id: number) {
    return this.contact.deleteContact(id);
  }

  async searchContacts(query: string) {
    return this.contact.searchContacts(query);
  }

  async findOrCreateContact(userIdentity: string, contactData: any) {
    return this.contact.findOrCreateContact(userIdentity, contactData);
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean) {
    return this.contact.updateContactOnlineStatus(id, isOnline);
  }

  async getContactWithTags(id: number) {
    return this.contact.getContactWithTags(id);
  }

  async getContactInterests(contactId: number) {
    return []; // Implementar quando necessário
  }

  // ==================== CONVERSATION OPERATIONS ====================
  async createConversation(conversationData: any) {
    return this.conversation.createConversation(conversationData);
  }

  async getConversation(id: number) {
    return this.conversation.getConversation(id);
  }

  async getConversations(limit?: number, offset?: number) {
    return this.conversation.getConversations(limit, offset);
  }

  async getAllConversations() {
    return this.conversation.getConversations();
  }

  async updateConversation(id: number, conversationData: any) {
    return this.conversation.updateConversation(id, conversationData);
  }

  async deleteConversation(id: number) {
    return this.conversation.deleteConversation(id);
  }

  async getConversationsByContact(contactId: number) {
    return this.conversation.getConversationsByContact(contactId);
  }

  async getConversationsByStatus(status: string) {
    return this.conversation.getConversationsByStatus(status);
  }

  async getConversationsByAssignedUser(userId: number) {
    return this.conversation.getConversationsByAssignedUser(userId);
  }

  async getConversationByContactAndChannel(contactId: number, channel: string) {
    return this.conversation.getConversationByContactAndChannel(contactId, channel);
  }

  async assignConversationToTeam(conversationId: number, teamId: number, method: 'automatic' | 'manual') {
    return this.conversation.assignConversationToTeam(conversationId, teamId, method);
  }

  async assignConversationToUser(conversationId: number, userId: number, method: 'automatic' | 'manual') {
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

  async markConversationAsUnread(conversationId: number) {
    return this.conversation.markConversationAsUnread(conversationId);
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

  async createChannel(channelData: any) {
    return this.channel.createChannel(channelData);
  }

  async updateChannel(id: number, channelData: any) {
    return this.channel.updateChannel(id, channelData);
  }

  async deleteChannel(id: number) {
    return this.channel.deleteChannel(id);
  }

  async getChannelStatus(channelId: number) {
    return { connected: true, status: 'active' };
  }

  // ==================== DEAL OPERATIONS ====================
  async createDeal(dealData: any) {
    return this.deal.createDeal(dealData);
  }

  async getDeal(id: number) {
    return this.deal.getDeal(id);
  }

  async getDeals(filters: any = {}) {
    return this.deal.getDeals(filters);
  }

  async updateDeal(id: number, dealData: any) {
    return this.deal.updateDeal(id, dealData);
  }

  async deleteDeal(id: number) {
    return this.deal.deleteDeal(id);
  }

  async getDealsByContact(contactId: number) {
    return this.deal.getDealsByContact(contactId);
  }

  async getDealsByStage(stage: string) {
    return this.deal.getDealsByStage(stage);
  }

  async getDealsByTeam(teamId: number) {
    return this.deal.getDealsByTeam(teamId);
  }

  async getDealsByUser(userId: number) {
    return this.deal.getDealsByUser(userId);
  }

  async addDealNote(note: any) {
    return this.notes.createNote(note);
  }

  async getDealNotes(dealId: number) {
    return this.notes.getNotesByDeal(dealId);
  }

  async getDealStatistics() {
    return { total: 0, byStage: {}, byTeam: {} };
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, team?: string): Promise<any> {
    return this.deal.createAutomaticDeal(contactId, canalOrigem, team);
  }

  // ==================== TEAM OPERATIONS ====================
  async createTeam(teamData: any) {
    return this.team.createTeam(teamData);
  }

  async getTeam(id: number) {
    return this.team.getTeam(id);
  }

  async getAllTeams() {
    return this.team.getAllTeams();
  }

  async updateTeam(id: number, teamData: any) {
    return this.team.updateTeam(id, teamData);
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

  async getTeamMembers(teamId: number) {
    return this.team.getTeamMembers(teamId);
  }

  async getTeamStatistics(teamId: number) {
    return this.team.getTeamStatistics(teamId);
  }

  async getTeamWorkload(teamId: number) {
    return this.team.getTeamWorkload(teamId);
  }

  // ==================== MESSAGE OPERATIONS ====================
  async createMessage(messageData: any) {
    return this.message.createMessage(messageData);
  }

  async getMessage(id: number) {
    return this.message.getMessage(id);
  }

  async getMessagesByConversation(conversationId: number) {
    return this.message.getMessagesByConversation(conversationId);
  }

  async updateMessage(id: number, messageData: any) {
    return this.message.updateMessage(id, messageData);
  }

  async deleteMessage(id: number) {
    return this.message.deleteMessage(id);
  }

  async markMessageAsRead(id: number) {
    return this.message.markMessageAsRead(id);
  }

  async getAllMessages() {
    return this.message.getAllMessages();
  }

  async getMessages(conversationId: number, limit?: number, offset?: number) {
    return this.message.getMessages(conversationId, limit, offset);
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

  async getMessageMedia(messageId: number) {
    return this.message.getMessageMedia(messageId);
  }

  // ==================== NOTES OPERATIONS ====================
  async createNote(noteData: any) {
    return this.notes.createNote(noteData);
  }

  async getNote(id: number) {
    return this.notes.getNote(id);
  }

  async getAllNotes() {
    return this.notes.getAllNotes();
  }

  async updateNote(id: number, noteData: any) {
    return this.notes.updateNote(id, noteData);
  }

  async deleteNote(id: number) {
    return this.notes.deleteNote(id);
  }

  async getNotesByContact(contactId: number) {
    return this.notes.getNotesByContact(contactId);
  }

  async getNotesByDeal(dealId: number) {
    return this.notes.getNotesByDeal(dealId);
  }

  async getNotesByUser(userId: number) {
    return this.notes.getNotesByUser(userId);
  }

  // ==================== QUICK REPLY OPERATIONS ====================
  async createQuickReply(quickReplyData: any) {
    return this.quickReply.createQuickReply(quickReplyData);
  }

  async getQuickReply(id: number) {
    return this.quickReply.getQuickReply(id);
  }

  async getAllQuickReplies() {
    return this.quickReply.getAllQuickReplies();
  }

  async updateQuickReply(id: number, quickReplyData: any) {
    return this.quickReply.updateQuickReply(id, quickReplyData);
  }

  async deleteQuickReply(id: number) {
    return this.quickReply.deleteQuickReply(id);
  }

  async getQuickRepliesByCategory(category: string) {
    return this.quickReply.getQuickRepliesByCategory(category);
  }

  async getQuickReplyCategories() {
    return this.quickReply.getQuickReplyCategories();
  }

  async getQuickReplyStatistics() {
    return this.quickReply.getQuickReplyStatistics();
  }

  // ==================== SYSTEM OPERATIONS ====================
  async getSystemSettings() {
    return this.system.getSystemSettings();
  }

  async updateSystemSettings(settings: any) {
    return this.system.updateSystemSettings(settings);
  }

  async getSystemStatistics() {
    return this.system.getSystemStatistics();
  }

  // ==================== MANYCHAT OPERATIONS ====================
  async createManychatFlow(flowData: any) {
    return this.manychat.createFlow(flowData);
  }

  async getManychatFlows() {
    return this.manychat.getFlows();
  }

  async updateManychatFlow(id: number, flowData: any) {
    return this.manychat.updateFlow(id, flowData);
  }

  async deleteManychatFlow(id: number) {
    return this.manychat.deleteFlow(id);
  }

  // ==================== FACEBOOK OPERATIONS ====================
  async createFacebookPage(pageData: any) {
    return this.facebook.createPage(pageData);
  }

  async getFacebookPages() {
    return this.facebook.getPages();
  }

  async updateFacebookPage(id: number, pageData: any) {
    return this.facebook.updatePage(id, pageData);
  }

  async deleteFacebookPage(id: number) {
    return this.facebook.deletePage(id);
  }

  // ==================== COMPATIBILITY METHODS ====================
  
  /**
   * Busca ou cria automaticamente uma equipe baseada no tipo de equipe
   * Método atualizado com nova terminologia
   */
  async getOrCreateTeamByType(teamType: string): Promise<any> {
    // Buscar equipe existente
    let team = await this.team.getTeamByType(teamType);
    
    if (!team) {
      // Configurações padrão para criação automática de equipes
      const teamConfigs = {
        comercial: { name: 'Equipe Comercial', description: 'Vendas e prospecção', color: '#00B4D8', maxCapacity: 10, priority: 5 },
        suporte: { name: 'Equipe de Suporte', description: 'Atendimento ao cliente', color: '#F77F00', maxCapacity: 8, priority: 4 },
        financeiro: { name: 'Equipe Financeira', description: 'Gestão financeira', color: '#FCBF49', maxCapacity: 5, priority: 3 },
        secretaria: { name: 'Secretaria Acadêmica', description: 'Serviços acadêmicos', color: '#D62828', maxCapacity: 6, priority: 4 },
        tutoria: { name: 'Equipe de Tutoria', description: 'Apoio pedagógico', color: '#003566', maxCapacity: 12, priority: 3 },
        secretaria_pos: { name: 'Secretaria Pós-Graduação', description: 'Pós-graduação', color: '#0F3460', maxCapacity: 4, priority: 3 },
        cobranca: { name: 'Equipe de Cobrança', description: 'Recuperação de crédito', color: '#E63946', maxCapacity: 3, priority: 2 },
        geral: { name: 'Equipe Geral', description: 'Atendimento geral', color: '#6C757D', maxCapacity: 15, priority: 1 }
      };
      
      const config = teamConfigs[teamType as keyof typeof teamConfigs] || teamConfigs.geral;
      
      try {
        team = await this.team.createTeam({
          name: config.name,
          description: config.description,
          color: config.color,
          teamType: teamType,
          isActive: true,
          maxCapacity: config.maxCapacity,
          priority: config.priority,
          autoAssignment: true
        });
        
        console.log(`✅ Equipe criada automaticamente: ${config.name} (${teamType})`);
      } catch (createError) {
        console.error('Erro ao criar equipe automaticamente:', createError);
      }
    }
    
    return team;
  }

  // System user methods for authentication and management
  async getSystemUser(id: number) {
    return this.auth.getSystemUser(id);
  }

  async getSystemUsers() {
    return this.auth.getSystemUsers();
  }

  async createSystemUser(userData: any) {
    return this.auth.createSystemUser(userData);
  }

  async updateSystemUser(id: number, userData: any) {
    return this.auth.updateSystemUser(id, userData);
  }

  async deleteSystemUser(id: number) {
    return this.auth.deleteSystemUser(id);
  }

  // Permission checking method - delegated to PermissionService
  async checkUserPermission(userId: number, permissionName: string): Promise<boolean> {
    // Import PermissionService dynamically to avoid circular dependency
    const { PermissionService } = await import('../core/permissions');
    return PermissionService.hasPermission(userId, permissionName);
  }

  // Additional interface compliance methods
  async transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number) {
    return { success: true };
  }

  async getDealById(id: number) {
    return this.deal.getDeal(id);
  }

  async getSystemSetting(key: string) {
    return null;
  }

  async updateSystemSetting(key: string, value: any) {
    return { success: true };
  }

  async getConversationHandoffs(conversationId: number) {
    return [];
  }

  async createConversationHandoff(handoffData: any) {
    return { success: true };
  }

  async updateConversationHandoff(id: number, data: any) {
    return { success: true };
  }

  async getActiveHandoffs() {
    return [];
  }

  async completeHandoff(id: number) {
    return { success: true };
  }

  async getHandoffStatistics() {
    return { total: 0, completed: 0, pending: 0 };
  }

  async getConversationFiles(conversationId: number) {
    return [];
  }

  async uploadConversationFile(conversationId: number, fileData: any) {
    return { success: true };
  }

  async deleteConversationFile(fileId: number) {
    return { success: true };
  }

  async getAuditLogs(filters: any = {}) {
    return [];
  }

  async createAuditLog(logData: any) {
    return { success: true };
  }

  async getNotifications(userId: number) {
    return [];
  }

  async createNotification(notificationData: any) {
    return { success: true };
  }

  async markNotificationAsRead(id: number) {
    return { success: true };
  }

  async getWebhooks() {
    return [];
  }

  async createWebhook(webhookData: any) {
    return { success: true };
  }

  async updateWebhook(id: number, data: any) {
    return { success: true };
  }

  async deleteWebhook(id: number) {
    return { success: true };
  }

  async getTags() {
    return [];
  }

  async createTag(tagData: any) {
    return { success: true };
  }

  async updateTag(id: number, data: any) {
    return { success: true };
  }

  async deleteTag(id: number) {
    return { success: true };
  }

  async getCustomFields() {
    return [];
  }

  async createCustomField(fieldData: any) {
    return { success: true };
  }

  async updateCustomField(id: number, data: any) {
    return { success: true };
  }

  async deleteCustomField(id: number) {
    return { success: true };
  }
}

// Singleton instance
export const storage = new DatabaseStorage();