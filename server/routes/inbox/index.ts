import { Express } from 'express';
import conversationsRouter from './conversations';
import contactNotesRouter from './contact-notes';

export function registerInboxRoutes(app: Express) {
  // Rotas de conversas
  app.use('/api/conversations', conversationsRouter);

  // Rotas de notas de contato
  app.use('/api/contact-notes', contactNotesRouter);
}