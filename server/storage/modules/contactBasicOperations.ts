import { BaseStorage } from "../base/BaseStorage";
import { contacts, type Contact, type InsertContact, type ContactWithTags } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export class ContactBasicOperations extends BaseStorage {
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactWithTags(id: number): Promise<ContactWithTags | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;

    const { ContactTagOperations } = await import('./contactTagOperations');
    const tagOps = new ContactTagOperations(this.db);
    const tags = await tagOps.getContactTags(id);
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
} 