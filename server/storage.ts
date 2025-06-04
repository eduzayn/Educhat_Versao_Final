import {
  users,
  contacts,
  conversations,
  messages,
  contactTags,
  quickReplies,
  systemUsers,
  teams,
  roles,
  channels,
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
  type SystemUser,
  type InsertSystemUser,
  type Team,
  type InsertTeam,
  type Role,
  type InsertRole,
  type Channel,
  type InsertChannel,
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

  // Statistics operations
  getTotalUnreadCount(): Promise<number>;
  
  // Contact unification operations
  unifyDuplicateContacts(): Promise<{ unified: number; kept: number; removed: number }>;
  getContactConversations(contactId: number): Promise<any[]>;
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
    console.log(`📋 getConversations OTIMIZADO chamado com limit=${limit}, offset=${offset}`);
    
    // Buscar apenas as conversas que precisamos com paginação eficiente
    const conversationsData = await db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
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

    console.log(`📊 Conversas encontradas com filtro: ${conversationsData.length}`);

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
        
        result.push({
          ...row.conversations,
          contact: row.contacts,
          messages: lastMessage ? [lastMessage] : [],
        });
      }
    }
    
    console.log(`📄 Resultado final otimizado: ${result.length} conversas retornadas`);
    
    return result;
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.id, id));

    if (!conversation?.conversations || !conversation?.contacts) return undefined;

    const conversationMessages = await this.getMessages(id);

    return {
      ...conversation.conversations,
      contact: conversation.contacts,
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
      
      console.log(`📊 Novo contador para conversa ${message.conversationId}:`, result[0]?.newCount);
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

  // Statistics operations
  async getTotalUnreadCount(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`sum(${conversations.unreadCount})` })
      .from(conversations);
    
    return result[0]?.total || 0;
  }

  // Unificar contatos duplicados baseado no número de telefone
  async unifyDuplicateContacts(): Promise<{ unified: number; kept: number; removed: number }> {
    console.log('🔍 Iniciando unificação de contatos duplicados...');
    
    // Buscar contatos agrupados por telefone
    const duplicatePhones = await db
      .select({
        phone: contacts.phone,
        contacts: sql<string>`json_agg(json_build_object('id', ${contacts.id}, 'name', ${contacts.name}, 'email', ${contacts.email}, 'createdAt', ${contacts.createdAt}))`
      })
      .from(contacts)
      .where(isNotNull(contacts.phone))
      .groupBy(contacts.phone)
      .having(sql`count(*) > 1`);

    let unifiedCount = 0;
    let removedCount = 0;

    for (const group of duplicatePhones) {
      const contactsList = JSON.parse(group.contacts);
      if (contactsList.length <= 1) continue;

      // Manter o contato mais antigo
      const mainContact = contactsList.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];

      const duplicateContacts = contactsList.filter((c: any) => c.id !== mainContact.id);

      console.log(`📞 Unificando contatos para telefone ${group.phone}:`, {
        principal: mainContact.name,
        duplicatas: duplicateContacts.map((c: any) => c.name)
      });

      // Atualizar conversas dos contatos duplicados para apontar para o principal
      for (const duplicate of duplicateContacts) {
        await db
          .update(conversations)
          .set({ contactId: mainContact.id })
          .where(eq(conversations.contactId, duplicate.id));

        // Remover contato duplicado
        await db
          .delete(contacts)
          .where(eq(contacts.id, duplicate.id));

        removedCount++;
      }

      unifiedCount++;
    }

    console.log(`✅ Unificação concluída: ${unifiedCount} grupos unificados, ${removedCount} contatos removidos`);
    
    return {
      unified: unifiedCount,
      kept: unifiedCount,
      removed: removedCount
    };
  }

  // Buscar todas as conversas de um contato (multi-canal)
  async getContactConversations(contactId: number): Promise<any[]> {
    const conversationsList = await db
      .select({
        conversation: conversations,
        contact: contacts,
        lastMessage: {
          id: messages.id,
          content: messages.content,
          timestamp: messages.timestamp,
          isFromMe: messages.isFromMe,
          messageType: messages.messageType
        }
      })
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .leftJoin(
        messages,
        sql`${messages.conversationId} = ${conversations.id} AND ${messages.id} = (
          SELECT ${messages.id} 
          FROM ${messages} 
          WHERE ${messages.conversationId} = ${conversations.id} 
          ORDER BY ${messages.timestamp} DESC 
          LIMIT 1
        )`
      )
      .where(eq(conversations.contactId, contactId))
      .orderBy(desc(conversations.updatedAt));

    return conversationsList.map(row => ({
      ...row.conversation,
      contact: row.contact,
      lastMessage: row.lastMessage
    }));
  }
}

export const storage = new DatabaseStorage();
