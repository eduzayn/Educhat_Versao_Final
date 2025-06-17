import type { Express } from "express";
import { storage } from "../storage";

export function registerContactPhotoRoutes(app: Express) {
  app.get('/api/contacts/:id/photo', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      if (!contact || !contact.phone) {
        return res.status(404).json({ message: 'Contato não encontrado ou sem telefone' });
      }
      const { getContactPhoto } = await import('../../utils/zapi');
      const photoUrl = await getContactPhoto(contact.phone);
      if (photoUrl) {
        await storage.updateContact(contactId, { profileImageUrl: photoUrl });
        res.json({ photoUrl, updated: true });
      } else {
        res.json({ photoUrl: null, updated: false });
      }
    } catch (error) {
      console.error('Erro ao buscar foto do contato:', error);
      res.status(500).json({ message: 'Erro ao buscar foto do contato' });
    }
  });

  app.post('/api/contacts/update-photos', async (req, res) => {
    try {
      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;
      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          message: 'Credenciais Z-API não configuradas',
          error: 'ZAPI_CREDENTIALS_MISSING'
        });
      }
      const contacts = await storage.getAllContacts();
      let updatedCount = 0;
      let errorCount = 0;
      console.log(`🔄 Iniciando atualização de fotos para ${contacts.length} contatos`);
      for (const contact of contacts) {
        try {
          if (!contact.phone) {
            continue;
          }
          const phoneNumber = contact.phone.replace(/\D/g, '');
          if (!phoneNumber || phoneNumber.length < 10) {
            continue;
          }
          const photoUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-pic`;
          const photoResponse = await fetch(`${photoUrl}?phone=${phoneNumber}`, {
            method: 'GET',
            headers: {
              'Client-Token': clientToken
            }
          });
          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            if (photoData.profilePicUrl && photoData.profilePicUrl !== contact.profileImageUrl) {
              await storage.updateContact(contact.id, {
                profileImageUrl: photoData.profilePicUrl
              });
              console.log(`✅ Foto atualizada para ${contact.name} (${phoneNumber})`);
              updatedCount++;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (contactError) {
          console.error(`❌ Erro ao atualizar foto do contato ${contact.name}:`, contactError);
          errorCount++;
        }
      }
      console.log(`📊 Atualização concluída: ${updatedCount} fotos atualizadas, ${errorCount} erros`);
      res.json({
        success: true,
        updated: updatedCount,
        errors: errorCount,
        total: contacts.length
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar fotos dos contatos:', error);
      res.status(500).json({ 
        message: 'Erro interno ao atualizar fotos dos contatos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 