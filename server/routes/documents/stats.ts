import { Router, Request, Response } from 'express';
import { DocumentStats } from './types';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats: DocumentStats = {
      totalDocuments: 0,
      totalSizeMB: 0,
      processingStats: {
        success: 0,
        failed: 0,
        pending: 0
      },
      typeDistribution: []
    };
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

export default router; 