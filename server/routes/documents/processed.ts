import { Router, Request, Response } from 'express';

const router = Router();

router.get('/processed', async (req: Request, res: Response) => {
  try {
    // Retornar lista vazia temporariamente
    const documents: any[] = [];
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

export default router; 