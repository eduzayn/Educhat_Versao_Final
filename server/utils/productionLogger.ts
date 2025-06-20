/**
 * Sistema de logs para produção - Captura detalhada de problemas Z-API
 * Focado em identificar problemas específicos de envio de mensagens
 */

interface ProductionLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: 'Z-API' | 'DATABASE' | 'WEBHOOK' | 'UPLOAD' | 'SYSTEM';
  operation: string;
  data: any;
  correlationId?: string;
  userId?: number;
  phone?: string;
  duration?: number;
  environment: string;
}

class ProductionLogger {
  private logs: ProductionLogEntry[] = [];
  private maxLogs = 2000; // Manter mais logs para análise
  private isDevelopment = process.env.NODE_ENV === 'development';

  private sanitizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    // Mascarar telefone para logs: 5511999****999
    return phone.length > 6 
      ? phone.substring(0, 6) + '****' + phone.substring(phone.length - 3)
      : phone;
  }

  private addLog(
    level: ProductionLogEntry['level'], 
    service: ProductionLogEntry['service'],
    operation: string, 
    data: any, 
    options: {
      correlationId?: string;
      userId?: number;
      phone?: string;
      duration?: number;
    } = {}
  ) {
    const entry: ProductionLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      operation,
      data,
      correlationId: options.correlationId,
      userId: options.userId,
      phone: this.sanitizePhone(options.phone),
      duration: options.duration,
      environment: process.env.NODE_ENV || 'development'
    };

    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log estruturado no console
    const logData = {
      service: entry.service,
      operation: entry.operation,
      correlationId: entry.correlationId,
      phone: entry.phone,
      duration: entry.duration,
      data: this.isDevelopment ? entry.data : this.sanitizeData(entry.data),
      timestamp: entry.timestamp
    };

    switch (level) {
      case 'ERROR':
        console.error(`[PROD-ERROR] ${service}:${operation}`, logData);
        break;
      case 'WARN':
        console.warn(`[PROD-WARN] ${service}:${operation}`, logData);
        break;
      case 'INFO':
        console.log(`[PROD-INFO] ${service}:${operation}`, logData);
        break;
      case 'DEBUG':
        if (this.isDevelopment) {
          console.debug(`[PROD-DEBUG] ${service}:${operation}`, logData);
        }
        break;
    }
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return data.length > 200 ? data.substring(0, 200) + '...[truncated]' : data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('password')) {
          sanitized[key] = '[REDACTED]';
        } else if (key.toLowerCase().includes('phone')) {
          sanitized[key] = this.sanitizePhone(String(value));
        } else if (typeof value === 'string' && value.length > 100) {
          sanitized[key] = value.substring(0, 100) + '...[truncated]';
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    
    return data;
  }

  // Z-API specific logging
  zapiSendStart(phone: string, messageType: string, correlationId: string, userId?: number) {
    this.addLog('INFO', 'Z-API', 'SEND_START', {
      messageType,
      messageLength: messageType.includes('[') ? 0 : messageType.length
    }, { correlationId, userId, phone });
  }

  zapiSendSuccess(phone: string, messageId: string, duration: number, correlationId: string) {
    this.addLog('INFO', 'Z-API', 'SEND_SUCCESS', {
      messageId,
      success: true
    }, { correlationId, phone, duration });
  }

  zapiSendError(phone: string, error: any, duration: number, correlationId: string) {
    this.addLog('ERROR', 'Z-API', 'SEND_ERROR', {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : 'Unknown'
    }, { correlationId, phone, duration });
  }

  zapiTimeout(phone: string, timeoutMs: number, correlationId: string) {
    this.addLog('ERROR', 'Z-API', 'TIMEOUT', {
      timeoutMs,
      message: 'Requisição expirou'
    }, { correlationId, phone, duration: timeoutMs });
  }

  zapiCredentialsError(source: string, correlationId: string) {
    this.addLog('ERROR', 'Z-API', 'CREDENTIALS_ERROR', {
      source,
      hasInstanceId: !!(process.env.ZAPI_INSTANCE_ID),
      hasToken: !!(process.env.ZAPI_TOKEN),
      hasClientToken: !!(process.env.ZAPI_CLIENT_TOKEN)
    }, { correlationId });
  }

  // Database logging
  databaseSuccess(operation: string, affectedRows: number, correlationId?: string) {
    this.addLog('INFO', 'DATABASE', operation, {
      affectedRows,
      success: true
    }, { correlationId });
  }

  databaseError(operation: string, error: any, correlationId?: string) {
    this.addLog('ERROR', 'DATABASE', operation, {
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code
    }, { correlationId });
  }

  // Webhook logging
  webhookReceived(type: string, phone: string, correlationId: string) {
    this.addLog('INFO', 'WEBHOOK', 'RECEIVED', {
      type,
      processed: true
    }, { correlationId, phone });
  }

  webhookError(type: string, phone: string, error: any, correlationId: string) {
    this.addLog('ERROR', 'WEBHOOK', 'PROCESSING_ERROR', {
      type,
      error: error instanceof Error ? error.message : String(error)
    }, { correlationId, phone });
  }

  // Upload logging
  uploadStart(fileName: string, fileSize: number, correlationId: string, userId?: number) {
    this.addLog('INFO', 'UPLOAD', 'START', {
      fileName,
      fileSize,
      fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100
    }, { correlationId, userId });
  }

  uploadSuccess(fileName: string, duration: number, correlationId: string) {
    this.addLog('INFO', 'UPLOAD', 'SUCCESS', {
      fileName,
      processed: true
    }, { correlationId, duration });
  }

  uploadError(fileName: string, error: any, correlationId: string) {
    this.addLog('ERROR', 'UPLOAD', 'ERROR', {
      fileName,
      error: error instanceof Error ? error.message : String(error)
    }, { correlationId });
  }

  // System monitoring
  systemPerformance(metric: string, value: number, threshold?: number) {
    const level = threshold && value > threshold ? 'WARN' : 'INFO';
    this.addLog(level, 'SYSTEM', 'PERFORMANCE', {
      metric,
      value,
      threshold,
      exceedsThreshold: threshold ? value > threshold : false
    });
  }

  // Analysis methods
  getRecentErrors(minutes: number = 10): ProductionLogEntry[] {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => 
      log.level === 'ERROR' && new Date(log.timestamp) > since
    );
  }

  getCorrelationLogs(correlationId: string): ProductionLogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  getServiceStats(service: ProductionLogEntry['service'], hours: number = 1) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const serviceLogs = this.logs.filter(log => 
      log.service === service && new Date(log.timestamp) > since
    );

    const errors = serviceLogs.filter(log => log.level === 'ERROR');
    const successes = serviceLogs.filter(log => 
      log.operation.includes('SUCCESS') || log.data?.success === true
    );

    const avgDuration = serviceLogs
      .filter(log => log.duration)
      .reduce((sum, log, _, arr) => sum + (log.duration || 0) / arr.length, 0);

    return {
      service,
      period: `${hours}h`,
      totalOperations: serviceLogs.length,
      errors: errors.length,
      successes: successes.length,
      errorRate: serviceLogs.length > 0 ? 
        ((errors.length / serviceLogs.length) * 100).toFixed(2) + '%' : '0%',
      avgDuration: Math.round(avgDuration) || 0,
      commonErrors: this.getCommonErrors(errors)
    };
  }

  private getCommonErrors(errorLogs: ProductionLogEntry[]): Array<{error: string, count: number}> {
    const errorCounts: { [key: string]: number } = {};
    
    errorLogs.forEach(log => {
      const errorMsg = log.data?.error || log.operation;
      errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  getDashboard() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => new Date(log.timestamp) > last24h);

    return {
      timestamp: new Date().toISOString(),
      period: '24h',
      summary: {
        totalLogs: recentLogs.length,
        errors: recentLogs.filter(log => log.level === 'ERROR').length,
        warnings: recentLogs.filter(log => log.level === 'WARN').length,
        operations: recentLogs.filter(log => log.level === 'INFO').length
      },
      services: {
        zapi: this.getServiceStats('Z-API', 24),
        database: this.getServiceStats('DATABASE', 24),
        webhook: this.getServiceStats('WEBHOOK', 24),
        upload: this.getServiceStats('UPLOAD', 24)
      },
      recentErrors: this.getRecentErrors(60),
      topErrors: this.getCommonErrors(recentLogs.filter(log => log.level === 'ERROR'))
    };
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(service?: ProductionLogEntry['service'], level?: ProductionLogEntry['level']) {
    let filteredLogs = this.logs;
    
    if (service) {
      filteredLogs = filteredLogs.filter(log => log.service === service);
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs;
  }
}

export const productionLogger = new ProductionLogger();