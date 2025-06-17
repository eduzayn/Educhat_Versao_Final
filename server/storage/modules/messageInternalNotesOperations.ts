import { BaseStorage } from '../base/BaseStorage';
import { messages, type Message, type InsertMessage } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class MessageInternalNotesOperations extends BaseStorage {
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

    // Usar o método createMessage do módulo básico
    const { MessageBasicOperations } = await import('./messageBasicOperations');
    const basicOps = new MessageBasicOperations();
    return basicOps.createMessage(noteData);
  }
} 