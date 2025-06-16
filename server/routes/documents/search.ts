import { Router, Request, Response } from 'express';
import { documentService } from '../../services/documentService';

const router = Router();

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

export default router; 