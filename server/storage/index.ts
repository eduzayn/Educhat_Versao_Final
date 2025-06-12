import { UserManagementStorage } from './modules/userManagementStorage';
import { ContactStorage } from './modules/contactStorage';
import { ConversationStorage } from './modules/conversationStorage';
import { MessageStorage } from './modules/messageStorage';
import { ChannelStorage } from './modules/channelStorage';
import { DealStorage } from './modules/dealStorage';
import { NotesStorage } from './modules/notesStorage';
import { TeamStorage } from './modules/teamStorage';
import { QuickReplyStorage } from './modules/quickReplyStorage';
import { ManychatStorage } from './modules/manychatStorage';
import { FacebookStorage } from './modules/facebookStorage';

/**
 * STORAGE PRINCIPAL CONSOLIDADO
 * Agrupa todos os módulos de storage em uma interface unificada
 * Sistema consolidado com terminologia unificada de equipes
 */
export class CentralStorage {
  public userManagement: UserManagementStorage;
  public contact: ContactStorage;
  public conversation: ConversationStorage;
  public message: MessageStorage;
  public channel: ChannelStorage;
  public deal: DealStorage;
  public notes: NotesStorage;
  public team: TeamStorage;
  public quickReply: QuickReplyStorage;
  public manychat: ManychatStorage;
  public facebook: FacebookStorage;

  constructor() {
    this.userManagement = new UserManagementStorage();
    this.contact = new ContactStorage();
    this.conversation = new ConversationStorage();
    this.message = new MessageStorage();
    this.channel = new ChannelStorage();
    this.deal = new DealStorage();
    this.notes = new NotesStorage();
    this.team = new TeamStorage();
    this.quickReply = new QuickReplyStorage();
    this.manychat = new ManychatStorage();
    this.facebook = new FacebookStorage();
  }

  // ==================== USER OPERATIONS ====================
  async createUser(userData: any) {
    return this.userManagement.createUser(userData);
  }

  async getUser(id: number) {
    return this.userManagement.getUser(String(id));
  }

  async getUserByEmail(email: string) {
    return this.userManagement.getUserByEmail(email);
  }

