import { Router } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage as storageEngine } from '../../storage';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configuração do multer para upload de arquivos
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/deals');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Upload de anexo - REST: POST /api/deals/:id/attachments
router.post('/:id/attachments', 
  requirePermission('deals:update'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }
      // Apenas retorna o arquivo salvo, sem persistência em banco
      res.status(201).json({
        message: 'Arquivo enviado com sucesso',
        file: {
          originalname: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Erro ao fazer upload de anexo:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  }
);

// Listar anexos - REST: GET /api/deals/:id/attachments
router.get('/:id/attachments', requirePermission('deals:read'), async (req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Funcionalidade não implementada' });
});

// Remover anexo - REST: DELETE /api/deals/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', requirePermission('deals:update'), async (req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Funcionalidade não implementada' });
});

// Adicionar comentário - REST: POST /api/deals/:id/comments
router.post('/:id/comments', requirePermission('deals:update'), async (req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Funcionalidade não implementada' });
});

// Listar comentários - REST: GET /api/deals/:id/comments
router.get('/:id/comments', requirePermission('deals:read'), async (req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Funcionalidade não implementada' });
});

// Remover comentário - REST: DELETE /api/deals/:id/comments/:commentId
router.delete('/:id/comments/:commentId', requirePermission('deals:update'), async (req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Funcionalidade não implementada' });
});

export default router; 