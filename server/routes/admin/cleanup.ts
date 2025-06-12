
import { Express, Request, Response } from 'express';
import { requirePermission, PermissionService, AuthenticatedRequest, updateLastActivity } from '../../core/permissions';

/**
 * Módulo de Ferramentas de Limpeza
 * Responsabilidades:
 * - Limpeza de dados duplicados
 * - Manutenção do sistema
 * - Operações administrativas especiais
 */
export function registerCleanupRoutes(app: Express) {

  // Limpar negócios duplicados
  app.post('/api/admin/cleanup-duplicate-deals', 
    updateLastActivity(),
    requirePermission('permissao:gerenciar'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { storage } = await import('../../core/storage');
        
        console.log(`🧹 Iniciando limpeza de deals duplicados por usuário ${req.user!.displayName}`);
        
        const result = await storage.cleanupDuplicateDeals();
        
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'deals',
          details: { 
            removedCount: result.removed,
            cleanupType: 'duplicate_deals'
          },
          result: 'success'
        });

        res.json({
          success: true,
          message: `Limpeza concluída: ${result.removed} negócios duplicados removidos`,
          details: result
        });
      } catch (error) {
        console.error('Erro na limpeza de negócios duplicados:', error);
        
        await PermissionService.logAction({
          userId: req.user!.id,
          action: 'cleanup',
          resource: 'deals',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          result: 'error'
        });
        
        res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor durante a limpeza',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}
