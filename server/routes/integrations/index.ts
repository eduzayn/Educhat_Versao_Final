import type { Express } from "express";
import { facebookRoutes } from './facebook';

export function registerIntegrationRoutes(app: Express) {
  // ✅ CONSOLIDADO: Rotas de integrações Manychat migradas para /api/settings/integrations/
  // Sistema unificado consolidado no módulo de configurações
  
  // Facebook integration routes (mantidas aqui por serem específicas)
  app.use('/api/integrations/facebook', facebookRoutes);
}