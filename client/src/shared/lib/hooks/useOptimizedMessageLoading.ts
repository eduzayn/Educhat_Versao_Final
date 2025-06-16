import { useState, useCallback, useRef } from 'react';
import { messageLoadingOptimizer } from '@/shared/lib/utils/messageLoadingOptimizer';
import { messagePerformanceMonitor } from '@/shared/lib/utils/messagePerformanceMonitor';

export function useOptimizedMessageLoading(messageId: number, messageType: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadContent = useCallback(async () => {
    if (loaded || loading) return;

    const cachedContent = messageLoadingOptimizer.getFromCache(messageId);
    if (cachedContent) {
      setContent(cachedContent);
      setLoaded(true);
      return;
    }

    if (!messageLoadingOptimizer.canRetry(messageId)) {
      setError(`Máximo de tentativas excedido para ${messageType}`);
      return;
    }

    if (!messageLoadingOptimizer.startLoading(messageId)) {
      return; // Já está carregando
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const performanceKey = messagePerformanceMonitor.startOperation(messageId, `load-${messageType}`);
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/${messageId}/media`, {
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.content && typeof data.content === 'string') {
          setContent(data.content);
          setLoaded(true);
          messageLoadingOptimizer.finishLoading(messageId, true, data.content, messageType);
          messagePerformanceMonitor.endOperation(performanceKey, true);
        } else {
          const errorMsg = `Conteúdo inválido para ${messageType}`;
          setError(errorMsg);
          messageLoadingOptimizer.finishLoading(messageId, false);
          messagePerformanceMonitor.endOperation(performanceKey, false, errorMsg);
        }
      } else {
        const errorMsg = `Erro HTTP ${response.status}`;
        setError(errorMsg);
        messageLoadingOptimizer.finishLoading(messageId, false);
        messagePerformanceMonitor.endOperation(performanceKey, false, errorMsg);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Requisição cancelada, não é erro
      }
      
      const errorMsg = `Erro de rede: ${error instanceof Error ? error.message : 'Desconhecido'}`;
      setError(errorMsg);
      messageLoadingOptimizer.finishLoading(messageId, false);
      messagePerformanceMonitor.endOperation(performanceKey, false, errorMsg);
    } finally {
      setLoading(false);
    }
  }, [messageId, messageType, loaded, loading]);

  const retry = useCallback(() => {
    setError(null);
    setLoaded(false);
    loadContent();
  }, [loadContent]);

  const getRetryCount = useCallback(() => {
    return messageLoadingOptimizer.getRetryCount(messageId);
  }, [messageId]);

  const canRetry = useCallback(() => {
    return messageLoadingOptimizer.canRetry(messageId);
  }, [messageId]);

  return {
    loading,
    error,
    content,
    loaded,
    loadContent,
    retry,
    getRetryCount,
    canRetry
  };
}
