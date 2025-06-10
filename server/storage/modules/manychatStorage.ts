import { BaseStorage } from '../base/BaseStorage';
import { 
  manychatIntegrations, 
  manychatWebhookLogs,
  type ManychatIntegration, 
  type InsertManychatIntegration,
  type ManychatWebhookLog,
  type InsertManychatWebhookLog
} from '../../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Manychat integration storage module
 */
export class ManychatStorage extends BaseStorage {
  
  // Integrations management
  async getIntegrations(): Promise<ManychatIntegration[]> {
    return this.db.select().from(manychatIntegrations).orderBy(desc(manychatIntegrations.createdAt));
  }

  async getIntegration(id: number): Promise<ManychatIntegration | undefined> {
    const results = await this.db
      .select()
      .from(manychatIntegrations)
      .where(eq(manychatIntegrations.id, id))
      .limit(1);
    
    return results[0];
  }

  async getActiveIntegration(): Promise<ManychatIntegration | undefined> {
    const results = await this.db
      .select()
      .from(manychatIntegrations)
      .where(eq(manychatIntegrations.isActive, true))
      .limit(1);
    
    return results[0];
  }

  async createIntegration(integration: InsertManychatIntegration): Promise<ManychatIntegration> {
    // Deactivate other integrations if this one is being set as active
    if (integration.isActive) {
      await this.db
        .update(manychatIntegrations)
        .set({ isActive: false })
        .where(eq(manychatIntegrations.isActive, true));
    }

    const results = await this.db
      .insert(manychatIntegrations)
      .values({
        ...integration,
        updatedAt: new Date()
      })
      .returning();
    
    return results[0];
  }

  async updateIntegration(id: number, updates: Partial<InsertManychatIntegration>): Promise<ManychatIntegration> {
    // Deactivate other integrations if this one is being set as active
    if (updates.isActive) {
      await this.db
        .update(manychatIntegrations)
        .set({ isActive: false })
        .where(and(
          eq(manychatIntegrations.isActive, true),
          eq(manychatIntegrations.id, id)
        ));
    }

    const results = await this.db
      .update(manychatIntegrations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id))
      .returning();
    
    return results[0];
  }

  async deleteIntegration(id: number): Promise<void> {
    await this.db
      .delete(manychatIntegrations)
      .where(eq(manychatIntegrations.id, id));
  }

  async updateIntegrationStatus(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      // Deactivate other integrations
      await this.db
        .update(manychatIntegrations)
        .set({ isActive: false })
        .where(eq(manychatIntegrations.isActive, true));
    }

    await this.db
      .update(manychatIntegrations)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id));
  }

  async updateLastTest(id: number, success: boolean, error?: string): Promise<void> {
    await this.db
      .update(manychatIntegrations)
      .set({
        lastTestAt: new Date(),
        errorCount: success ? 0 : undefined,
        lastError: error || null,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id));
  }

  async updateLastSync(id: number, success: boolean, error?: string): Promise<void> {
    await this.db
      .update(manychatIntegrations)
      .set({
        lastSyncAt: new Date(),
        errorCount: success ? 0 : undefined,
        lastError: error || null,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id));
  }

  // Webhook logs management
  async createWebhookLog(log: InsertManychatWebhookLog): Promise<ManychatWebhookLog> {
    const results = await this.db
      .insert(manychatWebhookLogs)
      .values(log)
      .returning();
    
    return results[0];
  }

  async getWebhookLogs(integrationId?: number, limit: number = 50): Promise<ManychatWebhookLog[]> {
    if (integrationId) {
      return this.db
        .select()
        .from(manychatWebhookLogs)
        .where(eq(manychatWebhookLogs.integrationId, integrationId))
        .orderBy(desc(manychatWebhookLogs.createdAt))
        .limit(limit);
    }
    
    return this.db
      .select()
      .from(manychatWebhookLogs)
      .orderBy(desc(manychatWebhookLogs.createdAt))
      .limit(limit);
  }

  async markWebhookProcessed(id: number, processed: boolean, error?: string): Promise<void> {
    await this.db
      .update(manychatWebhookLogs)
      .set({
        processed,
        processedAt: processed ? new Date() : null,
        error: error || null
      })
      .where(eq(manychatWebhookLogs.id, id));
  }

  async getUnprocessedWebhooks(integrationId?: number): Promise<ManychatWebhookLog[]> {
    if (integrationId) {
      return this.db
        .select()
        .from(manychatWebhookLogs)
        .where(and(
          eq(manychatWebhookLogs.processed, false),
          eq(manychatWebhookLogs.integrationId, integrationId)
        ))
        .orderBy(manychatWebhookLogs.createdAt);
    }
    
    return this.db
      .select()
      .from(manychatWebhookLogs)
      .where(eq(manychatWebhookLogs.processed, false))
      .orderBy(manychatWebhookLogs.createdAt);
  }

  // Helper methods for testing Manychat API
  async testManychatConnection(apiKey: string, pageAccessToken: string): Promise<any> {
    try {
      // Test basic API connectivity
      const response = await fetch('https://api.manychat.com/fb/page/getInfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Connection failed'
      };
    }
  }

  // Integration with EduChat contact system
  async processManychatLead(webhookData: any, integrationId: number): Promise<{ contactId?: number; conversationId?: number }> {
    try {
      const { first_name, last_name, email, phone } = webhookData.user || {};
      
      if (!first_name && !email && !phone) {
        throw new Error('Insufficient user data in webhook');
      }

      // Create or find contact
      const contactData = {
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
        .from(this.schema.contacts)
        .where(eq(this.schema.contacts.userIdentity, contactData.userIdentity))
        .limit(1);
      
      let contact = existingContacts[0];
      
      if (!contact) {
        // Create new contact
        const newContacts = await this.db
          .insert(this.schema.contacts)
          .values(contactData)
          .returning();
        contact = newContacts[0];
      }

      // Find or create conversation
      const existingConversations = await this.db
        .select()
        .from(this.schema.conversations)
        .where(and(
          eq(this.schema.conversations.contactId, contact.id),
          eq(this.schema.conversations.channel, 'manychat'),
          eq(this.schema.conversations.status, 'open')
        ))
        .limit(1);
      
      let conversation = existingConversations[0];
      
      if (!conversation) {
        const newConversations = await this.db
          .insert(this.schema.conversations)
          .values({
            contactId: contact.id,
            channel: 'manychat',
            status: 'open',
            macrosetor: 'comercial',
            assignmentMethod: 'automatic'
          })
          .returning();
        conversation = newConversations[0];
      }

      // Create message in conversation
      const messageContent = webhookData.text || 'Novo lead capturado via Manychat';
      await this.db
        .insert(this.schema.messages)
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