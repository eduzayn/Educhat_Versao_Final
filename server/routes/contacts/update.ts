import type { Express } from "express";
import { storage } from "../../storage";
import { insertContactSchema } from "@shared/schema";

export function registerContactUpdateRoutes(app: Express) {
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
} 