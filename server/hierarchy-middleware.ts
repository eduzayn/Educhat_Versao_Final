import { Request, Response, NextFunction } from 'express';
import { PermissionService, type AuthenticatedRequest } from './permissions';

/**
 * Middleware para aplicar permissões hierárquicas específicas
 * Usado para restringir acesso de atendentes apenas aos seus próprios recursos
 */
export function requireHierarchicalPermission(
  permissionName: string,
  resourceIdExtractor?: (req: AuthenticatedRequest) => string | undefined
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { id: userId, role } = req.user;

      // Admin tem acesso total - pular verificações hierárquicas
      if (role === 'admin') {
        return next();
      }

      // Para permissões que terminam com '_proprio', verificar propriedade do recurso
      if (permissionName.endsWith('_proprio')) {
        const resourceId = resourceIdExtractor ? resourceIdExtractor(req) : req.params.id;
        
        if (!resourceId) {
          return res.status(400).json({ message: 'ID do recurso não fornecido' });
        }

        const hasPermission = await PermissionService.hasPermission(userId, permissionName, {
          resourceId
        });

        if (!hasPermission) {
          await PermissionService.logAction({
            userId,
            action: 'access_denied',
            resource: permissionName.split(':')[0],
            resourceId,
            result: 'unauthorized',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });

          return res.status(403).json({ 
            message: 'Acesso negado - você só pode acessar seus próprios recursos' 
          });
        }
      } else {
        // Verificação de permissão padrão
        const hasPermission = await PermissionService.hasPermission(userId, permissionName);

        if (!hasPermission) {
          await PermissionService.logAction({
            userId,
            action: 'access_denied',
            resource: permissionName.split(':')[0],
            result: 'unauthorized',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });

          return res.status(403).json({ 
            message: 'Acesso negado - permissão insuficiente' 
          });
        }
      }

      // Log da ação autorizada
      await PermissionService.logAction({
        userId,
        action: 'access_granted',
        resource: permissionName.split(':')[0],
        resourceId: resourceIdExtractor ? resourceIdExtractor(req) : req.params.id,
        result: 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      console.error('Erro no middleware de permissões hierárquicas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware para filtrar resultados com base na propriedade hierárquica
 * Aplica filtros automáticos para que atendentes vejam apenas seus recursos
 */
export function applyHierarchicalFilter() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { id: userId, role } = req.user;

      // Admin vê todos os recursos - não aplicar filtro
      if (role === 'admin') {
        return next();
      }

      // Para atendentes, adicionar filtro de propriedade aos parâmetros de consulta
      if (role === 'atendente') {
        req.hierarchicalFilter = {
          assignedUserId: userId
        };
      }

      next();
    } catch (error) {
      console.error('Erro no middleware de filtro hierárquico:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
}

// Adicionar tipos ao Request
declare global {
  namespace Express {
    interface Request {
      hierarchicalFilter?: {
        assignedUserId?: number;
        assignedTeamId?: number;
      };
    }
  }
}