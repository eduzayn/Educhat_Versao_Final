import { BaseStorage } from "../base/BaseStorage";
import {
  contacts,
  contactTags,
  type Contact,
  type InsertContact,
  type ContactTag,
  type InsertContactTag,
  type ContactWithTags,
} from "@shared/schema";

/**
 * Contact storage module
 */
export class ContactStorage extends BaseStorage {
  async getContact(id: number): Promise<Contact | undefined> {
    try {
      const [contact] = await this.db.select().from(contacts).where(this.eq(contacts.id, id));
      return contact;
    } catch (error) {
      this.handleError(error, 'getContact');
    }
  }

  async getContactWithTags(id: number): Promise<ContactWithTags | undefined> {
    try {
      const contact = await this.getContact(id);
      if (!contact) return undefined;

      const contactTagsData = await this.getContactTags(id);
      return { ...contact, contactTags: contactTagsData };
    } catch (error) {
      this.handleError(error, 'getContactWithTags');
    }
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    try {
      this.validateRequired(contact, ['name'], 'createContact');
      
      const [newContact] = await this.db
        .insert(contacts)
        .values(contact)
        .returning();
      
      return newContact;
    } catch (error) {
      this.handleError(error, 'createContact');
    }
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact> {
    try {
      const [updatedContact] = await this.db
        .update(contacts)
        .set({ ...contact, updatedAt: new Date() })
        .where(this.eq(contacts.id, id))
        .returning();
      return updatedContact;
    } catch (error) {
      this.handleError(error, 'updateContact');
    }
  }

  async searchContacts(query: string): Promise<Contact[]> {
    try {
      if (!query || query.trim() === '') {
        return await this.db
          .select()
          .from(contacts)
          .orderBy(this.desc(contacts.createdAt));
      }
      
      return await this.db
        .select()
        .from(contacts)
        .where(
          this.or(
            this.ilike(contacts.name, `%${query}%`),
            this.ilike(contacts.email, `%${query}%`),
            this.ilike(contacts.phone, `%${query}%`)
          )
        )
        .orderBy(this.desc(contacts.createdAt));
    } catch (error) {
      this.handleError(error, 'searchContacts');
    }
  }

  async updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    try {
      await this.db
        .update(contacts)
        .set({ 
          isOnline, 
          lastSeenAt: isOnline ? new Date() : undefined,
          updatedAt: new Date() 
        })
        .where(this.eq(contacts.id, id));
    } catch (error) {
      this.handleError(error, 'updateContactOnlineStatus');
    }
  }

  async findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact> {
    try {
      this.validateRequired({ userIdentity }, ['userIdentity'], 'findOrCreateContact');
      
      let existingContact: Contact | undefined;
      
      if (contactData.phone) {
        const [contact] = await this.db
          .select()
          .from(contacts)
          .where(this.eq(contacts.phone, contactData.phone));
        existingContact = contact;
      }
      
      if (!existingContact && contactData.email) {
        const [contact] = await this.db
          .select()
          .from(contacts)
          .where(this.eq(contacts.email, contactData.email));
        existingContact = contact;
      }
      
      if (existingContact) {
        return await this.updateContact(existingContact.id, contactData);
      }
      
      const newContactData: InsertContact = {
        name: contactData.name || userIdentity,
        phone: contactData.phone || null,
        email: contactData.email || null,
        canalOrigem: contactData.canalOrigem || 'whatsapp',
        ...contactData
      };
      
      return await this.createContact(newContactData);
    } catch (error) {
      this.handleError(error, 'findOrCreateContact');
    }
  }

  // Contact Tags Operations
  async getContactTags(contactId: number): Promise<ContactTag[]> {
    try {
      return await this.db
        .select()
        .from(contactTags)
        .where(this.eq(contactTags.contactId, contactId));
    } catch (error) {
      this.handleError(error, 'getContactTags');
    }
  }

  async addContactTag(tag: InsertContactTag): Promise<ContactTag> {
    try {
      this.validateRequired(tag, ['contactId', 'tag'], 'addContactTag');
      
      const [newTag] = await this.db
        .insert(contactTags)
        .values(tag)
        .returning();
      return newTag;
    } catch (error) {
      this.handleError(error, 'addContactTag');
    }
  }

  async removeContactTag(contactId: number, tag: string): Promise<void> {
    try {
      await this.db
        .delete(contactTags)
        .where(
          this.and(
            this.eq(contactTags.contactId, contactId),
            this.eq(contactTags.tag, tag)
          )
        );
    } catch (error) {
      this.handleError(error, 'removeContactTag');
    }
  }

  async getContactInterests(contactId: number): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      this.handleError(error, 'getContactInterests');
    }
  }
}