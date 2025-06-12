import { BaseStorage } from "../base/BaseStorage";
import { contacts, contactTags, type Contact, type InsertContact, type ContactTag, type InsertContactTag, type ContactWithTags } from "../../../shared/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";

/**
 * Contact storage module - manages contacts and contact tags
 */
export class ContactStorage extends BaseStorage {
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactWithTags(id: number): Promise<ContactWithTags | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;

    const tags = await this.getContactTags(id);
    return { ...contact, contactTags: tags };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await this.db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contactData: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await this.db.update(contacts)
      .set({ ...contactData, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    if (!query || query.trim() === '') {
      // Se não há query, retornar todos os contatos
      return this.db.select().from(contacts)
        .orderBy(desc(contacts.createdAt));
    }
    
    return this.db.select().from(contacts)
      .where(
        or(
          ilike(contacts.name, `%${query}%`),
          ilike(contacts.phone, `%${query}%`),
          ilike(contacts.email, `%${query}%`)
        )
      )
      .orderBy(desc(contacts.createdAt));
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await this.db.update(contacts)
      .set({ 
        isOnline,
        lastSeenAt: isOnline ? undefined : new Date(),
        updatedAt: new Date()
      })
      .where(eq(contacts.id, id));
  }

  async findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact> {
    // Try to find existing contact by userIdentity
    const [existingContact] = await this.db.select().from(contacts)
      .where(eq(contacts.userIdentity, userIdentity));

    if (existingContact) {
      // Update existing contact with new data if provided
      if (Object.keys(contactData).length > 0) {
        return this.updateContact(existingContact.id, contactData);
      }
      return existingContact;
    }

    // Create new contact
    const newContactData: InsertContact = {
      userIdentity,
      name: contactData.name || 'Contato Sem Nome',
      phone: contactData.phone || null,
      email: contactData.email || null,
      canalOrigem: contactData.canalOrigem || null,
      nomeCanal: contactData.nomeCanal || null,
      idCanal: contactData.idCanal || null,
      ...contactData
    };

    return this.createContact(newContactData);
  }

  async getContactInterests(contactId: number): Promise<any[]> {
    // Esta implementação pode ser expandida para buscar interesses baseados em tags
    const tags = await this.getContactTags(contactId);
    return tags.map(tag => ({ interest: tag.tag, source: 'tag' }));
  }

  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.phone, phone));
    return contact;
  }



  async getContactByUserIdentity(userIdentity: string): Promise<Contact | undefined> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.userIdentity, userIdentity));
    return contact;
  }

  async getContactByEmail(email: string): Promise<Contact | undefined> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.email, email));
    return contact;
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async deleteContact(id: number): Promise<void> {
    await this.db.delete(contacts).where(eq(contacts.id, id));
  }

  // Contact Tags Operations
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

  async getContactsPaginated(options: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: Contact[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    // Build where condition
    let whereCondition;
    if (search && search.trim() !== '') {
      whereCondition = or(
        ilike(contacts.name, `%${search}%`),
        ilike(contacts.phone, `%${search}%`),
        ilike(contacts.email, `%${search}%`)
      );
    }

    // Get total count
    const countQuery = this.db.select({ count: sql<number>`count(*)`.as('count') }).from(contacts);
    if (whereCondition) {
      countQuery.where(whereCondition);
    }
    const [{ count: total }] = await countQuery;

    // Get paginated data
    const dataQuery = this.db.select().from(contacts).orderBy(desc(contacts.createdAt));
    if (whereCondition) {
      dataQuery.where(whereCondition);
    }
    dataQuery.limit(limit).offset(offset);
    
    const data = await dataQuery;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

}