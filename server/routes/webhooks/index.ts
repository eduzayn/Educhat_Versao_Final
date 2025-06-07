import type { Express } from "express";
import { storage } from "../../storage";
import { validateZApiCredentials } from "../shared/zapi-validation";

export function registerWebhookRoutes(app: Express) {
  
  // Import Z-API contacts - REST: POST /api/zapi/import-contacts
  app.post('/api/zapi/import-contacts', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;

      let allContacts: any[] = [];
      let page = 1;
      const pageSize = 50;
      let hasMorePages = true;

      while (hasMorePages && allContacts.length < 1000) {
        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts?page=${page}&pageSize=${pageSize}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Client-Token': clientToken || '',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
        }

        const pageData = await response.json();
        
        if (Array.isArray(pageData) && pageData.length > 0) {
          allContacts.push(...pageData);
          page++;
          if (pageData.length < pageSize) {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }
      }

      console.log(`Total de contatos encontrados na Z-API: ${allContacts.length}`);
      
      let importedCount = 0;
      let updatedCount = 0;
      
      for (const zapiContact of allContacts) {
        try {
          const phone = zapiContact.phone || zapiContact.id;
          if (!phone) continue;

          const existingContacts = await storage.searchContacts(phone);
          
          const contactData = {
            name: zapiContact.name || zapiContact.short || zapiContact.notify || zapiContact.vname || phone,
            phone: phone,
            email: null,
            profileImageUrl: zapiContact.profilePic || null,
            canalOrigem: 'whatsapp',
            nomeCanal: 'WhatsApp Comercial',
            idCanal: 'whatsapp-1',
            userIdentity: phone
          };

          if (existingContacts.length === 0) {
            await storage.createContact(contactData);
            importedCount++;
          } else {
            const existingContact = existingContacts[0];
            const updatedData: any = {};
            
            if (!existingContact.profileImageUrl && contactData.profileImageUrl) {
              updatedData.profileImageUrl = contactData.profileImageUrl;
            }
            
            if (!existingContact.canalOrigem) {
              updatedData.canalOrigem = contactData.canalOrigem;
              updatedData.nomeCanal = contactData.nomeCanal;
              updatedData.idCanal = contactData.idCanal;
              updatedData.userIdentity = contactData.userIdentity;
            }

            if (Object.keys(updatedData).length > 0) {
              await storage.updateContact(existingContact.id, updatedData);
              updatedCount++;
            }
          }
        } catch (contactError) {
          console.error('Erro ao processar contato:', contactError);
        }
      }

      res.json({
        message: `Importação concluída: ${importedCount} novos contatos, ${updatedCount} atualizados`,
        imported: importedCount,
        updated: updatedCount,
        total: allContacts.length
      });
      
    } catch (error) {
      console.error('Erro ao importar contatos:', error);
      res.status(500).json({ error: 'Erro interno ao importar contatos' });
    }
  });

  // Update all profile pictures - REST: POST /api/zapi/update-all-profile-pictures
  app.post('/api/zapi/update-all-profile-pictures', async (req, res) => {
    try {
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      
      const allContacts = await storage.searchContacts('');
      const contactsWithPhone = allContacts.filter(contact => contact.phone);
      
      console.log(`Encontrados ${contactsWithPhone.length} contatos com telefone para atualizar fotos`);
      
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const contact of contactsWithPhone) {
        try {
          const cleanPhone = contact.phone!.replace(/\D/g, '');
          
          const profileUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-picture?phone=${cleanPhone}`;
          const profileResponse = await fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Client-Token': clientToken || '',
              'Content-Type': 'application/json'
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            
            if (profileData.link && profileData.link !== contact.profileImageUrl) {
              await storage.updateContact(contact.id, {
                profileImageUrl: profileData.link
              });
              updatedCount++;
              console.log(`Foto atualizada para ${contact.name} (${cleanPhone})`);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (contactError) {
          console.error(`Erro ao atualizar foto do contato ${contact.name}:`, contactError);
          errorCount++;
        }
      }

      res.json({
        message: `Atualização concluída: ${updatedCount} fotos atualizadas`,
        updated: updatedCount,
        errors: errorCount,
        total: contactsWithPhone.length
      });
      
    } catch (error) {
      console.error('Erro ao atualizar fotos de perfil:', error);
      res.status(500).json({ 
        error: 'Erro interno ao atualizar fotos de perfil' 
      });
    }
  });

  // Sync messages from Z-API - REST: POST /api/zapi/sync-messages
  app.post('/api/zapi/sync-messages', async (req, res) => {
    try {
      console.log('🔄 Iniciando sincronização de mensagens...');
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const { since, phone } = req.body;
      
      const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);
      
      console.log(`📅 Sincronizando mensagens desde: ${sinceDate.toISOString()}`);
      
      const chatsUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
      
      console.log('🔍 Buscando chats ativos na Z-API...');
      
      const chatsResponse = await fetch(chatsUrl, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!chatsResponse.ok) {
        throw new Error(`Erro na API Z-API: ${chatsResponse.status} - ${chatsResponse.statusText}`);
      }

      const chatsData = await chatsResponse.json();
      const chats = chatsData || [];
      
      console.log(`💬 ${chats.length} chats encontrados na Z-API`);
      
      let processedCount = 0;
      let errorCount = 0;
      const results = [];
      
      for (const chat of chats.slice(0, 20)) {
        try {
          const chatPhone = chat.phone || chat.id;
          if (!chatPhone) continue;
          
          const cleanPhone = chatPhone.replace(/\D/g, '');
          
          const existingContacts = await storage.searchContacts(cleanPhone);
          const contact = existingContacts.find(c => c.phone?.replace(/\D/g, '') === cleanPhone);
          
          if (contact) {
            const conversation = await storage.getConversationByContactAndChannel(contact.id, 'whatsapp');
            
            if (conversation) {
              const recentMessages = await storage.getMessages(conversation.id, 10);
              
              results.push({
                phone: cleanPhone,
                contactName: contact.name,
                status: 'verified',
                conversationExists: true,
                messageCount: recentMessages.length,
                lastMessageAt: conversation.lastMessageAt?.toISOString()
              });
              
              processedCount++;
            } else {
              results.push({
                phone: cleanPhone,
                contactName: contact.name,
                status: 'no_conversation',
                conversationExists: false
              });
            }
          } else {
            results.push({
              phone: cleanPhone,
              contactName: chat.name || cleanPhone,
              status: 'not_in_system',
              conversationExists: false
            });
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar chat ${chat.phone || chat.id}:`, error);
          errorCount++;
          
          results.push({
            phone: chat.phone || chat.id,
            contactName: chat.name || 'Desconhecido',
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
      
      console.log(`✅ Sincronização concluída: ${processedCount} processadas, ${errorCount} erros`);
      
      res.json({
        success: true,
        summary: {
          totalFound: results.length,
          processed: processedCount,
          errors: errorCount,
          since: sinceDate.toISOString()
        },
        results
      });
      
    } catch (error) {
      console.error('💥 Erro na sincronização:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  });
}