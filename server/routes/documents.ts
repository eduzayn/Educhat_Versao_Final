import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { documentService } from '../services/documentService';

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
      cb(new Error('Tipo de arquivo não suportado. Use apenas PDF, DOCX ou DOC.'));
    }
  }
});

/**
 * POST /api/documents/upload
 * Upload e processamento de documento PDF/DOCX
 */
router.post('/upload', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
    }

    console.log(`📄 Processando documento: ${req.file.originalname}`);

    // Processar o documento
    const result = await documentService.processDocument(
      req.file.path,
      req.file.originalname
    );

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.warn('⚠️ Erro ao limpar arquivo temporário:', error);
    }

    if (result.success) {
      console.log(`✅ Documento processado com sucesso: ${req.file.originalname}`);
      return res.json(result);
    } else {
      console.error(`❌ Erro no processamento: ${result.error}`);
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erro interno no upload:', error);
    
    // Limpar arquivo em caso de erro
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Erro ao limpar arquivo após erro:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/documents/recent
 * Lista documentos processados recentemente
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const documents = await documentService.getRecentDocuments(limit);

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('❌ Erro ao buscar documentos recentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/documents/search
 * Busca documentos por palavras-chave
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro de busca é obrigatório'
      });
    }

    const documents = await documentService.searchDocuments(query.trim());

    res.json({
      success: true,
      documents,
      query: query.trim()
    });

  } catch (error) {
    console.error('❌ Erro na busca de documentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/documents/stats
 * Estatísticas dos documentos processados
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const recent = await documentService.getRecentDocuments(100);
    
    const stats = {
      totalDocuments: recent.length,
      categorias: recent.reduce((acc: Record<string, number>, doc: any) => {
        const category = doc.metadata?.category || 'Não categorizado';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      ultimoProcessamento: recent[0]?.createdAt || null,
      tamanhoMedio: recent.length > 0 
        ? Math.round(recent.reduce((acc: number, doc: any) => 
            acc + (doc.metadata?.wordCount || 0), 0) / recent.length)
        : 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;