import {
  users,
  contacts,
  conversations,
  messages,
  contactTags,
  quickReplies,
  quickReplyTeamShares,
  quickReplyShares,
  systemUsers,
  teams,
  roles,
  channels,
  contactNotes,
  deals,
  userTeams,
  systemSettings,
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
  type QuickReplyWithCreator,
  type SystemSetting,
  type InsertSystemSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, isNotNull, ne, not, like, sql, gt, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations for auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<SystemUser | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContactWithTags(id: number): Promise<ContactWithTags | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  searchContacts(query: string): Promise<Contact[]>;
  updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void>;

  // Conversation operations
  getConversations(limit?: number, offset?: number): Promise<ConversationWithContact[]>;
  getConversation(id: number): Promise<ConversationWithContact | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;
  getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined>;

  // Message operations
  getAllMessages(): Promise<Message[]>;
  getMessages(conversationId: number, limit?: number, offset?: number): Promise<Message[]>;
  getMessageMedia(messageId: number): Promise<string | null>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  markMessageAsUnread(id: number): Promise<void>;
  markMessageAsDelivered(id: number): Promise<void>;
  markMessageAsDeleted(id: number): Promise<void>;

  // Contact tag operations
  getContactTags(contactId: number): Promise<ContactTag[]>;
  addContactTag(tag: InsertContactTag): Promise<ContactTag>;
  removeContactTag(contactId: number, tag: string): Promise<void>;

  // Quick reply operations
  getQuickReplies(): Promise<QuickReply[]>;
  getQuickReply(id: number): Promise<QuickReply | undefined>;
  createQuickReply(quickReply: InsertQuickReply): Promise<QuickReply>;
  updateQuickReply(id: number, quickReply: Partial<InsertQuickReply>): Promise<QuickReply>;
  deleteQuickReply(id: number): Promise<void>;
  incrementQuickReplyUsage(id: number): Promise<void>;

  // Quick reply sharing operations
  createQuickReplyTeamShare(share: InsertQuickReplyTeamShare): Promise<QuickReplyTeamShare>;
  createQuickReplyUserShare(share: InsertQuickReplyShare): Promise<QuickReplyShare>;
  deleteQuickReplyTeamShares(quickReplyId: number): Promise<void>;
  deleteQuickReplyUserShares(quickReplyId: number): Promise<void>;

  // System User operations for user management settings
  getSystemUsers(): Promise<SystemUser[]>;
  getSystemUser(id: number): Promise<SystemUser | undefined>;
  createSystemUser(user: InsertSystemUser): Promise<SystemUser>;
  updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser>;
  deleteSystemUser(id: number): Promise<void>;

  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Role operations
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  // Channel operations
  getChannels(): Promise<Channel[]>;
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelsByType(type: string): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: number, channel: Partial<InsertChannel>): Promise<Channel>;
  deleteChannel(id: number): Promise<void>;
  updateChannelConnectionStatus(id: number, status: string, isConnected: boolean): Promise<void>;

  // Contact notes operations
  getContactNotes(contactId: number): Promise<ContactNote[]>;
  createContactNote(note: InsertContactNote): Promise<ContactNote>;
  updateContactNote(id: number, note: Partial<InsertContactNote>): Promise<ContactNote>;
  deleteContactNote(id: number): Promise<void>;

  // Deal operations for CRM
  getDeals(): Promise<Deal[]>;
  getDealsWithPagination(params: {
    page: number;
    limit: number;
    macrosetor?: string;
    stage?: string;
    search?: string;
  }): Promise<{ deals: Deal[]; total: number; totalPages: number; currentPage: number }>;
  getDeal(id: number): Promise<Deal | undefined>;
  getDealsByContact(contactId: number): Promise<Deal[]>;
  getDealsByStage(stage: string): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: number): Promise<void>;
  createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string): Promise<Deal>;

  // Automatic contact creation
  findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact>;

  // Team assignment operations
  assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual'): Promise<void>;
  assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual'): Promise<void>;
  getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined>;
  getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam>;
  removeUserFromTeam(userId: number, teamId: number): Promise<void>;

  // Team CRUD operations
  getAllTeams(): Promise<Team[]>;

  // Conversation assignment queries
  getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]>;
  getConversationsByUser(userId: number): Promise<ConversationWithContact[]>;

  // Statistics operations
  getTotalUnreadCount(): Promise<number>;

  // System Settings operations
  getSystemSetting(key: string): Promise<SystemSetting | null>;
  getSystemSettings(category?: string): Promise<SystemSetting[]>;
  setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<SystemSetting>;
  toggleSystemSetting(key: string): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;

  // Contact interests operations
  getContactInterests(contactId: number): Promise<any[]>;

  // Permission operations for conversation responses
  canUserRespondToOthersConversations(userId: number): Promise<boolean>;
  canUserRespondToOwnConversations(userId: number): Promise<boolean>;
  canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations for auth
  async getUser(id: string): Promise<User | undefined> {
    const [systemUser] = await db.select().from(systemUsers).where(eq(systemUsers.id, parseInt(id)));
    if (!systemUser) return undefined;
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  async getUserByEmail(email: string): Promise<SystemUser | undefined> {
    const [systemUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, email));
    return systemUser;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [systemUser] = await db
      .insert(systemUsers)
      .values({
        email: userData.email,
        username: userData.firstName || userData.email.split('@')[0],
        displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
        password: userData.password,
        role: userData.role || 'user',
        roleId: 1,
        isActive: true,
        channels: [],
        macrosetores: []
      })
      .returning();
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [systemUser] = await db
      .insert(systemUsers)
      .values({
        email: userData.email,
        username: userData.firstName || userData.email.split('@')[0],
        displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
        password: userData.password,
        role: userData.role || 'user',
        roleId: 1,
        isActive: true,
        channels: [],
        macrosetores: []
      })
      .onConflictDoUpdate({
        target: systemUsers.email,
        set: {
          displayName: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return {
      id: systemUser.id,
      email: systemUser.email,
      username: systemUser.username,
      displayName: systemUser.displayName,
      role: systemUser.role,
      roleId: systemUser.roleId || 1,
      dataKey: systemUser.dataKey || undefined,
      channels: Array.isArray(systemUser.channels) ? systemUser.channels : [],
      macrosetores: Array.isArray(systemUser.macrosetores) ? systemUser.macrosetores : [],
      teamId: systemUser.teamId || undefined,
      team: systemUser.team || undefined
    };
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactWithTags(id: number): Promise<ContactWithTags | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;

    const contactTags = await this.getContactTags(id);
    return { ...contact, contactTags };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    
    // Criar automaticamente um negócio para o novo contato
    await this.createAutomaticDeal(newContact.id, contact.canalOrigem || undefined);
    
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    if (!query || query.trim() === '') {
      return await db
        .select()
        .from(contacts)
        .orderBy(desc(contacts.createdAt));
    }
    
    return await db
      .select()
      .from(contacts)
      .where(
        or(
          ilike(contacts.name, `%${query}%`),
          ilike(contacts.email, `%${query}%`),
          ilike(contacts.phone, `%${query}%`)
        )
      )
      .orderBy(desc(contacts.createdAt));
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await db
      .update(contacts)
      .set({ 
        isOnline, 
        lastSeenAt: isOnline ? new Date() : undefined,
        updatedAt: new Date() 
      })
      .where(eq(contacts.id, id));
  }

  // Conversation operations
  async getConversations(limit = 50, offset = 0): Promise<ConversationWithContact[]> {
    const conversationsData = await db
      .select({
        conversations: conversations,
        contacts: contacts,
        channels: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(
        and(
          isNotNull(contacts.phone),
          sql`length(${contacts.phone}) >= 10`
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const conversationIds = conversationsData
      .filter(row => row.conversations)
      .map(row => row.conversations!.id);
    
    const lastMessagesMap = new Map<number, any>();
    
    if (conversationIds.length > 0) {
      const lastMessageIds = await db
        .select({
          conversationId: messages.conversationId,
          lastMessageId: sql<number>`MAX(${messages.id})`.as('lastMessageId')
        })
        .from(messages)
        .where(sql`${messages.conversationId} IN (${sql.join(conversationIds, sql`, `)})`)
        .groupBy(messages.conversationId);

      if (lastMessageIds.length > 0) {
        const messageIds = lastMessageIds.map(row => row.lastMessageId);
        const lastMessages = await db
          .select()
          .from(messages)
          .where(sql`${messages.id} IN (${sql.join(messageIds, sql`, `)})`);

        for (const msgIdRow of lastMessageIds) {
          const message = lastMessages.find(m => m.id === msgIdRow.lastMessageId);
          if (message) {
            lastMessagesMap.set(msgIdRow.conversationId, message);
          }
        }
      }
    }

    const result: ConversationWithContact[] = [];
    
    for (const row of conversationsData) {
      if (row.conversations && row.contacts) {
        const lastMessage = lastMessagesMap.get(row.conversations.id);
        
        const { channel: channelType, ...conversationData } = row.conversations;
        result.push({
          ...conversationData,
          channel: channelType,
          contact: row.contacts,
          channelInfo: row.channels || undefined,
          messages: lastMessage ? [lastMessage] : [],
        });
      }
    }
    
    return result;
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    const [conversation] = await db
      .select({
        conversations: conversations,
        contacts: contacts,
        channels: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(eq(conversations.id, id));

    if (!conversation?.conversations || !conversation?.contacts) return undefined;

    const conversationMessages = await this.getMessages(id);

    return {
      ...conversation.conversations,
      contact: conversation.contacts,
      channelInfo: conversation.channels || undefined,
      messages: conversationMessages,
    };
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }

  async getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.contactId, contactId),
          eq(conversations.channel, channel)
        )
      );
    return conversation;
  }

  // Message operations
  async getAllMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.sentAt));
  }

  async getMessages(conversationId: number, limit = 30, offset = 0): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.sentAt)
      .limit(limit)
      .offset(offset);
  }

  async getMessageMedia(messageId: number): Promise<string | null> {
    const result = await db
      .select({ content: messages.content })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    
    return result[0]?.content || null;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    if (message.isFromContact) {
      await db
        .update(conversations)
        .set({ 
          lastMessageAt: new Date(),
          unreadCount: sql`COALESCE(${conversations.unreadCount}, 0) + 1`,
          updatedAt: new Date() 
        })
        .where(eq(conversations.id, message.conversationId));
    } else {
      await db
        .update(conversations)
        .set({ 
          lastMessageAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(conversations.id, message.conversationId));
    }

    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id));
  }

  async markMessageAsUnread(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: null })
      .where(eq(messages.id, id));
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ deliveredAt: new Date() })
      .where(eq(messages.id, id));
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, id));
  }

  // Contact tag operations
  async getContactTags(contactId: number): Promise<ContactTag[]> {
    return await db
      .select()
      .from(contactTags)
      .where(eq(contactTags.contactId, contactId));
  }

  async addContactTag(tag: InsertContactTag): Promise<ContactTag> {
    const [newTag] = await db
      .insert(contactTags)
      .values(tag)
      .returning();
    return newTag;
  }

  async removeContactTag(contactId: number, tag: string): Promise<void> {
    await db
      .delete(contactTags)
      .where(
        and(
          eq(contactTags.contactId, contactId),
          eq(contactTags.tag, tag)
        )
      );
  }

  // Quick reply operations
  async getQuickReplies(): Promise<QuickReply[]> {
    return await db.select().from(quickReplies).orderBy(desc(quickReplies.createdAt));
  }

  async getQuickReply(id: number): Promise<QuickReply | undefined> {
    const [quickReply] = await db
      .select()
      .from(quickReplies)
      .where(eq(quickReplies.id, id));
    return quickReply;
  }

  async createQuickReply(quickReplyData: InsertQuickReply): Promise<QuickReply> {
    const [quickReply] = await db
      .insert(quickReplies)
      .values(quickReplyData)
      .returning();
    return quickReply;
  }

  async updateQuickReply(id: number, quickReplyData: Partial<InsertQuickReply>): Promise<QuickReply> {
    const [quickReply] = await db
      .update(quickReplies)
      .set({
        ...quickReplyData,
        updatedAt: new Date(),
      })
      .where(eq(quickReplies.id, id))
      .returning();
    return quickReply;
  }

  async deleteQuickReply(id: number): Promise<void> {
    await db
      .delete(quickReplies)
      .where(eq(quickReplies.id, id));
  }

  async incrementQuickReplyUsage(id: number): Promise<void> {
    await db
      .update(quickReplies)
      .set({
        usageCount: sql`COALESCE(${quickReplies.usageCount}, 0) + 1`,
      })
      .where(eq(quickReplies.id, id));
  }

  // Quick reply sharing operations
  async createQuickReplyTeamShare(share: InsertQuickReplyTeamShare): Promise<QuickReplyTeamShare> {
    const [newShare] = await db
      .insert(quickReplyTeamShares)
      .values(share)
      .returning();
    return newShare;
  }

  async createQuickReplyUserShare(share: InsertQuickReplyShare): Promise<QuickReplyShare> {
    const [newShare] = await db
      .insert(quickReplyShares)
      .values(share)
      .returning();
    return newShare;
  }

  async deleteQuickReplyTeamShares(quickReplyId: number): Promise<void> {
    await db.delete(quickReplyTeamShares).where(eq(quickReplyTeamShares.quickReplyId, quickReplyId));
  }

  async deleteQuickReplyUserShares(quickReplyId: number): Promise<void> {
    await db.delete(quickReplyShares).where(eq(quickReplyShares.quickReplyId, quickReplyId));
  }

  // System User operations
  async getSystemUsers(): Promise<SystemUser[]> {
    return await db.select().from(systemUsers).orderBy(desc(systemUsers.createdAt));
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await db.insert(systemUsers).values(user).returning();
    return newUser;
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser> {
    const [updatedUser] = await db
      .update(systemUsers)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteSystemUser(id: number): Promise<void> {
    await db.delete(systemUsers).where(eq(systemUsers.id, id));
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await this.getAllTeams();
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(desc(teams.createdAt));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.macrosetor, macrosetor));
    return team;
  }

  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    const teamUsers = await db
      .select()
      .from(systemUsers)
      .innerJoin(userTeams, eq(userTeams.userId, systemUsers.id))
      .where(
        and(
          eq(userTeams.teamId, teamId),
          eq(systemUsers.isActive, true)
        )
      );
    
    if (teamUsers.length > 0) {
      const randomIndex = Math.floor(Math.random() * teamUsers.length);
      return teamUsers[randomIndex].system_users;
    }
    
    return undefined;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const userTeamsData = await db
      .select({ team: teams })
      .from(userTeams)
      .leftJoin(teams, eq(userTeams.teamId, teams.id))
      .where(eq(userTeams.userId, userId));
    
    return userTeamsData
      .filter(row => row.team)
      .map(row => row.team!);
  }

  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    const [newUserTeam] = await db.insert(userTeams).values(userTeam).returning();
    return newUserTeam;
  }

  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await db
      .delete(userTeams)
      .where(
        and(
          eq(userTeams.userId, userId),
          eq(userTeams.teamId, teamId)
        )
      );
  }

  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    const conversationsData = await db
      .select({
        conversations: conversations,
        contacts: contacts,
        channels: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(eq(conversations.assignedTeamId, teamId))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsData
      .filter(row => row.conversations && row.contacts)
      .map(row => ({
        ...row.conversations!,
        contact: row.contacts!,
        channelInfo: row.channels || undefined,
        messages: [],
      }));
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    const conversationsData = await db
      .select({
        conversations: conversations,
        contacts: contacts,
        channels: channels
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(channels, eq(conversations.channelId, channels.id))
      .where(eq(conversations.assignedUserId, userId))
      .orderBy(desc(conversations.lastMessageAt));

    return conversationsData
      .filter(row => row.conversations && row.contacts)
      .map(row => ({
        ...row.conversations!,
        contact: row.contacts!,
        channelInfo: row.channels || undefined,
        messages: [],
      }));
  }

  async assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual'): Promise<void> {
    await db
      .update(conversations)
      .set({
        assignedTeamId: teamId,
        assignmentMethod: method,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual'): Promise<void> {
    await db
      .update(conversations)
      .set({
        assignedUserId: userId,
        assignmentMethod: method,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  // Role operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Channel operations
  async getChannels(): Promise<Channel[]> {
    return db.select().from(channels).orderBy(desc(channels.createdAt));
  }

  async getChannel(id: number): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async getChannelsByType(type: string): Promise<Channel[]> {
    return db.select().from(channels).where(eq(channels.type, type)).orderBy(desc(channels.createdAt));
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [newChannel] = await db.insert(channels).values(channel).returning();
    return newChannel;
  }

  async updateChannel(id: number, channelData: Partial<InsertChannel>): Promise<Channel> {
    const [channel] = await db
      .update(channels)
      .set({ ...channelData, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();
    return channel;
  }

  async deleteChannel(id: number): Promise<void> {
    await db.delete(channels).where(eq(channels.id, id));
  }

  async updateChannelConnectionStatus(id: number, status: string, isConnected: boolean): Promise<void> {
    await db
      .update(channels)
      .set({
        connectionStatus: status,
        isConnected,
        lastConnectionCheck: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(channels.id, id));
  }

  // Contact notes operations
  async getContactNotes(contactId: number): Promise<ContactNote[]> {
    return await db
      .select()
      .from(contactNotes)
      .where(eq(contactNotes.contactId, contactId))
      .orderBy(desc(contactNotes.createdAt));
  }

  async createContactNote(note: InsertContactNote): Promise<ContactNote> {
    const [newNote] = await db.insert(contactNotes).values(note).returning();
    return newNote;
  }

  async updateContactNote(id: number, note: Partial<InsertContactNote>): Promise<ContactNote> {
    const [updatedNote] = await db
      .update(contactNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(contactNotes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteContactNote(id: number): Promise<void> {
    await db.delete(contactNotes).where(eq(contactNotes.id, id));
  }

  // Deal operations for CRM
  async getDeals(): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(eq(deals.isActive, true))
      .orderBy(desc(deals.createdAt));
  }

  async getDealsWithPagination(params: {
    page: number;
    limit: number;
    macrosetor?: string;
    stage?: string;
    search?: string;
  }): Promise<{ deals: Deal[]; total: number; totalPages: number; currentPage: number }> {
    const { page, limit, macrosetor, stage, search } = params;
    const offset = (page - 1) * limit;

    const conditions = [eq(deals.isActive, true)];
    
    if (macrosetor) {
      conditions.push(eq(deals.macrosetor, macrosetor));
    }
    
    if (stage) {
      conditions.push(eq(deals.stage, stage));
    }
    
    if (search) {
      conditions.push(
        sql`(${deals.name} ILIKE ${'%' + search + '%'} OR ${deals.notes} ILIKE ${'%' + search + '%'})`
      );
    }

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(...conditions));
    
    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    const dealsResult = await db
      .select()
      .from(deals)
      .where(and(...conditions))
      .orderBy(desc(deals.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      deals: dealsResult,
      total,
      totalPages,
      currentPage: page
    };
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getDealsByContact(contactId: number): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(and(eq(deals.contactId, contactId), eq(deals.isActive, true)))
      .orderBy(desc(deals.createdAt));
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(and(eq(deals.stage, stage), eq(deals.isActive, true)))
      .orderBy(desc(deals.createdAt));
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<void> {
    await db.update(deals).set({ isActive: false }).where(eq(deals.id, id));
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string): Promise<Deal> {
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const dealData: InsertDeal = {
      name: `${contact.name || 'Contato'} - Novo Lead`,
      contactId: contactId,
      macrosetor: macrosetor || 'comercial',
      stage: 'prospecting',
      value: 100000,
      probability: 20,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'unknown',
      notes: `Deal criado automaticamente para ${contact.name || 'Contato'} via ${canalOrigem || 'sistema'}`,
      isActive: true
    };

    return await this.createDeal(dealData);
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting || null;
  }

  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    if (category) {
      return await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.category, category))
        .orderBy(systemSettings.key);
    }
    
    return await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key);
  }

  async setSystemSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({
        key,
        value,
        type: type || 'string',
        description,
        category: category || 'general'
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          type: type || 'string',
          description,
          category: category || 'general',
          updatedAt: new Date()
        }
      })
      .returning();
    
    return setting;
  }

  async toggleSystemSetting(key: string): Promise<SystemSetting> {
    const currentSetting = await this.getSystemSetting(key);
    
    if (!currentSetting) {
      return await this.setSystemSetting(key, 'false', 'boolean');
    }
    
    const currentValue = currentSetting.value?.toLowerCase() === 'true';
    const newValue = (!currentValue).toString();
    
    return await this.setSystemSetting(key, newValue, 'boolean', currentSetting.description || undefined, currentSetting.category || undefined);
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db.delete(systemSettings).where(eq(systemSettings.key, key));
  }

  // Statistics operations
  async getTotalUnreadCount(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`sum(${conversations.unreadCount})` })
      .from(conversations);
    
    return result[0]?.total || 0;
  }

  // Find or create contact
  async findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact> {
    let existingContact: Contact | undefined;
    
    if (contactData.phone) {
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.phone, contactData.phone));
      existingContact = contact;
    }
    
    if (!existingContact && contactData.email) {
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.email, contactData.email));
      existingContact = contact;
    }
    
    if (existingContact) {
      return await this.updateContact(existingContact.id, contactData);
    }
    
    const newContactData: InsertContact = {
      name: contactData.name || userIdentity,
      phone: contactData.phone || null,
      email: contactData.email || null,
      canalOrigem: contactData.canalOrigem || 'whatsapp',
      ...contactData
    };
    
    return await this.createContact(newContactData);
  }

  // Contact interests operations
  async getContactInterests(contactId: number): Promise<any[]> {
    return [];
  }

  // Permission operations
  async canUserRespondToOthersConversations(userId: number): Promise<boolean> {
    return true; // Simplified for now
  }

  async canUserRespondToOwnConversations(userId: number): Promise<boolean> {
    return true; // Simplified for now
  }

  async canUserRespondToConversation(userId: number, conversationId: number): Promise<boolean> {
    return true; // Simplified for now
  }
}

export const storage = new DatabaseStorage();