  async getAllUsers() {
    return this.userManagement.getAllUsers();
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

  // ==================== CONVERSATION OPERATIONS ====================
  async createConversation(conversationData: any) {
    return this.conversation.createConversation(conversationData);
  }

  async getConversation(id: number) {
    return this.conversation.getConversation(id);
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

  async getConversationsByStatus(status: string) {
    return this.conversation.getConversationsByStatus(status);
  }

  async getConversationsByTeam(teamId: number) {
    return this.conversation.getConversationsByTeam(teamId);
  }

  async getConversationsByUser(userId: number) {
    return this.conversation.getConversationsByUser(userId);
  }

  async assignConversationToUser(conversationId: number, userId: number) {
    return this.conversation.assignConversationToUser(conversationId, userId);
  }

  async assignConversationToTeam(conversationId: number, teamId: number) {
    return this.conversation.assignConversationToTeam(conversationId, teamId);
  }

  async markConversationAsRead(conversationId: number) {
    return this.conversation.markConversationAsRead(conversationId);
  }

  async markConversationAsUnread(conversationId: number) {
    return this.conversation.markConversationAsUnread(conversationId);
  }

  async getTotalUnreadCount() {
    return this.conversation.getTotalUnreadCount();
  }

  async recalculateUnreadCounts() {
    return this.conversation.recalculateUnreadCounts();
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

  // ==================== DEAL OPERATIONS ====================
  async createDeal(dealData: any) {
    return this.deal.createDeal(dealData);
  }

  async getDeal(id: number) {
    return this.deal.getDeal(id);
  }

  async getDeals() {
    return this.deal.getDeals();
  }

  async getDealsWithPagination(params: any) {
    return this.deal.getDealsWithPagination(params);
  }

  async updateDeal(id: number, dealData: any) {
    return this.deal.updateDeal(id, dealData);
  }

  async deleteDeal(id: number) {
    return this.deal.deleteDeal(id);
  }

  async getDealsByStage(stage: string) {
    return this.deal.getDealsByStage(stage);
  }

  async getDealStatistics() {
    return { total: 0, byStage: {}, byTeam: {} };
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, team?: string): Promise<any> {
    return this.deal.createAutomaticDeal(contactId, canalOrigem, team);
  }

  async getDealsByContact(contactId: number) {
    return this.deal.getDealsByContact(contactId);
  }

  // ==================== TEAM OPERATIONS ====================
  async createTeam(teamData: any) {
    return this.team.createTeam(teamData);
  }

  async getTeam(id: number) {
    return this.team.getTeam(id);
  }

  async getTeams() {
    return this.team.getTeams();
  }

  async updateTeam(id: number, teamData: any) {
    return this.team.updateTeam(id, teamData);
  }

  async deleteTeam(id: number) {
    return this.team.deleteTeam(id);
  }

  async getTeamByTeamType(teamType: string) {
    return this.team.getTeamByTeamType(teamType);
  }

  async testTeamDetection(message: string, teamId?: number) {
    return this.team.testTeamDetection(message);
  }

  // ==================== MESSAGE OPERATIONS ====================
  async createMessage(messageData: any) {
    return this.message.createMessage(messageData);
  }

  async getMessage(id: number) {
    return this.message.getMessage ? this.message.getMessage(id) : null;
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

  async markMessageAsDeletedByUser(messageId: number, deletedByUser: boolean) {
    return this.message.markMessageAsDeletedByUser(messageId, deletedByUser);
  }

  // Soft delete methods available through message module

  // ==================== QUICK REPLY OPERATIONS ====================
  async createQuickReply(quickReplyData: any) {
    return this.quickReply.createQuickReply(quickReplyData);
  }

  async getQuickReply(id: number) {
    return this.quickReply.getQuickReply(id);
  }

  async getQuickReplies() {
    return this.quickReply.getQuickReplies();
  }

  async updateQuickReply(id: number, quickReplyData: any) {
    return this.quickReply.updateQuickReply(id, quickReplyData);
  }

  async deleteQuickReply(id: number) {
    return this.quickReply.deleteQuickReply(id);
  }

  // ==================== SYSTEM SETTINGS ====================
  async getSystemSetting(key: string) {
    const setting = await this.userManagement.getSystemSetting(key);
    return setting || null;
  }

  // System setting updates available through userManagement module

  // ==================== ANALYTICS & REPORTS ====================
  async getAnalyticsData(filters: any = {}) {
    return {
      conversations: await this.conversation.getConversations(),
      messages: await this.message.getAllMessages(),
      teams: await this.team.getTeams(),
      deals: await this.deal.getDeals()
    };
  }

  async getFunnelAnalytics(funnelId?: number) {
    return {
      totalSteps: 0,
      completionRate: 0,
      dropoffPoints: [],
      conversions: []
    };
  }

  // ==================== INTEGRATION HELPERS ====================
  async findOrCreateContact(phone: string, name?: string) {
    const existingContact = await this.contact.getContactByPhone(phone);
    if (existingContact) {
      return existingContact;
    }
    
    return this.contact.createContact({
      phone,
      name: name || `Contato ${phone}`,
      isOnline: false
    });
  }

  async findOrCreateConversation(contactId: number, channel: string) {
    const conversations = await this.conversation.getConversations();
    const existingConversation = conversations.find((c: any) => 
      c.contactId === contactId && c.channel === channel
    );
    
    if (existingConversation) {
      return existingConversation;
    }
    
    return this.conversation.createConversation({
      contactId,
      channel,
      status: 'open',
      assignedUserId: null,
      assignedTeamId: null
    });
  }

  // ==================== CONTACT NOTES OPERATIONS ====================
  async createContactNote(noteData: any) {
    return this.notes.createContactNote(noteData);
  }

  async updateContactNote(id: number, noteData: any) {
    return this.notes.updateContactNote(id, noteData);
  }

  async deleteContactNote(id: number) {
    return this.notes.deleteContactNote(id);
  }

  async getContactNotes(contactId: number) {
    return this.notes.getContactNotes(contactId);
  }
}

export const storage = new CentralStorage();