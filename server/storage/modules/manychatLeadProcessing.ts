import { BaseStorage } from '../base/BaseStorage';
import { contacts, conversations, messages, type InsertContact, type InsertConversation, type InsertMessage } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class ManychatLeadProcessing extends BaseStorage {
  // Integration with EduChat contact system
  async processManychatLead(webhookData: any, integrationId: number): Promise<{ contactId?: number; conversationId?: number }> {
    try {
      const { first_name, last_name, email, phone } = webhookData.user || {};
      
      if (!first_name && !email && !phone) {
        throw new Error('Insufficient user data in webhook');
      }

      // Create or find contact
      const contactData: InsertContact = {
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Lead Manychat',
        email: email || undefined,
        phone: phone || undefined,
        canalOrigem: 'manychat',
        nomeCanal: 'Manychat Lead Capture',
        userIdentity: email || phone || `manychat_${webhookData.user?.id}`,
        tags: ['manychat', 'lead-capture']
      };

      // Check if contact already exists by searching for user identity
      const existingContacts = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.userIdentity, contactData.userIdentity))
        .limit(1);
      
      let contact = existingContacts[0];
      
      if (!contact) {
        // Create new contact
        const newContacts = await this.db
          .insert(contacts)
          .values(contactData)
          .returning();
        contact = newContacts[0];
      }

      // Find or create conversation
      const existingConversations = await this.db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.contactId, contact.id),
          eq(conversations.channel, 'manychat'),
          eq(conversations.status, 'open')
        ))
        .limit(1);
      
      let conversation = existingConversations[0];
      
      if (!conversation) {
        const newConversations = await this.db
          .insert(conversations)
          .values({
            contactId: contact.id,
            channel: 'manychat',
            status: 'open',
            teamType: 'comercial',
            assignmentMethod: 'automatic'
          })
          .returning();
        conversation = newConversations[0];
      }

      // Create message in conversation
      const messageContent = webhookData.text || 'Novo lead capturado via Manychat';
      await this.db
        .insert(messages)
        .values({
          conversationId: conversation.id,
          content: messageContent,
          isFromContact: true,
          messageType: 'text',
          metadata: {
            source: 'manychat',
            webhookData: webhookData
          }
        });

      return {
        contactId: contact.id,
        conversationId: conversation.id
      };
    } catch (error) {
      console.error('Error processing Manychat lead:', error);
      throw error;
    }
  }
} 