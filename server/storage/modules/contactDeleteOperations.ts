import { BaseStorage } from "../base/BaseStorage";
import { contacts, conversations, deals } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export class ContactDeleteOperations extends BaseStorage {
  async deleteContact(id: number): Promise<void> {
    try {
      // Verificar se o contato existe
      const { ContactBasicOperations } = await import('./contactBasicOperations');
      const basicOps = new ContactBasicOperations(this.db);
      const contact = await basicOps.getContact(id);
      
      if (!contact) {
        throw new Error("Contato não encontrado.");
      }

      // Verificar conversas associadas
      const relatedConversations = await this.db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.contactId, id))
        .limit(1);

      if (relatedConversations.length > 0) {
        throw new Error("Não é possível excluir este contato pois existem conversas associadas. Exclua as conversas primeiro ou considere desativar o contato.");
      }

      // Verificar deals associados
      const relatedDeals = await this.db
        .select({ id: deals.id })
        .from(deals)
        .where(eq(deals.contactId, id))
        .limit(1);

      if (relatedDeals.length > 0) {
        throw new Error("Não é possível excluir este contato pois existem negócios associados. Exclua os negócios primeiro ou considere desativar o contato.");
      }

      // Se não há dependências, pode excluir o contato
      await this.db.delete(contacts).where(eq(contacts.id, id));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro ao excluir contato. Verifique se não há dados associados a este contato.");
    }
  }
} 