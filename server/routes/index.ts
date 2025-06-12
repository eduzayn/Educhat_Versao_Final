
import { Express } from 'express';

// Importar todas as rotas modularizadas
import { registerAuthRoutes } from './auth';
import { registerAdminRoutes } from './admin';
import { registerChannelsRoutes } from './channels';
import { registerContactsRoutes } from './contacts';
import { registerConversationsRoutes } from './conversations';
import { registerMessagesRoutes } from './messages';
import { registerWebhooksRoutes } from './webhooks';
import { registerUtilitiesRoutes } from './utilities';
import { registerDashboardRoutes } from './dashboard';
import { registerTeamsRoutes } from './teams';
import { registerUsersRoutes } from './users';
import { registerDealsRoutes } from './deals';
import { registerFunnelsRoutes } from './funnels';
import { registerHandoffsRoutes } from './handoffs';
import { registerQuickRepliesRoutes } from './quick-replies';
import { registerMediaRoutes } from './media';
import { registerIARoutes } from './ia';
import { registerBIRoutes } from './bi';
import { registerAnalyticsRoutes } from './analytics';
import { registerSalesRoutes } from './sales';
import { registerInboxRoutes } from './inbox';
import { registerDocumentsRoutes } from './documents';
import { registerWebCaptureRoutes } from './web-capture';
import { registerCoursesRoutes } from './courses';
import { registerIntegrationsRoutes } from './integrations';
import { registerRealtimeRoutes } from './realtime';

/**
 * Registra todas as rotas da aplicação
 * Consolidação de imports e registros de rotas em arquivo único
 */
export function registerAllRoutes(app: Express): void {
  console.log('🔧 Registrando todas as rotas do sistema...');

  // Rotas de autenticação (prioritárias)
  registerAuthRoutes(app);
  
  // Rotas administrativas
  registerAdminRoutes(app);
  
  // Rotas principais do sistema
  registerChannelsRoutes(app);
  registerContactsRoutes(app);
  registerConversationsRoutes(app);
  registerMessagesRoutes(app);
  registerWebhooksRoutes(app);
  registerUtilitiesRoutes(app);
  
  // Rotas de funcionalidades
  registerDashboardRoutes(app);
  registerTeamsRoutes(app);
  registerUsersRoutes(app);
  registerDealsRoutes(app);
  registerFunnelsRoutes(app);
  registerHandoffsRoutes(app);
  registerQuickRepliesRoutes(app);
  registerMediaRoutes(app);
  
  // Rotas de IA e análise
  registerIARoutes(app);
  registerBIRoutes(app);
  registerAnalyticsRoutes(app);
  registerSalesRoutes(app);
  
  // Rotas de interface
  registerInboxRoutes(app);
  registerDocumentsRoutes(app);
  registerWebCaptureRoutes(app);
  registerCoursesRoutes(app);
  
  // Rotas de integrações
  registerIntegrationsRoutes(app);
  registerRealtimeRoutes(app);
  
  console.log('✅ Todas as rotas registradas com sucesso');
}
