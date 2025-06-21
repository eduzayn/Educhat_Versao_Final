/**
 * Sistema de isolamento para evitar replicação indevida de atribuições
 * MELHORIA 3: Correção do problema identificado nos logs
 */

interface AssignmentOperation {
  conversationId: number;
  teamId?: number;
  userId?: number;
  timestamp: number;
  source: string;
}

class AssignmentIsolation {
  private recentAssignments = new Map<number, AssignmentOperation>();
  private readonly ISOLATION_WINDOW = 2000; // 2 segundos
  
  /**
   * Verifica se operação de atribuição deve ser bloqueada para evitar duplicação
   */
  shouldBlockAssignment(operation: AssignmentOperation): boolean {
    const existing = this.recentAssignments.get(operation.conversationId);
    
    if (existing && (operation.timestamp - existing.timestamp) < this.ISOLATION_WINDOW) {
      // Verificar se é a mesma atribuição
      if (existing.teamId === operation.teamId && existing.userId === operation.userId) {
        console.log(`🛡️ [ASSIGNMENT-ISOLATION] Bloqueando duplicação para conversa ${operation.conversationId}`);
        return true;
      }
    }
    
    // Registrar operação
    this.recentAssignments.set(operation.conversationId, operation);
    
    // Limpeza automática
    this.cleanupOldOperations(operation.timestamp);
    
    return false;
  }
  
  /**
   * Limpa operações antigas
   */
  private cleanupOldOperations(currentTime: number) {
    const cutoff = currentTime - this.ISOLATION_WINDOW;
    
    for (const [conversationId, operation] of this.recentAssignments.entries()) {
      if (operation.timestamp < cutoff) {
        this.recentAssignments.delete(conversationId);
      }
    }
  }
  
  /**
   * Força limpeza para conversa específica
   */
  clearConversation(conversationId: number) {
    this.recentAssignments.delete(conversationId);
  }
}

export const assignmentIsolation = new AssignmentIsolation();