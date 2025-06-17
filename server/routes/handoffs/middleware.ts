import { Request, Response, NextFunction } from 'express';

export const validateInternalCall = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-internal-call'] === 'true' || req.ip === '127.0.0.1' || req.ip === '::1') {
    return next();
  }
  return next();
};

export const validateHandoffId = (req: Request, res: Response, next: NextFunction) => {
  const handoffId = parseInt(req.params.id);
  if (isNaN(handoffId)) {
    return res.status(400).json({
      error: 'ID do handoff inválido'
    });
  }
  next();
};

export const validateConversationId = (req: Request, res: Response, next: NextFunction) => {
  const conversationId = parseInt(req.params.conversationId || req.body.conversationId);
  if (isNaN(conversationId)) {
    return res.status(400).json({
      error: 'ID da conversa inválido'
    });
  }
  next();
}; 