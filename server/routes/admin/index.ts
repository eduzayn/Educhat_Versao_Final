import { Express } from 'express';
import { registerPermissionRoutes } from './permissions';
import { registerRoleRoutes } from './roles';
import { registerUserRoutes } from './users';
import { registerAuditRoutes } from './audit';
import { registerStatsRoutes } from './stats';
import { registerCleanupRoutes } from './cleanup';
import { registerPublicRoutes } from './public';
import retroactiveAssignmentRouter from './retroactive-assignment-router';
import aiConnectionTestRouter from './ai-connection-test';

/**
 * Módulo Admin - Sistema de Administração
 * 
 * Funcionalidades:
 * - Gestão de permissões e roles
 * - Gerenciamento de usuários
 * - Logs de auditoria
 * - Estatísticas do sistema
 * - Configurações administrativas
 */
export function registerAdminRoutes(app: Express) {
  console.log('🔧 Registrando rotas administrativas...');

  // Registrar todas as rotas
  registerPermissionRoutes(app);
  registerRoleRoutes(app);
  registerUserRoutes(app);
  registerAuditRoutes(app);
  registerStatsRoutes(app);
  registerCleanupRoutes(app);
  registerPublicRoutes(app);
  
  // Registro da rota de atribuição retroativa
  app.use('/api/admin', retroactiveAssignmentRouter);
  
  // Registro das rotas de teste de IA
  app.use('/api/admin', aiConnectionTestRouter);
}