/**
 * Sistema de debounce global para prevenir atribuições em massa
 * Garante que apenas uma atribuição por conversa aconteça por vez
 */

const assignmentQueue = new Map<string, boolean>();
const DEBOUNCE_TIME = 1000; // 1 segundo

export function canPerformAssignment(conversationId: number, type: 'team' | 'user'): boolean {
  const key = `${conversationId}-${type}`;
  
  if (assignmentQueue.has(key)) {
    console.warn(`⚠️ Atribuição ${type} já em andamento para conversa ${conversationId}, ignorando`);
    return false;
  }
  
  // Bloquear novas atribuições para esta conversa
  assignmentQueue.set(key, true);
  
  // Liberar após o tempo de debounce
  setTimeout(() => {
    assignmentQueue.delete(key);
  }, DEBOUNCE_TIME);
  
  return true;
}

export function clearAssignmentQueue(conversationId?: number) {
  if (conversationId) {
    assignmentQueue.delete(`${conversationId}-team`);
    assignmentQueue.delete(`${conversationId}-user`);
  } else {
    assignmentQueue.clear();
  }
}