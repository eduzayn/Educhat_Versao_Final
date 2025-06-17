import type { Express } from "express";
import { storage } from "../storage";

export function registerContactInterestsRoutes(app: Express) {
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
} 