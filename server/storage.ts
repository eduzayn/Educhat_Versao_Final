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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, isNotNull, ne, not, like, sql, gt, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations for auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  assignConversationToTeam(conversationId: number, teamId: number, method: 'automatic' | 'manual'): Promise<void>;
  assignConversationToUser(conversationId: number, userId: number, method: 'automatic' | 'manual'): Promise<void>;
  getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined>;
  getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam>;
  removeUserFromTeam(userId: number, teamId: number): Promise<void>;

  // Team CRUD operations
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Conversation assignment queries
  getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]>;
  getConversationsByUser(userId: number): Promise<ConversationWithContact[]>;

  // Statistics operations
  getTotalUnreadCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations for auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: userId,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactWithTags(id: number): Promise<ContactWithTags | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;

    const tags = await this.getContactTags(id);
    return { ...contact, tags };
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
      // Retornar todos os contatos ordenados por data de criação (mais recentes primeiro)
      // Isso garantirá que os contatos reais da Z-API apareçam primeiro
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

    
    // Buscar apenas as conversas que precisamos com paginação eficiente
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
          sql`length(${contacts.phone}) > 8`,
          not(like(contacts.phone, '%000000%')),
          not(like(contacts.phone, '%111111%')),
          not(like(contacts.phone, '%123456%')),
          not(ilike(contacts.name, '%test%')),
          not(ilike(contacts.name, '%demo%')),
          not(ilike(contacts.name, '%exemplo%'))
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);



    // Buscar todas as últimas mensagens de uma vez usando uma subconsulta otimizada
    const conversationIds = conversationsData
      .filter(row => row.conversations)
      .map(row => row.conversations!.id);
    
    const lastMessagesMap = new Map<number, any>();
    
    if (conversationIds.length > 0) {
      // Subconsulta para encontrar o ID da última mensagem de cada conversa
      const lastMessageIds = await db
        .select({
          conversationId: messages.conversationId,
          lastMessageId: sql<number>`MAX(${messages.id})`.as('lastMessageId')
        })
        .from(messages)
        .where(sql`${messages.conversationId} IN (${sql.join(conversationIds, sql`, `)})`)
        .groupBy(messages.conversationId);

      // Buscar as mensagens completas dos IDs encontrados
      if (lastMessageIds.length > 0) {
        const messageIds = lastMessageIds.map(row => row.lastMessageId);
        const lastMessages = await db
          .select()
          .from(messages)
          .where(sql`${messages.id} IN (${sql.join(messageIds, sql`, `)})`);

        // Mapear mensagens por conversationId
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
    // Consulta otimizada: não carrega content binário de mídias grandes
    return await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        content: sql<string>`CASE 
          WHEN ${messages.messageType} IN ('video', 'image', 'audio', 'document') AND LENGTH(${messages.content}) > 50000
          THEN NULL
          ELSE ${messages.content}
        END`.as('content'),
        isFromContact: messages.isFromContact,
        messageType: messages.messageType,
        metadata: messages.metadata,
        isDeleted: messages.isDeleted,
        sentAt: messages.sentAt,
        deliveredAt: messages.deliveredAt,
        readAt: messages.readAt,
        whatsappMessageId: messages.whatsappMessageId,
        zapiStatus: messages.zapiStatus,
        isGroup: messages.isGroup,
        referenceMessageId: messages.referenceMessageId
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sentAt))
      .limit(limit)
      .offset(offset);
  }

  // Novo método para carregar conteúdo de mídia sob demanda
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

    // Update conversation's last message timestamp and unread count
    if (message.isFromContact) {
      console.log(`📬 Incrementando contador para conversa ${message.conversationId}`);
      // Se a mensagem é do contato, incrementar contador de não lidas
      const result = await db
        .update(conversations)
        .set({ 
          lastMessageAt: new Date(),
          unreadCount: sql`COALESCE(${conversations.unreadCount}, 0) + 1`,
          updatedAt: new Date() 
        })
        .where(eq(conversations.id, message.conversationId))
        .returning({ newCount: conversations.unreadCount });
      

    } else {
      // Se a mensagem é nossa, apenas atualizar timestamp
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

  async markConversationAsRead(conversationId: number): Promise<void> {
    // Primeiro marcar todas as mensagens não lidas da conversa como lidas
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isFromContact, true),
          isNull(messages.readAt)
        )
      );

    // Depois zerar o contador da conversa
    await db
      .update(conversations)
      .set({ unreadCount: 0 })
      .where(eq(conversations.id, conversationId));
  }

  async recalculateUnreadCounts(): Promise<void> {
    console.log('🔄 Recalculando todos os contadores de mensagens não lidas...');
    
    // Uma abordagem mais simples: contar mensagens do contato sem readAt
    await db.execute(sql`
      UPDATE conversations 
      SET unread_count = (
        SELECT COUNT(*) 
        FROM messages 
        WHERE messages.conversation_id = conversations.id 
        AND messages.is_from_contact = true 
        AND messages.read_at IS NULL
      )
    `);
    
    console.log('✅ Recálculo de contadores concluído');
  }



  // System User operations for user management settings
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

  async updateMessageStatus(whatsappMessageId: string, status: string): Promise<void> {
    await db
      .update(messages)
      .set({ 
        zapiStatus: status,
        readAt: status === 'READ' ? new Date() : undefined
      })
      .where(eq(messages.whatsappMessageId, whatsappMessageId));
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
    return await db
      .select()
      .from(quickReplies)
      .orderBy(desc(quickReplies.createdAt));
  }

  // Check if user can edit a quick reply (creator, admin, manager, or superadmin)
  async canUserEditQuickReply(userId: string, quickReplyId: number): Promise<boolean> {
    const quickReply = await this.getQuickReply(quickReplyId);
    if (!quickReply) return false;

    // Check if user is admin, manager, or superadmin (they can edit any quick reply)
    const user = await this.getUser(userId);
    if (!user) return false;
    
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'superadmin') {
      return true;
    }

    // Creator can edit their own quick replies
    if (quickReply.createdBy === userId) return true;

    return false;
  }

  // Check if user can delete a quick reply
  async canUserDeleteQuickReply(userId: string, quickReplyId: number): Promise<boolean> {
    return this.canUserEditQuickReply(userId, quickReplyId);
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

  // Legacy team operations (keeping for compatibility)
  async getTeams(): Promise<Team[]> {
    return await this.getAllTeams();
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
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
    const [role] = await db
      .insert(roles)
      .values(roleData)
      .returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set({
        ...roleData,
        updatedAt: new Date(),
      })
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
      .set({
        ...channelData,
        updatedAt: new Date(),
      })
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

  async createContactNote(noteData: InsertContactNote): Promise<ContactNote> {
    const [note] = await db
      .insert(contactNotes)
      .values(noteData)
      .returning();
    return note;
  }

  async updateContactNote(id: number, noteData: Partial<InsertContactNote>): Promise<ContactNote> {
    const [note] = await db
      .update(contactNotes)
      .set({
        ...noteData,
        updatedAt: new Date(),
      })
      .where(eq(contactNotes.id, id))
      .returning();
    return note;
  }

  async deleteContactNote(id: number): Promise<void> {
    await db
      .delete(contactNotes)
      .where(eq(contactNotes.id, id));
  }

  // Automatic contact creation with lead classification
  async findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact> {
    // First, try to find existing contact by userIdentity
    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userIdentity, userIdentity))
      .limit(1);

    if (existingContact) {
      // Update existing contact with new channel info if provided
      if (contactData.canalOrigem && existingContact.canalOrigem !== contactData.canalOrigem) {
        await db
          .update(contacts)
          .set({
            canalOrigem: contactData.canalOrigem,
            nomeCanal: contactData.nomeCanal,
            idCanal: contactData.idCanal,
            lastSeenAt: new Date(),
            isOnline: contactData.isOnline || existingContact.isOnline,
          })
          .where(eq(contacts.id, existingContact.id));
      }
      return existingContact;
    }

    // If not found, create new contact with lead classification
    const leadClassification = this.classifyLead(contactData.canalOrigem);
    
    const [newContact] = await db
      .insert(contacts)
      .values({
        name: contactData.name || userIdentity,
        phone: contactData.phone || null,
        email: contactData.email || null,
        profileImageUrl: contactData.profileImageUrl || null,
        location: contactData.location || null,
        age: contactData.age || null,
        isOnline: contactData.isOnline || false,
        lastSeenAt: contactData.lastSeenAt || new Date(),
        canalOrigem: contactData.canalOrigem || 'unknown',
        nomeCanal: contactData.nomeCanal || 'Canal Desconhecido',
        idCanal: contactData.idCanal || null,
        userIdentity,
      })
      .returning();

    console.log(`👤 Novo contato criado: ${newContact.name} (${contactData.canalOrigem}) - Classificação: ${leadClassification}`);
    return newContact;
  }

  // Dicionário completo de cursos - 184 pós-graduações + Psicanálise
  private courseDictionary = {
    // ========== EDUCAÇÃO (42 cursos) ==========
    'aba_docencia': {
      variations: ['aba', 'docência ensino superior', 'docência superior', 'aba docência'],
      courseType: 'Pós-graduação',
      courseName: 'ABA - Docência do Ensino Superior'
    },
    'administracao_publica': {
      variations: ['administração pública', 'gestão pública', 'admin pública'],
      courseType: 'Pós-graduação',
      courseName: 'Administração Pública'
    },
    'alfabetizacao_letramento': {
      variations: ['alfabetização', 'letramento', 'alfabetização letramento'],
      courseType: 'Pós-graduação',
      courseName: 'Alfabetização e Letramento'
    },
    'alfabetizacao_psicopedagogia': {
      variations: ['alfabetização letramento psicopedagogia', 'psicopedagogia alfabetização'],
      courseType: 'Pós-graduação',
      courseName: 'Alfabetização, Letramento e Psicopedagogia'
    },
    'arbitragem_mediacao': {
      variations: ['arbitragem', 'mediação conflitos', 'resolução conflitos', 'arbitragem mediação'],
      courseType: 'Pós-graduação',
      courseName: 'Arbitragem e Mediação de Conflitos'
    },
    'aee': {
      variations: ['atendimento educacional especializado', 'aee', 'educação especial'],
      courseType: 'Pós-graduação',
      courseName: 'Atendimento Educacional Especializado'
    },
    'autismo': {
      variations: ['autismo', 'tea', 'transtorno autista', 'espectro autista'],
      courseType: 'Pós-graduação',
      courseName: 'Autismo'
    },
    'coordenacao_educacional': {
      variations: ['coordenação educacional', 'coordenação escolar', 'coordenador pedagógico'],
      courseType: 'Pós-graduação',
      courseName: 'Coordenação Educacional'
    },
    'coordenacao_orientacao': {
      variations: ['coordenação orientação escolar', 'orientação educacional'],
      courseType: 'Pós-graduação',
      courseName: 'Coordenação e Orientação Escolar'
    },
    'educacao_5_0': {
      variations: ['educação 5.0', 'educação cinco ponto zero', 'tecnologia educacional'],
      courseType: 'Pós-graduação',
      courseName: 'Educação 5.0'
    },
    'educacao_ambiental': {
      variations: ['educação ambiental', 'sustentabilidade', 'meio ambiente educação'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Ambiental e Sustentabilidade'
    },
    'eja': {
      variations: ['eja', 'educação jovens adultos', 'educação adultos'],
      courseType: 'Pós-graduação',
      courseName: 'Educação de Jovens e Adultos'
    },
    'educacao_direitos_humanos': {
      variations: ['educação direitos humanos', 'direitos humanos educação'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Direitos Humanos'
    },
    'educacao_distancia': {
      variations: ['educação distância', 'ead', 'ensino remoto', 'educação online'],
      courseType: 'Pós-graduação',
      courseName: 'Educação à Distância'
    },
    'educacao_especial_visual_auditiva': {
      variations: ['educação especial visual auditiva', 'deficiência visual', 'deficiência auditiva'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Especial - Deficiência Visual e Auditiva'
    },
    'educacao_especial_inclusiva': {
      variations: ['educação especial inclusiva', 'educação inclusiva', 'inclusão'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Especial e Inclusiva'
    },
    'educacao_tgd_altas_habilidades': {
      variations: ['tgd', 'altas habilidades', 'superdotação', 'transtorno global desenvolvimento'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Especial TGD e Altas Habilidades'
    },
    'educacao_financeira': {
      variations: ['educação financeira', 'finanças pessoais', 'gestão financeira pessoal'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Financeira'
    },
    'educacao_fisica_escolar': {
      variations: ['educação física', 'treinamento desportivo', 'esporte', 'educação física escolar'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Física Escolar e Treinamento Desportivo'
    },
    'educacao_inclusiva_diversidade': {
      variations: ['educação inclusiva diversidade', 'diversidade educacional', 'inclusão diversidade'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Inclusiva e Diversidade'
    },
    'educacao_infantil': {
      variations: ['educação infantil', 'primeira infância', 'creche', 'pré-escola'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Infantil'
    },
    'educacao_musical': {
      variations: ['educação musical', 'música educação', 'ensino música'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Musical'
    },
    'educacao_musical_inovadora': {
      variations: ['educação musical inovadora', 'música inovadora', 'tecnologia musical'],
      courseType: 'Pós-graduação',
      courseName: 'Educação Musical Inovadora'
    },
    'ensino_espanhol': {
      variations: ['ensino espanhol', 'língua espanhola', 'espanhol', 'castelhano'],
      courseType: 'Pós-graduação',
      courseName: 'Ensino de Língua Espanhola'
    },
    'ensino_ingles': {
      variations: ['ensino inglês', 'língua inglesa', 'inglês', 'english'],
      courseType: 'Pós-graduação',
      courseName: 'Ensino de Língua Inglesa'
    },
    'ensino_portugues': {
      variations: ['ensino português', 'língua portuguesa', 'português', 'gramática'],
      courseType: 'Pós-graduação',
      courseName: 'Ensino de Língua Portuguesa'
    },
    'ensino_religioso': {
      variations: ['ensino religioso', 'educação religiosa', 'religião'],
      courseType: 'Pós-graduação',
      courseName: 'Ensino Religioso'
    },
    'gestao_orientacao_escolar': {
      variations: ['gestão orientação escolar', 'gestão escolar orientação'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão e Orientação Escolar'
    },
    'gestao_educacional': {
      variations: ['gestão educacional', 'administração escolar', 'gestão escola'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão Educacional'
    },
    'gestao_publica_educacional': {
      variations: ['gestão pública educacional', 'administração pública educação'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão Pública Educacional'
    },
    'inspecao_escolar': {
      variations: ['inspeção escolar', 'inspetor escolar', 'supervisão inspeção'],
      courseType: 'Pós-graduação',
      courseName: 'Inspeção Escolar'
    },
    'metodologia_artes': {
      variations: ['metodologia artes', 'ensino artes', 'arte educação'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Artes'
    },
    'metodologia_ciencias': {
      variations: ['metodologia ciências', 'ensino ciências', 'ciências naturais'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Ciências'
    },
    'metodologia_filosofia': {
      variations: ['metodologia filosofia', 'ensino filosofia', 'filosofia educação'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Filosofia'
    },
    'metodologia_geografia': {
      variations: ['metodologia geografia', 'ensino geografia', 'geografia escolar'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Geografia'
    },
    'metodologia_matematica': {
      variations: ['metodologia matemática', 'ensino matemática', 'matemática escolar'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Matemática'
    },
    'metodologia_matematica_fisica': {
      variations: ['metodologia matemática física', 'ensino matemática física', 'exatas'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Matemática e Física'
    },
    'metodologia_sociologia': {
      variations: ['metodologia sociologia', 'ensino sociologia', 'sociologia educação'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino de Sociologia'
    },
    'metodologia_ensino_superior': {
      variations: ['metodologia ensino superior', 'didática ensino superior'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologia do Ensino Superior em Várias Modalidades'
    },
    'metodologias_ativas': {
      variations: ['metodologias ativas', 'tecnologias educacionais', 'inovação educacional'],
      courseType: 'Pós-graduação',
      courseName: 'Metodologias Ativas e Tecnologias Educacionais'
    },
    'tecnologias_educacionais': {
      variations: ['tecnologias educacionais', 'tecnologia educação', 'educação digital'],
      courseType: 'Pós-graduação',
      courseName: 'Tecnologias Educacionais'
    },
    'tutoria_ead': {
      variations: ['tutoria ead', 'tutor ead', 'tutoria ensino distância'],
      courseType: 'Pós-graduação',
      courseName: 'Tutoria em EAD'
    },

    // ========== GESTÃO ESCOLAR (9 cursos) ==========
    'gestao_escolar': {
      variations: ['gestão escolar', 'administração escolar', 'direção escolar'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão Escolar'
    },
    'gestao_escolar_integradora': {
      variations: ['gestão escolar integradora', 'gestão integradora'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão Escolar Integradora'
    },
    'secretariado_escolar': {
      variations: ['secretariado escolar', 'secretária escolar', 'administração escolar'],
      courseType: 'Pós-graduação',
      courseName: 'Secretariado Escolar'
    },
    'supervisao_escolar': {
      variations: ['supervisão escolar', 'supervisor escolar', 'supervisão pedagógica'],
      courseType: 'Pós-graduação',
      courseName: 'Supervisão Escolar'
    },
    'supervisao_orientacao_infantil': {
      variations: ['supervisão orientação infantil', 'gestão educação infantil'],
      courseType: 'Pós-graduação',
      courseName: 'Supervisão e Orientação em Educação Infantil'
    },
    'supervisao_orientacao_escolar': {
      variations: ['supervisão orientação escolar', 'orientação pedagógica'],
      courseType: 'Pós-graduação',
      courseName: 'Supervisão e Orientação Escolar'
    },

    // ========== MBA (20 cursos) ==========
    'mba_administracao_pessoal': {
      variations: ['mba administração pessoal', 'gestão pessoal', 'desenvolvimento pessoal'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Administração Pessoal'
    },
    'mba_auditoria_contabil': {
      variations: ['mba auditoria contábil', 'auditoria', 'contabilidade auditoria'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Auditoria Contábil'
    },
    'mba_contabilidade_gerencial': {
      variations: ['mba contabilidade gerencial', 'contabilidade gerencial', 'controladoria'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Contabilidade Gerencial'
    },
    'mba_financas_controladoria': {
      variations: ['mba finanças corporativas', 'finanças controladoria', 'gestão financeira'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Finanças Corporativas e Controladoria'
    },
    'mba_gestao_ambiental': {
      variations: ['mba gestão ambiental', 'gestão ambiental', 'meio ambiente'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão Ambiental'
    },
    'mba_gestao_producao': {
      variations: ['mba gestão produção', 'gestão produção', 'produção industrial'],
      courseType: 'Pós-graduação',
      courseName: 'MBA Gestão da Produção'
    },
    'mba_gestao_ti': {
      variations: ['mba gestão ti', 'gestão tecnologia informação', 'ti gestão'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão da Tecnologia da Informação'
    },
    'mba_cadeia_suprimentos': {
      variations: ['mba cadeia suprimentos', 'supply chain', 'gestão suprimentos'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão de Cadeia de Suprimentos'
    },
    'mba_farmacias_drogarias': {
      variations: ['mba farmácias drogarias', 'gestão farmácia', 'administração farmácia'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão de Farmácias e Drogarias'
    },
    'mba_marketing_digital': {
      variations: ['mba marketing digital', 'marketing digital', 'gestão marketing online'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão de Marketing Digital'
    },
    'mba_pessoas_talentos': {
      variations: ['mba gestão pessoas', 'gestão talentos', 'recursos humanos'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão de Pessoas e Talentos'
    },
    'mba_gestao_empresarial': {
      variations: ['mba gestão empresarial', 'administração empresarial', 'gestão negócios'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão Empresarial'
    },
    'mba_estrategica_inovacao': {
      variations: ['mba gestão estratégica', 'gestão inovação', 'estratégia empresarial'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão Estratégica e Inovação'
    },
    'mba_gestao_hospitalar': {
      variations: ['mba gestão hospitalar', 'administração hospitalar', 'gestão saúde'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão Hospitalar'
    },
    'mba_gestao_publica': {
      variations: ['mba gestão pública', 'administração pública', 'setor público'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Gestão Pública'
    },
    'mba_gestao_saude': {
      variations: ['mba gestão saúde', 'administração saúde', 'gestão hospitalar'],
      courseType: 'Pós-graduação',
      courseName: 'MBA Gestão em Saúde'
    },
    'mba_logistica_empresarial': {
      variations: ['mba logística empresarial', 'logística', 'gestão logística'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Logística Empresarial'
    },
    'mba_logistica_supply_chain': {
      variations: ['mba logística supply chain', 'supply chain management', 'cadeia suprimentos'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Logística e Supply Chain Management'
    },
    'mba_marketing_estrategico': {
      variations: ['mba marketing estratégico', 'marketing estratégia', 'gestão marketing'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Marketing Estratégico'
    },
    'mba_modelagem_processos': {
      variations: ['mba gestão processos', 'modelagem processos', 'bpm'],
      courseType: 'Pós-graduação',
      courseName: 'MBA em Modelagem e Gestão de Processos'
    },

    // ========== PSICOLOGIA (10 cursos) ==========
    'avaliacao_psicologica': {
      variations: ['avaliação psicológica', 'psicodiagnóstico', 'testagem psicológica'],
      courseType: 'Pós-graduação',
      courseName: 'Avaliação Psicológica e Psicodiagnóstico'
    },
    'neuroeducacao': {
      variations: ['neuroeducação', 'neurociência educação', 'aprendizagem neurociência'],
      courseType: 'Pós-graduação',
      courseName: 'Neuroeducação'
    },
    'neuropsicologia_clinica': {
      variations: ['neuropsicologia clínica', 'neuropsicologia', 'neurociência clínica'],
      courseType: 'Pós-graduação',
      courseName: 'Neuropsicologia Clínica'
    },
    'neuropsicopedagogia': {
      variations: ['neuropsicopedagogia', 'neuropsicopedagógica', 'neuropedagogia'],
      courseType: 'Pós-graduação',
      courseName: 'Neuropsicopedagogia'
    },
    'psicologia_clinica': {
      variations: ['psicologia clínica', 'clínica psicológica', 'psicoterapia'],
      courseType: 'Pós-graduação',
      courseName: 'Psicologia Clínica'
    },
    'psicologia_educacional': {
      variations: ['psicologia educacional', 'psicologia escolar', 'psicopedagogia'],
      courseType: 'Pós-graduação',
      courseName: 'Psicologia Educacional'
    },
    'psicologia_hospitalar': {
      variations: ['psicologia hospitalar', 'psicologia saúde', 'psicologia médica'],
      courseType: 'Pós-graduação',
      courseName: 'Psicologia Hospitalar'
    },
    'psicologia_transito': {
      variations: ['psicologia trânsito', 'psicologia tráfego', 'avaliação psicológica trânsito'],
      courseType: 'Pós-graduação',
      courseName: 'Psicologia do Trânsito'
    },
    'terapia_casal': {
      variations: ['terapia casal', 'terapia conjugal', 'psicoterapia casal'],
      courseType: 'Pós-graduação',
      courseName: 'Terapia de Casal'
    },
    'terapia_familiar': {
      variations: ['terapia familiar', 'terapia família', 'psicoterapia familiar'],
      courseType: 'Pós-graduação',
      courseName: 'Terapia Familiar'
    },

    // ========== PSICANÁLISE (Conforme solicitado) ==========
    'psicanalise_pos': {
      variations: ['psicanálise', 'psicanalise', 'pós psicanálise', 'pós em psicanálise', 'especialização psicanálise'],
      courseType: 'Pós-graduação',
      courseName: 'Psicanálise'
    },
    'psicanalise_livre': {
      variations: ['formação psicanálise', 'curso livre psicanálise', 'formação psicanalítica'],
      courseType: 'Formação Livre',
      courseName: 'Formação Livre em Psicanálise'
    },

    // ========== PSICOPEDAGOGIA (5 cursos) ==========
    'psicopedagogia_clinica_institucional': {
      variations: ['psicopedagogia clínica institucional', 'psicopedagogia hospitalar'],
      courseType: 'Pós-graduação',
      courseName: 'Psicopedagogia Clínica, Institucional e Hospitalar'
    },
    'psicopedagogia_educacao_especial': {
      variations: ['psicopedagogia educação especial', 'psicopedagogia inclusiva'],
      courseType: 'Pós-graduação',
      courseName: 'Psicopedagogia e Educação Especial'
    },
    'psicopedagogia_escolar': {
      variations: ['psicopedagogia escolar', 'psicopedagogia educacional'],
      courseType: 'Pós-graduação',
      courseName: 'Psicopedagogia Escolar'
    },
    'psicopedagogia_institucional': {
      variations: ['psicopedagogia institucional', 'psicopedagogia empresarial'],
      courseType: 'Pós-graduação',
      courseName: 'Psicopedagogia Institucional'
    },
    'psicopedagogia_completa': {
      variations: ['psicopedagogia institucional clínica', 'psicopedagogia completa'],
      courseType: 'Pós-graduação',
      courseName: 'Psicopedagogia Institucional e Clínica'
    },

    // ========== SAÚDE (15 cursos) ==========
    'enfermagem_ubs': {
      variations: ['enfermagem ubs', 'unidade básica saúde', 'atenção básica enfermagem'],
      courseType: 'Pós-graduação',
      courseName: 'Atendimento de Unidade Básica de Saúde - Enfermagem'
    },
    'enfermagem_trabalho': {
      variations: ['enfermagem trabalho', 'saúde ocupacional enfermagem', 'enfermagem ocupacional'],
      courseType: 'Pós-graduação',
      courseName: 'Enfermagem do Trabalho'
    },
    'enfermagem_trabalho_ocupacional': {
      variations: ['enfermagem trabalho saúde ocupacional', 'medicina trabalho enfermagem'],
      courseType: 'Pós-graduação',
      courseName: 'Enfermagem do Trabalho e Saúde Ocupacional'
    },
    'enfermagem_oncologia': {
      variations: ['enfermagem oncologia', 'oncologia enfermagem', 'câncer enfermagem'],
      courseType: 'Pós-graduação',
      courseName: 'Enfermagem em Oncologia'
    },
    'enfermagem_urgencia_emergencia': {
      variations: ['enfermagem urgência emergência', 'urgência emergência', 'pronto socorro enfermagem'],
      courseType: 'Pós-graduação',
      courseName: 'Enfermagem de Urgência e Emergência'
    },
    'gestao_saude': {
      variations: ['gestão saúde', 'administração saúde', 'gerenciamento saúde'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão em Saúde'
    },
    'gestao_hospitais': {
      variations: ['gestão hospitais', 'administração hospitalar', 'gestão hospitalar'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão de Hospitais'
    },
    'gestao_saude_municipal': {
      variations: ['gestão saúde municipal', 'saúde pública municipal', 'sus municipal'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão de Saúde Municipal'
    },
    'gestao_saude_publica': {
      variations: ['gestão saúde pública', 'saúde pública', 'sus gestão'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão de Saúde Pública'
    },
    'gestao_saude_publica_privada': {
      variations: ['gestão saúde pública privada', 'administração saúde integral'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão de Saúde Pública e Privada'
    },
    'gestao_estrategica_saude': {
      variations: ['gestão estratégica saúde', 'planejamento estratégico saúde'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão Estratégica em Saúde'
    },
    'gestao_unidades_oncologicas': {
      variations: ['gestão unidades oncológicas', 'administração oncologia', 'gestão câncer'],
      courseType: 'Pós-graduação',
      courseName: 'Gestão de Unidades Oncológicas'
    },
    'microbiologia': {
      variations: ['microbiologia', 'microbiologia clínica', 'laboratório microbiologia'],
      courseType: 'Pós-graduação',
      courseName: 'Microbiologia'
    },
    'nutricao_esportiva': {
      variations: ['nutrição esportiva', 'nutrição atletas', 'alimentação esportiva'],
      courseType: 'Pós-graduação',
      courseName: 'Nutrição Esportiva'
    },
    'sexologia': {
      variations: ['sexologia', 'terapia sexual', 'sexualidade humana'],
      courseType: 'Pós-graduação',
      courseName: 'Sexologia'
    },

    // ========== DIREITO (20 cursos) ==========
    'direito_administrativo': {
      variations: ['direito administrativo', 'admin público direito', 'administração pública jurídica'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Administrativo'
    },
    'direito_aduaneiro': {
      variations: ['direito aduaneiro', 'direito alfandegário', 'comércio exterior direito'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Aduaneiro'
    },
    'direito_ambiental': {
      variations: ['direito ambiental', 'direito ecológico', 'legislação ambiental'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Ambiental'
    },
    'direito_civil_processual': {
      variations: ['direito civil', 'processual civil', 'processo civil'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Civil e Processual Civil'
    },
    'direito_constitucional': {
      variations: ['direito constitucional', 'constituição', 'constitucional'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Constitucional'
    },
    'direito_contratual': {
      variations: ['direito contratual', 'contratos', 'direito dos contratos'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Contratual'
    },
    'direito_digital': {
      variations: ['direito digital', 'direito eletrônico', 'cyber direito'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Digital'
    },
    'direito_educacional': {
      variations: ['direito educacional', 'legislação educacional', 'direito escolar'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Educacional'
    },
    'direito_eleitoral': {
      variations: ['direito eleitoral', 'legislação eleitoral', 'processo eleitoral'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Eleitoral'
    },
    'direito_empresarial': {
      variations: ['direito empresarial', 'direito comercial', 'direito societário'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Empresarial'
    },
    'direito_familia_sucessoes': {
      variations: ['direito família', 'sucessões', 'direito hereditário'],
      courseType: 'Pós-graduação',
      courseName: 'Direito da Família e Sucessões'
    },
    'direito_imobiliario': {
      variations: ['direito imobiliário', 'direito predial', 'legislação imobiliária'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Imobiliário'
    },
    'direito_internacional': {
      variations: ['direito internacional', 'relações internacionais direito'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Internacional'
    },
    'direito_lgbtqiapn': {
      variations: ['direito lgbtqiapn', 'direitos lgbt', 'diversidade sexual direito'],
      courseType: 'Pós-graduação',
      courseName: 'Direito LGBTQIAPN+'
    },
    'direito_notarial_registral': {
      variations: ['direito notarial', 'registral', 'cartório direito'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Notarial e Registral'
    },
    'direito_penal_processual': {
      variations: ['direito penal', 'processual penal', 'processo penal', 'criminal'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Penal e Processual Penal'
    },
    'direito_previdenciario': {
      variations: ['direito previdenciário', 'previdência social', 'inss direito'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Previdenciário'
    },
    'direito_previdenciario_docencia': {
      variations: ['direito previdenciário docência', 'previdência ensino'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Previdenciário e Docência'
    },
    'direito_publico_tributario': {
      variations: ['direito público', 'tributário', 'constitucional administrativo'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Público Constitucional, Administrativo e Tributário'
    },
    'direito_publico_licitatorio': {
      variations: ['direito público licitatório', 'licitações', 'contratos públicos'],
      courseType: 'Pós-graduação',
      courseName: 'Direito Público e Licitatório'
    },

    // ========== GRADUAÇÃO TRADICIONAL ==========
    'administracao': {
      variations: ['administração', 'adm', 'gestão empresarial', 'business'],
      courseType: 'graduacao',
      courseName: 'Administração'
    },
    'direito': {
      variations: ['direito', 'ciências jurídicas', 'advocacia', 'law'],
      courseType: 'graduacao',
      courseName: 'Direito'
    },
    'psicologia': {
      variations: ['psicologia', 'psi', 'psychology'],
      courseType: 'graduacao',
      courseName: 'Psicologia'
    },
    'enfermagem': {
      variations: ['enfermagem', 'nursing', 'técnico em enfermagem'],
      courseType: 'graduacao',
      courseName: 'Enfermagem'
    },
    'pedagogia': {
      variations: ['pedagogia', 'educação', 'licenciatura em pedagogia'],
      courseType: 'graduacao',
      courseName: 'Pedagogia'
    },
    'engenharia': {
      variations: ['engenharia', 'engineering', 'eng'],
      courseType: 'graduacao',
      courseName: 'Engenharia'
    },

    // ========== SEGUNDA LICENCIATURA ==========
    'segunda_pedagogia': {
      variations: ['segunda licenciatura pedagogia', 'segunda grad pedagogia', 'segunda licenciatura em pedagogia'],
      courseType: 'Segunda Licenciatura',
      courseName: 'Segunda Licenciatura em Pedagogia'
    },
    'segunda_artes_visuais': {
      variations: ['artes visuais', 'segunda licenciatura artes', 'licenciatura artes visuais'],
      courseType: 'Segunda Licenciatura',
      courseName: 'Segunda Licenciatura em Artes Visuais'
    },
    'segunda_musica': {
      variations: ['música', 'musica', 'segunda licenciatura música', 'licenciatura música'],
      courseType: 'Segunda Licenciatura',
      courseName: 'Segunda Licenciatura em Música'
    }
  };

  // Função para detectar curso mencionado na mensagem
  detectMentionedCourse(messageContent: string): { courseName: string; courseType: string; courseKey: string } | null {
    const normalizedMessage = messageContent.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();

    console.log(`🔍 Analisando mensagem para detecção de curso: "${normalizedMessage}"`);

    // Buscar por cada curso no dicionário
    for (const [courseKey, courseData] of Object.entries(this.courseDictionary)) {
      for (const variation of courseData.variations) {
        const normalizedVariation = variation.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Verificar se a variação está contida na mensagem
        if (normalizedMessage.includes(normalizedVariation)) {
          console.log(`✅ Curso detectado: ${courseData.courseName} (${courseData.courseType})`);
          return {
            courseName: courseData.courseName,
            courseType: courseData.courseType,
            courseKey: courseKey
          };
        }

        // Verificar também palavras-chave soltas com contexto
        const keywords = normalizedVariation.split(' ');
        if (keywords.length === 1 && keywords[0].length > 4) {
          if (normalizedMessage.includes(keywords[0])) {
            // Verificar se tem contexto educacional
            const educationalContext = [
              'curso', 'pos', 'graduacao', 'licenciatura', 'especialização',
              'formacao', 'tcc', 'estagio', 'certificado', 'diploma',
              'turma', 'matricula', 'interesse'
            ];
            
            const hasContext = educationalContext.some(context => 
              normalizedMessage.includes(context)
            );

            if (hasContext) {
              console.log(`✅ Curso detectado por contexto: ${courseData.courseName} (${courseData.courseType})`);
              return {
                courseName: courseData.courseName,
                courseType: courseData.courseType,
                courseKey: courseKey
              };
            }
          }
        }
      }
    }

    // Verificar códigos de turma (ex: 2025/01, 2024.2)
    const turmaRegex = /\b(20\d{2})[\/\.](\d{1,2})\b/;
    const turmaMatch = messageContent.match(turmaRegex);
    if (turmaMatch) {
      console.log(`📅 Código de turma detectado: ${turmaMatch[0]}`);
      return {
        courseName: `Turma ${turmaMatch[0]}`,
        courseType: 'Código de Turma',
        courseKey: 'turma_codigo'
      };
    }

    console.log(`❌ Nenhum curso detectado na mensagem`);
    return null;
  }

  // Função para salvar curso mencionado no contato
  async saveMentionedCourse(contactId: number, courseInfo: { courseName: string; courseType: string; courseKey: string }) {
    try {
      // Verificar se já existe um registro de curso mencionado para este contato
      const existingContact = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
      
      if (existingContact.length > 0) {
        // Buscar tags existentes ou criar array vazio
        const currentTags = Array.isArray(existingContact[0].tags) ? existingContact[0].tags : [];
        
        // Adicionar tag do curso se não existir
        const courseTag = `Interesse: ${courseInfo.courseName}`;
        if (!currentTags.includes(courseTag)) {
          const updatedTags = [...currentTags, courseTag];
          
          await db.update(contacts)
            .set({ 
              tags: updatedTags,
              updatedAt: new Date()
            })
            .where(eq(contacts.id, contactId));
            
          console.log(`📚 Curso "${courseInfo.courseName}" salvo como interesse do contato ${contactId}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar curso mencionado:', error);
    }
  }

  // Lead classification based on channel and behavior
  private classifyLead(canalOrigem?: string): 'frio' | 'morno' | 'quente' {
    if (!canalOrigem) return 'frio';
    
    // WhatsApp leads are typically warmer due to direct interaction
    if (canalOrigem === 'whatsapp') return 'morno';
    
    // Instagram leads can vary but tend to be cooler
    if (canalOrigem === 'instagram') return 'frio';
    
    // Email leads are typically cooler unless specific context
    if (canalOrigem === 'email') return 'frio';
    
    // SMS leads are typically medium warmth
    if (canalOrigem === 'sms') return 'morno';
    
    // Voice calls are typically hot leads
    if (canalOrigem === 'voice') return 'quente';
    
    // Default classification
    return 'frio';
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

  // Statistics operations
  async getTotalUnreadCount(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`sum(${conversations.unreadCount})` })
      .from(conversations);
    
    return result[0]?.total || 0;
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

    // Construir condições WHERE
    const conditions = [eq(deals.isActive, true)];
    
    if (macrosetor) {
      conditions.push(eq(deals.macrosetor, macrosetor));
    }
    
    if (stage) {
      conditions.push(eq(deals.stage, stage));
    }
    
    // Para busca por nome ou notas
    if (search) {
      conditions.push(
        sql`(${deals.name} ILIKE ${'%' + search + '%'} OR ${deals.notes} ILIKE ${'%' + search + '%'})`
      );
    }

    // Buscar total de registros
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(...conditions));
    
    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    // Buscar deals paginados
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
    const [newDeal] = await db
      .insert(deals)
      .values(deal)
      .returning();
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
    await db
      .update(deals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deals.id, id));
  }

  // Função para detectar macrosetor baseado no canal e conteúdo da mensagem
  public detectMacrosetor(messageContent?: string, canalOrigem?: string): string {
    if (!messageContent) return 'comercial';
    
    const content = messageContent.toLowerCase();
    
    // Palavras-chave para SUPORTE
    const suporteKeywords = [
      'problema', 'ajuda', 'suporte', 'erro', 'bug', 'não funciona', 'dificuldade',
      'como usar', 'tutorial', 'dúvida', 'não consigo', 'quebrou', 'defeito',
      'não está funcionando', 'travou', 'lento', 'senha', 'login', 'acesso',
      'recuperar', 'resetar', 'configurar', 'instalar', 'atualizar',
      // Adicionando suas sugestões específicas
      'falha', 'instável', 'não aparece', 'esqueci minha senha', 'link não funciona',
      'não abre', 'mensagem de erro', 'sistema lento', 'fora do ar', 'cadastro não vai',
      'não recebi', 'não carrega', 'meu curso sumiu', 'não finalizei a matrícula',
      'já sou aluno', 'minha aula não abre', 'plataforma está com erro'
    ];
    
    // Palavras-chave para COBRANÇA
    const cobrancaKeywords = [
      'pagamento', 'boleto', 'fatura', 'vencimento', 'débito', 'cobrança',
      'pagar', 'quitação', 'parcela', 'atraso', 'juros', 'multa', 'cartão',
      'pix', 'transferência', 'dinheiro', 'valor', 'preço', 'desconto',
      'negociar', 'parcelar', 'renegociar', 'acordo'
    ];
    
    // Palavras-chave para TUTORIA (prioridade alta - detecção específica)
    const tutoriaKeywords = [
      'tutor', 'tutoria', 'orientação pedagógica', 'orientador', 'dúvida acadêmica',
      'tcc', 'estágio', 'atividade', 'atividades', 'trabalho', 'trabalhos', 'tarefa',
      'avaliação', 'avaliações', 'matéria', 'disciplina', 'disciplinas', 'conteúdo',
      'prática', 'práticas pedagógicas', 'portfólio', 'resumo', 'prova', 'professor',
      'aula', 'nota da atividade', 'prazo de entrega', 'entrega', 'caderno de atividades',
      'relatório', 'ensino', 'dúvida sobre aula', 'não entendi', 'reposição',
      'acompanhamento', 'monografia', 'projeto de pesquisa', 'metodologia de pesquisa',
      'cronograma de estudos', 'planejamento de estudos', 'pesquisa acadêmica',
      'bibliografia', 'artigo científico', 'nota', 'média', 'aprovação', 'reprovação',
      'calendário acadêmico', 'plano de estudos', 'acompanhamento acadêmico', 'mentoria',
      'tenho dúvida no tcc', 'qual é o prazo do estágio', 'não entendi a matéria',
      'a atividade não abriu', 'como entrego o portfólio', 'onde envio o trabalho',
      'fiquei sem nota', 'o professor não corrigiu', 'meu orientador não respondeu',
      'tenho aula ao vivo', 'dúvida sobre matéria', 'pergunta sobre matéria'
    ];
    
    // Palavras-chave para SECRETARIA  
    const secretariaKeywords = [
      'documento', 'documentos', 'certidão', 'certificado', 'diploma', 'histórico escolar',
      'declaração', 'declaração de matrícula', 'atestado', 'comprovante', 'segunda via', 'requerimento',
      'solicitação de documento', 'protocolo', 'processo', 'tramitação', 'secretaria',
      'acadêmico', 'escolar', 'rematrícula', 'matrícula', 'transferência', 'boletim',
      'aproveitamento', 'validação', 'reconhecimento', 'equivalência', 'registro acadêmico',
      'prazo', 'entrega', 'retirada', 'documentação', 'papelada', 'nota', 'presença',
      'burocracia', 'procedimento', 'como solicitar', 'onde retirar', 'cancelamento',
      'trancamento', 'mudança de curso', 'mudança de polo', 'erro nos dados',
      'enviei o documento', 'foto do rg', 'confirmação', 'emissão', 'onde pego',
      'preciso de uma declaração', 'quero meu histórico', 'meu diploma já foi emitido',
      'como faço a rematrícula', 'qual o prazo', 'preciso corrigir', 'meu nome saiu errado',
      'apresentar documento', 'histórico', 'emissão de boletos'
    ];
    
    // Palavras-chave para FINANCEIRO ALUNO (prioridade alta - questões administrativas financeiras)
    const financeiroKeywords = [
      'nota fiscal', 'nf', 'segunda via de boleto', 'boleto', 'pagamento', 'comprovante',
      'quitei', 'quitar', 'quero quitar', 'recibo', 'imposto de renda', 'mensalidade paga',
      'declaração de pagamento', 'baixa no sistema', 'dados para nota fiscal', 'erro no valor',
      'pagamento duplicado', 'paguei', 'pagamento em atraso', 'forma de pagamento',
      'data de vencimento', 'parcelamento', 'adiantar parcelas', 'comprovante de quitação',
      'cadastro do cpf na nota', 'dúvida sobre boleto', 'boleto errado', 'paguei mas não foi reconhecido',
      'enviei o comprovante', 'quero a nota fiscal', 'como pegar a segunda via',
      'já quitei o curso', 'consigo declarar', 'meu boleto veio com valor errado',
      'como faço pra adiantar', 'o pagamento foi feito', 'confirmação de pagamento'
    ];
    
    // Palavras-chave para SECRETARIA PÓS (prioridade alta - específico para pós-graduação)
    const secretariaPosKeywords = [
      'certificado da pós', 'meu certificado ficou pronto', 'certificação da pós',
      'pós-graduação', 'finalizei a pós', 'terminar a pós', 'curso de pós',
      'conclusão da pós', 'documento da pós', 'tempo de certificação',
      'prazo do certificado', 'emissão do certificado', 'como recebo o certificado',
      'documentação da pós', 'preciso do certificado da pós', 'preciso apresentar o certificado',
      'defesa do tcc da pós', 'histórico da pós', 'rematrícula da pós',
      'segunda via do certificado de pós', 'certificado de pós-graduação',
      'diploma da pós', 'como peço o certificado da minha pós', 'já finalizei a pós',
      'estou na etapa final da pós', 'certificado para empresa', 'comprovação da pós'
    ];
    
    // Palavras-chave para COMERCIAL (contexto educacional)
    const comercialKeywords = [
      'curso', 'cursos', 'valores', 'mensalidade', 'preço', 'preços', 'promoção',
      'inscrição', 'matrícula', 'matricular', 'oferta', 'condição', 'desconto',
      'quero estudar', 'quero começar', 'modalidade', 'formação', 'faculdade',
      'pós-graduação', 'segunda licenciatura', 'formação pedagógica', 'graduação',
      'quero saber mais', 'como funciona', 'interesse', 'sou novo', 'sou nova',
      'quero fazer', 'gostaria de saber', 'quero me matricular', 'tem curso',
      'vocês oferecem', 'quero estudar online', 'estou procurando', 'captação'
    ];
    
    // Verificar palavras-chave de secretaria pós PRIMEIRO (mais específico que secretaria geral)
    if (secretariaPosKeywords.some(keyword => content.includes(keyword))) {
      return 'secretaria_pos';
    }
    
    // Verificar palavras-chave de financeiro aluno (questões administrativas financeiras específicas)
    if (financeiroKeywords.some(keyword => content.includes(keyword))) {
      return 'financeiro';
    }
    
    // Verificar palavras-chave de tutoria (maior especificidade pedagógica)
    if (tutoriaKeywords.some(keyword => content.includes(keyword))) {
      return 'tutoria';
    }
    
    // Verificar palavras-chave de secretaria
    if (secretariaKeywords.some(keyword => content.includes(keyword))) {
      return 'secretaria';
    }
    
    // Verificar palavras-chave de suporte
    if (suporteKeywords.some(keyword => content.includes(keyword))) {
      return 'suporte';
    }
    
    // Verificar palavras-chave de cobrança
    if (cobrancaKeywords.some(keyword => content.includes(keyword))) {
      return 'cobranca';
    }
    
    // Verificar palavras-chave comerciais específicas
    if (comercialKeywords.some(keyword => content.includes(keyword))) {
      return 'comercial';
    }
    
    // Padrão: comercial
    return 'comercial';
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string, messageContent?: string): Promise<Deal> {
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    // Determinar macrosetor baseado na mensagem e canal ou usar o fornecido
    let determinedMacrosetor = macrosetor || this.detectMacrosetor(messageContent, canalOrigem);
    let stage = 'prospecting';
    let dealName = `${contact.name || 'Contato'} - Novo Lead`;
    let initialValue = 100000; // R$ 1.000,00 padrão
    let probability = 20;

    // Definir configurações baseadas no macrosetor
    switch (determinedMacrosetor) {
      case 'comercial':
        stage = 'prospecting';
        dealName = `${contact.name || 'Contato'} - Lead Comercial`;
        probability = 25;
        // Valor baseado no canal
        switch (canalOrigem?.toLowerCase()) {
          case 'whatsapp': initialValue = 150000; break;
          case 'instagram': initialValue = 120000; break;
          case 'facebook': initialValue = 100000; break;
          case 'email': initialValue = 200000; break;
          default: initialValue = 100000;
        }
        break;
      case 'suporte':
        stage = 'novo';
        dealName = `${contact.name || 'Contato'} - Suporte`;
        initialValue = 0; // Suporte não tem valor monetário
        probability = 80; // Alta probabilidade de resolução
        break;
      case 'cobranca':
        stage = 'debito_detectado';
        dealName = `${contact.name || 'Contato'} - Cobrança`;
        initialValue = 50000; // R$ 500,00 valor médio de cobrança
        probability = 60; // Probabilidade média de quitação
        break;
      case 'secretaria':
        stage = 'solicitacao';
        dealName = `${contact.name || 'Contato'} - Secretaria`;
        initialValue = 0; // Secretaria não tem valor monetário
        probability = 90; // Alta probabilidade de conclusão
        break;
      case 'tutoria':
        stage = 'duvida_recebida';
        dealName = `${contact.name || 'Contato'} - Tutoria`;
        initialValue = 0; // Tutoria não tem valor monetário
        probability = 85; // Alta probabilidade de resolução
        break;
      case 'financeiro':
        stage = 'solicitacao_recebida';
        dealName = `${contact.name || 'Contato'} - Financeiro`;
        initialValue = 0; // Financeiro não tem valor monetário direto
        probability = 95; // Muito alta probabilidade de conclusão
        break;
      case 'secretaria_pos':
        stage = 'solicitacao_certificado';
        dealName = `${contact.name || 'Contato'} - Secretaria Pós`;
        initialValue = 0; // Secretaria Pós não tem valor monetário
        probability = 90; // Alta probabilidade de conclusão
        break;
    }

    // Classificar lead baseado no conteúdo da mensagem e canal
    const leadClassification = this.classifyLeadByMessage(messageContent, canalOrigem);
    
    // Gerar tags automáticas baseadas no contexto
    const automaticTags = this.generateAutomaticTags(canalOrigem, determinedMacrosetor, messageContent, leadClassification);
    
    // Ajustar probabilidade baseada na classificação do lead
    if (leadClassification === 'quente') probability = Math.min(probability + 20, 95);
    if (leadClassification === 'frio') probability = Math.max(probability - 15, 25);

    const dealData: InsertDeal = {
      name: dealName,
      contactId: contactId,
      macrosetor: determinedMacrosetor,
      stage: stage,
      value: initialValue,
      probability: probability,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'unknown',
      tags: JSON.stringify(automaticTags),
      notes: `Deal criado automaticamente para ${contact.name || 'Contato'} via ${canalOrigem || 'sistema'} - Setor: ${determinedMacrosetor} - Classificação: ${leadClassification} em ${new Date().toLocaleDateString('pt-BR')}${messageContent ? `\nPrimeira mensagem: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"` : ''}`,
      isActive: true
    };

    const newDeal = await this.createDeal(dealData);
    
    console.log(`🎯 Deal criado automaticamente: ID ${newDeal.id} para contato ${contact.name} - Setor: ${determinedMacrosetor} (${canalOrigem}) - Lead ${leadClassification}`);
    
    return newDeal;
  }

  // Classify lead based on message content and urgency
  private classifyLeadByMessage(messageContent?: string, canalOrigem?: string): 'frio' | 'morno' | 'quente' {
    if (!messageContent) return this.classifyLead(canalOrigem);
    
    const content = messageContent.toLowerCase();
    
    // Hot lead indicators (urgency, direct purchase intent)
    const hotIndicators = [
      'urgente', 'preciso agora', 'hoje mesmo', 'rápido', 'imediato',
      'quero comprar', 'vou fechar', 'aceito', 'pode enviar',
      'qual o valor', 'como pago', 'tem desconto', 'posso pagar',
      'vencimento hoje', 'prazo final', 'último dia'
    ];
    
    // Warm lead indicators (interest, questions)
    const warmIndicators = [
      'tenho interesse', 'gostaria de saber', 'pode me ajudar',
      'preciso de informação', 'dúvida', 'como funciona',
      'quais os cursos', 'valor do curso', 'formas de pagamento',
      'quando começa', 'certificado', 'duration'
    ];
    
    // Cold lead indicators (complaints, problems, support)
    const coldIndicators = [
      'problema', 'erro', 'não funciona', 'reclamação',
      'cancelar', 'insatisfeito', 'ruim', 'péssimo'
    ];
    
    if (hotIndicators.some(indicator => content.includes(indicator))) {
      return 'quente';
    }
    
    if (warmIndicators.some(indicator => content.includes(indicator))) {
      return 'morno';
    }
    
    if (coldIndicators.some(indicator => content.includes(indicator))) {
      return 'frio';
    }
    
    // Fallback to channel-based classification
    return this.classifyLead(canalOrigem);
  }

  // Generate automatic tags based on context
  private generateAutomaticTags(canalOrigem?: string, macrosetor?: string, messageContent?: string, leadClassification?: string): string[] {
    const tags: string[] = [];
    
    // Channel tags
    if (canalOrigem) {
      switch (canalOrigem) {
        case 'whatsapp':
          tags.push('Lead WhatsApp', 'Chat Direto');
          break;
        case 'instagram':
          tags.push('Lead Instagram', 'Rede Social');
          break;
        case 'email':
          tags.push('Lead Email', 'Contato Formal');
          break;
        case 'sms':
          tags.push('Lead SMS', 'Mensagem Texto');
          break;
        case 'voice':
          tags.push('Lead Telefone', 'Contato Direto');
          break;
        default:
          tags.push('Lead Digital');
      }
    }
    
    // Sector tags
    if (macrosetor) {
      tags.push(`Setor ${macrosetor.charAt(0).toUpperCase() + macrosetor.slice(1)}`);
    }
    
    // Lead classification tags
    if (leadClassification) {
      switch (leadClassification) {
        case 'quente':
          tags.push('Lead Quente', 'Alta Prioridade');
          break;
        case 'morno':
          tags.push('Lead Morno', 'Interesse Médio');
          break;
        case 'frio':
          tags.push('Lead Frio', 'Acompanhar');
          break;
      }
    }
    
    // Content-based tags
    if (messageContent) {
      const content = messageContent.toLowerCase();
      
      if (content.includes('curso') || content.includes('graduação') || content.includes('pós')) {
        tags.push('Interesse Acadêmico');
      }
      
      if (content.includes('valor') || content.includes('preço') || content.includes('pagamento')) {
        tags.push('Consulta Financeira');
      }
      
      if (content.includes('urgente') || content.includes('hoje') || content.includes('agora')) {
        tags.push('Urgente');
      }
      
      if (content.includes('problema') || content.includes('erro') || content.includes('ajuda')) {
        tags.push('Suporte Necessário');
      }
    }
    
    // Always add automatic tag
    tags.push('Automático');
    
    // Add timestamp tag
    const now = new Date();
    tags.push(`Criado ${now.toLocaleDateString('pt-BR')}`);
    
    return tags;
  }

  // Team assignment operations
  async assignConversationToTeam(conversationId: number, teamId: number, method: 'automatic' | 'manual'): Promise<void> {
    await db.update(conversations)
      .set({
        assignedTeamId: teamId,
        assignmentMethod: method,
        assignedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async assignConversationToUser(conversationId: number, userId: number, method: 'automatic' | 'manual'): Promise<void> {
    await db.update(conversations)
      .set({
        assignedUserId: userId,
        assignmentMethod: method,
        assignedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async getTeamByMacrosetor(macrosetor: string): Promise<Team | undefined> {
    const result = await db.select()
      .from(teams)
      .where(and(eq(teams.macrosetor, macrosetor), eq(teams.isActive, true)))
      .limit(1);
    
    return result[0];
  }

  async getAvailableUserFromTeam(teamId: number): Promise<SystemUser | undefined> {
    const result = await db.select({
      id: systemUsers.id,
      username: systemUsers.username,
      displayName: systemUsers.displayName,
      email: systemUsers.email,
      isOnline: systemUsers.isOnline,
      lastLoginAt: systemUsers.lastLoginAt,
      createdAt: systemUsers.createdAt,
      updatedAt: systemUsers.updatedAt
    })
      .from(userTeams)
      .innerJoin(systemUsers, eq(userTeams.userId, systemUsers.id))
      .where(and(
        eq(userTeams.teamId, teamId),
        eq(userTeams.isActive, true),
        eq(systemUsers.isOnline, true)
      ))
      .orderBy(systemUsers.lastLoginAt)
      .limit(1);
    
    return result[0];
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await db.select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      color: teams.color,
      macrosetor: teams.macrosetor,
      isActive: teams.isActive,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt
    })
      .from(userTeams)
      .innerJoin(teams, eq(userTeams.teamId, teams.id))
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.isActive, true),
        eq(teams.isActive, true)
      ));
    
    return result;
  }

  async addUserToTeam(userTeam: InsertUserTeam): Promise<UserTeam> {
    const result = await db.insert(userTeams).values(userTeam).returning();
    return result[0];
  }

  async removeUserFromTeam(userId: number, teamId: number): Promise<void> {
    await db.update(userTeams)
      .set({ isActive: false })
      .where(and(
        eq(userTeams.userId, userId),
        eq(userTeams.teamId, teamId)
      ));
  }

  // CRUD operations for teams
  async getAllTeams(): Promise<Team[]> {
    const result = await db.select()
      .from(teams)
      .where(eq(teams.isActive, true))
      .orderBy(teams.name);
    
    return result;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const result = await db.update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    return result[0];
  }

  async deleteTeam(id: number): Promise<void> {
    await db.update(teams)
      .set({ isActive: false })
      .where(eq(teams.id, id));
  }

  // Conversation assignment queries
  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    const result = await db.select()
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.assignedTeamId, teamId))
      .orderBy(desc(conversations.lastMessageAt));
    
    // Transform to match ConversationWithContact type
    return result.map(row => ({
      ...row.conversations,
      contact: row.contacts,
      messages: [] // Will be populated separately if needed
    }));
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    const result = await db.select({
      id: conversations.id,
      contactId: conversations.contactId,
      channel: conversations.channel,
      status: conversations.status,
      lastMessageAt: conversations.lastMessageAt,
      assignedTeamId: conversations.assignedTeamId,
      assignedUserId: conversations.assignedUserId,
      assignmentMethod: conversations.assignmentMethod,
      assignedAt: conversations.assignedAt,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      contact: {
        id: contacts.id,
        name: contacts.name,
        phone: contacts.phone,
        email: contacts.email,
        isOnline: contacts.isOnline,
        profileImageUrl: contacts.profileImageUrl,
        canalOrigem: contacts.canalOrigem,
        nomeCanal: contacts.nomeCanal,
        idCanal: contacts.idCanal,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt
      }
    })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.assignedUserId, userId))
      .orderBy(desc(conversations.lastMessageAt));
    
    // Transform to match ConversationWithContact type
    return result.map(row => ({
      ...row,
      messages: [] // Will be populated separately if needed
    }));
  }
}

export const storage = new DatabaseStorage();
