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

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(teams.name);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(teamData)
      .returning();
    return team;
  }

  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({
        ...teamData,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
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

  // Automatic contact creation
  async findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact> {
    // First, try to find existing contact by userIdentity
    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userIdentity, userIdentity))
      .limit(1);

    if (existingContact) {
      return existingContact;
    }

    // If not found, create new contact
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
        lastSeenAt: contactData.lastSeenAt || null,
        canalOrigem: contactData.canalOrigem || null,
        nomeCanal: contactData.nomeCanal || null,
        idCanal: contactData.idCanal || null,
        userIdentity,
      })
      .returning();

    return newContact;
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
      'como estudar', 'metodologia de pesquisa', 'cronograma de estudos', 'planejamento de estudos',
      'disciplina', 'matéria', 'conteúdo', 'atividade acadêmica', 'tarefa', 'trabalho acadêmico',
      'tcc', 'monografia', 'projeto de pesquisa', 'pesquisa acadêmica', 'bibliografia', 'artigo científico',
      'avaliação', 'prova', 'nota', 'média', 'aprovação', 'reprovação',
      'calendário acadêmico', 'plano de estudos', 'acompanhamento acadêmico', 'mentoria'
    ];
    
    // Palavras-chave para SECRETARIA  
    const secretariaKeywords = [
      'documento', 'documentos', 'certidão', 'certificado', 'diploma', 'histórico escolar',
      'declaração de matrícula', 'atestado', 'comprovante', 'segunda via', 'requerimento',
      'solicitação de documento', 'protocolo', 'processo', 'tramitação', 'secretaria',
      'acadêmico', 'escolar', 'rematrícula', 'transferência',
      'aproveitamento', 'validação', 'reconhecimento', 'equivalência',
      'prazo', 'entrega', 'retirada', 'documentação', 'papelada',
      'burocracia', 'procedimento', 'como solicitar', 'onde retirar'
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
    
    // Verificar palavras-chave de tutoria PRIMEIRO (maior especificidade)
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
    }

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
      tags: JSON.stringify([canalOrigem || 'lead', 'automatico', determinedMacrosetor]),
      notes: `Deal criado automaticamente para ${contact.name || 'Contato'} via ${canalOrigem || 'sistema'} - Setor: ${determinedMacrosetor} em ${new Date().toLocaleDateString('pt-BR')}`,
      isActive: true
    };

    const newDeal = await this.createDeal(dealData);
    
    console.log(`🎯 Deal criado automaticamente: ID ${newDeal.id} para contato ${contact.name} - Setor: ${determinedMacrosetor} (${canalOrigem})`);
    
    return newDeal;
  }
}

export const storage = new DatabaseStorage();
