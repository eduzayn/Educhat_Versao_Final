import { Express } from 'express';
import uploadRouter from './routes/upload';
import uploadProductionRouter from './routes/upload-production';
import staticRouter from './routes/static';

/**
 * Módulo Media - Sistema de Upload e Mídia
 * 
 * Funcionalidades:
 * - Upload de arquivos de mídia (imagens, vídeos, áudios, documentos)
 * - Validação de tipos de arquivo
 * - Configuração de cache para otimização
 * - Gestão de armazenamento local e no banco de dados
 */
export function registerMediaRoutes(app: Express) {
  // Rotas de upload (legacy - sistema de arquivos)
  app.use('/api/messages', uploadRouter);

  // Rotas de upload para produção (banco de dados)
  app.use('/api/media', uploadProductionRouter);

  // Rotas de arquivos estáticos
  app.use('/uploads', staticRouter);
}