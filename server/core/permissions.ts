import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { systemUsers, roles, permissions, rolePermissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

export interface PermissionContext {
  resourceId?: string;
  channelId?: number;
  teamId?: number;
  dataKey?: string;
}

/**
 * Serviço centralizado de verificação de permissões
 * Consolida todas as verificações de permissão do sistema
 */
export class PermissionService {
  /**
   * Verifica se um usuário tem uma permissão específica
   */
  static async hasPermission(
    userId: number, 
    permissionName: string, 
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      // Buscar usuário com role
      const [userWithRole] = await db
        .select({
          id: systemUsers.id,
          role: systemUsers.role,
          roleId: systemUsers.roleId,
          teamId: systemUsers.teamId,
          dataKey: systemUsers.dataKey,
          isActive: systemUsers.isActive
        })
        .from(systemUsers)
        .where(and(
          eq(systemUsers.id, userId),
          eq(systemUsers.isActive, true)
        ));

      if (!userWithRole) return false;

      // Admins têm todas as permissões - incluindo variações em português
      if (userWithRole.role === 'admin' || 
          userWithRole.role === 'Administrador' || 
          userWithRole.role === 'administrador' || 
          userWithRole.role === 'Administrator') return true;

      // Verificar permissão específica através do role
      const userPermissions = await db
        .select({
          permissionName: permissions.name,
          resource: permissions.resource,
          action: permissions.action
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(and(
          eq(rolePermissions.roleId, userWithRole.roleId || 0),
          eq(rolePermissions.isActive, true),
          eq(permissions.isActive, true),
          eq(permissions.name, permissionName)
        ));

      if (userPermissions.length > 0) {
        // Se há contexto, verificar se o usuário tem acesso ao recurso específico
        if (context) {
          return this.checkContextualAccess(userWithRole, context);
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
   * Verifica se o usuário tem acesso contextual (team, dataKey, etc.)
   */
  private static checkContextualAccess(user: any, context: PermissionContext): boolean {
    // Verificar acesso por equipe
    if (context.teamId && user.teamId !== context.teamId) {
      return false;
    }

    // Verificar acesso por dataKey
    if (context.dataKey && user.dataKey && user.dataKey !== context.dataKey) {
      return false;
    }

    return true;
  }

  /**
   * Verifica múltiplas permissões (usuário precisa ter pelo menos uma)
   */
  static async hasAnyPermission(
    userId: number, 
    permissionNames: string[], 
    context?: PermissionContext
  ): Promise<boolean> {
    for (const permission of permissionNames) {
      if (await this.hasPermission(userId, permission, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Verifica se o usuário tem todas as permissões especificadas
   */
  static async hasAllPermissions(
    userId: number, 
    permissionNames: string[], 
    context?: PermissionContext
  ): Promise<boolean> {
    for (const permission of permissionNames) {
      if (!(await this.hasPermission(userId, permission, context))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifica se o usuário é admin
   */
  static async isAdmin(userId: number): Promise<boolean> {
    try {
      const [user] = await db
        .select({ role: systemUsers.role })
        .from(systemUsers)
        .where(eq(systemUsers.id, userId));
      
      return user?.role === 'admin' || 
             user?.role === 'Administrador' || 
             user?.role === 'administrador' || 
             user?.role === 'Administrator';
    } catch (error) {
      console.error('Erro ao verificar se é admin:', error);
      return false;
    }
  }

  /**
   * Verifica se o usuário pertence a uma equipe específica
   */
  static async belongsToTeam(userId: number, teamId: number): Promise<boolean> {
    try {
      const [user] = await db
        .select({ teamId: systemUsers.teamId })
        .from(systemUsers)
        .where(eq(systemUsers.id, userId));
      
      return user?.teamId === teamId;
    } catch (error) {
      console.error('Erro ao verificar equipe:', error);
      return false;
    }
  }

  /**
   * Busca todas as permissões de um usuário
   */
  static async getUserPermissions(userId: number): Promise<string[]> {
    try {
      const [user] = await db
        .select({ roleId: systemUsers.roleId, role: systemUsers.role })
        .from(systemUsers)
        .where(eq(systemUsers.id, userId));

      if (!user) return [];
      if (user.role === 'admin' || 
          user.role === 'Administrador' || 
          user.role === 'administrador' || 
          user.role === 'Administrator') return ['*']; // Admin tem todas

      const userPermissions = await db
        .select({ name: permissions.name })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(and(
          eq(rolePermissions.roleId, user.roleId || 0),
          eq(rolePermissions.isActive, true),
          eq(permissions.isActive, true)
        ));

      return userPermissions.map(p => p.name);
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      return [];
    }
  }

  /**
   * Registra uma ação para auditoria
   */
  static async logAction(data: {
    userId: number;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    result: 'success' | 'failure';
  }): Promise<void> {
    try {
      console.log(`[AUDIT] User ${data.userId}: ${data.action} on ${data.resource}${data.resourceId ? ` ${data.resourceId}` : ''} - ${data.result}`);
      // Aqui poderia ser implementado um sistema de auditoria mais robusto
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  }

  /**
   * Extrai filtro baseado no dataKey do usuário
   */
  static getDataKeyFilter(userDataKey?: string): Record<string, any> {
    return userDataKey ? { dataKey: userDataKey } : {};
  }
}

/**
 * Middleware para verificar permissão única
 */
export function requirePermission(
  permissionName: string, 
  extractContext?: (req: AuthenticatedRequest) => PermissionContext
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log(`🔐 Verificando permissão '${permissionName}' para endpoint ${req.method} ${req.path}`);
    
    if (!req.user) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ error: 'Acesso negado - usuário não autenticado' });
    }

    console.log(`👤 Usuário: ${req.user.id} (${req.user.email})`);
    
    const context = extractContext ? extractContext(req) : {};
    const hasPermission = await PermissionService.hasPermission(req.user.id, permissionName, context);

    console.log(`✅ Tem permissão '${permissionName}': ${hasPermission}`);

    if (!hasPermission) {
      await PermissionService.logAction({
        userId: req.user.id,
        action: 'access_denied',
        resource: permissionName,
        result: 'failure'
      });
      console.log(`🚫 Acesso negado para permissão '${permissionName}'`);
      return res.status(403).json({ error: 'Acesso negado - permissão insuficiente' });
    }

    console.log(`✅ Permissão '${permissionName}' aprovada, prosseguindo...`);
    next();
  };
}

/**
 * Middleware para verificar múltiplas permissões (OR)
 */
export function requireAnyPermission(permissionNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado - usuário não autenticado' });
    }

    const hasAnyPermission = await PermissionService.hasAnyPermission(req.user.id, permissionNames);

    if (!hasAnyPermission) {
      await PermissionService.logAction({
        userId: req.user.id,
        action: 'access_denied',
        resource: permissionNames.join('|'),
        result: 'failure'
      });
      return res.status(403).json({ error: 'Acesso negado - permissão insuficiente' });
    }

    next();
  };
}

/**
 * Middleware para verificar se é admin
 */
export function requireAdmin() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado - usuário não autenticado' });
    }

    const isAdmin = await PermissionService.isAdmin(req.user.id);

    if (!isAdmin) {
      await PermissionService.logAction({
        userId: req.user.id,
        action: 'admin_access_denied',
        resource: 'admin',
        result: 'failure'
      });
      return res.status(403).json({ error: 'Acesso negado - apenas administradores' });
    }

    next();
  };
}

/**
 * Middleware para verificar acesso a equipe
 */
export function requireTeamAccess(teamIdExtractor?: (req: AuthenticatedRequest) => number) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado - usuário não autenticado' });
    }

    // Admin tem acesso a todas as equipes
    if (await PermissionService.isAdmin(req.user.id)) {
      return next();
    }

    const teamId = teamIdExtractor ? teamIdExtractor(req) : parseInt(req.params.teamId);
    
    if (!teamId) {
      return res.status(400).json({ error: 'ID da equipe é obrigatório' });
    }

    const belongsToTeam = await PermissionService.belongsToTeam(req.user.id, teamId);

    if (!belongsToTeam) {
      await PermissionService.logAction({
        userId: req.user.id,
        action: 'team_access_denied',
        resource: 'team',
        resourceId: teamId.toString(),
        result: 'failure'
      });
      return res.status(403).json({ error: 'Acesso negado - você não pertence a esta equipe' });
    }

    next();
  };
}

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