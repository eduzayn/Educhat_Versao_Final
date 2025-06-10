import { eq, and, desc } from 'drizzle-orm';
import { BaseStorage } from '../base/BaseStorage';
import {
  facebookIntegrations,
  facebookWebhookLogs,
  contacts,
  conversations,
  messages,
  FacebookIntegration,
  InsertFacebookIntegration,
  FacebookWebhookLog,
  InsertFacebookWebhookLog,
  Contact,
  InsertContact,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage
} from '../../../shared/schema';

/**
 * Facebook/Instagram integration storage module
 */
export class FacebookStorage extends BaseStorage {
  // Facebook Integration Management
  async getIntegrations(): Promise<FacebookIntegration[]> {
    try {
      const result = await this.db
        .select()
        .from(facebookIntegrations)
        .orderBy(desc(facebookIntegrations.createdAt));
      
      console.log(`📋 Facebook: ${result.length} integrações encontradas`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar integrações Facebook:', error);
      throw error;
    }
  }

  async getIntegration(id: number): Promise<FacebookIntegration | undefined> {
    try {
      const result = await this.db
        .select()
        .from(facebookIntegrations)
        .where(eq(facebookIntegrations.id, id))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('❌ Erro ao buscar integração Facebook:', error);
      throw error;
    }
  }

  async getActiveIntegration(): Promise<FacebookIntegration | undefined> {
    try {
      const result = await this.db
        .select()
        .from(facebookIntegrations)
        .where(eq(facebookIntegrations.isActive, true))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('❌ Erro ao buscar integração Facebook ativa:', error);
      throw error;
    }
  }

  async createIntegration(integration: InsertFacebookIntegration): Promise<FacebookIntegration> {
    try {
      const result = await this.db
        .insert(facebookIntegrations)
        .values(integration)
        .returning();
      
      console.log(`✅ Nova integração Facebook criada: ${result[0].name}`);
      return result[0];
    } catch (error) {
      console.error('❌ Erro ao criar integração Facebook:', error);
      throw error;
    }
  }

  async updateIntegration(id: number, updates: Partial<InsertFacebookIntegration>): Promise<FacebookIntegration> {
    try {
      const result = await this.db
        .update(facebookIntegrations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(facebookIntegrations.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Integração Facebook não encontrada');
      }
      
      console.log(`🔄 Integração Facebook atualizada: ${result[0].name}`);
      return result[0];
    } catch (error) {
      console.error('❌ Erro ao atualizar integração Facebook:', error);
      throw error;
    }
  }

  async deleteIntegration(id: number): Promise<void> {
    try {
      await this.db
        .delete(facebookIntegrations)
        .where(eq(facebookIntegrations.id, id));
      
      console.log(`🗑️ Integração Facebook removida: ${id}`);
    } catch (error) {
      console.error('❌ Erro ao remover integração Facebook:', error);
      throw error;
    }
  }

  async updateIntegrationStatus(id: number, isActive: boolean): Promise<void> {
    try {
      // Se ativando uma integração, desative as outras primeiro
      if (isActive) {
        await this.db
          .update(facebookIntegrations)
          .set({ isActive: false })
          .where(eq(facebookIntegrations.isActive, true));
      }
      
      await this.db
        .update(facebookIntegrations)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(facebookIntegrations.id, id));
      
      console.log(`🔄 Status da integração Facebook atualizado: ${id} -> ${isActive ? 'ativa' : 'inativa'}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da integração Facebook:', error);
      throw error;
    }
  }

  // Webhook Logs Management
  async createWebhookLog(log: InsertFacebookWebhookLog): Promise<FacebookWebhookLog> {
    try {
      const result = await this.db
        .insert(facebookWebhookLogs)
        .values(log)
        .returning();
      
      console.log(`📨 Log de webhook Facebook criado: ${result[0].webhookType} - ${result[0].platform}`);
      return result[0];
    } catch (error) {
      console.error('❌ Erro ao criar log de webhook Facebook:', error);
      throw error;
    }
  }

  async getWebhookLogs(integrationId?: number, limit: number = 50): Promise<FacebookWebhookLog[]> {
    try {
      let query = this.db
        .select()
        .from(facebookWebhookLogs)
        .orderBy(desc(facebookWebhookLogs.createdAt))
        .limit(limit);
      
      if (integrationId) {
        const result = await this.db
          .select()
          .from(facebookWebhookLogs)
          .where(eq(facebookWebhookLogs.integrationId, integrationId))
          .orderBy(desc(facebookWebhookLogs.createdAt))
          .limit(limit);
        return result;
      }
      
      const result = await query;
      console.log(`📋 ${result.length} logs de webhook Facebook encontrados`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar logs de webhook Facebook:', error);
      throw error;
    }
  }

  async markWebhookProcessed(id: number, processed: boolean, error?: string): Promise<void> {
    try {
      await this.db
        .update(facebookWebhookLogs)
        .set({ processed, error })
        .where(eq(facebookWebhookLogs.id, id));
      
      console.log(`✅ Webhook Facebook processado: ${id}`);
    } catch (error) {
      console.error('❌ Erro ao marcar webhook Facebook como processado:', error);
      throw error;
    }
  }

  async getUnprocessedWebhooks(integrationId?: number): Promise<FacebookWebhookLog[]> {
    try {
      let whereCondition = eq(facebookWebhookLogs.processed, false);
      
      if (integrationId) {
        whereCondition = and(
          eq(facebookWebhookLogs.processed, false),
          eq(facebookWebhookLogs.integrationId, integrationId)
        );
      }
      
      const query = this.db
        .select()
        .from(facebookWebhookLogs)
        .where(whereCondition)
        .orderBy(facebookWebhookLogs.createdAt);
      
      const result = await query;
      console.log(`📋 ${result.length} webhooks Facebook não processados encontrados`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar webhooks Facebook não processados:', error);
      throw error;
    }
  }

  // Facebook API Integration Methods
  async testFacebookConnection(accessToken: string): Promise<any> {
    try {
      console.log('🧪 Testando conexão Facebook...');
      
      const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Token de acesso inválido ou expirado. Verifique no painel do Facebook: Settings > Advanced > Security',
          message: 'Falha na autenticação',
          status: response.status
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'Permissões insuficientes. Verifique as permissões do aplicativo Facebook',
          message: 'Acesso negado',
          status: response.status
        };
      }

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `API Facebook retornou erro ${response.status}: ${errorData}`,
          message: 'Falha na conexão',
          status: response.status
        };
      }

      const data = await response.json();
      console.log('✅ Teste de conexão Facebook bem-sucedido');
      
      return {
        success: true,
        data,
        message: 'Conexão estabelecida com sucesso',
        status: response.status
      };
      
    } catch (error: any) {
      console.error('❌ Teste de conexão Facebook falhou:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na conexão',
        message: 'Falha na conexão',
        status: 500
      };
    }
  }

  async sendMessage(pageAccessToken: string, recipientId: string, message: string, platform: 'facebook' | 'instagram' = 'facebook'): Promise<any> {
    try {
      const url = platform === 'instagram' 
        ? 'https://graph.facebook.com/v18.0/me/messages'
        : 'https://graph.facebook.com/v18.0/me/messages';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Facebook API Error: ${result.error?.message || 'Unknown error'}`);
      }

      console.log(`📤 Mensagem enviada via ${platform}: ${recipientId}`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ Erro ao enviar mensagem via ${platform}:`, error);
      throw error;
    }
  }

  async replyToComment(pageAccessToken: string, commentId: string, message: string): Promise<any> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`
        },
        body: JSON.stringify({
          message: message
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Facebook API Error: ${result.error?.message || 'Unknown error'}`);
      }

      console.log(`💬 Resposta ao comentário enviada: ${commentId}`);
      return result;
      
    } catch (error: any) {
      console.error('❌ Erro ao responder comentário:', error);
      throw error;
    }
  }

  // Message Processing for Inbox Integration
  async processFacebookMessage(webhookData: any, integrationId: number): Promise<{ contactId?: number; conversationId?: number }> {
    try {
      console.log('📨 Processando mensagem Facebook/Instagram...');
      
      const { platform, sender, recipient, message, timestamp } = webhookData;
      const senderId = sender.id;
      const senderName = sender.name || sender.username || `User ${senderId}`;
      
      // Buscar ou criar contato
      let contact = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.externalId, senderId))
        .limit(1);
      
      let contactId: number;
      
      if (contact.length === 0) {
        const newContact: InsertContact = {
          name: senderName,
          externalId: senderId,
          source: platform,
          phone: null,
          email: null,
          profileImageUrl: sender.profile_pic || null,
          isActive: true,
          metadata: {
            platform,
            senderId,
            integrationId,
            originalData: sender
          }
        };
        
        const createdContact = await this.db
          .insert(contacts)
          .values(newContact)
          .returning();
        
        contactId = createdContact[0].id;
        console.log(`👤 Novo contato criado: ${senderName} (${platform})`);
      } else {
        contactId = contact[0].id;
      }
      
      // Buscar ou criar conversa
      let conversation = await this.db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.contactId, contactId),
          eq(conversations.source, platform)
        ))
        .limit(1);
      
      let conversationId: number;
      
      if (conversation.length === 0) {
        const newConversation: InsertConversation = {
          contactId,
          source: platform,
          status: 'open',
          priority: 'medium',
          isRead: false,
          metadata: {
            platform,
            integrationId,
            recipientId: recipient?.id,
            threadId: webhookData.threadId
          }
        };
        
        const createdConversation = await this.db
          .insert(conversations)
          .values(newConversation)
          .returning();
        
        conversationId = createdConversation[0].id;
        console.log(`💬 Nova conversa criada: ${platform} - ${senderName}`);
      } else {
        conversationId = conversation[0].id;
        
        // Atualizar conversa como não lida
        await this.db
          .update(conversations)
          .set({ 
            isRead: false,
            updatedAt: new Date(),
            lastMessageAt: new Date(timestamp)
          })
          .where(eq(conversations.id, conversationId));
      }
      
      // Criar mensagem
      const newMessage: InsertMessage = {
        conversationId,
        content: message.text || '[Mídia]',
        isFromContact: true,
        messageType: message.attachments?.length > 0 ? 'media' : 'text',
        metadata: {
          platform,
          messageId: message.mid,
          timestamp,
          attachments: message.attachments || [],
          originalData: webhookData
        }
      };
      
      await this.db
        .insert(messages)
        .values(newMessage);
      
      console.log(`✅ Mensagem ${platform} processada: ${contactId} -> ${conversationId}`);
      
      return { contactId, conversationId };
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem Facebook/Instagram:', error);
      throw error;
    }
  }
}