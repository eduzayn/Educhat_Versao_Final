import {
  contacts,
  conversations,
  messages,
  contactTags,
  type Contact,
  type InsertContact,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ContactTag,
  type InsertContactTag,
  type ConversationWithContact,
  type ContactWithTags,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";

export interface IStorage {
  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContactWithTags(id: number): Promise<ContactWithTags | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  searchContacts(query: string): Promise<Contact[]>;
  updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void>;

  // Conversation operations
  getConversations(): Promise<ConversationWithContact[]>;
  getConversation(id: number): Promise<ConversationWithContact | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;
  getConversationByContactAndChannel(contactId: number, channel: string): Promise<Conversation | undefined>;

  // Message operations
  getMessages(conversationId: number, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  markMessageAsDelivered(id: number): Promise<void>;

  // Contact tag operations
  getContactTags(contactId: number): Promise<ContactTag[]>;
  addContactTag(tag: InsertContactTag): Promise<ContactTag>;
  removeContactTag(contactId: number, tag: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
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
    return await db
      .select()
      .from(contacts)
      .where(
        or(
          ilike(contacts.name, `%${query}%`),
          ilike(contacts.email, `%${query}%`),
          ilike(contacts.phone, `%${query}%`)
        )
      );
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
  async getConversations(): Promise<ConversationWithContact[]> {
    const conversationsWithContacts = await db
      .select()
      .from(conversations)
      .leftJoin(contacts, eq(conversations.contactId, contacts.id))
      .orderBy(desc(conversations.lastMessageAt));

    const result: ConversationWithContact[] = [];
    
    for (const row of conversationsWithContacts) {
      if (row.conversations && row.contacts) {
        const lastMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, row.conversations.id))
          .orderBy(desc(messages.sentAt))
          .limit(1);

        result.push({
          ...row.conversations,
          contact: row.contacts,
          messages: lastMessages,
        });
      }
    }

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
  async getMessages(conversationId: number, limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sentAt))
      .limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        unreadCount: message.isFromContact ? 
          // Increment unread count if message is from contact
          db.select({ count: count() }).from(messages)
            .where(and(
              eq(messages.conversationId, message.conversationId),
              eq(messages.isFromContact, true),
              eq(messages.readAt, null)
            )) as any : undefined,
        updatedAt: new Date() 
      })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id));
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ deliveredAt: new Date() })
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
}

export const storage = new DatabaseStorage();
