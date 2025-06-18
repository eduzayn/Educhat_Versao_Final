import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaCache {
  content: string;
  timestamp: number;
  type: string;
}

interface LoadingState {
  isLoading: boolean;
  retryCount: number;
  lastAttempt: number;
}

const mediaCache = new Map<number, MediaCache>();
const loadingStates = new Map<number, LoadingState>();
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_RETRIES = 3;

export function useOptimizedMedia(messageId: number, messageType: string, initialContent?: string | null) {
  // Log detalhado do que está sendo recebido no hook
  console.log(`🎯 useOptimizedMedia iniciado para mensagem ${messageId}:`, {
    messageType,
    hasInitialContent: !!initialContent,
    initialContent,
    initialContentType: typeof initialContent,
    initialContentLength: initialContent?.length
  });

  const [content, setContent] = useState<string | null>(initialContent || null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCachedContent = useCallback((id: number): string | null => {
    const cached = mediaCache.get(id);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      mediaCache.delete(id);
      return null;
    }
    
    return cached.content;
  }, []);

  const setCachedContent = useCallback((id: number, content: string, type: string) => {
    if (mediaCache.size >= 100) {
      const oldestKey = Array.from(mediaCache.keys())[0];
      if (oldestKey !== undefined) {
        mediaCache.delete(oldestKey);
      }
    }
    
    mediaCache.set(id, {
      content,
      timestamp: Date.now(),
      type
    });
  }, []);

  const canRetry = useCallback((id: number): boolean => {
    const state = loadingStates.get(id);
    return !state || state.retryCount < MAX_RETRIES;
  }, []);

  const updateLoadingState = useCallback((id: number, isLoading: boolean, increment = false) => {
    const existing = loadingStates.get(id) || { isLoading: false, retryCount: 0, lastAttempt: 0 };
    loadingStates.set(id, {
      isLoading,
      retryCount: increment ? existing.retryCount + 1 : existing.retryCount,
      lastAttempt: Date.now()
    });
  }, []);

  const loadMediaContent = useCallback(async () => {
    // Se já temos conteúdo inicial válido, não carregar novamente
    if (loaded || loading || (content && content.length > 0)) {
      console.log(`⚡ Mídia ${messageId} já disponível (${content?.length} chars)`);
      return;
    }

    const cachedContent = getCachedContent(messageId);
    if (cachedContent) {
      setContent(cachedContent);
      setLoaded(true);
      console.log(`📋 Mídia ${messageId} carregada do cache`);
      return;
    }

    if (!canRetry(messageId)) {
      setError(`Máximo de tentativas excedido para ${messageType}`);
      return;
    }

    const currentState = loadingStates.get(messageId);
    if (currentState?.isLoading) {
      console.log(`⏳ Mídia ${messageId} já está sendo carregada`);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const startTime = performance.now();
    
    setLoading(true);
    setError(null);
    updateLoadingState(messageId, true);
    
    console.log(`🚀 Carregamento sob demanda de ${messageType} para mensagem ${messageId}`);

    try {
      const response = await fetch(`/api/messages/${messageId}/media`, {
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.content && typeof data.content === 'string') {
          setContent(data.content);
          setLoaded(true);
          setCachedContent(messageId, data.content, messageType);
          updateLoadingState(messageId, false);
          
          const duration = performance.now() - startTime;
          console.log(`✅ ${messageType} carregado sob demanda em ${duration.toFixed(2)}ms para mensagem ${messageId}`);
        } else {
          const errorMsg = `Conteúdo inválido para ${messageType}`;
          setError(errorMsg);
          updateLoadingState(messageId, false, true);
          setRetryCount(loadingStates.get(messageId)?.retryCount || 0);
          console.error(`❌ ${errorMsg}`, { messageId, data });
        }
      } else {
        const errorMsg = `Erro HTTP ${response.status} ao carregar ${messageType}`;
        setError(errorMsg);
        updateLoadingState(messageId, false, true);
        setRetryCount(loadingStates.get(messageId)?.retryCount || 0);
        console.error(`❌ ${errorMsg}`, { messageId });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      const errorMsg = `Erro de rede ao carregar ${messageType}`;
      setError(errorMsg);
      updateLoadingState(messageId, false, true);
      setRetryCount(loadingStates.get(messageId)?.retryCount || 0);
      console.error(`❌ ${errorMsg}`, { messageId, error });
    } finally {
      setLoading(false);
    }
  }, [messageId, messageType, loaded, loading, getCachedContent, setCachedContent, canRetry, updateLoadingState]);

  const retry = useCallback(() => {
    setError(null);
    setLoaded(false);
    loadMediaContent();
  }, [loadMediaContent]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    content,
    loading,
    loaded,
    error,
    retryCount,
    loadMediaContent,
    retry,
    canRetry: canRetry(messageId)
  };
}
