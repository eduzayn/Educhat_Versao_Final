import type { Express, Request, Response } from "express";
import { storage } from "../../storage/index";
import { db } from "../../db";
import { contacts } from "@shared/schema";
import { ilike, or, desc, count, eq, inArray } from "drizzle-orm";

export function registerContactRoutes(app: Express) {
  // GET /api/contacts - Buscar contatos com paginação e filtros
  app.get('/api/contacts', async (req: Request, res: Response) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const searchTerm = search as string;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let whereConditions;
      
      // Se há termo de busca, aplicar filtros
      if (searchTerm && searchTerm.trim()) {
        const trimmedSearch = searchTerm.trim();
        whereConditions = or(
          ilike(contacts.name, `%${trimmedSearch}%`),
          ilike(contacts.phone, `%${trimmedSearch}%`),
          ilike(contacts.email, `%${trimmedSearch}%`)
        );
      }

      // Buscar contatos com filtros aplicados
      const contactsQuery = db
        .select()
        .from(contacts)
        .orderBy(desc(contacts.updatedAt))
        .limit(limitNum)
        .offset(offset);

      if (whereConditions) {
        contactsQuery.where(whereConditions);
      }

      const contactsData = await contactsQuery;

      // Contar total de contatos com os mesmos filtros
      const countQuery = db
        .select({ count: count() })
        .from(contacts);

      if (whereConditions) {
        countQuery.where(whereConditions);
      }

      const [{ count: totalCount }] = await countQuery;

      res.json({
        data: contactsData,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      });

    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/contacts/search - Buscar contatos para seleção (sem paginação)
  app.get('/api/contacts/search', async (req: Request, res: Response) => {
    try {
      const { q = '' } = req.query;
      const searchTerm = q as string;

      let whereConditions;
      
      // Se há termo de busca, aplicar filtros
      if (searchTerm && searchTerm.trim()) {
        const trimmedSearch = searchTerm.trim();
        whereConditions = or(
          ilike(contacts.name, `%${trimmedSearch}%`),
          ilike(contacts.phone, `%${trimmedSearch}%`),
          ilike(contacts.email, `%${trimmedSearch}%`)
        );
      }

      // Buscar contatos sem limitação de paginação para seleção
      const contactsQuery = db
        .select({
          id: contacts.id,
          name: contacts.name,
          phone: contacts.phone,
          email: contacts.email,
          profileImageUrl: contacts.profileImageUrl
        })
        .from(contacts)
        .orderBy(desc(contacts.updatedAt))
        .limit(500); // Limite maior para permitir busca ampla

      if (whereConditions) {
        contactsQuery.where(whereConditions);
      }

      const contactsData = await contactsQuery;

      res.json(contactsData);

    } catch (error) {
      console.error('Erro ao buscar contatos para seleção:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/contacts/:id - Buscar contato específico
  app.get('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/contacts - Criar novo contato
  app.post('/api/contacts', async (req: Request, res: Response) => {
    try {
      const contactData = req.body;
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // PUT /api/contacts/:id - Atualizar contato
  app.put('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const updateData = req.body;
      
      const contact = await storage.updateContact(contactId, updateData);
      res.json(contact);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // DELETE /api/contacts/:id - Deletar contato
  app.delete('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      
      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'ID do contato inválido' });
      }
      
      await storage.deleteContact(contactId);
      res.json({ success: true, message: 'Contato excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar contato:', error);
      
      // Retornar mensagem de erro específica se disponível
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/contacts/:id/photo - Atualizar foto do contato via WhatsApp
  app.get('/api/contacts/:id/photo', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }

      // Simular busca de foto via WhatsApp (implementar integração real se necessário)
      res.json({ 
        updated: false, 
        message: 'Funcionalidade de atualização de foto ainda não implementada' 
      });
    } catch (error) {
      console.error('Erro ao buscar foto do contato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/contacts/update-photos - Atualizar todas as fotos
  app.post('/api/contacts/update-photos', async (req: Request, res: Response) => {
    try {
      // Simular atualização em massa de fotos
      res.json({ 
        updated: 0, 
        message: 'Funcionalidade de atualização em massa ainda não implementada' 
      });
    } catch (error) {
      console.error('Erro ao atualizar fotos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/contacts/export - Exportar contatos
  app.post('/api/contacts/export', async (req: Request, res: Response) => {
    try {
      const { contactIds } = req.body;
      
      // Buscar contatos para exportar
      let contactsToExport;
      
      if (contactIds && contactIds.length > 0) {
        // Se IDs específicos foram fornecidos, buscar apenas esses contatos
        contactsToExport = await db
          .select()
          .from(contacts)
          .where(inArray(contacts.id, contactIds));
      } else {
        // Se nenhum ID específico, exportar todos
        contactsToExport = await db
          .select()
          .from(contacts);
      }

      // Gerar CSV
      const csvHeader = 'Nome,Telefone,Email,Canal de Origem,Data de Criação\n';
      const csvRows = contactsToExport.map(contact => 
        `"${contact.name || ''}","${contact.phone || ''}","${contact.email || ''}","${contact.canalOrigem || ''}","${contact.createdAt || ''}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contatos.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error('Erro ao exportar contatos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/contacts/:id/notes - Buscar notas do contato
  app.get('/api/contacts/:id/notes', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const notes = await storage.getContactNotes(contactId);
      res.json(notes || []);
    } catch (error) {
      console.error('Erro ao buscar notas do contato:', error);
      res.status(500).json({ message: 'Erro ao buscar notas do contato' });
    }
  });

  // POST /api/contacts/:id/notes - Adicionar nota ao contato
  app.post('/api/contacts/:id/notes', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Conteúdo da nota é obrigatório' });
      }
      
      const note = await storage.addContactNote(contactId, content.trim());
      res.status(201).json(note);
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/contacts/:id/interests - Buscar interesses do contato
  app.get('/api/contacts/:id/interests', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const interests = await storage.getContactInterests(contactId);
      res.json(interests || []);
    } catch (error) {
      console.error('Erro ao buscar interesses do contato:', error);
      res.status(500).json({ message: 'Erro ao buscar interesses do contato' });
    }
  });

  // GET /api/contacts/:id/deals - Buscar negócios do contato
  app.get('/api/contacts/:id/deals', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      const deals = await storage.getContactDeals(contactId);
      res.json({ deals: deals || [] });
    } catch (error) {
      console.error('Erro ao buscar negócios do contato:', error);
      res.status(500).json({ message: 'Erro ao buscar negócios do contato' });
    }
  });

  console.log("Contact routes registered");
}