import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertContactSchema, insertContactTagSchema } from "@shared/schema";
import { validateZApiCredentials } from "../../utils/zapi";
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
      
      const tag = await storage.addContactTag(validatedData);
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

  // Update profile pictures from Z-API
  app.post('/api/contacts/update-photos', async (req, res) => {
    try {
      console.log('📸 Iniciando atualização de fotos de perfil...');
      
      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      
      // Buscar contatos via SQL simples para evitar problemas de tipos
      const result = await pool.query(`
        SELECT id, name, phone 
        FROM contacts 
        WHERE phone IS NOT NULL 
        AND (profile_image_url IS NULL OR profile_image_url = '' OR profile_image_url LIKE '%attached_assets%')
        ORDER BY created_at DESC
        LIMIT 50
      `);
      
      const contacts = result.rows;
      console.log(`📊 Encontrados ${contacts.length} contatos sem foto de perfil`);
      
      let updated = 0;
      let errors = 0;
      
      // Processar em lotes pequenos
      for (const contact of contacts) {
        try {
          if (!contact.phone) continue;
          
          const cleanPhone = contact.phone.replace(/\D/g, '');
          const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts/${cleanPhone}/profile-picture`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Client-Token': clientToken || '',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.log(`❌ Erro ao buscar foto para ${cleanPhone}: ${response.status}`);
            errors++;
            continue;
          }

          const data = await response.json();
          
          if (data.value?.profilePictureUrl) {
            // Atualizar usando SQL direto
            await pool.query(
              'UPDATE contacts SET profile_image_url = $1, updated_at = NOW() WHERE id = $2',
              [data.value.profilePictureUrl, contact.id]
            );
            
            console.log(`✅ Foto atualizada para ${contact.name} (${cleanPhone})`);
            updated++;
          }
          
          // Pausa entre requisições
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Erro ao processar contato ${contact.id}:`, error);
          errors++;
        }
      }

      const summary = {
        total: contacts.length,
        updated,
        errors,
        message: `${updated} fotos atualizadas com sucesso`
      };

      console.log('✅ Atualização de fotos concluída:', summary);
      res.json(summary);
      
    } catch (error) {
      console.error('❌ Erro na atualização de fotos:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get profile picture from Z-API for specific contact
  app.get('/api/zapi/profile-picture', async (req, res) => {
    try {
      const phone = req.query.phone as string;
      
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts/${cleanPhone}/profile-picture`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Z-API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
      
    } catch (error) {
      console.error('Erro ao buscar foto de perfil:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

}