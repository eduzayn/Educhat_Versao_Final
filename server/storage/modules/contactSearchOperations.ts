import { BaseStorage } from "../base/BaseStorage";
import { contacts, type Contact } from "../../../shared/schema";
import { desc, ilike, or } from "drizzle-orm";

export class ContactSearchOperations extends BaseStorage {
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

  async findOrCreateContact(userIdentity: string, contactData: Partial<any>): Promise<Contact> {
    // Try to find existing contact by userIdentity
    const [existingContact] = await this.db.select().from(contacts)
      .where(eq(contacts.userIdentity, userIdentity));

    if (existingContact) {
      // Update existing contact with new data if provided
      if (Object.keys(contactData).length > 0) {
        const { ContactBasicOperations } = await import('./contactBasicOperations');
        const basicOps = new ContactBasicOperations(this.db);
        return basicOps.updateContact(existingContact.id, contactData);
      }
      return existingContact;
    }

    // Create new contact
    const newContactData = {
      userIdentity,
      name: contactData.name || 'Contato Sem Nome',
      phone: contactData.phone || null,
      email: contactData.email || null,
      canalOrigem: contactData.canalOrigem || null,
      nomeCanal: contactData.nomeCanal || null,
      idCanal: contactData.idCanal || null,
      ...contactData
    };

    const { ContactBasicOperations } = await import('./contactBasicOperations');
    const basicOps = new ContactBasicOperations(this.db);
    return basicOps.createContact(newContactData);
  }

  async getContactInterests(contactId: number): Promise<any[]> {
    // Esta implementação pode ser expandida para buscar interesses baseados em tags
    const { ContactTagOperations } = await import('./contactTagOperations');
    const tagOps = new ContactTagOperations(this.db);
    const tags = await tagOps.getContactTags(contactId);
    return tags.map(tag => ({ interest: tag.tag, source: 'tag' }));
  }
} 