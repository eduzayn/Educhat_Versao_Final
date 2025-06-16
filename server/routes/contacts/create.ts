import type { Express } from "express";
import { storage } from "../../storage";
import { insertContactSchema } from "@shared/schema";
import { syncContactWithZApi } from "./syncZApi";

export function registerContactCreateRoutes(app: Express) {
  app.post('/api/contacts', async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
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
      console.error('Error creating contact:', error);
      res.status(400).json({ message: 'Invalid contact data' });
    }
  });
} 