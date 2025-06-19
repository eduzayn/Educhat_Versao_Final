import { useState, useCallback, useRef, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export function useLocalCache<T = any>(options: CacheOptions = {}) {
  const { ttl = 30000, maxSize = 100 } = options;
  const cache = useRef(new Map<string, CacheEntry<T>>());
  const [, forceUpdate] = useState({});

  // Limpar cache expirado
  const cleanupExpired = useCallback(() => {
    const now = Date.now();
    let hasChanges = false;

    cache.current.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        cache.current.delete(key);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      forceUpdate({});
    }
  }, [ttl]);

  // Limpar cache periodicamente
  useEffect(() => {
    const interval = setInterval(cleanupExpired, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [cleanupExpired]);

  // Obter dados do cache
  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.current.delete(key);
      return null;
    }

    return entry.data;
  }, [ttl]);

  // Definir dados no cache
  const set = useCallback((key: string, data: T, customTtl?: number) => {
    // Verificar se já existe e se é igual
    const existing = cache.current.get(key);
    if (existing && JSON.stringify(existing.data) === JSON.stringify(data)) {
      return false; // Dados iguais, não atualizar
    }

    // Limpar cache se exceder tamanho máximo
    if (cache.current.size >= maxSize) {
      const firstKey = cache.current.keys().next().value;
      if (firstKey) {
        cache.current.delete(firstKey);
      }
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || ttl
    });

    forceUpdate({});
    return true; // Dados atualizados
  }, [ttl, maxSize]);

  // Remover do cache
  const remove = useCallback((key: string) => {
    const deleted = cache.current.delete(key);
    if (deleted) {
      forceUpdate({});
    }
    return deleted;
  }, []);

  // Limpar todo o cache
  const clear = useCallback(() => {
    cache.current.clear();
    forceUpdate({});
  }, []);

  // Verificar se existe no cache
  const has = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.current.delete(key);
      return false;
    }

    return true;
  }, [ttl]);

  // Obter estatísticas do cache
  const getStats = useCallback(() => {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    cache.current.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      total: cache.current.size,
      valid: validEntries,
      expired: expiredEntries,
      keys: Array.from(cache.current.keys())
    };
  }, [ttl]);

  return {
    get,
    set,
    remove,
    clear,
    has,
    getStats,
    size: cache.current.size
  };
} 