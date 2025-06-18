import { BaseStorage } from "../base/BaseStorage";
import { contactNotes, type ContactNote, type InsertContactNote } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Notes storage module - manages contact notes
 */
export class NotesStorage extends BaseStorage {
  async getContactNotes(contactId: number): Promise<ContactNote[]> {
    return this.db.select().from(contactNotes)
      .where(eq(contactNotes.contactId, contactId))
      .orderBy(desc(contactNotes.createdAt));
  }

  async createContactNote(note: InsertContactNote): Promise<ContactNote> {
    const [newNote] = await this.db.insert(contactNotes).values(note).returning();
    return newNote;
  }

  async updateContactNote(id: number, note: Partial<InsertContactNote>): Promise<ContactNote> {
    const [updated] = await this.db.update(contactNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(contactNotes.id, id))
      .returning();
    return updated;
  }

  async deleteContactNote(id: number): Promise<void> {
    await this.db.delete(contactNotes).where(eq(contactNotes.id, id));
  }

  async getContactNoteById(id: number): Promise<ContactNote | null> {
    const [note] = await this.db.select().from(contactNotes)
      .where(eq(contactNotes.id, id))
      .limit(1);
    return note || null;
  }

  async addContactNote(contactId: number, content: string): Promise<ContactNote> {
    const noteData: InsertContactNote = {
      contactId,
      content,
      authorName: 'Sistema', // Nome padrão para notas do sistema
      authorId: null
    };
    return this.createContactNote(noteData);
  }
}