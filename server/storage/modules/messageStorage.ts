import { BaseStorage } from "../base/BaseStorage";
import { messages, conversations, type Message, type InsertMessage } from "../../../shared/schema";
import { eq, desc, and, isNull, lt, like, sql } from "drizzle-orm";
import crypto from 'crypto';

/**
 * Message storage module - manages messages and media handling
 */
export class MessageStorage extends BaseStorage {
  async getAllMessages(): Promise<Message[]> {
    return this.db.select().from(messages).orderBy(desc(messages.sentAt));
  }

  async getMessages(conversationId: number, limit = 15, offset = 0): Promise<Message[]> {
    try {
      // Para scroll infinito invertido: buscar mensagens mais recentes primeiro
      // Incluir mensagens deletadas para mostrar marca visual "Esta mensagem foi deletada"
      const result = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.sentAt)) // Ordem decrescente para scroll infinito invertido
        .limit(limit)
        .offset(offset);

      return result; // Retornar em ordem decrescente para o frontend processar
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      throw new Error('Falha ao buscar mensagens');
    }
  }

  async getMessagesBefore(conversationId: number, beforeId: number, limit = 10): Promise<Message[]> {
    try {
      // Primeiro, buscar a mensagem de referência para obter o timestamp
      const [beforeMessage] = await this.db
        .select({ sentAt: messages.sentAt })
        .from(messages)
        .where(eq(messages.id, beforeId))
        .limit(1);

      if (!beforeMessage) {
        return [];
      }

      // Buscar mensagens anteriores ao timestamp da mensagem de referência
      const result = await this.db
        .select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false),
          // Mensagens anteriores (sentAt menor que a mensagem de referência)
          lt(messages.sentAt, beforeMessage.sentAt)
        ))
        .orderBy(desc(messages.sentAt))
        .limit(limit);

      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens anteriores:', error);
      // Implementação simplificada como fallback usando ID
      const result = await this.db
        .select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false),
          // Usar ID como aproximação se timestamp falhar
          lt(messages.id, beforeId)
        ))
        .orderBy(desc(messages.sentAt))
        .limit(limit);

      return result;
    }
  }

  async getMessageMedia(messageId: number): Promise<string | null> {
    const [message] = await this.db.select({ 
      metadata: messages.metadata 
    }).from(messages).where(eq(messages.id, messageId));
    
    if (!message?.metadata || typeof message.metadata !== 'object') {
      return null;
    }
    
    const metadata = message.metadata as any;
    return metadata.fileUrl || metadata.mediaUrl || null;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await this.db.insert(messages).values(message).returning();
    
    // Calcular novo unread_count se a mensagem é do contato
    let unreadCountUpdate = {};
    if (newMessage.isFromContact) {
      const unreadCount = await this.db.select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, newMessage.conversationId),
          eq(messages.isFromContact, true),
          isNull(messages.readAt),
          eq(messages.isDeleted, false)
        ));
      
      unreadCountUpdate = { unreadCount: unreadCount.length };
    }
    
    // Atualizar a conversa com last_message_at e unread_count
    await this.db.update(conversations)
      .set({ 
        lastMessageAt: newMessage.sentAt,
        updatedAt: new Date(),
        ...unreadCountUpdate
      })
      .where(eq(conversations.id, newMessage.conversationId));
    
    return newMessage;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async markMessageAsRead(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        readAt: new Date()
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsUnread(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        readAt: null
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        deliveredAt: new Date()
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        isDeleted: true
      })
      .where(eq(messages.id, id));
  }

  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages)
      .where(eq(messages.whatsappMessageId, zapiMessageId));
    return message;
  }

  async getMessagesByMetadata(key: string, value: string): Promise<Message[]> {
    // Esta implementação é simplificada - pode ser melhorada com queries JSON mais específicas
    const allMessages = await this.db.select().from(messages)
      .where(isNull(messages.isDeleted));
    
    return allMessages.filter(message => {
      if (!message.metadata || typeof message.metadata !== 'object') {
        return false;
      }
      const metadata = message.metadata as any;
      return metadata[key] === value;
    });
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string): Promise<void> {
    await this.db.update(messages)
      .set({ 
        zapiStatus: status
      })
      .where(eq(messages.whatsappMessageId, whatsappMessageId));
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isFromContact, true),
        isNull(messages.readAt),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));
  }

  async markConversationMessagesAsRead(conversationId: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        readAt: new Date()
      })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isFromContact, true),
        isNull(messages.readAt)
      ));
    
    // Atualizar unread_count da conversa para 0
    await this.db.update(conversations)
      .set({ 
        unreadCount: 0,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async getInternalNotes(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isInternalNote, true),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));
  }

  async createInternalNote(conversationId: number, content: string, authorId: number, authorName: string): Promise<Message> {
    const noteData: InsertMessage = {
      conversationId,
      content,
      isFromContact: false,
      isInternalNote: true,
      authorId,
      authorName,
      messageType: 'text',
      sentAt: new Date()
    };

    return this.createMessage(noteData);
  }

  // ========== MÉTODOS DE VERIFICAÇÃO DE MÍDIA DUPLICADA ==========

  /**
   * Verifica se existe mensagem por WhatsApp Message ID
   */
  async findByWhatsappMessageId(whatsappMessageId: string): Promise<Message | null> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.whatsappMessageId, whatsappMessageId))
        .limit(1);
      
      return message || null;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem por WhatsApp ID:', error);
      return null;
    }
  }

  /**
   * Verifica se existe mensagem por URL da mídia
   */
  async findByMediaUrl(mediaUrl: string): Promise<Message | null> {
    try {
      const allMessages = await this.db
        .select()
        .from(messages)
        .where(sql`metadata::text LIKE ${'%' + mediaUrl + '%'}`);
      
      const messageWithUrl = allMessages.find(msg => {
        if (!msg.metadata || typeof msg.metadata !== 'object') return false;
        const metadata = msg.metadata as any;
        return metadata.mediaUrl === mediaUrl || 
               metadata.imageUrl === mediaUrl ||
               metadata.videoUrl === mediaUrl ||
               metadata.fileUrl === mediaUrl;
      });
      
      return messageWithUrl || null;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem por URL da mídia:', error);
      return null;
    }
  }

  /**
   * Gera hash SHA-256 de um buffer
   */
  private generateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Verifica se existe mensagem por hash do arquivo
   */
  async findByFileHash(fileHash: string, conversationId?: number): Promise<Message | null> {
    try {
      let query = this.db
        .select()
        .from(messages)
        .where(sql`metadata::text LIKE ${'%' + fileHash + '%'}`);
      
      if (conversationId) {
        query = query.where(eq(messages.conversationId, conversationId));
      }
      
      const allMessages = await query;
      
      const messageWithHash = allMessages.find(msg => {
        if (!msg.metadata || typeof msg.metadata !== 'object') return false;
        const metadata = msg.metadata as any;
        return metadata.fileHash === fileHash ||
               metadata.verification?.checkHash === fileHash;
      });
      
      return messageWithHash || null;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem por hash do arquivo:', error);
      return null;
    }
  }

  /**
   * Verifica se existe mensagem por nome e tamanho do arquivo
   */
  async findByFileNameAndSize(fileName: string, fileSize: number, conversationId?: number): Promise<Message | null> {
    try {
      let query = this.db
        .select()
        .from(messages)
        .where(sql`metadata::text LIKE ${'%' + fileName + '%'}`);
      
      if (conversationId) {
        query = query.where(eq(messages.conversationId, conversationId));
      }
      
      const allMessages = await query;
      
      const messageWithFile = allMessages.find(msg => {
        if (!msg.metadata || typeof msg.metadata !== 'object') return false;
        const metadata = msg.metadata as any;
        
        // Verificar nas diferentes estruturas de metadados
        const originalFile = metadata.originalFile;
        const fileData = metadata.fileData;
        
        if (originalFile) {
          return originalFile.name === fileName && originalFile.size === fileSize;
        }
        
        if (fileData) {
          return fileData.originalName === fileName && fileData.size === fileSize;
        }
        
        // Verificar na estrutura direta
        return (metadata.fileName === fileName && metadata.fileSize === fileSize) ||
               (metadata.originalName === fileName && metadata.size === fileSize);
      });
      
      return messageWithFile || null;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem por nome e tamanho:', error);
      return null;
    }
  }

  /**
   * Atualiza mensagem com hash do arquivo para verificações futuras
   */
  async updateMessageWithFileHash(messageId: number, fileHash: string, fileName?: string, fileSize?: number): Promise<void> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);
      
      if (!message) return;
      
      const currentMetadata = (message.metadata as any) || {};
      const updatedMetadata = {
        ...currentMetadata,
        fileHash,
        verification: {
          ...currentMetadata.verification,
          checkHash: fileHash,
          checkDate: new Date().toISOString()
        }
      };
      
      if (fileName && fileSize) {
        updatedMetadata.originalFile = {
          name: fileName,
          size: fileSize,
          hash: fileHash
        };
      }
      
      await this.db
        .update(messages)
        .set({ metadata: updatedMetadata })
        .where(eq(messages.id, messageId));
        
    } catch (error) {
      console.error('❌ Erro ao atualizar mensagem com hash:', error);
    }
  }
}