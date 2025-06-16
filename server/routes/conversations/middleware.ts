import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types';

// Middleware de autenticação simplificado
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.isAuthenticated && authReq.isAuthenticated() && authReq.user) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}; 