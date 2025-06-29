import { BaseStorage } from "../base/BaseStorage";
import { contacts, contactTags, type Contact, type InsertContact, type ContactTag, type InsertContactTag, type ContactWithTags } from "../../../shared/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";

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

  async findContactByPhone(phone: string): Promise<Contact | undefined> {
    const cleanPhone = phone.replace(/\D/g, '');
    const [contact] = await this.db.select().from(contacts)
      .where(
        or(
          eq(contacts.phone, phone),
          eq(contacts.phone, cleanPhone),
          ilike(contacts.phone, `%${cleanPhone}%`)
        )
      );
    return contact;
  }

  /**
   * Busca contato por telefone e canal específico para evitar duplicação no mesmo canal
   */
  async findContactByPhoneAndChannel(phone: string, canalOrigem: string): Promise<Contact | undefined> {
    const cleanPhone = phone.replace(/\D/g, '');
    const [contact] = await this.db.select().from(contacts)
      .where(
        and(
          or(
            eq(contacts.phone, phone),
            eq(contacts.phone, cleanPhone),
            ilike(contacts.phone, `%${cleanPhone}%`)
          ),
          eq(contacts.canalOrigem, canalOrigem)
        )
      );
    return contact;
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
    // 1. Verificação de unicidade por canal (se phone e canalOrigem fornecidos)
    if (contactData.phone && contactData.canalOrigem) {
      const existingContactByChannel = await this.findContactByPhoneAndChannel(
        contactData.phone, 
        contactData.canalOrigem
      );
      
      if (existingContactByChannel) {
        console.log(`🔄 Reutilizando contato existente no canal ${contactData.canalOrigem}: ${existingContactByChannel.name} (${existingContactByChannel.phone})`);
        
        // Atualizar contato existente com novos dados se fornecidos
        if (Object.keys(contactData).length > 0) {
          return this.updateContact(existingContactByChannel.id, contactData);
        }
        return existingContactByChannel;
      }
    }

    // 2. Fallback: busca por userIdentity (método antigo para compatibilidade)
    const [existingContact] = await this.db.select().from(contacts)
      .where(eq(contacts.userIdentity, userIdentity));

    if (existingContact) {
      // Se encontrado por userIdentity mas não por canal, significa que é outro canal
      console.log(`📱 Contato existente em outro canal, criando novo para canal ${contactData.canalOrigem}: ${contactData.name}`);
      
      // Continue para criar novo contato (não retorna aqui)
    }

    // 3. Criar novo contato
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

    console.log(`✅ Criando novo contato no canal ${contactData.canalOrigem}: ${newContactData.name} (${newContactData.phone})`);
    return this.createContact(newContactData);
  }

  async getContactInterests(contactId: number): Promise<any[]> {
    // Esta implementação pode ser expandida para buscar interesses baseados em tags
    const tags = await this.getContactTags(contactId);
    return tags.map(tag => ({ interest: tag.tag, source: 'tag' }));
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


}