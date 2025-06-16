interface PerformanceEntry {
  messageId: number;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
}

class MessagePerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map();
  private slowOperationThreshold = 1000; // 1 segundo

  startOperation(messageId: number, operation: string): string {
    const key = `${messageId}-${operation}-${Date.now()}`;
    const entry: PerformanceEntry = {
      messageId,
      operation,
      startTime: performance.now()
    };
    
    this.entries.set(key, entry);
    console.log(`🚀 Iniciando ${operation} para mensagem ${messageId}`);
    
    return key;
  }

  endOperation(key: string, success: boolean = true, error?: string): PerformanceEntry | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    const endTime = performance.now();
    const duration = endTime - entry.startTime;

    const updatedEntry: PerformanceEntry = {
      ...entry,
      endTime,
      duration,
      success,
      error
    };

    this.entries.set(key, updatedEntry);

    const status = success ? '✅' : '❌';
    const durationText = `${duration.toFixed(2)}ms`;
    
    console.log(`${status} ${entry.operation} para mensagem ${entry.messageId} - ${durationText}`);

    if (duration > this.slowOperationThreshold) {
      console.warn(`⚠️ Operação lenta detectada: ${entry.operation} levou ${durationText}`);
    }

    return updatedEntry;
  }

  getSlowOperations(): PerformanceEntry[] {
    return Array.from(this.entries.values())
      .filter(entry => entry.duration && entry.duration > this.slowOperationThreshold);
  }

  getAverageTime(operation: string): number {
    const operationEntries = Array.from(this.entries.values())
      .filter(entry => entry.operation === operation && entry.duration);
    
    if (operationEntries.length === 0) return 0;
    
    const totalTime = operationEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    return totalTime / operationEntries.length;
  }

  getStats() {
    const allEntries = Array.from(this.entries.values());
    const completedEntries = allEntries.filter(entry => entry.duration);
    
    return {
      totalOperations: allEntries.length,
      completedOperations: completedEntries.length,
      successfulOperations: completedEntries.filter(entry => entry.success).length,
      failedOperations: completedEntries.filter(entry => !entry.success).length,
      slowOperations: this.getSlowOperations().length,
      averageLoadTime: this.getAverageTime('load'),
      averageDeleteTime: this.getAverageTime('delete')
    };
  }

  clearOldEntries(maxAge: number = 300000) { // 5 minutos
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now - entry.startTime > maxAge) {
        this.entries.delete(key);
      }
    }
  }

  reset() {
    this.entries.clear();
  }
}

export const messagePerformanceMonitor = new MessagePerformanceMonitor();
