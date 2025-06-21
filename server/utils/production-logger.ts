/**
 * Logger específico para produção - Baseado na análise dos logs da imagem
 * Resolve os problemas identificados em produção
 */

interface ProductionLogContext {
  conversationId?: number;
  messageId?: number;
  optimisticId?: number;
  action: string;
  duration?: number;
  error?: string;
  roomSize?: number;
  source?: 'socket' | 'webhook' | 'rest';
}

class ProductionLogger {
  private isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT_ID;
  
  /**
   * Log de auditoria para comunicação em tempo real
   */
  realtime(context: ProductionLogContext) {
    if (!this.isProduction) return;
    
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      type: 'REALTIME_AUDIT',
      ...context
    };
    
    console.log(`🔍 [PROD-AUDIT] ${context.action}:`, logData);
  }
  
  /**
   * Log de performance para otimização
   */
  performance(action: string, duration: number, context?: any) {
    if (!this.isProduction) return;
    
    const status = duration > 1000 ? 'SLOW' : duration > 500 ? 'MEDIUM' : 'FAST';
    console.log(`⚡ [PROD-PERF] ${action}: ${duration.toFixed(1)}ms (${status})`, context);
  }
  
  /**
   * Log de erros críticos
   */
  critical(error: string, context?: any) {
    if (!this.isProduction) return;
    
    console.error(`🚨 [PROD-CRITICAL] ${error}`, {
      timestamp: new Date().toISOString(),
      context
    });
  }
  
  /**
   * Log de broadcast para debug de mensagens
   */
  broadcast(conversationId: number, messageId: number, roomSize: number, source: string) {
    if (!this.isProduction) return;
    
    console.log(`📡 [PROD-BROADCAST] Conversa ${conversationId}, Mensagem ${messageId}, ${roomSize} clientes, Source: ${source}`);
  }
  
  /**
   * Log de atribuições para evitar duplicações
   */
  assignment(conversationId: number, teamId: number | null, userId: number | null, method: string) {
    if (!this.isProduction) return;
    
    console.log(`👥 [PROD-ASSIGNMENT] Conversa ${conversationId} → Team: ${teamId}, User: ${userId}, Method: ${method}`);
  }
}

export const prodLogger = new ProductionLogger();