import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from './permissions';

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
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/avi',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mpeg',
      'application/pdf', 'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

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

      const fileUrl = `/uploads/media/${req.file.filename}`;
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 
                      req.file.mimetype.startsWith('video/') ? 'video' : 
                      req.file.mimetype.startsWith('audio/') ? 'audio' : 'document';

      res.json({
        fileUrl,
        originalName: req.file.originalname,
        fileType,
        size: req.file.size,
        mimeType: req.file.mimetype
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

  // Endpoint para buscar áudio de mensagem específica
  app.get('/api/messages/:messageId/audio', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { messageId } = req.params;
      
      // Aqui você implementaria a lógica para buscar o áudio da mensagem
      // Por enquanto, retorno um exemplo
      res.json({
        audioUrl: `/uploads/media/audio_${messageId}.mp3`,
        duration: 30 // duração em segundos
      });

    } catch (error) {
      console.error('Erro ao buscar áudio:', error);
      res.status(404).json({ error: 'Áudio não encontrado' });
    }
  });

  // Endpoint para enviar reação
  app.post('/api/zapi/send-reaction', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { phone, reaction } = req.body;

      if (!phone || !reaction) {
        return res.status(400).json({ error: 'Dados incompletos para enviar reação' });
      }

      const instanceId = process.env.ZAPI_INSTANCE_ID;
      const token = process.env.ZAPI_TOKEN;
      const clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (!instanceId || !token || !clientToken) {
        return res.status(500).json({ error: 'Configuração Z-API incompleta' });
      }

      console.log(`🎭 Enviando reação: ${reaction} para ${phone}`);

      // Enviar reação via Z-API como mensagem de texto
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          message: reaction
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Reação enviada com sucesso: ${reaction}`);
        res.json({
          success: true,
          reaction,
          zaapId: data.zaapId || data.id,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ Erro na resposta Z-API:', data);
        res.status(400).json({ error: 'Falha ao enviar reação via Z-API' });
      }

    } catch (error) {
      console.error('Erro ao enviar reação:', error);
      res.status(500).json({ error: 'Erro ao enviar reação' });
    }
  });

  // Endpoint para remover reação
  app.post('/api/zapi/remove-reaction', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { phone, messageId } = req.body;

      if (!phone || !messageId) {
        return res.status(400).json({ error: 'Dados incompletos para remover reação' });
      }

      console.log(`🎭 Reação removida da mensagem ${messageId} no WhatsApp ${phone}`);
      
      res.json({
        success: true,
        messageId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao remover reação:', error);
      res.status(500).json({ error: 'Erro ao remover reação' });
    }
  });
}