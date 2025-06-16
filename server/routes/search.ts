import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { eq, ilike, or, desc } from 'drizzle-orm';
import { conversations, contacts } from '../../shared/schema';
import { db } from '../db';

export function setupSearchRoutes(app: Express) {
  // Rota de busca global
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.json([]);
      }

      const searchTerm = query.trim();
      const results: any[] = [];

      // Buscar contatos
      try {
        const contactResults = await db
          .select({
            id: contacts.id,
            name: contacts.name,
            phone: contacts.phone,
            email: contacts.email,
            canalOrigem: contacts.canalOrigem,
            updatedAt: contacts.updatedAt
          })
          .from(contacts)
          .where(
            or(
              ilike(contacts.name, `%${searchTerm}%`),
              ilike(contacts.phone, `%${searchTerm}%`),
              ilike(contacts.email, `%${searchTerm}%`)
            )
          )
          .orderBy(desc(contacts.updatedAt))
          .limit(10);

        contactResults.forEach(contact => {
          results.push({
            id: contact.id,
            type: 'contact',
            title: contact.name || contact.phone || 'Contato sem nome',
            subtitle: contact.email || contact.phone,
            channel: contact.canalOrigem || 'WhatsApp',
            lastActivity: contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString('pt-BR') : undefined
          });
        });
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      }

      // Buscar conversas
      try {
        const conversationResults = await db
          .select({
            id: conversations.id,
            contactId: conversations.contactId,
            status: conversations.status,
            channel: conversations.channel,
            updatedAt: conversations.updatedAt
          })
          .from(conversations)
          .orderBy(desc(conversations.updatedAt))
          .limit(10);

        // Para cada conversa, buscar o nome do contato
        for (const conversation of conversationResults) {
          try {
            const contact = conversation.contactId ? 
              await db.select({ name: contacts.name, phone: contacts.phone })
                .from(contacts)
                .where(eq(contacts.id, conversation.contactId))
                .limit(1) : null;

            const contactName = contact?.[0]?.name || contact?.[0]?.phone || 'Contato desconhecido';
            
            // Verificar se o nome do contato contém o termo de busca
            if (contactName.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({
                id: conversation.id,
                type: 'conversation',
                title: `Conversa com ${contactName}`,
                subtitle: contactName,
                channel: conversation.channel || 'WhatsApp',
                lastActivity: conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString('pt-BR') : undefined
              });
            }
          } catch (error) {
            console.error('Erro ao buscar detalhes da conversa:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
      }

      // Ordenar resultados por relevância e data
      results.sort((a, b) => {
        // Priorizar contatos que começam com o termo de busca
        const aStartsWithQuery = a.title.toLowerCase().startsWith(searchTerm.toLowerCase());
        const bStartsWithQuery = b.title.toLowerCase().startsWith(searchTerm.toLowerCase());
        
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        
        // Se ambos ou nenhum começam com o termo, ordenar por tipo (contatos primeiro)
        if (a.type !== b.type) {
          return a.type === 'contact' ? -1 : 1;
        }
        
        return 0;
      });

      res.json(results.slice(0, 15)); // Limitar a 15 resultados

    } catch (error) {
      console.error('Erro na busca:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}