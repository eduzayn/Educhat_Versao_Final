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

// POST /api/web-capture/batch - Capture content from multiple websites
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de URLs é obrigatória'
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Máximo de 10 URLs por lote'
      });
    }

    console.log(`🌐 Iniciando captura em lote: ${urls.length} URLs`);
    
    const results = await WebCaptureService.captureMultipleUrls(urls);
    
    console.log(`✅ Captura em lote concluída: ${results.length}/${urls.length} sucessos`);
    
    res.json({
      success: true,
      data: results,
      metadata: {
        total: urls.length,
        successful: results.length,
        failed: urls.length - results.length
      }
    });
    
  } catch (error: any) {
    console.error('Erro na captura em lote:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao capturar conteúdo dos sites'
    });
  }
});

export default router;