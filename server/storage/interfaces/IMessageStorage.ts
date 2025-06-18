import { Message, InsertMessage } from '@shared/schema';

export interface IMessageStorage {
  getAllMessages(): Promise<Message[]>;
  getMessages(conversationId: number, limit?: number, offset?: number): Promise<Message[]>;
  getMessageMedia(messageId: number): Promise<string | null>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  markMessageAsUnread(id: number): Promise<void>;
  markMessageAsDelivered(id: number): Promise<void>;
  markMessageAsDeleted(id: number): Promise<void>;
  getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined>;
  getMessagesByMetadata(key: string, value: string): Promise<Message[]>;
} 