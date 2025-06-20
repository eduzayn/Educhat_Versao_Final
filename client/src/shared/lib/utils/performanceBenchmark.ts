/**
 * Sistema de Benchmark de Performance - Comparação com Chatwoot
 * Mede tempos críticos do message bubble para alcançar performance Chatwoot-level
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceBenchmark {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled = import.meta.env.DEV;

  startTimer(name: string): void {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }

  endTimer(name: string): number {
    if (!this.isEnabled) return 0;
    
    const metric = this.metrics.get(name);
    if (!metric) return 0;

    const endTime: number = performance.now();
    const duration: number = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    // Log resultados com comparação Chatwoot (referência: ~50ms)
    const chatwootTarget = 50; // ms
    const performanceLevel: string = duration <= chatwootTarget ? '🚀 CHATWOOT-LEVEL' : 
                                    duration <= 100 ? '⚡ RÁPIDO' : 
                                    duration <= 200 ? '⚠️ LENTO' : '🔴 CRÍTICO';
    
    console.log(`📊 [BENCHMARK] ${name}: ${duration.toFixed(1)}ms ${performanceLevel}`);
    
    return duration;
  }

  // Benchmark específico para message bubble (crítico para UX)
  benchmarkMessageBubble() {
    return {
      start: () => this.startTimer('message-bubble-render'),
      end: () => this.endTimer('message-bubble-render')
    };
  }

  // Benchmark para tempo entre ENTER e aparição do bubble
  benchmarkSendToRender() {
    return {
      start: () => this.startTimer('send-to-render'),
      end: () => this.endTimer('send-to-render')
    };
  }

  // Benchmark para Socket.IO latency
  benchmarkSocketLatency() {
    return {
      start: () => this.startTimer('socket-latency'),
      end: () => this.endTimer('socket-latency')
    };
  }

  getReport(): string {
    if (!this.isEnabled) return 'Benchmark disabled in production';

    const report = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .map(m => `${m.name}: ${m.duration!.toFixed(1)}ms`)
      .join('\n');

    return `Performance Report:\n${report}`;
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const performanceBenchmark = new PerformanceBenchmark();

// Função para iniciar benchmark de envio de mensagem
export function startMessageSendBenchmark(): void {
  performanceBenchmark.startTimer('message-send-to-bubble');
}

// Função para finalizar benchmark de envio de mensagem
export function endMessageSendBenchmark(): number {
  return performanceBenchmark.endTimer('message-send-to-bubble');
}