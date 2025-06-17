import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from './permissionTypes';

/**
 * Monitor de atividade para logout automático
 */
export class ActivityMonitor {
  private static readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  private static userTimers: Map<number, NodeJS.Timeout> = new Map();

  static resetTimer(userId: number, logoutCallback: () => void) {
    this.clearTimer(userId);
    
    const timer = setTimeout(() => {
      console.log(`Usuário ${userId} desconectado por inatividade`);
      logoutCallback();
      this.clearTimer(userId);
    }, this.INACTIVITY_TIMEOUT);
    
    this.userTimers.set(userId, timer);
  }

  static clearTimer(userId: number) {
    const timer = this.userTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.userTimers.delete(userId);
    }
  }
}

/**
 * Middleware para atualizar atividade do usuário
 */
export function updateLastActivity() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      ActivityMonitor.resetTimer(req.user.id, () => {
        if (req.logout) {
          req.logout((err) => {
            if (err) console.error('Erro ao fazer logout automático:', err);
          });
        }
      });
    }
    next();
  };
} 