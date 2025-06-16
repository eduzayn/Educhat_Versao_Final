import { useCallback, useRef } from 'react';

interface PerformanceMetrics {
  messageId: number;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
}

export function useMessagePerformance() {
  const metricsRef = useRef<Map<string, PerformanceMetrics>>(new Map());

  const startTimer = useCallback((messageId: number, operation: string) => {
    const key = `${messageId}-${operation}`;
    const startTime = performance.now();
    
    metricsRef.current.set(key, {
      messageId,
      operation,
      startTime,
    });

    console.log(`⏱️ Iniciando ${operation} para mensagem ${messageId}`);
    return key;
  }, []);

  const endTimer = useCallback((key: string, success: boolean = true, error?: string) => {
    const metric = metricsRef.current.get(key);
    if (!metric) return;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const updatedMetric = {
      ...metric,
      endTime,
      duration,
      success,
      error,
    };

    metricsRef.current.set(key, updatedMetric);

    const status = success ? '✅' : '❌';
    console.log(`${status} ${metric.operation} para mensagem ${metric.messageId} - ${duration.toFixed(2)}ms`);

    if (duration > 1000) {
      console.warn(`⚠️ Operação lenta detectada: ${metric.operation} levou ${duration.toFixed(2)}ms`);
    }

    return updatedMetric;
  }, []);

  const getMetrics = useCallback(() => {
    return Array.from(metricsRef.current.values());
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current.clear();
  }, []);

  return {
    startTimer,
    endTimer,
    getMetrics,
    clearMetrics,
  };
}
