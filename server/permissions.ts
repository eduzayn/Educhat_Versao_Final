import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

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
    macrosetores: string[];
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
      const user = await storage.getUserById(userId);
      return user?.role === 'admin' || user?.role === 'manager';
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
      const user = await storage.getUserById(userId);
      return user?.role === 'admin' || user?.role === 'manager';
    } catch (error) {
      console.error('Erro ao verificar propriedade do recurso:', error);
      return false;
    }
  }

  static async checkTeamAccess(userId: number, resourceId?: string): Promise<boolean> {
    try {
      const user = await storage.getUserById(userId);
      return user?.role === 'admin' || user?.role === 'manager';
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
      return res.status(401).json({ message: "Não autenticado" });
    }

    const hasPermission = await PermissionService.hasPermission(req.user.id, permissionName);
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    next();
  };
}

export function requireAnyPermission(permissionNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const hasAnyPermission = await Promise.all(
      permissionNames.map(permission => PermissionService.hasPermission(req.user!.id, permission))
    );

    if (!hasAnyPermission.some(Boolean)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    next();
  };
}

export function updateLastActivity() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      ActivityMonitor.resetTimer(req.user.id, () => {
        console.log(`User ${req.user!.id} logged out due to inactivity`);
      });
    }
    next();
  };
}

export class ActivityMonitor {
  private static readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  private static userTimers: Map<number, NodeJS.Timeout> = new Map();

  static resetTimer(userId: number, logoutCallback: () => void) {
    if (this.userTimers.has(userId)) {
      clearTimeout(this.userTimers.get(userId)!);
    }

    const timer = setTimeout(() => {
      logoutCallback();
      this.userTimers.delete(userId);
    }, this.INACTIVITY_TIMEOUT);

    this.userTimers.set(userId, timer);
  }

  static clearTimer(userId: number) {
    if (this.userTimers.has(userId)) {
      clearTimeout(this.userTimers.get(userId)!);
      this.userTimers.delete(userId);
    }
  }
}