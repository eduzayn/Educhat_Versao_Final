interface MessageDebugInfo {
  messageId: number;
  operation: string;
  timestamp: number;
  data?: any;
  error?: string;
}

class MessageDebugger {
  private logs: MessageDebugInfo[] = [];
  private maxLogs = 200;

  log(messageId: number, operation: string, data?: any, error?: string) {
    const debugInfo: MessageDebugInfo = {
      messageId,
      operation,
      timestamp: Date.now(),
      data,
      error
    };

    this.logs.push(debugInfo);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const status = error ? '❌' : '✅';
    console.log(`${status} [MSG-${messageId}] ${operation}`, data || '');
    
    if (error) {
      console.error(`Error details:`, error);
    }
  }

  getLogsForMessage(messageId: number): MessageDebugInfo[] {
    return this.logs.filter(log => log.messageId === messageId);
  }

  getRecentLogs(count: number = 20): MessageDebugInfo[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getStats() {
    const operations = new Map<string, number>();
    const errors = new Map<string, number>();
    
    this.logs.forEach(log => {
      operations.set(log.operation, (operations.get(log.operation) || 0) + 1);
      if (log.error) {
        errors.set(log.operation, (errors.get(log.operation) || 0) + 1);
      }
    });

    return {
      totalLogs: this.logs.length,
      operations: Object.fromEntries(operations),
      errors: Object.fromEntries(errors),
      recentActivity: this.logs.slice(-10).map(log => ({
        messageId: log.messageId,
        operation: log.operation,
        timestamp: new Date(log.timestamp).toISOString(),
        hasError: !!log.error
      }))
    };
  }
}

export const messageDebugger = new MessageDebugger();
