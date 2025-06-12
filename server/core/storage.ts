/**
 * Storage Central Simplificado
 * Substitui o complexo storage/index.ts (1223 linhas) por acesso direto aos módulos
 */

import { UserManagementStorage } from '../storage/modules/userManagementStorage';
import { ContactStorage } from '../storage/modules/contactStorage';
import { ConversationStorage } from '../storage/modules/conversationStorage';
import { ChannelStorage } from '../storage/modules/channelStorage';
import { DealStorage } from '../storage/modules/dealStorage';
import { TeamStorage } from '../storage/modules/teamStorage';
import { MessageStorage } from '../storage/modules/messageStorage';
import { QuickReplyStorage } from '../storage/modules/quickReplyStorage';
import { FacebookStorage } from '../storage/modules/facebookStorage';
import { ManychatStorage } from '../storage/modules/manychatStorage';

class CentralStorage {
  public readonly users = new UserManagementStorage();
  public readonly contacts = new ContactStorage();
  public readonly conversations = new ConversationStorage();
  public readonly channels = new ChannelStorage();
  public readonly deals = new DealStorage();
  public readonly teams = new TeamStorage();
  public readonly messages = new MessageStorage();
  public readonly quickReplies = new QuickReplyStorage();
  public readonly facebook = new FacebookStorage();
  public readonly manychat = new ManychatStorage();

  // Métodos de conveniência diretos - sem proxies desnecessários
  getUser = (id: number) => this.users.getUser(id);
  getUserById = (id: number) => this.users.getUser(id); // Compatibilidade auth
  getUserByEmail = (email: string) => this.users.getUserByEmail(email); // Método crítico para autenticação
  createUser = (userData: any) => this.users.createUser(userData);
  
  // Métodos de system users
  getSystemUsers = () => this.users.getSystemUsers();
  getSystemUser = (id: number) => this.users.getSystemUser(id);
  createSystemUser = (userData: any) => this.users.createSystemUser(userData);
  updateSystemUser = (id: number, userData: any) => this.users.updateSystemUser(id, userData);
  deleteSystemUser = (id: number) => this.users.deleteSystemUser(id);
  getContact = (id: number) => this.contacts.getContact(id);
  createContact = (contactData: any) => this.contacts.createContact(contactData);
  getConversation = (id: number) => this.conversations.getConversation(id);
  getConversations = (limit?: number, offset?: number) => this.conversations.getConversations(limit, offset);
  createConversation = (conversationData: any) => this.conversations.createConversation(conversationData);
  getTeam = (id: number) => this.teams.getTeam(id);
  getTeams = () => this.teams.getTeams();
  getUserTeams = (userId: number) => this.teams.getUserTeams(userId);
  addUserToTeam = (userTeamData: any) => this.teams.addUserToTeam(userTeamData);
  createDeal = (dealData: any) => this.deals.createDeal(dealData);
  getDealsByContact = (contactId: number) => this.deals.getDealsByContact(contactId);
  createAutomaticDeal = (contactId: number, canalOrigem: string, teamType: string, initialStage: string) => 
    this.deals.createAutomaticDeal(contactId, canalOrigem, teamType, initialStage);
  
  // Métodos de QuickReply necessários
  createQuickReply = (replyData: any) => this.quickReplies.createQuickReply(replyData);
  getQuickReplies = () => this.quickReplies.getQuickReplies();
  updateQuickReply = (id: number, data: any) => this.quickReplies.updateQuickReply(id, data);
  deleteQuickReply = (id: number) => this.quickReplies.deleteQuickReply(id);
  
  // Métodos de Channel necessários
  getChannels = () => this.channels.getChannels();
  getChannel = (id: number) => this.channels.getChannel(id);
  createChannel = (channelData: any) => this.channels.createChannel(channelData);
  updateChannel = (id: number, data: any) => this.channels.updateChannel(id, data);
  deleteChannel = (id: number) => this.channels.deleteChannel(id);
  
  // Métodos de Contact necessários
  getContactInterests = (contactId: number) => this.contacts.getContactInterests(contactId);
  getContactNotes = (contactId: number) => Promise.resolve([]);
  
  // Métodos de marcar conversa como lida/não lida
  markConversationAsRead = (conversationId: number) => this.conversations.markConversationAsRead(conversationId);
  markConversationAsUnread = (conversationId: number) => this.conversations.markConversationAsUnread(conversationId);
  
  // Métodos de compatibilidade para rotas que ainda usam storage/index.ts
  assignConversationToTeam = (conversationId: number, teamId: number, method: string) => 
    this.conversations.assignConversationToTeam(conversationId, teamId, method);
  getAvailableUserFromTeam = (teamId: number) => this.teams.getAvailableUserFromTeam(teamId);
  assignConversationToUser = (conversationId: number, userId: number, method: string) => 
    this.conversations.assignConversationToUser(conversationId, userId, method);
  getConversationByContactAndChannel = (contactId: number, channel: string) => 
    this.conversations.getConversationByContactAndChannel(contactId, channel);
  createMessage = (messageData: any) => this.messages.createMessage(messageData);
  getMessages = (conversationId: number, limit?: number, offset?: number) => this.messages.getMessages(conversationId, limit, offset);
  getMessage = (messageId: number) => this.messages.getMessage(messageId);
  markMessageAsDeletedByUser = (messageId: number, deletedByUser: boolean) => this.messages.markMessageAsDeletedByUser(messageId, deletedByUser);
  getTotalUnreadCount = () => this.conversations.getTotalUnreadCount();
  
  // Métodos de Contact com Tags e Paginação
  getContactsPaginated = (page: number, limit: number) => this.contacts.getContactsPaginated(page, limit);
  getContactWithTags = (id: number) => this.contacts.getContactWithTags(id);
  updateContact = (id: number, data: any) => this.contacts.updateContact(id, data);
  getContactTags = (contactId: number) => this.contacts.getContactTags(contactId);
  addContactTag = (contactId: number, tag: string) => this.contacts.addContactTag(contactId, tag);
  removeContactTag = (contactId: number, tag: string) => this.contacts.removeContactTag(contactId, tag);
  
  // Métodos de Deal completos
  getDealsWithPagination = (page: number, limit: number, filters?: any) => this.deals.getDealsWithPagination(page, limit, filters);
  getDeal = (id: number) => this.deals.getDeal(id);
  updateDeal = (id: number, data: any) => this.deals.updateDeal(id, data);
  deleteDeal = (id: number) => this.deals.deleteDeal(id);
  addDealNote = (dealId: number, noteData: any) => this.deals.addDealNote(dealId, noteData);
  getDealNotes = (dealId: number) => this.deals.getDealNotes(dealId);
  getDealStatistics = (filters?: any) => this.deals.getDealStatistics(filters);
}

export const storage = new CentralStorage();