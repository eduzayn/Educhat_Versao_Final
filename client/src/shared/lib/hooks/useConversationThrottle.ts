import { useRef, useCallback } from 'react';

/**
 * Hook para implementar throttle em requisições de conversas
 * Evita requisições excessivas que causam erro 429
 */
export function useConversationThrottle(delay = 2000) {
  const lastRequestTime = useRef<number>(0);
  const pendingRequests = useRef<Set<string>>(new Set());

  const throttledRequest = useCallback(
    async <T>(key: string, requestFn: () => Promise<T>): Promise<T | null> => {
      const now = Date.now();
      
      // Se já existe uma requisição pendente para esta chave, ignorar
      if (pendingRequests.current.has(key)) {
        return null;
      }

      // Se passou pouco tempo desde a última requisição, ignorar
      if (now - lastRequestTime.current < delay) {
        return null;
      }

      // Marcar requisição como pendente
      pendingRequests.current.add(key);
      lastRequestTime.current = now;

      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        console.error(`Erro na requisição throttled ${key}:`, error);
        throw error;
      } finally {
        // Remover da lista de pendentes
        pendingRequests.current.delete(key);
      }
    },
    [delay]
  );

  return { throttledRequest };
}