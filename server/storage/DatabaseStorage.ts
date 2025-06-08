// Refatoração da classe DatabaseStorage com melhorias estruturais

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

export class DatabaseStorage implements IStorage {
  private auth = new AuthStorage();
  private contact = new ContactStorage();
  private conversation = new ConversationStorage();
  private channel = new ChannelStorage();
  private deal = new DealStorage();
  private notes = new NotesStorage();
  private quickReply = new QuickReplyStorage();
  private team = new TeamStorage();
  private message = new MessageStorage();

  // ========== AUTH ==========
  getUser = this.auth.getUser;
  getUserByEmail = this.auth.getUserByEmail;
  createUser = this.auth.createUser;
  upsertUser = this.auth.upsertUser;
  getSystemUsers = this.auth.getSystemUsers;
  getSystemUser = this.auth.getSystemUser;
  createSystemUser = this.auth.createSystemUser;
  updateSystemUser = this.auth.updateSystemUser;
  deleteSystemUser = this.auth.deleteSystemUser;

  // ========== CONTACT ==========
  getContact = this.contact.getContact;
  getContactWithTags = this.contact.getContactWithTags;
  createContact = this.contact.createContact;
  updateContact = this.contact.updateContact;
  searchContacts = this.contact.searchContacts;
  updateContactOnlineStatus = this.contact.updateContactOnlineStatus;
  findOrCreateContact = this.contact.findOrCreateContact;
  getContactInterests = this.contact.getContactInterests;
  getContactTags = this.contact.getContactTags;
  addContactTag = this.contact.addContactTag;
  removeContactTag = this.contact.removeContactTag;

  // ========== CONVERSATION ==========
  getConversations = this.conversation.getConversations;
  getConversation = this.conversation.getConversation;
  createConversation = this.conversation.createConversation;
  updateConversation = this.conversation.updateConversation;
  getConversationByContactAndChannel = this.conversation.getConversationByContactAndChannel;
  assignConversationToTeam = this.conversation.assignConversationToTeam;
  assignConversationToUser = this.conversation.assignConversationToUser;
  getConversationsByTeam = this.conversation.getConversationsByTeam;
  getConversationsByUser = this.conversation.getConversationsByUser;
  getTotalUnreadCount = this.conversation.getTotalUnreadCount;
  markConversationAsRead = this.conversation.markConversationAsRead;

  // ========== CHANNEL ==========
  getChannels = this.channel.getChannels;
  getChannel = this.channel.getChannel;
  getChannelsByType = this.channel.getChannelsByType;
  createChannel = this.channel.createChannel;
  updateChannel = this.channel.updateChannel;
  deleteChannel = this.channel.deleteChannel;
  updateChannelConnectionStatus = this.channel.updateChannelConnectionStatus;

  // ========== DEAL ==========
  getDeals = this.deal.getDeals;
  getDealsWithPagination = this.deal.getDealsWithPagination;
  getDeal = this.deal.getDeal;
  getDealsByContact = this.deal.getDealsByContact;
  getDealsByStage = this.deal.getDealsByStage;
  createDeal = this.deal.createDeal;
  updateDeal = this.deal.updateDeal;
  deleteDeal = this.deal.deleteDeal;
  createAutomaticDeal = this.deal.createAutomaticDeal;

  // ========== NOTES ==========
  getContactNotes = this.notes.getContactNotes;
  createContactNote = this.notes.createContactNote;
  updateContactNote = this.notes.updateContactNote;
  deleteContactNote = this.notes.deleteContactNote;

  // ========== QUICK REPLIES ==========
  getQuickReplies = this.quickReply.getQuickReplies;
  getQuickReply = this.quickReply.getQuickReply;
  createQuickReply = this.quickReply.createQuickReply;
  updateQuickReply = this.quickReply.updateQuickReply;
  deleteQuickReply = this.quickReply.deleteQuickReply;
  incrementQuickReplyUsage = this.quickReply.incrementQuickReplyUsage;
  createQuickReplyTeamShare = this.quickReply.createQuickReplyTeamShare;
  createQuickReplyUserShare = this.quickReply.createQuickReplyUserShare;
  deleteQuickReplyTeamShares = this.quickReply.deleteQuickReplyTeamShares;
  deleteQuickReplyUserShares = this.quickReply.deleteQuickReplyUserShares;

  // ========== TEAM ==========
  getTeams = this.team.getTeams;
  getTeam = this.team.getTeam;
  createTeam = this.team.createTeam;
  updateTeam = this.team.updateTeam;
  deleteTeam = this.team.deleteTeam;
  getTeamByMacrosetor = this.team.getTeamByMacrosetor;
  getAvailableUserFromTeam = this.team.getAvailableUserFromTeam;
  getUserTeams = this.team.getUserTeams;
  addUserToTeam = this.team.addUserToTeam;
  removeUserFromTeam = this.team.removeUserFromTeam;
  updateTeamMemberRole = this.team.updateTeamMemberRole;
  getTeamMembers = this.team.getTeamMembers;
  getTeamStatistics = this.team.getTeamStatistics;

  // ========== MESSAGES ==========
  getMessages = this.message.getMessages;
  getMessageMedia = this.message.getMessageMedia;
  createMessage = this.message.createMessage;

  // ========== PERMISSIONS (padrao TRUE, customizar depois) ==========
  canUserRespondToOthersConversations = async () => true;
  canUserRespondToOwnConversations = async () => true;
  canUserRespondToConversation = async () => true;

  // ========== PLACEHOLDERS ==========
  // implementar conforme necessário
  async getAllMessages(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async markMessageAsUnread(messageId: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async markMessageAsDelivered(messageId: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async getAvailableUsersFromTeam(teamId: number): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getRoles(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getRole(id: number): Promise<any> {
    throw new Error("Método não implementado");
  }

  async createRole(role: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async updateRole(id: number, role: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async deleteRole(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async getPermissions(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getPermission(id: number): Promise<any> {
    throw new Error("Método não implementado");
  }

  async createPermission(permission: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async updatePermission(id: number, permission: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async deletePermission(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async getRolePermissions(roleId: number): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async addRolePermission(roleId: number, permissionId: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async removeRolePermission(roleId: number, permissionId: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async getCustomRules(userId: number): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async createCustomRule(rule: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async updateCustomRule(id: number, rule: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async deleteCustomRule(id: number): Promise<void> {
    throw new Error("Método não implementado");
  }

  async createAuditLog(log: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getAuditLogs(filters?: any): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getSystemSettings(): Promise<any[]> {
    throw new Error("Método não implementado");
  }

  async getSystemSetting(key: string): Promise<any> {
    throw new Error("Método não implementado");
  }

  async updateSystemSetting(key: string, value: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getTeamWorkload(teamId: number): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getConversationAnalytics(filters?: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getUserAnalytics(userId: number, filters?: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getTeamAnalytics(teamId: number, filters?: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getChannelAnalytics(channelId: number, filters?: any): Promise<any> {
    throw new Error("Método não implementado");
  }

  async getDealAnalytics(filters?: any): Promise<any> {
    throw new Error("Método não implementado");
  }
}