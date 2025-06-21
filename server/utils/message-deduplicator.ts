/**
 * Sistema de deduplicação de mensagens para evitar duplicatas em produção
 * Baseado nos problemas identificados nos logs
 */

interface MessageKey {
  conversationId: number;
  content: string;
  timestamp: number;
  source: 'socket' | 'webhook' | 'rest';
}

class MessageDeduplicator {
  private recentMessages = new Map<string, number>();
  private readonly DEDUP_WINDOW = 5000; // 5 segundos
  
  /**
   * Gera chave única para mensagem
   */
  private generateKey(messageData: MessageKey): string {
    return `${messageData.conversationId}:${messageData.content.slice(0, 50)}:${messageData.source}`;
  }
  
  /**
   * Verifica se mensagem é duplicata
   */
  isDuplicate(messageData: MessageKey): boolean {
    const key = this.generateKey(messageData);
    const lastSeen = this.recentMessages.get(key);
    
    if (lastSeen && (messageData.timestamp - lastSeen) < this.DEDUP_WINDOW) {
      console.warn(`🔄 [DEDUP] Mensagem duplicada detectada para conversa ${messageData.conversationId}`);
      return true;
    }
    
    // Registrar mensagem
    this.recentMessages.set(key, messageData.timestamp);
    
    // Limpar cache antigas
    this.cleanupOldEntries(messageData.timestamp);
    
    return false;
  }
  
  /**
   * Limpa entradas antigas do cache
   */
  private cleanupOldEntries(currentTime: number) {
    const cutoff = currentTime - this.DEDUP_WINDOW;
    
    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (timestamp < cutoff) {
        this.recentMessages.delete(key);
      }
    }
  }
  
  /**
   * Força limpeza do cache
   */
  clear() {
    this.recentMessages.clear();
  }
}

export const messageDeduplicator = new MessageDeduplicator();