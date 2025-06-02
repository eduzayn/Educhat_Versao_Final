import { db } from "./db";
import { contacts, conversations, messages } from "@shared/schema";
import { and, or, like, eq } from "drizzle-orm";

export async function cleanupTestContacts() {
  console.log("🧹 Iniciando limpeza de contatos de teste...");
  
  try {
    // Identificar contatos de teste/simulados
    const testContacts = await db
      .select()
      .from(contacts)
      .where(
        or(
          // Telefones de teste
          like(contacts.phone, '%000000%'),
          like(contacts.phone, '%111111%'),
          like(contacts.phone, '%123456%'),
          like(contacts.phone, '%999999%'),
          // Nomes de teste
          like(contacts.name, '%Test%'),
          like(contacts.name, '%test%'),
          like(contacts.name, '%Demo%'),
          like(contacts.name, '%demo%'),
          like(contacts.name, '%Exemplo%'),
          like(contacts.name, '%exemplo%'),
          like(contacts.name, '%Sample%'),
          like(contacts.name, '%sample%'),
          // Telefones muito curtos (menos de 8 dígitos)
          and(
            contacts.phone !== null,
            // Regex para telefones com menos de 8 dígitos numéricos
          )
        )
      );

    if (testContacts.length === 0) {
      console.log("✅ Nenhum contato de teste encontrado");
      return;
    }

    console.log(`📝 Encontrados ${testContacts.length} contatos de teste para remover`);

    // Para cada contato de teste, remover mensagens e conversas relacionadas
    for (const contact of testContacts) {
      console.log(`🗑️ Removendo contato: ${contact.name} (${contact.phone})`);
      
      // Buscar conversas do contato
      const contactConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.contactId, contact.id));

      // Remover mensagens de cada conversa
      for (const conversation of contactConversations) {
        await db
          .delete(messages)
          .where(eq(messages.conversationId, conversation.id));
      }

      // Remover conversas
      await db
        .delete(conversations)
        .where(eq(conversations.contactId, contact.id));

      // Remover contato
      await db
        .delete(contacts)
        .where(eq(contacts.id, contact.id));
    }

    console.log("✅ Limpeza de contatos de teste concluída com sucesso!");
    return testContacts.length;
    
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error);
    throw error;
  }
}