/**
 * CORREÇÃO CRÍTICA EM PRODUÇÃO
 * Endpoint de emergência para forçar sincronização de conversas
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage/index";

export function registerEmergencySyncRoutes(app: Express) {
  
  // Endpoint de emergência para forçar sincronização
  app.post('/api/emergency-sync', async (req: Request, res: Response) => {
    try {
      console.log('🚨 EMERGÊNCIA: Forçando sincronização de conversas');
      
      // Importar WebSocket broadcast
      const { broadcastToAll } = await import('./realtime');
      
      // Buscar conversas com mensagens recentes
      const recentConversations = await storage.getConversations(50, 0);
      
      console.log(`📊 Encontradas ${recentConversations.length} conversas para sincronizar`);
      
      // Forçar broadcast de todas as conversas
      broadcastToAll({
        type: 'force_conversation_refresh',
        action: 'emergency_sync',
        timestamp: new Date().toISOString(),
        conversationCount: recentConversations.length
      });
      
      // Aguardar um momento para garantir entrega
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Segundo broadcast para garantir
      broadcastToAll({
        type: 'conversation_list_update',
        action: 'force_refresh',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ EMERGÊNCIA: Sincronização forçada enviada via WebSocket');
      
      res.json({
        success: true,
        message: 'Sincronização de emergência executada',
        conversationsFound: recentConversations.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ EMERGÊNCIA: Erro na sincronização forçada:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}