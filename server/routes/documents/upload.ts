import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { documentService } from '../../services/documentService';
import { UPLOAD_CONFIG } from './config';
import { validateFileType } from './middleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_CONFIG.UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_CONFIG.UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_CONFIG.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase() as '.pdf' | '.docx' | '.doc';
    if (UPLOAD_CONFIG.ALLOWED_TYPES.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, DOCX e DOC são permitidos'));
    }
  }
});

router.post('/upload', upload.single('document'), validateFileType, async (req: Request, res: Response) => {
  try {
    const result = await documentService.processDocument(req.file!.path, req.file!.originalname);
    fs.unlinkSync(req.file!.path);
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

export default router; 