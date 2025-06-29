import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertContactSchema, insertContactTagSchema } from "@shared/schema";
import { pool } from "../../db";

async function syncContactWithZApi(contact: any) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    throw new Error('Credenciais Z-API não configuradas');
  }

  const phoneNumber = contact.phone.replace(/\D/g, '');
  if (!phoneNumber.startsWith('55')) {
    throw new Error('Número deve estar em formato brasileiro (+55)');
  }

  try {
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({ phone: phoneNumber, name: contact.name })
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
  app.get("/api/contacts", async (req, res) => {
    try {
      const { search, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 50;
      const offset = (pageNum - 1) * limitNum;

      let whereClause = '';
      let params: any[] = [];

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereClause = ' WHERE (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)';
        params.push(searchTerm);
      }

      const countQuery = `SELECT COUNT(*) as total FROM contacts${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      const dataQuery = `SELECT * FROM contacts${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);

      const dataResult = await pool.query(dataQuery, params);

      res.json({
        data: dataResult.rows,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactWithTags(id);

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      
      // ✅ VERIFICAÇÃO DE UNICIDADE POR CANAL
      if (validatedData.phone && validatedData.canalOrigem) {
        const existingContact = await storage.findContactByPhoneAndChannel(
          validatedData.phone,
          validatedData.canalOrigem
        );
        
        if (existingContact) {
          console.log(`🔄 Contato já existe no canal ${validatedData.canalOrigem}: ${existingContact.name} (${existingContact.phone})`);
          return res.status(409).json({ 
            message: "Contato já existe neste canal",
            details: `Telefone ${validatedData.phone} já cadastrado no canal ${validatedData.canalOrigem}`,
            existingContact: {
              id: existingContact.id,
              name: existingContact.name,
              phone: existingContact.phone,
              canalOrigem: existingContact.canalOrigem
            }
          });
        }
      }
      
      const contact = await storage.createContact(validatedData);
      console.log(`✅ Novo contato criado no canal ${validatedData.canalOrigem}: ${contact.name} (${contact.phone})`);

      if (contact.phone) {
        try {
          await syncContactWithZApi(contact);
          console.log(`✅ Contato ${contact.name} sincronizado com Z-API para mensagens ativas`);
        } catch (zapiError) {
          console.warn(`⚠️ Falha ao sincronizar contato com Z-API: ${zapiError}`);
        }
      }

      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "ID do contato inválido" });
      }

      const validatedData = insertContactSchema.partial().parse(req.body);
      
      if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({ message: "Nenhum campo fornecido para atualização" });
      }

      const contact = await storage.updateContact(id, validatedData);
      
      if (!contact) {
        return res.status(404).json({ message: "Contato não encontrado" });
      }

      res.json(contact);
    } catch (error: any) {
      console.error("Error updating contact:", error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: "Dados de contato inválidos: " + error.message });
      }
      res.status(500).json({ message: "Erro interno do servidor ao atualizar contato" });
    }
  });

  // Contact tags endpoints
  app.get("/api/contacts/:id/tags", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tags = await storage.getContactTags(id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching contact tags:", error);
      res.status(500).json({ message: "Failed to fetch contact tags" });
    }
  });

  app.post("/api/contacts/:id/tags", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const validatedData = insertContactTagSchema.parse({
        ...req.body,
        contactId,
      });

      const tag = await storage.addContactTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error adding contact tag:", error);
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  app.delete("/api/contacts/:id/tags/:tag", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const tag = req.params.tag;

      await storage.removeContactTag(contactId, tag);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing contact tag:", error);
      res.status(500).json({ message: "Failed to remove contact tag" });
    }
  });

  // Contact notes endpoints - alias para compatibilidade com frontend
  app.get("/api/contacts/:id/notes", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const notes = await storage.getContactNotes(contactId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching contact notes:", error);
      res.status(500).json({ message: "Failed to fetch contact notes" });
    }
  });

  // Contact interests endpoints
  app.get("/api/contacts/:id/interests", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const interests = await storage.getContactInterests(contactId);
      res.json(interests);
    } catch (error) {
      console.error("Erro ao buscar interesses do contato:", error);
      res.status(500).json({ message: "Erro ao buscar interesses do contato" });
    }
  });

  // Migration endpoint for existing contacts
  app.post("/api/contacts/migrate", async (req, res) => {
    try {
      res.json({
        message: "Migração de contatos desabilitada temporariamente",
        migrated: 0,
        skipped: 0
      });
    } catch (error) {
      console.error("Error running contact migration:", error);
      res
        .status(500)
        .json({ message: "Erro ao executar migração de contatos" });
    }
  });
}
