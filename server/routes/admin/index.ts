import { Express } from 'express';
import { registerPermissionRoutes } from './permissions';
import { registerRoleRoutes } from './roles';
import { registerUserRoutes } from './users';
import { registerAuditRoutes } from './audit';
import { registerStatsRoutes } from './stats';
import { registerCleanupRoutes } from './cleanup';

/**
 * Sistema de Administração - Entrada Principal
 * 
 * Este módulo organiza todas as rotas administrativas em submódulos especializados:
 * 
 * 📋 Módulos disponíveis:
 * - permissions: Gestão de permissões do sistema
 * - roles: Gestão de funções e associações
 * - users: Gerenciamento de usuários
 * - audit: Logs de auditoria e monitoramento
 * - stats: Estatísticas e métricas do sistema
 * - cleanup: Ferramentas de limpeza e manutenção
 * 
 * 🔧 Vantagens da modularização:
 * - Código mais organizado e fácil de manter
 * - Responsabilidades claras e separadas
 * - Facilita testes unitários
 * - Melhor escalabilidade
 * - Reduz conflitos de merge
 */
export function registerAdminRoutes(app: Express) {
  console.log('🔧 Registrando rotas administrativas modularizadas...');

  // Registrar todos os submódulos
  registerPermissionRoutes(app);
  registerRoleRoutes(app);
  registerUserRoutes(app);
  registerAuditRoutes(app);
  registerStatsRoutes(app);
  registerCleanupRoutes(app);

  console.log('✅ Sistema administrativo modularizado registrado com sucesso');
}