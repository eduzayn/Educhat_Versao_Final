import { useRef, useCallback } from 'react';

/**
 * Hook para deduplica mensagens e evitar race conditions
 * Resolve o problema de mensagens que aparecem e depois desaparecem
 */
export function useMessageDeduplicator() {
  const processedMessages = useRef(new Set<string>());
  const optimisticMessages = useRef(new Map<number, string>()); // ID otimista -> conteúdo

  const markAsProcessed = useCallback((messageId: string | number, content?: string) => {
    const key = `${messageId}`;
    processedMessages.current.add(key);
    
    // Se for ID temporário (otimista), guardar conteúdo para matching posterior
    if (typeof messageId === 'number' && messageId < 0 && content) {
      optimisticMessages.current.set(messageId, content);
    }
    
    // Limpar cache antigas (manter apenas últimas 100)
    if (processedMessages.current.size > 100) {
      const oldEntries = Array.from(processedMessages.current).slice(0, 50);
      oldEntries.forEach(key => processedMessages.current.delete(key));
    }
  }, []);

  const isProcessed = useCallback((messageId: string | number): boolean => {
    const key = `${messageId}`;
    return processedMessages.current.has(key);
  }, []);

  const findOptimisticMatch = useCallback((content: string, timestamp: Date): number | null => {
    // Buscar mensagem otimística com mesmo conteúdo e timestamp próximo
    for (const [optId, optContent] of optimisticMessages.current) {
      if (optContent === content) {
        return optId;
      }
    }
    return null;
  }, []);

  const removeOptimistic = useCallback((optimisticId: number) => {
    optimisticMessages.current.delete(optimisticId);
    processedMessages.current.delete(`${optimisticId}`);
  }, []);

  const clear = useCallback(() => {
    processedMessages.current.clear();
    optimisticMessages.current.clear();
  }, []);

  return {
    markAsProcessed,
    isProcessed,
    findOptimisticMatch,
    removeOptimistic,
    clear
  };
}