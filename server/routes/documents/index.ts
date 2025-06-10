import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { documentService } from '../../services/documentService';

const router = Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, DOCX e DOC são permitidos'));
    }
  }
});

// Upload e processamento de documento
router.post('/upload', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo foi enviado' 
      });
    }

    const result = await documentService.processDocument(req.file.path, req.file.originalname);
    
    // Remove o arquivo temporário após processamento
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    
    // Remove o arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Listar documentos processados
router.get('/processed', async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getDocuments();
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar documentos
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro de busca é obrigatório'
      });
    }

    const documents = await documentService.searchDocuments(query);
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Erro na busca de documentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Estatísticas de documentos
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await documentService.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Documentos recentes
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getRecentDocuments();
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Erro ao buscar documentos recentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;