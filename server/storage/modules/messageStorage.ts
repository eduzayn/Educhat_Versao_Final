import { BaseStorage } from '../base/BaseStorage';
import { messages, type Message, type InsertMessage } from '@shared/schema';
import { MessageBasicOperations } from './messageBasicOperations';
import { MessageStatusOperations } from './messageStatusOperations';
import { MessageMediaOperations } from './messageMediaOperations';
import { MessageInternalNotesOperations } from './messageInternalNotesOperations';
import { MessageZApiOperations } from './messageZApiOperations';

/**
 * Message storage module - manages messages and media handling
 */
export class MessageStorage extends BaseStorage {
  private basicOps: MessageBasicOperations;
  private statusOps: MessageStatusOperations;
  private mediaOps: MessageMediaOperations;
  private notesOps: MessageInternalNotesOperations;
  private zapiOps: MessageZApiOperations;

  constructor() {
    super();
    this.basicOps = new MessageBasicOperations();
    this.statusOps = new MessageStatusOperations();
    this.mediaOps = new MessageMediaOperations();
    this.notesOps = new MessageInternalNotesOperations();
    this.zapiOps = new MessageZApiOperations();
  }

  // Basic operations
  async getAllMessages(): Promise<Message[]> {
    return this.basicOps.getAllMessages();
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.basicOps.getMessage(id);
  }

  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<Message[]> {
    return this.basicOps.getMessages(conversationId, limit, offset);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    return this.basicOps.createMessage(message);
  }

  async updateMessage(id: number, messageData: Partial<InsertMessage>): Promise<Message> {
    return this.basicOps.updateMessage(id, messageData);
  }

  async deleteMessage(id: number): Promise<void> {
    return this.basicOps.deleteMessage(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.basicOps.getMessagesByConversation(conversationId);
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    return this.basicOps.getUnreadMessages(conversationId);
  }

  // Status operations
  async markMessageAsRead(id: number): Promise<void> {
    return this.statusOps.markMessageAsRead(id);
  }

  async markMessageAsUnread(id: number): Promise<void> {
    return this.statusOps.markMessageAsUnread(id);
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    return this.statusOps.markMessageAsDelivered(id);
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    return this.statusOps.markMessageAsDeleted(id);
  }

  async markMessageAsDeletedByUser(messageId: number, deletedByUser: boolean, userId?: number): Promise<boolean> {
    return this.statusOps.markMessageAsDeletedByUser(messageId, deletedByUser, userId);
  }

  async markConversationMessagesAsRead(conversationId: number): Promise<void> {
    return this.statusOps.markConversationMessagesAsRead(conversationId);
  }

  // Media operations
  async getMessageMedia(messageId: number): Promise<string | null> {
    return this.mediaOps.getMessageMedia(messageId);
  }

  async getMessagesByMetadata(key: string, value: string): Promise<Message[]> {
    return this.mediaOps.getMessagesByMetadata(key, value);
  }

  // Internal notes operations
  async getInternalNotes(conversationId: number): Promise<Message[]> {
    return this.notesOps.getInternalNotes(conversationId);
  }

  async createInternalNote(data: {
    conversationId: number;
    content: string;
    authorId: number;
    authorName: string;
    noteType?: string;
    notePriority?: string;
    noteTags?: string[];
    isPrivate?: boolean;
  }): Promise<Message> {
    return this.notesOps.createInternalNote(data);
  }

  async updateInternalNote(id: number, data: any): Promise<Message> {
    return this.notesOps.updateInternalNote(id, data);
  }

  async getInternalNotesByPriority(conversationId: number, priority: string): Promise<Message[]> {
    return this.notesOps.getInternalNotesByPriority(conversationId, priority);
  }

  async getInternalNotesByTags(conversationId: number, tags: string[]): Promise<Message[]> {
    return this.notesOps.getInternalNotesByTags(conversationId, tags);
  }

  // Getter para acessar diretamente as operações de notas internas
  get messageInternalNotesOps() {
    return this.notesOps;
  }

  // Z-API operations
  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    return this.zapiOps.getMessageByZApiId(zapiMessageId);
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string): Promise<void> {
    return this.zapiOps.updateMessageZApiStatus(whatsappMessageId, status);
  }
}