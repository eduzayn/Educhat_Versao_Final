interface LoadingState {
  messageId: number;
  isLoading: boolean;
  startTime: number;
  retryCount: number;
}

class MessageLoadingOptimizer {
  private loadingStates = new Map<number, LoadingState>();
  private cache = new Map<number, { content: string; timestamp: number; type: string }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_RETRIES = 3;

  startLoading(messageId: number): boolean {
    const existing = this.loadingStates.get(messageId);
    if (existing?.isLoading) {
      return false; // Já está carregando
    }

    this.loadingStates.set(messageId, {
      messageId,
      isLoading: true,
      startTime: performance.now(),
      retryCount: existing?.retryCount || 0
    });

    return true;
  }

  finishLoading(messageId: number, success: boolean, content?: string, type?: string) {
    const state = this.loadingStates.get(messageId);
    if (!state) return;

    if (success && content && type) {
      this.setCache(messageId, content, type);
    } else if (!success) {
      state.retryCount++;
    }

    state.isLoading = false;
    
    const duration = performance.now() - state.startTime;
    console.log(`📊 Carregamento ${success ? 'concluído' : 'falhou'} em ${duration.toFixed(2)}ms para mensagem ${messageId}`);
  }

  getFromCache(messageId: number): string | null {
    const cached = this.cache.get(messageId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(messageId);
      return null;
    }

    return cached.content;
  }

  setCache(messageId: number, content: string, type: string) {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(messageId, {
      content,
      timestamp: Date.now(),
      type
    });
  }

  canRetry(messageId: number): boolean {
    const state = this.loadingStates.get(messageId);
    return !state || state.retryCount < this.MAX_RETRIES;
  }

  getRetryCount(messageId: number): number {
    return this.loadingStates.get(messageId)?.retryCount || 0;
  }

  isLoading(messageId: number): boolean {
    return this.loadingStates.get(messageId)?.isLoading || false;
  }

  clearOldEntries() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutos

    for (const [messageId, state] of this.loadingStates.entries()) {
      if (now - state.startTime > maxAge) {
        this.loadingStates.delete(messageId);
      }
    }

    for (const [messageId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(messageId);
      }
    }
  }

  getStats() {
    return {
      loadingStates: this.loadingStates.size,
      cacheSize: this.cache.size,
      activeLoading: Array.from(this.loadingStates.values()).filter(s => s.isLoading).length
    };
  }
}

export const messageLoadingOptimizer = new MessageLoadingOptimizer();

setInterval(() => {
  messageLoadingOptimizer.clearOldEntries();
}, 5 * 60 * 1000);
