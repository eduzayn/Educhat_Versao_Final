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
 * Agrega todos os módulos especializados de storage usando delegação
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
  markMessageAsDeleted = this.message.markMessageAsDeleted;
  getMessageByZApiId = this.message.getMessageByZApiId;
  getMessagesByMetadata = this.message.getMessagesByMetadata;

  // ========== PERMISSIONS (padrão TRUE, customizar depois) ==========
  canUserRespondToOthersConversations = async () => true;
  canUserRespondToOwnConversations = async () => true;
  canUserRespondToConversation = async () => true;

  // ========== MÉTODOS ADICIONAIS DE MENSAGENS ==========
  markMessageAsRead = this.message.markMessageAsRead;
  markMessageAsUnread = this.message.markMessageAsUnread;
  markMessageAsDelivered = this.message.markMessageAsDelivered;
  getMessage = this.message.getMessage;
  updateMessageZApiStatus = this.message.updateMessageZApiStatus;

  // ========== PLACEHOLDERS ==========
  // implementar conforme necessário
  async getAllMessages(): Promise<any[]> {
    throw new Error("Método getAllMessages não implementado");
  }

  async getRole(): Promise<any> {
    throw new Error("Método getRole não implementado");
  }

  async getRoles(): Promise<any[]> {
    throw new Error("Método getRoles não implementado");
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
}