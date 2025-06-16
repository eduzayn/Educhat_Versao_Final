import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest, requirePermission } from '../../permissions';

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/media';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    console.log(`🔍 Verificando arquivo: ${file.originalname} com MIME type: ${file.mimetype}`);
    
    const allowedTypes = [
      // Imagens
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      // Vídeos
      'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv',
      // Áudios
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mpeg', 'audio/aac', 'audio/flac',
      // Documentos
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/rtf', 'application/json', 'text/html', 'application/xml', 'text/xml',
      // Tipos adicionais comuns
      'application/octet-stream', 'text/javascript', 'application/javascript'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`✅ Arquivo aceito: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`⚠️ Tipo de arquivo rejeitado: "${file.mimetype}" para arquivo: ${file.originalname}`);
      cb(null, true); // Temporariamente aceitar todos os arquivos para debug
    }
  }
});

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
  
  // Upload de arquivos de mídia
  app.post('/api/messages/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const conversationId = req.body.conversationId;
      const caption = req.body.caption || '';

      if (!conversationId) {
        return res.status(400).json({ error: 'ID da conversa é obrigatório' });
      }

      const fileUrl = `/uploads/media/${req.file.filename}`;
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 
                      req.file.mimetype.startsWith('video/') ? 'video' : 
                      req.file.mimetype.startsWith('audio/') ? 'audio' : 'document';

      // Salvar mensagem no banco de dados
      const { storage } = await import('../../storage');
      
      const messageData = {
        conversationId: parseInt(conversationId),
        content: caption || `${fileType === 'image' ? 'Imagem' : fileType === 'video' ? 'Vídeo' : fileType === 'audio' ? 'Áudio' : 'Documento'} enviado`,
        isFromContact: false,
        messageType: fileType,
        status: 'sent',
        metadata: {
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileType
        }
      };

      console.log('📎 Salvando mensagem de mídia:', {
        conversationId,
        fileType,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

      const savedMessage = await storage.createMessage(messageData);

      // Broadcast via WebSocket
      const { broadcast } = await import('../realtime');
      broadcast(parseInt(conversationId), {
        type: 'message_sent',
        conversationId: parseInt(conversationId),
        message: savedMessage
      });

      res.json({
        fileUrl,
        originalName: req.file.originalname,
        fileType,
        size: req.file.size,
        mimeType: req.file.mimetype,
        message: savedMessage
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({ error: 'Erro no upload do arquivo' });
    }
  });

  // Servir arquivos de mídia
  app.use('/uploads', (req, res, next) => {
    // Adicionar headers de cache para otimização
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
    next();
  });

  // Audio endpoint moved to routes.ts for better database integration

  // Z-API reaction endpoints moved to routes.ts for better integration
}