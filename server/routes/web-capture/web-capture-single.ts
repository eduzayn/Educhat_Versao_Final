import { Router, Request, Response } from 'express';
import { WebCaptureService } from '../../services/webCaptureService';

const router = Router();

// POST /api/web-capture - Capture content from a website
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL é obrigatória'
      });
    }

    console.log(`🌐 Iniciando captura de conteúdo web: ${url}`);
    
    const result = await WebCaptureService.captureWebsite(url);
    
    console.log(`✅ Captura concluída: ${result.title}`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('Erro na captura web:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao capturar conteúdo do site'
    });
  }
});

export default router; 