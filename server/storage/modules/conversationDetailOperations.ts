import { BaseStorage } from "../base/BaseStorage";
import { conversations, contacts, channels, messages, contactTags, deals, type ConversationWithContact } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export class ConversationDetailOperations extends BaseStorage {
  async getConversation(id: number): Promise<ConversationWithContact | undefined> {
    const [result] = await this.db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        channel: conversations.channel,
        channelId: conversations.channelId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: conversations.unreadCount,
        teamType: conversations.teamType,
        assignedTeamId: conversations.assignedTeamId,
        assignedUserId: conversations.assignedUserId,
        assignmentMethod: conversations.assignmentMethod,
        assignedAt: conversations.assignedAt,
        isRead: conversations.isRead,
        priority: conversations.priority,
        tags: conversations.tags,
        metadata: conversations.metadata,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        
        // Contact fields
        contact: {
          id: contacts.id,
          userIdentity: contacts.userIdentity,
          name: contacts.name,
          email: contacts.email,
          phone: contacts.phone,
          profileImageUrl: contacts.profileImageUrl,
          location: contacts.location,
          age: contacts.age,
          isOnline: contacts.isOnline,
          lastSeenAt: contacts.lastSeenAt,
          canalOrigem: contacts.canalOrigem,
          nomeCanal: contacts.nomeCanal,
          idCanal: contacts.idCanal,
          assignedUserId: contacts.assignedUserId,
          tags: contacts.tags,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt
        }
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.id, id))
      .limit(1);

    if (!result) return undefined;

    // Buscar mensagens da conversa
    const conversationMessages = await this.db
      .select()
      .from(messages)
      .where(and(
        eq(messages.conversationId, id),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));

    // Buscar canal se disponível
    let channelInfo = null;
    if (result.channelId) {
      [channelInfo] = await this.db
        .select()
        .from(channels)
        .where(eq(channels.id, result.channelId));
    }

    // Buscar tags do contato
    const contactTagsResult = await this.db
      .select({ tag: contactTags.tag })
      .from(contactTags)
      .where(eq(contactTags.contactId, result.contact.id));

    const tagsArray = contactTagsResult.map(t => t.tag);

    // Buscar deals do contato
    const contactDeals = await this.db
      .select()
      .from(deals)
      .where(and(
        eq(deals.contactId, result.contact.id),
        eq(deals.isActive, true)
      ))
      .orderBy(desc(deals.createdAt));

    return {
      ...result,
      contact: {
        ...result.contact,
        tags: tagsArray,
        deals: contactDeals
      },
      channelInfo: channelInfo || undefined,
      messages: conversationMessages || [],
      _count: { messages: result.unreadCount || 0 }
    } as ConversationWithContact;
  }
} 