import { Router, Request, Response } from 'express';
import { documentService } from '../../services/documentService';

const router = Router();

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