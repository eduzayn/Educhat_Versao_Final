import { Express } from 'express';
import uploadRouter from './routes/upload';
import staticRouter from './routes/static';

/**
 * Módulo Media - Sistema de Upload e Mídia
 * 
 * Funcionalidades:
 * - Upload de arquivos de mídia (imagens, vídeos, áudios, documentos)
 * - Validação de tipos de arquivo
 * - Configuração de cache para otimização
 * - Gestão de armazenamento local
 */
export function registerMediaRoutes(app: Express) {
  // Rotas de upload
  app.use('/api/messages', uploadRouter);

  // Rotas de arquivos estáticos
  app.use('/uploads', staticRouter);
}