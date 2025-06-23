import { BaseStorage } from "../base/BaseStorage";
import { contacts, conversations, deals } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ContactDeleteOperations extends BaseStorage {
  async deleteContact(id: number): Promise<void> {
    try {
      // Verificar se o contato existe
      const { ContactBasicOperations } = await import('./contactBasicOperations');
      const basicOps = new ContactBasicOperations(this.db);
      const contact = await basicOps.getContact(id);
      
      console.log(`[DELETE][Contact] Buscando contato ${id}:`, contact ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (!contact) {
        const error = new Error("Contato não encontrado.");
        (error as any).statusCode = 404;
        throw error;
      }

      // Verificar conversas associadas
      const relatedConversations = await this.db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.contactId, id))
        .limit(1);

      if (relatedConversations.length > 0) {
        console.log(`[DELETE][Contact] Contato ${id} possui ${relatedConversations.length} conversas associadas`);
        const error = new Error("Não é possível excluir este contato pois existem conversas associadas. Exclua as conversas primeiro ou considere desativar o contato.");
        (error as any).statusCode = 409; // Conflict
        throw error;
      }

      // Verificar deals associados
      const relatedDeals = await this.db
        .select({ id: deals.id })
        .from(deals)
        .where(eq(deals.contactId, id))
        .limit(1);

      if (relatedDeals.length > 0) {
        console.log(`[DELETE][Contact] Contato ${id} possui ${relatedDeals.length} negócios associados`);
        const error = new Error("Não é possível excluir este contato pois existem negócios associados. Exclua os negócios primeiro ou considere desativar o contato.");
        (error as any).statusCode = 409; // Conflict
        throw error;
      }

      // Se não há dependências, pode excluir o contato
      console.log(`[DELETE][Contact] Excluindo contato ${id} (${contact.name})`);
      await this.db.delete(contacts).where(eq(contacts.id, id));
      console.log(`[DELETE][Contact] Contato ${id} excluído com sucesso`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro ao excluir contato. Verifique se não há dados associados a este contato.");
    }
  }
} 