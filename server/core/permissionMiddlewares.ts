import type { Response, NextFunction } from "express";
import { PermissionService } from './permissionService';
import type { AuthenticatedRequest, PermissionContext } from './permissionTypes';

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