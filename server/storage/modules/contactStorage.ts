import { BaseStorage } from "../base/BaseStorage";
import { type Contact, type InsertContact, type ContactTag, type InsertContactTag, type ContactWithTags } from "@shared/schema";

/**
 * Contact storage module - manages contacts and contact tags
 * Refatorado para usar módulos menores
 */
export class ContactStorage extends BaseStorage {
  // Basic Operations
  async getContact(id: number): Promise<Contact | undefined> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.getContact(id);
  }

  async getContactWithTags(id: number): Promise<ContactWithTags | undefined> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.getContactWithTags(id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations(this.db);
    return basicOps.createContact(contact);
  }

  // Duplicate Detection Operations - REMOVIDOS: Usar ContactDuplicateDetection diretamente
  // Métodos consolidados no módulo específico para evitar wrapper desnecessário

  async updateContact(id: number, contactData: Partial<InsertContact>): Promise<Contact> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.updateContact(id, contactData);
  }

  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.getContactByPhone(phone);
  }

  async getContactByUserIdentity(userIdentity: string): Promise<Contact | undefined> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.getContactByUserIdentity(userIdentity);
  }

  async getContactByEmail(email: string): Promise<Contact | undefined> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.getContactByEmail(email);
  }

  async getAllContacts(): Promise<Contact[]> {
    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations();
    return basicOps.getAllContacts();
  }

  // Search Operations
  async searchContacts(query: string): Promise<Contact[]> {
    const { ContactSearchOperations } = await import('./contactSearchOperations');
    const searchOps = new ContactSearchOperations();
    return searchOps.searchContacts(query);
  }

  async findOrCreateContact(userIdentity: string, contactData: Partial<InsertContact>): Promise<Contact> {
    const { ContactSearchOperations } = await import('./contactSearchOperations');
    const searchOps = new ContactSearchOperations(this.db);
    return searchOps.findOrCreateContact(userIdentity, contactData);
  }

  async getContactInterests(contactId: number): Promise<any[]> {
    const { ContactSearchOperations } = await import('./contactSearchOperations');
    const searchOps = new ContactSearchOperations(this.db);
    return searchOps.getContactInterests(contactId);
  }

  // Status Operations
  async updateContactOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const { ContactStatusOperations } = await import('./contactStatusOperations');
    const statusOps = new ContactStatusOperations(this.db);
    return statusOps.updateContactOnlineStatus(id, isOnline);
  }

  // Tag Operations
  async getContactTags(contactId: number): Promise<ContactTag[]> {
    const { ContactTagOperations } = await import('./contactTagOperations');
    const tagOps = new ContactTagOperations(this.db);
    return tagOps.getContactTags(contactId);
  }

  async addContactTag(tag: InsertContactTag): Promise<ContactTag> {
    const { ContactTagOperations } = await import('./contactTagOperations');
    const tagOps = new ContactTagOperations(this.db);
    return tagOps.addContactTag(tag);
  }

  async removeContactTag(contactId: number, tag: string): Promise<void> {
    const { ContactTagOperations } = await import('./contactTagOperations');
    const tagOps = new ContactTagOperations(this.db);
    return tagOps.removeContactTag(contactId, tag);
  }

  // Delete Operations
  async deleteContact(id: number): Promise<void> {
    const { ContactDeleteOperations } = await import('./contactDeleteOperations');
    const deleteOps = new ContactDeleteOperations(this.db);
    return deleteOps.deleteContact(id);
  }
}