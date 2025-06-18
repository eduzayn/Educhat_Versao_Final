/**
 * Integração da gamificação com eventos do sistema
 * Atualiza estatísticas automaticamente quando eventos importantes ocorrem
 */

import { gamificationService } from './gamificationService';

export class GamificationWebhookIntegration {
  
  /**
   * Processa evento de atribuição de conversa
   */
  static async onConversationAssigned(userId: number, conversationId: number): Promise<void> {
    try {
      console.log(`🎮 [Gamificação] Processando atribuição: usuário ${userId}, conversa ${conversationId}`);
      
      const now = new Date();
      await Promise.all([
        gamificationService.updateUserStats(userId, 'daily', now),
        gamificationService.updateUserStats(userId, 'weekly', now),
        gamificationService.updateUserStats(userId, 'monthly', now)
      ]);
      
      console.log(`✅ [Gamificação] Estatísticas atualizadas para usuário ${userId}`);
    } catch (error) {
      console.error(`❌ [Gamificação] Erro ao processar atribuição:`, error);
    }
  }

  /**
   * Processa evento de fechamento de conversa
   */
  static async onConversationClosed(userId: number, conversationId: number): Promise<void> {
    try {
      console.log(`🎮 [Gamificação] Processando fechamento: usuário ${userId}, conversa ${conversationId}`);
      
      const now = new Date();
      await Promise.all([
        gamificationService.updateUserStats(userId, 'daily', now),
        gamificationService.updateUserStats(userId, 'weekly', now),
        gamificationService.updateUserStats(userId, 'monthly', now)
      ]);
      
      console.log(`✅ [Gamificação] Estatísticas de fechamento atualizadas para usuário ${userId}`);
    } catch (error) {
      console.error(`❌ [Gamificação] Erro ao processar fechamento:`, error);
    }
  }

  /**
   * Processa evento de transferência/handoff
   */
  static async onHandoffCompleted(fromUserId: number | null, toUserId: number, conversationId: number): Promise<void> {
    try {
      console.log(`🎮 [Gamificação] Processando handoff: de ${fromUserId} para ${toUserId}, conversa ${conversationId}`);
      
      const now = new Date();
      
      // Atualizar estatísticas do usuário que recebeu a conversa
      await Promise.all([
        gamificationService.updateUserStats(toUserId, 'daily', now),
        gamificationService.updateUserStats(toUserId, 'weekly', now),
        gamificationService.updateUserStats(toUserId, 'monthly', now)
      ]);
      
      console.log(`✅ [Gamificação] Estatísticas de handoff atualizadas para usuário ${toUserId}`);
    } catch (error) {
      console.error(`❌ [Gamificação] Erro ao processar handoff:`, error);
    }
  }

  /**
   * Processa evento de envio de mensagem
   */
  static async onMessageSent(userId: number, conversationId: number): Promise<void> {
    try {
      // Atualizar apenas estatísticas diárias para performance
      await gamificationService.updateUserStats(userId, 'daily', new Date());
    } catch (error) {
      console.error(`❌ [Gamificação] Erro ao processar mensagem:`, error);
    }
  }

  /**
   * Força atualização completa das estatísticas de um usuário
   */
  static async forceUserStatsUpdate(userId: number): Promise<void> {
    try {
      console.log(`🎮 [Gamificação] Forçando atualização completa para usuário ${userId}`);
      
      const now = new Date();
      await Promise.all([
        gamificationService.updateUserStats(userId, 'daily', now),
        gamificationService.updateUserStats(userId, 'weekly', now),
        gamificationService.updateUserStats(userId, 'monthly', now)
      ]);
      
      console.log(`✅ [Gamificação] Atualização completa concluída para usuário ${userId}`);
    } catch (error) {
      console.error(`❌ [Gamificação] Erro na atualização completa:`, error);
    }
  }
}

export const gamificationWebhook = GamificationWebhookIntegration;