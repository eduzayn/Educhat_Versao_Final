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
} from "../../../shared/schema";

/**
 * Interface principal do sistema de storage
 * Define todas as operações de banco de dados disponíveis
 */
export interface IStorage {
  // ==================== AUTH OPERATIONS ====================
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<SystemUser | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // ==================== CONTACT OPERATIONS ====================
  getContact(id: number): Promise<Contact | undefined>;
  getContactWithTags(id: number): Promise<ContactWithTags | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  searchContacts(query: string): Promise<Contact[]>;
  updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact>;
  getContactInterests(contactId: number): Promise<any[]>;

  // ==================== CONVERSATION OPERATIONS ====================
  getConversations(limit?: number, offset?: number): Promise<ConversationWithContact[]>;
  getConversation(id: number): Promise<ConversationWithContact | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;
  getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined>;
  assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual'): Promise<void>;
  assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual'): Promise<void>;
  getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]>;
  getConversationsByUser(userId: number): Promise<ConversationWithContact[]>;
  getTotalUnreadCount(): Promise<number>;

  // ==================== MESSAGE OPERATIONS ====================
  getAllMessages(): Promise<Message[]>;
  getMessages(conversationId: number, limit?: number, offset?: number): Promise<Message[]>;
  getMessageMedia(messageId: number): Promise<string | null>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  markMessageAsUnread(id: number): Promise<void>;
  markMessageAsDelivered(id: number): Promise<void>;
  markMessageAsDeleted(id: number): Promise<void>;
  getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined>;
  getMessagesByMetadata(key: string, value: string): Promise<Message[]>;

  // ==================== CONTACT TAG OPERATIONS ====================
  getContactTags(contactId: number): Promise<ContactTag[]>;
  addContactTag(tag: InsertContactTag): Promise<ContactTag>;
  removeContactTag(contactId: number, tag: string): Promise<void>;

  // ==================== QUICK REPLY OPERATIONS ====================
  getQuickReplies(): Promise<QuickReply[]>;
  getQuickReply(id: number): Promise<QuickReply | undefined>;
  createQuickReply(quickReply: InsertQuickReply): Promise<QuickReply>;
  updateQuickReply(id: number, quickReply: Partial<InsertQuickReply>): Promise<QuickReply>;
  deleteQuickReply(id: number): Promise<void>;
  incrementQuickReplyUsage(id: number): Promise<void>;
  getQuickRepliesByCategory(category: string): Promise<QuickReply[]>;
  searchQuickReplies(query: string): Promise<QuickReply[]>;
  getMostUsedQuickReplies(limit?: number): Promise<QuickReply[]>;
  getUserQuickReplies(userId: number): Promise<QuickReply[]>;
  getQuickReplyCategories(): Promise<string[]>;
  getQuickReplyStatistics(): Promise<any>;

  // ==================== QUICK REPLY SHARING OPERATIONS ====================
  createQuickReplyTeamShare(share: InsertQuickReplyTeamShare): Promise<QuickReplyTeamShare>;
  createQuickReplyUserShare(share: InsertQuickReplyShare): Promise<QuickReplyShare>;
  deleteQuickReplyTeamShares(quickReplyId: number): Promise<void>;
  deleteQuickReplyUserShares(quickReplyId: number): Promise<void>;

  // ==================== SYSTEM USER OPERATIONS ====================
  getSystemUsers(): Promise<SystemUser[]>;
  getSystemUser(id: number): Promise<SystemUser | undefined>;
  createSystemUser(user: InsertSystemUser): Promise<SystemUser>;
  updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser>;
  deleteSystemUser(id: number): Promise<void>;

  // ==================== TEAM OPERATIONS ====================
  getTeams(): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined>;
  getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam>;
  removeUserFromTeam(userId: number, teamId: number): Promise<void>;
  updateTeamMemberRole(userId: number, teamId: number, role: string): Promise<any>;
  getTeamMembers(teamId: number): Promise<any[]>;
  getTeamStatistics(teamId: number): Promise<any>;
  getTeamWorkload(teamId: number): Promise<any>;
  transferConversationBetweenTeams(conversationId: number, fromTeamId: number, toTeamId: number): Promise<any>;

  // ==================== ROLE OPERATIONS ====================
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  // ==================== CHANNEL OPERATIONS ====================
  getChannels(): Promise<Channel[]>;
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelsByType(type: string): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: number, channel: Partial<InsertChannel>): Promise<Channel>;
  deleteChannel(id: number): Promise<void>;
  updateChannelConnectionStatus(id: number, status: string, isConnected: boolean): Promise<void>;
  getChannelStatus(channelId: number): Promise<any>;

  // ==================== CONTACT NOTES OPERATIONS ====================
  getContactNotes(contactId: number): Promise<ContactNote[]>;
  createContactNote(note: InsertContactNote): Promise<ContactNote>;
  updateContactNote(id: number, note: Partial<InsertContactNote>): Promise<ContactNote>;
  deleteContactNote(id: number): Promise<void>;

  // ==================== DEAL OPERATIONS ====================
  getDeals(): Promise<Deal[]>;
  getDealsWithPagination(params: {
    page: number;
    limit: number;
    team?: string;
    stage?: string;
    search?: string;
  }): Promise<{ deals: Deal[]; total: number; totalPages: number; currentPage: number }>;
  getDeal(id: number): Promise<Deal | undefined>;
  getDealById(id: number): Promise<Deal | undefined>;
  getDealsByContact(contactId: number): Promise<Deal[]>;
  getDealsByStage(stage: string): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: number): Promise<void>;
  createAutomaticDeal(contactId: number, canalOrigem?: string, team?: string): Promise<Deal>;
  addDealNote(dealId: number, note: string, userId: number): Promise<any>;
  getDealNotes(dealId: number): Promise<any[]>;
  getDealStatistics(filters?: any): Promise<any>;

  // ==================== SYSTEM SETTINGS OPERATIONS ====================
  getSystemSetting(key: string): Promise<SystemSetting | null>;
  getSystemSettings(category?: string): Promise<SystemSetting[]>;
  setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<SystemSetting>;
  toggleSystemSetting(key: string): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;

  // ==================== PERMISSION OPERATIONS ====================
  canUserRespondToOthersConversations(userId: number): Promise<boolean>;
  canUserRespondToOwnConversations(userId: number): Promise<boolean>;
  canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean>;

  // ==================== TEAM DETECTION OPERATIONS ====================
  getTeamDetections(): Promise<any[]>;
  getTeamDetection(id: number): Promise<any>;
  createTeamDetection(data: any): Promise<any>;
  updateTeamDetection(id: number, data: any): Promise<any>;
  deleteTeamDetection(id: number): Promise<void>;
  getTeamDetectionKeywords(teamDetectionId: number): Promise<any[]>;
  createTeamDetectionKeyword(teamDetectionId: number, data: any): Promise<any>;
  deleteTeamDetectionKeyword(teamDetectionId: number, keywordId: number): Promise<void>;
  testTeamDetection(text: string): Promise<any>;

  // ==================== ANALYTICS OPERATIONS ====================
  getConversationAnalytics(filters?: any): Promise<any>;
  getMessageAnalytics(filters?: any): Promise<any>;
  getDealAnalytics(filters?: any): Promise<any>;
  getResponseTimeAnalytics(filters?: any): Promise<any>;
  getChannelAnalytics(filters?: any): Promise<any>;
  getUserPerformanceAnalytics(filters?: any): Promise<any>;
  getTeamPerformanceAnalytics(filters?: any): Promise<any>;
  getDealConversionAnalytics(filters?: any): Promise<any>;
  getSalesFunnelAnalytics(filters?: any): Promise<any>;
  generateAnalyticsReport(reportType: string, filters?: any): Promise<any>;
  sendAnalyticsReport(reportId: string, recipients: string[]): Promise<any>;
  executeCustomAnalyticsQuery(query: string): Promise<any>;
  getRealtimeAnalytics(): Promise<any>;
  getAnalyticsTrends(metric: string, period: string): Promise<any>;
  getAnalyticsAlerts(): Promise<any>;
  createAnalyticsAlert(alert: any): Promise<any>;
  updateAnalyticsAlert(alertId: string, alert: any): Promise<any>;
  deleteAnalyticsAlert(alertId: string): Promise<any>;

  // ==================== TEAM DETECTION ====================
  detectTeam(content: string, channel?: string): string | null;
}