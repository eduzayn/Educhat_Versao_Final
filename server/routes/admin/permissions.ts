import type { Request, Response, NextFunction } from "express";
import { storage } from "../../core/storage";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    displayName: string;
    role: string;
    roleId: number;
    dataKey?: string;
    channels: string[];
    teams: string[];
    teamId?: number | null;
    team?: string | null;
  } | undefined;
}

export class PermissionService {
  static async hasPermission(userId: number, permissionName: string, context?: {
    resourceId?: string;
    channelId?: number;
    teamId?: number;
  }): Promise<boolean> {
    try {
      const user = await storage.getSystemUser(userId);
      if (!user) return false;
      
      // Check if user has the specific permission through their role
      const hasPermission = await storage.checkUserPermission(userId, permissionName);
      return hasPermission;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  static async logAction(data: {
    userId: number;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: any;
  }): Promise<void> {
    try {
      console.log(`Audit: User ${data.userId} performed ${data.action} on ${data.resourceType}${data.resourceId ? ` ${data.resourceId}` : ''}`);
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  }

  static getDataKeyFilter(userDataKey?: string) {
    return userDataKey ? { dataKey: userDataKey } : {};
  }

  static async checkResourceOwnership(userId: number, permissionName: string, resourceId: string): Promise<boolean> {
    try {
      const user = await storage.getSystemUser(userId);
      if (!user) return false;
      
      // Admin tem acesso total
      if (user.role === 'admin') return true;
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar propriedade do recurso:', error);
      return false;
    }
  }

  static async checkTeamAccess(userId: number, resourceId?: string): Promise<boolean> {
    try {
      const user = await storage.getSystemUser(userId);
      if (!user) return false;
      
      // Admin tem acesso total
      if (user.role === 'admin') return true;
      
      return user.teamId !== null;
    } catch (error) {
      console.error('Erro ao verificar acesso da equipe:', error);
      return false;
    }
  }
}

export function requirePermission(permissionName: string, extractContext?: (req: AuthenticatedRequest) => {
  resourceId?: string;
  channelId?: number;
  teamId?: number;
}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado - usuário não autenticado' });
    }

    const context = extractContext ? extractContext(req) : {};
    const hasPermission = await PermissionService.hasPermission(req.user.id, permissionName, context);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Acesso negado - permissão insuficiente' });
    }

    next();
  };
}

export function requireAnyPermission(permissionNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado - usuário não autenticado' });
    }

    let hasAnyPermission = false;
    for (const permission of permissionNames) {
      if (await PermissionService.hasPermission(req.user.id, permission)) {
        hasAnyPermission = true;
        break;
      }
    }

    if (!hasAnyPermission) {
      return res.status(403).json({ error: 'Acesso negado - permissão insuficiente' });
    }

    next();
  };
}

export function updateLastActivity() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      ActivityMonitor.resetTimer(req.user.id, () => {
        req.logout((err) => {
          if (err) console.error('Erro ao fazer logout automático:', err);
        });
      });
    }
    next();
  };
}

export class ActivityMonitor {
  private static readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  private static userTimers: Map<number, NodeJS.Timeout> = new Map();

  static resetTimer(userId: number, logoutCallback: () => void) {
    // Limpar timer existente
    this.clearTimer(userId);
    
    // Definir novo timer
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