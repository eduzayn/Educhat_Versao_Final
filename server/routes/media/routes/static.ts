import { Request, Response, Router } from 'express';

const router = Router();

// Servir arquivos de mídia
router.use('/', (req: Request, res: Response, next) => {
  // Adicionar headers de cache para otimização
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
  next();
});

export default router; 