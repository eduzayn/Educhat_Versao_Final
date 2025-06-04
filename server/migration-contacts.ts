import { storage } from "./storage";
import { db } from "./db";
import { contacts, conversations } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Script de migração para atualizar contatos existentes com informações de canal
 * Conforme especificado na tarefa de "Registro Automático de Contatos com Identificação de Canal"
 */
export async function migrateExistingContacts() {
  console.log('🔄 Iniciando migração de contatos existentes...');
  
  try {
    // Buscar todos os contatos que não possuem informações de canal
    const contactsToUpdate = await db
      .select()
      .from(contacts)
      .where(isNull(contacts.userIdentity));

    console.log(`📊 Encontrados ${contactsToUpdate.length} contatos para atualizar`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const contact of contactsToUpdate) {
      try {
        // Buscar conversas associadas a este contato para determinar o canal
        const contactConversations = await db
          .select()
          .from(conversations)
          .where(eq(conversations.contactId, contact.id))
          .limit(1);

        if (contactConversations.length > 0) {
          const conversation = contactConversations[0];
          let canalOrigem = 'whatsapp'; // Padrão
          let nomeCanal = 'WhatsApp Principal'; // Padrão
          let idCanal = 'whatsapp-1'; // Padrão
          
          // Determinar canal baseado na conversa existente
          if (conversation.channel === 'whatsapp') {
            canalOrigem = 'whatsapp';
            // Pode ser customizado baseado em channelId específico
            if (conversation.channelId === 2) {
              nomeCanal = 'WhatsApp Suporte';
              idCanal = 'whatsapp-2';
            } else {
              nomeCanal = 'WhatsApp Comercial';
              idCanal = 'whatsapp-1';
            }
          } else if (conversation.channel === 'instagram') {
            canalOrigem = 'instagram';
            nomeCanal = 'Instagram Principal';
            idCanal = 'instagram-1';
          } else if (conversation.channel === 'facebook') {
            canalOrigem = 'facebook';
            nomeCanal = 'Facebook Principal';
            idCanal = 'facebook-1';
          }

          // Usar telefone como userIdentity, ou email se não houver telefone
          const userIdentity = contact.phone || contact.email || `contact_${contact.id}`;

          // Atualizar o contato
          await storage.updateContact(contact.id, {
            canalOrigem,
            nomeCanal,
            idCanal,
            userIdentity
          });

          updatedCount++;
          console.log(`✅ Contato ${contact.name} atualizado: ${nomeCanal}`);
        } else {
          // Contato sem conversas - usar valores padrão
          const userIdentity = contact.phone || contact.email || `contact_${contact.id}`;
          
          await storage.updateContact(contact.id, {
            canalOrigem: 'whatsapp',
            nomeCanal: 'WhatsApp Principal',
            idCanal: 'whatsapp-1',
            userIdentity
          });

          updatedCount++;
          console.log(`✅ Contato ${contact.name} atualizado com valores padrão`);
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar contato ${contact.name}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Migração concluída:`);
    console.log(`   - ${updatedCount} contatos atualizados com sucesso`);
    console.log(`   - ${errorCount} erros encontrados`);

    return {
      total: contactsToUpdate.length,
      updated: updatedCount,
      errors: errorCount
    };

  } catch (error) {
    console.error('💥 Erro durante a migração:', error);
    throw error;
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateExistingContacts()
    .then((result) => {
      console.log('Migração finalizada:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro na migração:', error);
      process.exit(1);
    });
}