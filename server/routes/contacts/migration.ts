// Movido de server/migration-contacts.ts para consolidação
import { storage } from "../../storage";

/**
 * Script de migração para atualizar contatos existentes com informações de canal
 * Conforme especificado na tarefa de "Registro Automático de Contatos com Identificação de Canal"
 */
export async function migrateExistingContacts() {
  console.log('🔄 Iniciando migração de contatos existentes...');

  try {
    // Buscar todos os contatos sem channelId definido
    const contacts = await storage.getContactsWithoutChannel();
    console.log(`📊 Encontrados ${contacts.length} contatos para migração`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      try {
        // Determinar canal baseado no telefone
        let channelId = 2; // Default: WhatsApp (canal Suporte)
        
        // Lógica para determinar canal baseado no padrão do telefone
        if (contact.phone) {
          // Se o telefone tem formato brasileiro (+55), usar canal WhatsApp
          if (contact.phone.startsWith('55') || contact.phone.startsWith('+55')) {
            channelId = 2; // WhatsApp - Suporte
          }
          // Se tem formato internacional diferente, usar canal Email
          else if (contact.phone.includes('+') && !contact.phone.startsWith('+55')) {
            channelId = 1; // Email
          }
        }

        // Atualizar o contato com o channelId
        await storage.updateContact(contact.id, { 
          channelId,
          updatedAt: new Date()
        });

        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`📈 Migrados ${migratedCount}/${contacts.length} contatos...`);
        }

      } catch (error) {
        console.error(`❌ Erro ao migrar contato ${contact.id}:`, error);
        errorCount++;
      }
    }

    console.log('✅ Migração de contatos concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Contatos migrados: ${migratedCount}`);
    console.log(`   - Erros: ${errorCount}`);
    console.log(`   - Total processado: ${contacts.length}`);

    return {
      total: contacts.length,
      migrated: migratedCount,
      errors: errorCount,
      success: errorCount === 0
    };

  } catch (error) {
    console.error('❌ Erro crítico na migração:', error);
    throw error;
  }
}

/**
 * Migração específica para atualizar contatos com informações de macrossetor
 */
export async function migrateContactMacrosetores() {
  console.log('🔄 Iniciando migração de macrosetores de contatos...');

  try {
    // Buscar conversas recentes para determinar padrões de macrossetor
    const conversations = await storage.getRecentConversationsWithMessages();
    
    let migratedCount = 0;
    const macrosetorMapping: Record<string, string> = {
      'curso': 'educacao',
      'faculdade': 'educacao',
      'universidade': 'educacao',
      'treinamento': 'educacao',
      'capacitação': 'educacao',
      'preço': 'comercial',
      'valor': 'comercial',
      'desconto': 'comercial',
      'pagamento': 'comercial',
      'matricula': 'comercial',
      'suporte': 'suporte',
      'ajuda': 'suporte',
      'problema': 'suporte',
      'erro': 'suporte',
      'duvida': 'suporte'
    };

    for (const conversation of conversations) {
      try {
        // Analisar mensagens da conversa para determinar macrossetor
        const messages = conversation.messages || [];
        let detectedMacrossetor = 'geral'; // Default

        for (const message of messages) {
          const content = message.content?.toLowerCase() || '';
          
          for (const [keyword, macrossetor] of Object.entries(macrosetorMapping)) {
            if (content.includes(keyword)) {
              detectedMacrossetor = macrossetor;
              break;
            }
          }
          
          if (detectedMacrossetor !== 'geral') break;
        }

        // Atualizar contato com macrossetor detectado
        if (conversation.contactId) {
          await storage.updateContact(conversation.contactId, {
            macrossetor: detectedMacrossetor,
            updatedAt: new Date()
          });
          migratedCount++;
        }

      } catch (error) {
        console.error(`❌ Erro ao migrar conversa ${conversation.id}:`, error);
      }
    }

    console.log(`✅ Migração de macrosetores concluída! ${migratedCount} contatos atualizados.`);
    
    return {
      migrated: migratedCount,
      success: true
    };

  } catch (error) {
    console.error('❌ Erro na migração de macrosetores:', error);
    throw error;
  }
}

/**
 * Migração para limpar dados duplicados ou inconsistentes
 */
export async function cleanupContactData() {
  console.log('🧹 Iniciando limpeza de dados de contatos...');

  try {
    // Remover contatos duplicados baseado no telefone
    const duplicates = await storage.findDuplicateContacts();
    let cleanedCount = 0;

    for (const duplicate of duplicates) {
      try {
        // Manter o contato mais recente e mesclar dados do mais antigo
        const [newer, older] = duplicate.contacts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Mesclar dados importantes do contato mais antigo
        const mergedData = {
          name: newer.name || older.name,
          email: newer.email || older.email,
          phone: newer.phone || older.phone,
          channelId: newer.channelId || older.channelId,
          macrossetor: newer.macrossetor || older.macrossetor,
          updatedAt: new Date()
        };

        await storage.updateContact(newer.id, mergedData);
        await storage.deleteContact(older.id);
        cleanedCount++;

      } catch (error) {
        console.error(`❌ Erro ao limpar duplicata:`, error);
      }
    }

    console.log(`✅ Limpeza concluída! ${cleanedCount} duplicatas removidas.`);
    
    return {
      cleaned: cleanedCount,
      success: true
    };

  } catch (error) {
    console.error('❌ Erro na limpeza de dados:', error);
    throw error;
  }
}