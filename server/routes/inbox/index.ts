import { Express } from 'express';
import conversationsRouter from './conversations';
import contactNotesRouter from './contact-notes';

export function registerInboxRoutes(app: Express) {
  // Rotas de conversas movidas para conversations/index.ts - evitando duplicação
  // app.use('/api/conversations', conversationsRouter); // REMOVIDO - já registrado em routes/index.ts

  // Rotas de notas de contato
  app.use('/api/contact-notes', contactNotesRouter);
}