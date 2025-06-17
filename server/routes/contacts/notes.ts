import type { Express } from "express";
import { storage } from "../../storage/index";

export function registerContactNotesRoutes(app: Express) {
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
} 