import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertConversationSchema, insertContactNoteSchema } from "@shared/schema";

export function registerInboxRoutes(app: Express) {
  
  // Conversations endpoints
  app.get('/api/conversations', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Aumentado para carregar mais conversas
      const offset = (page - 1) * limit;
      
      const conversations = await storage.getConversations(limit, offset);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get total unread count - deve vir ANTES da rota genérica :id
  app.get('/api/conversations/unread-count', async (req, res) => {
    try {
      const totalUnread = await storage.getTotalUnreadCount();
      res.json({ count: totalUnread });
    } catch (error) {
      console.error('Erro ao buscar total de mensagens não lidas:', error);
      res.status(500).json({ message: 'Falha ao buscar contadores' });
    }
  });

  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  app.post('/api/conversations', async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ message: 'Invalid conversation data' });
    }
  });

  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(id, validatedData);
      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(400).json({ message: 'Failed to update conversation' });
    }
  });

  // Update conversation status endpoint
  app.patch('/api/conversations/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const validStatuses = ['open', 'pending', 'resolved', 'closed', 'new', 'in_progress'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const conversation = await storage.updateConversation(id, { status });
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Broadcast status update to WebSocket clients
      const { broadcast } = await import('../realtime');
      broadcast(id, {
        type: 'status_update',
        conversationId: id,
        status
      });

      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation status:', error);
      res.status(500).json({ message: 'Failed to update conversation status' });
    }
  });

  // Mark conversation as read
  app.patch('/api/conversations/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markConversationAsRead(id);
      res.json({ message: 'Conversation marked as read' });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ message: 'Failed to mark conversation as read' });
    }
  });

  // Mark conversation as unread
  app.post('/api/conversations/:id/mark-unread', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markConversationAsUnread(id);
      res.json({ message: 'Conversation marked as unread' });
    } catch (error) {
      console.error('Error marking conversation as unread:', error);
      res.status(500).json({ message: 'Failed to mark conversation as unread' });
    }
  });

  // Recalculate unread counts
  app.post('/api/conversations/recalculate-unread', async (req, res) => {
    try {
      await storage.recalculateUnreadCounts();
      res.json({ message: 'Contadores recalculados com sucesso' });
    } catch (error) {
      console.error('Erro ao recalcular contadores:', error);
      res.status(500).json({ message: 'Falha ao recalcular contadores' });
    }
  });

  // Contact notes endpoints
  app.get('/api/contact-notes/contact/:contactId', async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const notes = await storage.getContactNotes(contactId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ message: 'Failed to fetch contact notes' });
    }
  });

  app.post('/api/contact-notes', async (req, res) => {
    try {
      const validatedData = insertContactNoteSchema.parse(req.body);
      const note = await storage.createContactNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating contact note:', error);
      res.status(400).json({ message: 'Invalid note data' });
    }
  });

  app.patch('/api/contact-notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactNoteSchema.partial().parse(req.body);
      const note = await storage.updateContactNote(id, validatedData);
      res.json(note);
    } catch (error) {
      console.error('Error updating contact note:', error);
      res.status(400).json({ message: 'Failed to update contact note' });
    }
  });

  app.delete('/api/contact-notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContactNote(id);
      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact note:', error);
      res.status(500).json({ message: 'Failed to delete contact note' });
    }
  });
}