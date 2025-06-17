import { db } from "./db";
import { systemUsers, roles, permissions, rolePermissions } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { PermissionContext, AuditLogData } from './permissionTypes';

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
  static async logAction(data: AuditLogData): Promise<void> {
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