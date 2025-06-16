import { Request, Response, NextFunction } from 'express';
import { UPLOAD_CONFIG } from './config';

export const validateFileType = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum arquivo foi enviado'
    });
  }

  const fileExt = `.${req.file.originalname.split('.').pop()?.toLowerCase()}`;
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(fileExt as '.pdf' | '.docx' | '.doc')) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de arquivo não permitido'
    });
  }

  next();
};

export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Parâmetro de busca é obrigatório'
    });
  }
  next();
}; 