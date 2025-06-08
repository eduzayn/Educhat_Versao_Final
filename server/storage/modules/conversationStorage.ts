import { BaseStorage } from "../base/BaseStorage";
import {
  conversations,
  contacts,
  channels,
  messages,
  type Conversation,
  type InsertConversation,
  type ConversationWithContact,
} from "@shared/schema";

/**
 * Conversation storage module
 */
export class ConversationStorage extends BaseStorage {
  async getConversations(limit = 50, offset = 0): Promise<ConversationWithContact[]> {
    try {
      const conversationsData = await this.db
        .select({
          conversations: conversations,
          contacts: contacts,
          channels: channels
        })
        .from(conversations)
        .leftJoin(contacts, this.eq(conversations.contactId, contacts.id))
        .leftJoin(channels, this.eq(conversations.channelId, channels.id))
        .where(
          this.and(
            this.isNotNull(contacts.phone),
            this.sql`length(${contacts.phone}) >= 10`
          )
        )
        .orderBy(this.desc(conversations.lastMessageAt))
        .limit(limit)
        .offset(offset);

      const conversationIds = conversationsData
        .filter(row => row.conversations)
        .map(row => row.conversations!.id);
      
      const lastMessagesMap = new Map<number, any>();
      
      if (conversationIds.length > 0) {
        const lastMessageIds = await this.db
          .select({
            conversationId: messages.conversationId,
            lastMessageId: this.sql<number>`MAX(${messages.id})`.as('lastMessageId')
          })
          .from(messages)
          .where(this.sql`${messages.conversationId} IN (${this.sql.join(conversationIds, this.sql`, `)})`)
          .groupBy(messages.conversationId);

        if (lastMessageIds.length > 0) {
          const messageIds = lastMessageIds.map(row => row.lastMessageId);
          const lastMessages = await this.db
            .select()
            .from(messages)
            .where(this.sql`${messages.id} IN (${this.sql.join(messageIds, this.sql`, `)})`);

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
    } catch (error) {
      this.handleError(error, 'getConversations');
    }
  }

  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    try {
      const [conversation] = await this.db
        .select({
          conversations: conversations,
          contacts: contacts,
          channels: channels
        })
        .from(conversations)
        .leftJoin(contacts, this.eq(conversations.contactId, contacts.id))
        .leftJoin(channels, this.eq(conversations.channelId, channels.id))
        .where(this.eq(conversations.id, id));

      if (!conversation?.conversations || !conversation?.contacts) return undefined;

      const conversationMessages = await this.db
        .select()
        .from(messages)
        .where(this.eq(messages.conversationId, id))
        .orderBy(this.desc(messages.sentAt))
        .limit(30);

      return {
        ...conversation.conversations,
        contact: conversation.contacts,
        channelInfo: conversation.channels || undefined,
        messages: conversationMessages,
      };
    } catch (error) {
      this.handleError(error, 'getConversation');
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      this.validateRequired(conversation, ['contactId', 'channel'], 'createConversation');
      
      const [newConversation] = await this.db
        .insert(conversations)
        .values(conversation)
        .returning();
      return newConversation;
    } catch (error) {
      this.handleError(error, 'createConversation');
    }
  }

  async updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation> {
    try {
      const [updatedConversation] = await this.db
        .update(conversations)
        .set({ ...conversation, updatedAt: new Date() })
        .where(this.eq(conversations.id, id))
        .returning();
      return updatedConversation;
    } catch (error) {
      this.handleError(error, 'updateConversation');
    }
  }

  async getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined> {
    try {
      const [conversation] = await this.db
        .select()
        .from(conversations)
        .where(
          this.and(
            this.eq(conversations.contactId, contactId),
            this.eq(conversations.channel, channel)
          )
        );
      return conversation;
    } catch (error) {
      this.handleError(error, 'getConversationByContactAndChannel');
    }
  }

  async getConversationsByTeam(teamId: number): Promise<ConversationWithContact[]> {
    try {
      const conversationsData = await this.db
        .select({
          conversations: conversations,
          contacts: contacts,
          channels: channels
        })
        .from(conversations)
        .leftJoin(contacts, this.eq(conversations.contactId, contacts.id))
        .leftJoin(channels, this.eq(conversations.channelId, channels.id))
        .where(this.eq(conversations.assignedTeamId, teamId))
        .orderBy(this.desc(conversations.lastMessageAt));

      return conversationsData
        .filter(row => row.conversations && row.contacts)
        .map(row => ({
          ...row.conversations!,
          contact: row.contacts!,
          channelInfo: row.channels || undefined,
          messages: [],
        }));
    } catch (error) {
      this.handleError(error, 'getConversationsByTeam');
    }
  }

  async getConversationsByUser(userId: number): Promise<ConversationWithContact[]> {
    try {
      const conversationsData = await this.db
        .select({
          conversations: conversations,
          contacts: contacts,
          channels: channels
        })
        .from(conversations)
        .leftJoin(contacts, this.eq(conversations.contactId, contacts.id))
        .leftJoin(channels, this.eq(conversations.channelId, channels.id))
        .where(this.eq(conversations.assignedUserId, userId))
        .orderBy(this.desc(conversations.lastMessageAt));

      return conversationsData
        .filter(row => row.conversations && row.contacts)
        .map(row => ({
          ...row.conversations!,
          contact: row.contacts!,
          channelInfo: row.channels || undefined,
          messages: [],
        }));
    } catch (error) {
      this.handleError(error, 'getConversationsByUser');
    }
  }

  async assignConversationToTeam(conversationId: number, teamId: number | null, method: 'automatic' | 'manual'): Promise<void> {
    try {
      await this.db
        .update(conversations)
        .set({
          assignedTeamId: teamId,
          assignmentMethod: method,
          updatedAt: new Date()
        })
        .where(this.eq(conversations.id, conversationId));
    } catch (error) {
      this.handleError(error, 'assignConversationToTeam');
    }
  }

  async assignConversationToUser(conversationId: number, userId: number | null, method: 'automatic' | 'manual'): Promise<void> {
    try {
      await this.db
        .update(conversations)
        .set({
          assignedUserId: userId,
          assignmentMethod: method,
          updatedAt: new Date()
        })
        .where(this.eq(conversations.id, conversationId));
    } catch (error) {
      this.handleError(error, 'assignConversationToUser');
    }
  }
}