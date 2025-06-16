import { Router, Request, Response } from 'express';
import { documentService } from '../../services/documentService';
import { validateSearchQuery } from './middleware';

const router = Router();

router.get('/search', validateSearchQuery, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const documents = await documentService.searchDocuments(query as string);
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

export default router; 