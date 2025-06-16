import { useState, useCallback, useRef } from 'react';

interface CacheEntry {
  content: string;
  timestamp: number;
  messageType: string;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 100;

export function useMessageCache() {
  const cacheRef = useRef<Map<number, CacheEntry>>(new Map());

  const getCachedContent = useCallback((messageId: number): string | null => {
    const entry = cacheRef.current.get(messageId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      cacheRef.current.delete(messageId);
      return null;
    }

    return entry.content;
  }, []);

  const setCachedContent = useCallback((messageId: number, content: string, messageType: string) => {
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }

    cacheRef.current.set(messageId, {
      content,
      timestamp: Date.now(),
      messageType
    });
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      maxSize: MAX_CACHE_SIZE,
      entries: Array.from(cacheRef.current.entries()).map(([id, entry]) => ({
        messageId: id,
        messageType: entry.messageType,
        age: Date.now() - entry.timestamp
      }))
    };
  }, []);

  return {
    getCachedContent,
    setCachedContent,
    clearCache,
    getCacheStats
  };
}
