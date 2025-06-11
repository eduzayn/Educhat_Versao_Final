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
import {
  type User,
  type UpsertUser,
  type Contact,
  type InsertContact,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ContactTag,
  type InsertContactTag,
  type QuickReply,
  type InsertQuickReply,
  type QuickReplyTeamShare,
  type InsertQuickReplyTeamShare,
  type QuickReplyShare,
  type InsertQuickReplyShare,
  type SystemUser,
  type InsertSystemUser,
  type Team,
  type InsertTeam,
  type Role,
  type InsertRole,
  type Channel,
  type InsertChannel,
  type ContactNote,
  type InsertContactNote,
  type Deal,
  type InsertDeal,
  type UserTeam,
  type InsertUserTeam,
  type ConversationWithContact,
  type ContactWithTags,
  type SystemSetting,
  type InsertSystemSetting,
} from "../../shared/schema";

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
  async getUser(id: string): Promise<User | undefined> {
    return this.auth.getUser(id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return this.auth.upsertUser(user);
  }

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

  // ==================== CONTACT TAG OPERATIONS ====================
  async getContactTags(contactId: number): Promise<ContactTag[]> {
    return this.contact.getContactTags(contactId);
  }

  async addContactTag(tag: InsertContactTag): Promise<ContactTag> {
    return this.contact.addContactTag(tag);
  }

  async removeContactTag(contactId: number, tag: string): Promise<void> {
    return this.contact.removeContactTag(contactId, tag);
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
  async getQuickReplies(): Promise<QuickReply[]> {
    return this.quickReply.getQuickReplies();
  }

  async getQuickReply(id: number): Promise<QuickReply | undefined> {
    return this.quickReply.getQuickReply(id);
  }

  async createQuickReply(quickReply: InsertQuickReply): Promise<QuickReply> {
    return this.quickReply.createQuickReply(quickReply);
  }

  async updateQuickReply(id: number, quickReply: Partial<InsertQuickReply>): Promise<QuickReply> {
    return this.quickReply.updateQuickReply(id, quickReply);
  }

  async deleteQuickReply(id: number): Promise<void> {
    return this.quickReply.deleteQuickReply(id);
  }

  async incrementQuickReplyUsage(id: number): Promise<void> {
    return this.quickReply.incrementQuickReplyUsage(id);
  }

  async getQuickRepliesByCategory(category: string): Promise<QuickReply[]> {
    return this.quickReply.getQuickRepliesByCategory(category);
  }

  async searchQuickReplies(query: string): Promise<QuickReply[]> {
    return this.quickReply.searchQuickReplies(query);
  }

  async getMostUsedQuickReplies(limit?: number): Promise<QuickReply[]> {
    return this.quickReply.getMostUsedQuickReplies(limit);
  }

  async getUserQuickReplies(userId: number): Promise<QuickReply[]> {
    return this.quickReply.getUserQuickReplies(userId);
  }

  async getQuickReplyCategories(): Promise<string[]> {
    return this.quickReply.getQuickReplyCategories();
  }

  async getQuickReplyStatistics(): Promise<any> {
    return this.quickReply.getQuickReplyStatistics();
  }

  // ==================== QUICK REPLY SHARING OPERATIONS ====================
  async createQuickReplyTeamShare(share: InsertQuickReplyTeamShare): Promise<QuickReplyTeamShare> {
    return this.quickReply.createQuickReplyTeamShare(share);
  }

  async createQuickReplyUserShare(share: InsertQuickReplyShare): Promise<QuickReplyShare> {
    return this.quickReply.createQuickReplyUserShare(share);
  }

  async deleteQuickReplyTeamShares(quickReplyId: number): Promise<void> {
    return this.quickReply.deleteQuickReplyTeamShares(quickReplyId);
  }

  async deleteQuickReplyUserShares(quickReplyId: number): Promise<void> {
    return this.quickReply.deleteQuickReplyUserShares(quickReplyId);
  }



  // ==================== SYSTEM USER OPERATIONS ====================
  async getSystemUsers(): Promise<SystemUser[]> {
    return this.auth.getSystemUsers();
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    return this.auth.getSystemUser(id);
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    return this.auth.createSystemUser(user);
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser> {
    return this.auth.updateSystemUser(id, user);
  }

  async deleteSystemUser(id: number): Promise<void> {
    return this.auth.deleteSystemUser(id);
  }

  // ==================== TEAM OPERATIONS ====================
  async getTeams(): Promise<Team[]> {
    return this.team.getTeams();
  }

  async getAllTeams(): Promise<Team[]> {
    return this.team.getTeams();
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.team.getTeam(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    return this.team.createTeam(team);
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    return this.team.updateTeam(id, team);
  }

  async deleteTeam(id: number): Promise<void> {
    return this.team.deleteTeam(id);
  }

  async getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined> {
    return this.team.getTeamByTeamType(macrosetor);
  }

  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    return this.team.getAvailableUserFromTeam(teamId);
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    return this.team.getUserTeams(userId);
  }

  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    return this.team.addUserToTeam(userTeam);
  }

  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    return this.team.removeUserFromTeam(userId, teamId);
  }

  async updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<any> {
    return this.team.updateTeamMemberRole(userId, teamId, role);
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    return this.team.getTeamMembers(teamId);
  }

  async getTeamStatistics(teamId: number): Promise<any> {
    return this.team.getTeamStatistics(teamId);
  }

  async getTeamWorkload(teamId: number): Promise<any> {
    return this.team.getTeamWorkload(teamId);
  }

  async transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number): Promise<any> {
    return this.team.transferConversationBetweenTeams(conversationId, fromTeamId, toTeamId);
  }

  // ==================== ROLE OPERATIONS ====================
  async getRoles(): Promise<Role[]> {
    return this.auth.getRoles();
  }

  async getRole(id: number): Promise<Role | undefined> {
    return this.auth.getRole(id);
  }

  async createRole(role: InsertRole): Promise<Role> {
    return this.auth.createRole(role);
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> {
    return this.auth.updateRole(id, role);
  }

  async deleteRole(id: number): Promise<void> {
    return this.auth.deleteRole(id);
  }

  async checkUserPermission(userId: number, permissionName: string): Promise<boolean> {
    return this.auth.checkUserPermission(userId, permissionName);
  }

  // ==================== CHANNEL OPERATIONS ====================
  async getChannels(): Promise<Channel[]> {
    return this.channel.getChannels();
  }

  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channel.getChannel(id);
  }

  async getChannelsByType(type: string): Promise<Channel[]> {
    return this.channel.getChannelsByType(type);
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    return this.channel.createChannel(channel);
  }

  async updateChannel(id: number, channel: Partial<InsertChannel>): Promise<Channel> {
    return this.channel.updateChannel(id, channel);
  }

  async deleteChannel(id: number): Promise<void> {
    return this.channel.deleteChannel(id);
  }

  async updateChannelConnectionStatus(id: number, status: string, isConnected: boolean): Promise<void> {
    return this.channel.updateChannelConnectionStatus(id, status, isConnected);
  }

  async getChannelStatus(channelId: number): Promise<any> {
    return this.channel.getChannelStatus(channelId);
  }

  // ==================== CONTACT NOTES OPERATIONS ====================
  async getContactNotes(contactId: number): Promise<ContactNote[]> {
    return this.notes.getContactNotes(contactId);
  }

  async createContactNote(note: InsertContactNote): Promise<ContactNote> {
    return this.notes.createContactNote(note);
  }

  async updateContactNote(id: number, note: Partial<InsertContactNote>): Promise<ContactNote> {
    return this.notes.updateContactNote(id, note);
  }

  async deleteContactNote(id: number): Promise<void> {
    return this.notes.deleteContactNote(id);
  }

  // ==================== DEAL OPERATIONS ====================
  async getDealsWithPagination(params: {
    page: number;
    limit: number;
    team?: string;
    stage?: string;
    search?: string;
  }): Promise<{ deals: Deal[]; total: number; totalPages: number; currentPage: number }> {
    return this.deal.getDealsWithPagination(params);
  }

  async getDealById(id: number): Promise<Deal | undefined> {
    return this.deal.getDeal(id);
  }

  async addDealNote(dealId: number, note: string, userId: number): Promise<any> {
    return this.notes.addDealNote(dealId, note, userId);
  }

  async getDealNotes(dealId: number): Promise<any[]> {
    return this.notes.getDealNotes(dealId);
  }

  async getDealStatistics(filters?: any): Promise<any> {
    return this.deal.getDealStatistics(filters);
  }

  // ==================== SYSTEM SETTINGS OPERATIONS ====================
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    return this.system.getSystemSetting(key);
  }

  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    return this.system.getSystemSettings(category);
  }

  async setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<SystemSetting> {
    return this.system.setSystemSetting(key, value, type, description, category);
  }

  async toggleSystemSetting(key: string): Promise<SystemSetting> {
    return this.system.toggleSystemSetting(key);
  }

  async deleteSystemSetting(key: string): Promise<void> {
    return this.system.deleteSystemSetting(key);
  }

  // ==================== PERMISSION OPERATIONS ====================
  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    return this.auth.canUserRespondToOthersConversations(userId);
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    return this.auth.canUserRespondToOwnConversations(userId);
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    return this.auth.canUserRespondToConversation(userId, conversationId);
  }

  // ==================== TEAM DETECTION OPERATIONS ====================
  async getTeamDetections(): Promise<any[]> {
    return this.team.getTeamDetections();
  }

  async getTeamDetection(id: number): Promise<any> {
    return this.team.getTeamDetection(id);
  }

  async createTeamDetection(data: any): Promise<any> {
    return this.team.createTeamDetection(data);
  }

  async updateTeamDetection(id: number, data: any): Promise<any> {
    return this.team.updateTeamDetection(id, data);
  }

  async deleteTeamDetection(id: number): Promise<void> {
    return this.team.deleteTeamDetection(id);
  }

  async getTeamDetectionKeywords(teamDetectionId: number): Promise<any[]> {
    return this.team.getTeamDetectionKeywords(teamDetectionId);
  }

  async createTeamDetectionKeyword(teamDetectionId: number, data: any): Promise<any> {
    return this.team.createTeamDetectionKeyword(teamDetectionId, data);
  }

  async deleteTeamDetectionKeyword(teamDetectionId: number, keywordId: number): Promise<void> {
    return this.team.deleteTeamDetectionKeyword(teamDetectionId, keywordId);
  }

  async testTeamDetection(text: string): Promise<any> {
    return this.team.testTeamDetection(text);
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

  // ==================== ADDITIONAL INTERFACE COMPLIANCE ====================
  async getConversationHandoffs(conversationId: number) {
    return this.conversation.getConversationHandoffs(conversationId);
  }

  async createConversationHandoff(handoffData: any) {
    return this.conversation.createConversationHandoff(handoffData);
  }

  async updateConversationHandoff(id: number, data: any) {
    return this.conversation.updateConversationHandoff(id, data);
  }

  async getActiveHandoffs() {
    return this.conversation.getActiveHandoffs();
  }

  async completeHandoff(id: number) {
    return this.conversation.completeHandoff(id);
  }

  async getHandoffStatistics() {
    return this.conversation.getHandoffStatistics();
  }

  async getConversationFiles(conversationId: number) {
    return this.conversation.getConversationFiles(conversationId);
  }

  async uploadConversationFile(conversationId: number, fileData: any) {
    return this.conversation.uploadConversationFile(conversationId, fileData);
  }

  async deleteConversationFile(fileId: number) {
    return this.conversation.deleteConversationFile(fileId);
  }

  async getAuditLogs(filters: any = {}) {
    return this.system.getAuditLogs(filters);
  }

  async createAuditLog(logData: any) {
    return this.system.createAuditLog(logData);
  }

  async getNotifications(userId: number) {
    return this.system.getNotifications(userId);
  }

  async createNotification(notificationData: any) {
    return this.system.createNotification(notificationData);
  }

  async markNotificationAsRead(id: number) {
    return this.system.markNotificationAsRead(id);
  }

  async getWebhooks() {
    return this.system.getWebhooks();
  }

  async createWebhook(webhookData: any) {
    return this.system.createWebhook(webhookData);
  }

  async updateWebhook(id: number, data: any) {
    return this.system.updateWebhook(id, data);
  }

  async deleteWebhook(id: number) {
    return this.system.deleteWebhook(id);
  }

  async getTags() {
    return this.system.getTags();
  }

  async createTag(tagData: any) {
    return this.system.createTag(tagData);
  }

  async updateTag(id: number, data: any) {
    return this.system.updateTag(id, data);
  }

  async deleteTag(id: number) {
    return this.system.deleteTag(id);
  }

  async getCustomFields() {
    return this.system.getCustomFields();
  }

  async createCustomField(fieldData: any) {
    return this.system.createCustomField(fieldData);
  }

  async updateCustomField(id: number, data: any) {
    return this.system.updateCustomField(id, data);
  }

  async deleteCustomField(id: number) {
    return this.system.deleteCustomField(id);
  }

  // ==================== ANALYTICS OPERATIONS ====================
  async getConversationAnalytics(filters: any = {}) {
    return this.conversation.getConversationAnalytics(filters);
  }

  async getMessageAnalytics(filters: any = {}) {
    return this.message.getMessageAnalytics(filters);
  }

  async getDealAnalytics(filters: any = {}) {
    return this.deal.getDealAnalytics(filters);
  }

  async getResponseTimeAnalytics(filters: any = {}) {
    return this.conversation.getResponseTimeAnalytics(filters);
  }

  async getTeamPerformanceAnalytics(teamId: number, filters: any = {}) {
    return this.team.getTeamPerformanceAnalytics(teamId, filters);
  }

  async getUserPerformanceAnalytics(userId: number, filters: any = {}) {
    return this.auth.getUserPerformanceAnalytics(userId, filters);
  }

  async getChannelAnalytics(channelId: number, filters: any = {}) {
    return this.channel.getChannelAnalytics(channelId, filters);
  }

  async getIntegrationAnalytics(integrationType: string, filters: any = {}) {
    return this.system.getIntegrationAnalytics(integrationType, filters);
  }

  async getDealConversionAnalytics(filters: any = {}) {
    return this.deal.getDealConversionAnalytics(filters);
  }

  async getSalesFunnelAnalytics(funnelId?: number, filters: any = {}) {
    return this.deal.getSalesFunnelAnalytics(funnelId, filters);
  }

  async generateAnalyticsReport(reportType: string, filters: any = {}) {
    return this.system.generateAnalyticsReport(reportType, filters);
  }

  async sendAnalyticsReport(reportId: string, recipients: string[]) {
    return this.system.sendAnalyticsReport(reportId, recipients);
  }

  async exportAnalyticsData(exportType: string, filters: any = {}) {
    return this.system.exportAnalyticsData(exportType, filters);
  }

  async scheduleAnalyticsReport(schedule: any) {
    return this.system.scheduleAnalyticsReport(schedule);
  }

  async getScheduledReports(userId?: number) {
    return this.system.getScheduledReports(userId);
  }

  async deleteScheduledReport(reportId: string) {
    return this.system.deleteScheduledReport(reportId);
  }

  async updateSystemSetting(key: string, value: any) {
    return this.system.setSystemSetting(key, value);
  }

  async getSystemSetting(key: string) {
    return this.system.getSystemSetting(key);
  }

  // ==================== FINAL ANALYTICS METHODS ====================
  async executeCustomAnalyticsQuery(query: string, parameters?: any[]) {
    return this.system.executeCustomAnalyticsQuery(query, parameters);
  }

  async getRealtimeAnalytics(metric: string, filters?: any) {
    return this.system.getRealtimeAnalytics(metric, filters);
  }

  async getAnalyticsTrends(metric: string, timeframe: string, filters?: any) {
    return this.system.getAnalyticsTrends(metric, timeframe, filters);
  }

  async getAnalyticsAlerts(userId?: number) {
    return this.system.getAnalyticsAlerts(userId);
  }

  async createAnalyticsAlert(alertConfig: any) {
    return this.system.createAnalyticsAlert(alertConfig);
  }

  async updateAnalyticsAlert(alertId: string, alertConfig: any) {
    return this.system.updateAnalyticsAlert(alertId, alertConfig);
  }

  async deleteAnalyticsAlert(alertId: string) {
    return this.system.deleteAnalyticsAlert(alertId);
  }

  async getAnalyticsMetadata() {
    return this.system.getAnalyticsMetadata();
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