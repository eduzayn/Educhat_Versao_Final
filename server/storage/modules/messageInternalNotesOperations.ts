import { BaseStorage } from '../base/BaseStorage';
import { messages, type Message, type InsertMessage } from '../../../shared/schema';
import { eq, and, desc, or } from 'drizzle-orm';

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
    const noteData: InsertMessage = {
      conversationId: data.conversationId,
      content: data.content,
      isFromContact: false,
      isInternalNote: true,
      authorId: data.authorId,
      authorName: data.authorName,
      messageType: 'text',
      noteType: data.noteType || 'general',
      notePriority: data.notePriority || 'normal',
      noteTags: data.noteTags || [],
      isPrivate: data.isPrivate || false,
      sentAt: new Date()
    };

    // Usar o método createMessage do módulo básico
    const { MessageBasicOperations } = await import('./messageBasicOperations');
    const basicOps = new MessageBasicOperations();
    return basicOps.createMessage(noteData);
  }

  async getInternalNotesByPriority(conversationId: number, priority: string): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isInternalNote, true),
        eq(messages.notePriority, priority),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));
  }

  async getInternalNotesByTags(conversationId: number, tags: string[]): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isInternalNote, true),
        or(...tags.map(tag => eq(messages.noteTags, [tag]))),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));
  }

  async updateInternalNote(id: number, data: Partial<InsertMessage>): Promise<Message> {
    const [updated] = await this.db.update(messages)
      .set(data)
      .where(and(
        eq(messages.id, id),
        eq(messages.isInternalNote, true)
      ))
      .returning();
    return updated;
  }
} 