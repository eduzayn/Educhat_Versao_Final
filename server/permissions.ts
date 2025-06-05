import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { systemUsers, roles, permissions, rolePermissions, customRules, auditLogs } from '../shared/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    roleId: number;
    dataKey?: string;
    channels: string[];
    macrosetores: string[];
  };
}

export class PermissionService {
  /**
   * Verifica se um usuário tem uma permissão específica
   */
  static async hasPermission(userId: number, permissionName: string, context?: {
    channel?: string;
    macrosetor?: string;
    resourceId?: string;
  }): Promise<boolean> {
    try {
      // Buscar usuário com sua função
      const user = await db
        .select({
          id: systemUsers.id,
          roleId: systemUsers.roleId,
          role: systemUsers.role,
          dataKey: systemUsers.dataKey,
          channels: systemUsers.channels,
          macrosetores: systemUsers.macrosetores,
        })
        .from(systemUsers)
        .where(and(
          eq(systemUsers.id, userId),
          eq(systemUsers.isActive, true)
        ))
        .limit(1);

      if (!user.length) return false;

      const userData = user[0];

      // Admin tem acesso total
      if (userData.role === 'admin') return true;

      // Verificar permissões por função
      const rolePermission = await db
        .select({ id: permissions.id })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(and(
          eq(rolePermissions.roleId, userData.roleId || 0),
          eq(permissions.name, permissionName),
          eq(permissions.isActive, true),
          eq(rolePermissions.isActive, true)
        ))
        .limit(1);

      if (rolePermission.length) {
        // Verificar contexto (canal, macrosetor)
        if (context) {
          if (context.channel && userData.channels) {
            const userChannels = Array.isArray(userData.channels) ? userData.channels : [];
            if (userChannels.length > 0 && !userChannels.includes(context.channel)) {
              return false;
            }
          }

          if (context.macrosetor && userData.macrosetores) {
            const userMacrosetores = Array.isArray(userData.macrosetores) ? userData.macrosetores : [];
            if (userMacrosetores.length > 0 && !userMacrosetores.includes(context.macrosetor)) {
              return false;
            }
          }
        }

        return true;
      }

      // Verificar regras customizadas
      const customRule = await db
        .select({ id: customRules.id, conditions: customRules.conditions })
        .from(customRules)
        .innerJoin(permissions, eq(customRules.permissionId, permissions.id))
        .where(and(
          eq(customRules.userId, userId),
          eq(permissions.name, permissionName),
          eq(customRules.isActive, true)
        ))
        .limit(1);

      if (customRule.length) {
        const rule = customRule[0];
        // Implementar lógica de condições customizadas
        if (rule.conditions && context) {
          const conditions = rule.conditions as any;
          
          if (conditions.channels && context.channel) {
            if (!conditions.channels.includes(context.channel)) return false;
          }
          
          if (conditions.macrosetores && context.macrosetor) {
            if (!conditions.macrosetores.includes(context.macrosetor)) return false;
          }
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Registra uma ação no log de auditoria
   */
  static async logAction(data: {
    userId?: number;
    action: string;
    resource: string;
    resourceId?: string;
    channel?: string;
    macrosetor?: string;
    dataKey?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    result?: 'success' | 'failure' | 'unauthorized';
  }) {
    try {
      await db.insert(auditLogs).values({
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        channel: data.channel,
        macrosetor: data.macrosetor,
        dataKey: data.dataKey,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        result: data.result || 'success',
      });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }

  /**
   * Aplica filtro de dataKey para consultas hierárquicas
   */
  static getDataKeyFilter(userDataKey?: string) {
    if (!userDataKey) return undefined;
    return userDataKey;
  }
}

/**
 * Middleware para verificar permissão específica
 */
export function requirePermission(permissionName: string, extractContext?: (req: AuthenticatedRequest) => {
  channel?: string;
  macrosetor?: string;
  resourceId?: string;
}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        await PermissionService.logAction({
          action: 'access_denied',
          resource: permissionName,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          result: 'unauthorized',
        });
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const context = extractContext ? extractContext(req) : {};
      const hasPermission = await PermissionService.hasPermission(req.user.id, permissionName, context);

      if (!hasPermission) {
        await PermissionService.logAction({
          userId: req.user.id,
          action: 'permission_denied',
          resource: permissionName,
          details: { context },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          result: 'unauthorized',
        });
        return res.status(403).json({ message: 'Acesso negado - permissão insuficiente' });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware de permissão:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para verificar múltiplas permissões (OR)
 */
export function requireAnyPermission(permissionNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      for (const permission of permissionNames) {
        const hasPermission = await PermissionService.hasPermission(req.user.id, permission);
        if (hasPermission) {
          return next();
        }
      }

      await PermissionService.logAction({
        userId: req.user.id,
        action: 'permission_denied',
        resource: permissionNames.join(' OR '),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        result: 'unauthorized',
      });

      res.status(403).json({ message: 'Acesso negado - permissão insuficiente' });
    } catch (error) {
      console.error('Erro no middleware de permissão:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para atualizar última atividade do usuário
 */
export function updateLastActivity() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.id) {
        // Atualizar em background para não afetar performance
        setImmediate(async () => {
          try {
            await db
              .update(systemUsers)
              .set({ lastActivityAt: new Date() })
              .where(eq(systemUsers.id, req.user!.id));
          } catch (error) {
            console.error('Erro ao atualizar última atividade:', error);
          }
        });
      }
      next();
    } catch (error) {
      next();
    }
  };
}

/**
 * Sistema de auto logout por inatividade (10 minutos)
 */
export class ActivityMonitor {
  private static readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
  private static userTimers: Map<number, NodeJS.Timeout> = new Map();

  static resetTimer(userId: number, logoutCallback: () => void) {
    // Limpar timer anterior se existir
    const existingTimer = this.userTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Criar novo timer
    const timer = setTimeout(() => {
      this.userTimers.delete(userId);
      logoutCallback();
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