import { BaseStorage } from "../base/BaseStorage";
import {
  messages,
  conversations,
  type Message,
  type InsertMessage,
} from "@shared/schema";

/**
 * Message storage module
 * Handles message operations including media handling and status updates
 */
export class MessageStorage extends BaseStorage {
  /**
   * Get all messages (for admin/analytics purposes)
   */
  async getAllMessages(): Promise<Message[]> {
    try {
      return await this.db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          content: messages.content,
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
          referenceMessageId: messages.referenceMessageId,
          isInternalNote: messages.isInternalNote,
          authorId: messages.authorId,
          authorName: messages.authorName,
          isHiddenForUser: messages.isHiddenForUser
        })
        .from(messages)
        .orderBy(this.desc(messages.sentAt));
    } catch (error) {
      this.handleError(error, 'getAllMessages');
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(conversationId: number, limit = 30, offset = 0): Promise<Message[]> {
    try {
      // Optimized query: don't load binary content for large media files
      return await this.db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          content: this.sql<string>`CASE 
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
          referenceMessageId: messages.referenceMessageId,
          isInternalNote: messages.isInternalNote,
          authorId: messages.authorId,
          authorName: messages.authorName,
          isHiddenForUser: messages.isHiddenForUser
        })
        .from(messages)
        .where(
          this.and(
            this.eq(messages.conversationId, conversationId),
            this.or(
              this.eq(messages.isHiddenForUser, false),
              this.isNull(messages.isHiddenForUser)
            )
          )
        )
        .orderBy(messages.sentAt)
        .limit(limit)
        .offset(offset);
    } catch (error) {
      this.handleError(error, 'getMessages');
    }
  }

  /**
   * Get single message by ID
   */
  async getMessage(messageId: number): Promise<Message | null> {
    try {
      const result = await this.db
        .select()
        .from(messages)
        .where(this.eq(messages.id, messageId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'getMessage');
    }
  }

  /**
   * Get message media content on-demand
   */
  async getMessageMedia(messageId: number): Promise<string | null> {
    try {
      const result = await this.db
        .select({ 
          content: messages.content, 
          messageType: messages.messageType,
          metadata: messages.metadata 
        })
        .from(messages)
        .where(this.eq(messages.id, messageId))
        .limit(1);
      
      if (!result[0]) return null;

      const message = result[0];
      
      // Extract URL from metadata for different media types
      if (message.messageType === 'video' && message.metadata) {
        try {
          const metadata = typeof message.metadata === 'string' 
            ? JSON.parse(message.metadata) 
            : message.metadata;
          
          if (metadata.video?.videoUrl) {
            return metadata.video.videoUrl;
          }
        } catch (error) {
          console.error('Error parsing video metadata:', error);
        }
      }
      
      if (message.messageType === 'image' && message.metadata) {
        try {
          const metadata = typeof message.metadata === 'string' 
            ? JSON.parse(message.metadata) 
            : message.metadata;
          
          if (metadata.image?.imageUrl) {
            return metadata.image.imageUrl;
          }
          if (metadata.imageUrl) {
            return metadata.imageUrl;
          }
        } catch (error) {
          console.error('Error parsing image metadata:', error);
        }
      }

      if (message.messageType === 'audio' && message.metadata) {
        try {
          const metadata = typeof message.metadata === 'string' 
            ? JSON.parse(message.metadata) 
            : message.metadata;
          
          if (metadata.audio?.audioUrl) {
            return metadata.audio.audioUrl;
          }
          if (metadata.audioUrl) {
            return metadata.audioUrl;
          }
        } catch (error) {
          console.error('Error parsing audio metadata:', error);
        }
      }

      if (message.messageType === 'document' && message.metadata) {
        try {
          const metadata = typeof message.metadata === 'string' 
            ? JSON.parse(message.metadata) 
            : message.metadata;
          
          if (metadata.document?.documentUrl) {
            return metadata.document.documentUrl;
          }
          if (metadata.documentUrl) {
            return metadata.documentUrl;
          }
        } catch (error) {
          console.error('Error parsing document metadata:', error);
        }
      }
      
      // Fallback to original content (base64 images/audio)
      return message.content || null;
    } catch (error) {
      this.handleError(error, 'getMessageMedia');
    }
  }

  /**
   * Create new message
   */
  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      this.validateRequired(message, ['conversationId', 'content'], 'createMessage');
      
      const [newMessage] = await this.db
        .insert(messages)
        .values(message)
        .returning();

      // Update conversation's last message timestamp and unread count
      if (message.isFromContact) {
        console.log(`📬 Incrementing counter for conversation ${message.conversationId}`);
        // If message is from contact, increment unread count
        await this.db
          .update(conversations)
          .set({ 
            lastMessageAt: new Date(),
            unreadCount: this.sql`COALESCE(${conversations.unreadCount}, 0) + 1`,
            updatedAt: new Date() 
          })
          .where(this.eq(conversations.id, message.conversationId));
      } else {
        // If message is ours, just update timestamp
        await this.db
          .update(conversations)
          .set({ 
            lastMessageAt: new Date(),
            updatedAt: new Date() 
          })
          .where(this.eq(conversations.id, message.conversationId));
      }

      return newMessage;
    } catch (error) {
      this.handleError(error, 'createMessage');
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ readAt: new Date() })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsRead');
    }
  }

  /**
   * Mark message as unread
   */
  async markMessageAsUnread(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ readAt: null })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsUnread');
    }
  }

  /**
   * Mark message as delivered
   */
  async markMessageAsDelivered(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ deliveredAt: new Date() })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsDelivered');
    }
  }

  /**
   * Mark message as deleted
   */
  async markMessageAsDeleted(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ isDeleted: true })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsDeleted');
    }
  }

  /**
   * Hide message for user
   */
  async hideMessageForUser(id: number, isHidden: boolean): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ isHiddenForUser: isHidden })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'hideMessageForUser');
    }
  }

  /**
   * Mark entire conversation as read
   */
  async markConversationAsRead(conversationId: number): Promise<void> {
    try {
      // First mark all unread messages in conversation as read
      await this.db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          this.and(
            this.eq(messages.conversationId, conversationId),
            this.eq(messages.isFromContact, true),
            this.isNull(messages.readAt)
          )
        );
      
      // Then reset conversation unread count
      await this.db
        .update(conversations)
        .set({ 
          unreadCount: 0,
          updatedAt: new Date() 
        })
        .where(this.eq(conversations.id, conversationId));
    } catch (error) {
      this.handleError(error, 'markConversationAsRead');
    }
  }

  /**
   * Get message by Z-API ID
   */
  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(this.eq(messages.whatsappMessageId, zapiMessageId));
      return message;
    } catch (error) {
      this.handleError(error, 'getMessageByZApiId');
    }
  }

  /**
   * Get messages by metadata key-value
   */
  async getMessagesByMetadata(key: string, value: string): Promise<Message[]> {
    try {
      return await this.db
        .select()
        .from(messages)
        .where(this.sql`${messages.metadata}->>'${this.sql.raw(key)}' = ${value}`);
    } catch (error) {
      this.handleError(error, 'getMessagesByMetadata');
    }
  }
}