import { BaseStorage } from "../base/BaseStorage";
import { contactTags, type ContactTag, type InsertContactTag } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export class ContactTagOperations extends BaseStorage {
  async getContactTags(contactId: number): Promise<ContactTag[]> {
    return this.db.select().from(contactTags)
      .where(eq(contactTags.contactId, contactId))
      .orderBy(desc(contactTags.createdAt));
  }

  async addContactTag(tag: InsertContactTag): Promise<ContactTag> {
    // Check if tag already exists for this contact
    const [existingTag] = await this.db.select().from(contactTags)
      .where(and(
        eq(contactTags.contactId, tag.contactId),
        eq(contactTags.tag, tag.tag)
      ));

    if (existingTag) {
      return existingTag;
    }

    const [newTag] = await this.db.insert(contactTags).values(tag).returning();
    return newTag;
  }

  async removeContactTag(contactId: number, tag: string): Promise<void> {
    await this.db.delete(contactTags)
      .where(and(
        eq(contactTags.contactId, contactId),
        eq(contactTags.tag, tag)
      ));
  }
} 