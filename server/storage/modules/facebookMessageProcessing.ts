import { BaseStorage } from '../base/BaseStorage';
import { contacts, conversations, messages, InsertContact, InsertConversation, InsertMessage } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class FacebookMessageProcessing extends BaseStorage {
  async processFacebookMessage(webhookData: any, integrationId: number): Promise<{ contactId?: number; conversationId?: number }> {
    const { platform, sender, recipient, message, timestamp } = webhookData;
    const senderId = sender.id;
    const senderName = sender.name || sender.username || `User ${senderId}`;
    let contact = await this.db.select().from(contacts).where(eq(contacts.phone, senderId)).limit(1);
    let contactId: number;
    if (contact.length === 0) {
      const newContact: InsertContact = {
        name: senderName,
        phone: senderId,
        email: null,
        profileImageUrl: sender.profile_pic || null
      };
      const createdContact = await this.db.insert(contacts).values(newContact).returning();
      contactId = createdContact[0].id;
    } else {
      contactId = contact[0].id;
    }
    let conversation = await this.db.select().from(conversations).where(and(
      eq(conversations.contactId, contactId),
      eq(conversations.channel, platform === 'facebook' ? 'facebook-messenger' : 'instagram-direct')
    )).limit(1);
    let conversationId: number;
    if (conversation.length === 0) {
      const newConversation: InsertConversation = {
        contactId,
        channel: platform === 'facebook' ? 'facebook-messenger' : 'instagram-direct',
        status: 'open',
        priority: 'medium',
        isRead: false,
        metadata: { platform, integrationId, recipientId: recipient?.id, threadId: webhookData.threadId }
      };
      const createdConversation = await this.db.insert(conversations).values(newConversation).returning();
      conversationId = createdConversation[0].id;
    } else {
      conversationId = conversation[0].id;
      await this.db.update(conversations).set({ isRead: false, updatedAt: new Date(), lastMessageAt: new Date(timestamp) }).where(eq(conversations.id, conversationId));
    }
    const newMessage: InsertMessage = {
      conversationId,
      content: message.text || '[Mídia]',
      isFromContact: true,
      messageType: message.attachments?.length > 0 ? 'media' : 'text',
      metadata: { platform, messageId: message.mid, timestamp, attachments: message.attachments || [], originalData: webhookData }
    };
    await this.db.insert(messages).values(newMessage);
    return { contactId, conversationId };
  }
} 