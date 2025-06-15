import type { Express } from "express";
import { storage } from "../../storage";
import { insertContactSchema, insertContactTagSchema } from "@shared/schema";
import { pool } from "../../db";

/**
 * Sincroniza contato criado manualmente com Z-API para permitir mensagens ativas
 */
async function syncContactWithZApi(contact: any) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  
  if (!instanceId || !token || !clientToken) {
    throw new Error('Credenciais Z-API não configuradas');
  }
  
  // Verifica se o número está em formato válido para WhatsApp
  const phoneNumber = contact.phone.replace(/\D/g, '');
  if (!phoneNumber.startsWith('55')) {
    throw new Error('Número deve estar em formato brasileiro (+55)');
  }
  
  try {
    // Registra contato na Z-API para permitir mensagens ativas
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: phoneNumber,
        name: contact.name
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro Z-API: ${response.status} - ${errorData}`);
    }
    
    console.log(`✅ Contato ${contact.name} (${phoneNumber}) adicionado ao Z-API`);
    return await response.json();
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar contato com Z-API:', error);
    throw error;
  }
}

export function registerContactRoutes(app: Express) {
  
  // Contacts endpoints  
  app.get('/api/contacts', async (req, res) => {
    try {
      const { search, page = '1', limit = '50' } = req.query;
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 50;
      const offset = (pageNum - 1) * limitNum;
      
      let whereClause = '';
      let params: any[] = [];
      
      // Se há uma pesquisa, aplicar filtros
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereClause = ' WHERE (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)';
        params.push(searchTerm);
      }
      
      // Query para contar total
      const countQuery = `SELECT COUNT(*) as total FROM contacts${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      
      // Query para buscar dados com paginação
      const dataQuery = `SELECT * FROM contacts${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
      
      const dataResult = await pool.query(dataQuery, params);
      
      res.json({
        data: dataResult.rows,
        total: total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  app.get('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactWithTags(id);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: 'Failed to fetch contact' });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      
      // Criar contato no banco local
      const contact = await storage.createContact(validatedData);
      
      // Integração com Z-API - adicionar contato para permitir mensagens ativas
      if (contact.phone) {
        try {
          await syncContactWithZApi(contact);
          console.log(`✅ Contato ${contact.name} sincronizado com Z-API para mensagens ativas`);
        } catch (zapiError) {
          console.warn(`⚠️ Falha ao sincronizar contato com Z-API: ${zapiError}`);
          // Não falha a criação do contato por erro na Z-API
        }
      }
      
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });

  app.put('/api/contacts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });

  // Contact tags endpoints
  app.get('/api/contacts/:id/tags', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tags = await storage.getContactTags(id);
      res.json(tags);
    } catch (error) {
      console.error('Error fetching contact tags:', error);
      res.status(500).json({ message: 'Failed to fetch contact tags' });
    }
  });

  app.post('/api/contacts/:id/tags', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const validatedData = insertContactTagSchema.parse({
        ...req.body,
        contactId,
      });
      
      const tag = await storage.addContactTag(contactId, validatedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error adding contact tag:', error);
      res.status(400).json({ message: 'Invalid tag data' });
    }
  });

  app.delete('/api/contacts/:id/tags/:tag', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const tag = req.params.tag;
      
      await storage.removeContactTag(contactId, tag);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing contact tag:', error);
      res.status(500).json({ message: 'Failed to remove contact tag' });
    }
  });

  // Contact notes endpoints - alias para compatibilidade com frontend
  app.get('/api/contacts/:id/notes', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const notes = await storage.getContactNotes(contactId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ message: 'Failed to fetch contact notes' });
    }
  });

  // Contact interests endpoints
  app.get('/api/contacts/:id/interests', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const interests = await storage.getContactInterests(contactId);
      res.json(interests);
    } catch (error) {
      console.error('Erro ao buscar interesses do contato:', error);
      res.status(500).json({ message: 'Erro ao buscar interesses do contato' });
    }
  });

  // Get contact photo from Z-API
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
        // Update contact with new photo URL
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

  // Update all contact photos from Z-API
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

      // Get all contacts from database
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

          // Get profile photo from Z-API
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
              // Update contact with new profile image URL
              await storage.updateContact(contact.id, {
                profileImageUrl: photoData.profilePicUrl
              });
              
              console.log(`✅ Foto atualizada para ${contact.name} (${phoneNumber})`);
              updatedCount++;
            }
          }
          
          // Small delay to avoid rate limiting
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

  // Migration endpoint for existing contacts
  app.post('/api/contacts/migrate', async (req, res) => {
    res.status(501).json({ message: 'Migration functionality not available' });
  });
}