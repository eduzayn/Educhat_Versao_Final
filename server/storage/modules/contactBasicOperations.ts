import { BaseStorage } from "../base/BaseStorage";
import { contacts, type Contact, type InsertContact } from "../../../shared/schema";
import { eq, desc, ilike, or, and, sql } from "drizzle-orm";

/**
 * Contact basic operations module - provides fundamental contact operations
 */
export class ContactBasicOperations extends BaseStorage {
  
  /**
   * Check if a contact exists by phone number
   */
  async contactExistsByPhone(phone: string): Promise<boolean> {
    const [contact] = await this.db.select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.phone, phone))
      .limit(1);
    
    return !!contact;
  }

  /**
   * Check if a contact exists by user identity
   */
  async contactExistsByUserIdentity(userIdentity: string): Promise<boolean> {
    const [contact] = await this.db.select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.userIdentity, userIdentity))
      .limit(1);
    
    return !!contact;
  }

  /**
   * Get contact by phone number
   */
  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    const [contact] = await this.db.select()
      .from(contacts)
      .where(eq(contacts.phone, phone));
    
    return contact;
  }

  /**
   * Get contact by user identity
   */
  async getContactByUserIdentity(userIdentity: string): Promise<Contact | undefined> {
    const [contact] = await this.db.select()
      .from(contacts)
      .where(eq(contacts.userIdentity, userIdentity));
    
    return contact;
  }

  /**
   * Update contact last seen timestamp
   */
  async updateLastSeen(contactId: number): Promise<void> {
    await this.db.update(contacts)
      .set({ 
        lastSeenAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contacts.id, contactId));
  }

  /**
   * Get recent contacts (last 30 days)
   */
  async getRecentContacts(limit: number = 50): Promise<Contact[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.db.select()
      .from(contacts)
      .where(sql`${contacts.createdAt} >= ${thirtyDaysAgo}`)
      .orderBy(desc(contacts.createdAt))
      .limit(limit);
  }

  /**
   * Count total contacts
   */
  async getTotalContactsCount(): Promise<number> {
    const [result] = await this.db.select({ count: sql<number>`count(*)` })
      .from(contacts);
    
    return result.count;
  }

  /**
   * Get contacts with pagination
   */
  async getContactsPaginated(offset: number = 0, limit: number = 50): Promise<Contact[]> {
    return this.db.select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .offset(offset)
      .limit(limit);
  }
}

export default ContactBasicOperations;