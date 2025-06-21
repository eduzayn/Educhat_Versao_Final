/**
 * Hook para monitorar performance de mensagens em tempo real
 * Coleta métricas de latência e taxa de sucesso
 */

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  enterToBubble: number[]; // Tempos de renderização
  socketLatency: number[]; // Latência Socket.IO
  restLatency: number[]; // Latência REST
  errorRate: number;
  socketSuccessRate: number;
  averageRenderTime: number;
  p95RenderTime: number;
  p99RenderTime: number;
}

export function useMessagePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    enterToBubble: [],
    socketLatency: [],
    restLatency: [],
    errorRate: 0,
    socketSuccessRate: 0,
    averageRenderTime: 0,
    p95RenderTime: 0,
    p99RenderTime: 0
  });

  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  // Coletar métricas de performance do console
  useEffect(() => {
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      
      const message = args.join(' ');
      
      // Capturar tempos de renderização otimística
      const renderMatch = message.match(/PERFORMANCE OTIMÍSTICA: ENTER → Bubble em (\d+\.?\d*)ms/);
      if (renderMatch) {
        const time = parseFloat(renderMatch[1]);
        updateRenderMetrics(time);
      }

      // Capturar latência Socket.IO
      const socketMatch = message.match(/SOCKET: Mensagem processada e enviada em (\d+\.?\d*)ms/);
      if (socketMatch) {
        const time = parseFloat(socketMatch[1]);
        updateSocketMetrics(time);
      }

      // Capturar latência REST
      const restMatch = message.match(/Mensagem processada e enviada em (\d+\.?\d*)ms/);
      if (restMatch && !message.includes('SOCKET')) {
        const time = parseFloat(restMatch[1]);
        updateRestMetrics(time);
      }
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  const updateRenderMetrics = (time: number) => {
    setMetrics(prev => {
      const newTimes = [...prev.enterToBubble, time].slice(-100); // Manter últimas 100
      const average = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      const sorted = [...newTimes].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

      return {
        ...prev,
        enterToBubble: newTimes,
        averageRenderTime: average,
        p95RenderTime: p95,
        p99RenderTime: p99
      };
    });
  };

  const updateSocketMetrics = (time: number) => {
    setMetrics(prev => ({
      ...prev,
      socketLatency: [...prev.socketLatency, time].slice(-50)
    }));
  };

  const updateRestMetrics = (time: number) => {
    setMetrics(prev => ({
      ...prev,
      restLatency: [...prev.restLatency, time].slice(-50)
    }));
  };

  const getPerformanceReport = () => {
    const current = metricsRef.current;
    
    return {
      renderPerformance: {
        average: current.averageRenderTime,
        p95: current.p95RenderTime,
        p99: current.p99RenderTime,
        target: 50, // Target Chatwoot: <50ms
        isOptimal: current.averageRenderTime < 50
      },
      networkPerformance: {
        socketAverage: current.socketLatency.length > 0 
          ? current.socketLatency.reduce((a, b) => a + b, 0) / current.socketLatency.length 
          : 0,
        restAverage: current.restLatency.length > 0 
          ? current.restLatency.reduce((a, b) => a + b, 0) / current.restLatency.length 
          : 0,
        preferredMethod: 'Socket.IO'
      },
      recommendations: generateRecommendations(current)
    };
  };

  const generateRecommendations = (metrics: PerformanceMetrics) => {
    const recommendations = [];

    if (metrics.averageRenderTime > 50) {
      recommendations.push('Considere reduzir complexidade dos componentes de mensagem');
    }

    if (metrics.p95RenderTime > 100) {
      recommendations.push('Implemente virtualização para listas grandes de mensagens');
    }

    const socketAvg = metrics.socketLatency.length > 0 
      ? metrics.socketLatency.reduce((a, b) => a + b, 0) / metrics.socketLatency.length 
      : 0;

    if (socketAvg > 200) {
      recommendations.push('Verifique conexão Socket.IO - alta latência detectada');
    }

    if (metrics.enterToBubble.length > 20 && metrics.averageRenderTime < 30) {
      recommendations.push('Performance excelente - sistema otimizado');
    }

    return recommendations;
  };

  const resetMetrics = () => {
    setMetrics({
      enterToBubble: [],
      socketLatency: [],
      restLatency: [],
      errorRate: 0,
      socketSuccessRate: 0,
      averageRenderTime: 0,
      p95RenderTime: 0,
      p99RenderTime: 0
    });
  };

  return {
    metrics,
    getPerformanceReport,
    resetMetrics
  };
}