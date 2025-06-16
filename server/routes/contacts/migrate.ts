import type { Express } from "express";

export function registerContactMigrateRoutes(app: Express) {
  app.post('/api/contacts/migrate', async (req, res) => {
    res.status(501).json({ message: 'Migration functionality not available' });
  });
} 