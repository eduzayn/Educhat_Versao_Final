/**
 * Sistema de logs detalhados para Z-API - Diagnóstico de produção
 * Criado para identificar problemas específicos de envio de mensagens
 */

interface ZApiLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  operation: string;
  data: any;
  duration?: number;
  requestId?: string;
}

class ZApiLogger {
  private logs: ZApiLogEntry[] = [];
  private maxLogs = 1000; // Manter últimas 1000 entradas

  private generateRequestId(): string {
    return `zapi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addLog(level: ZApiLogEntry['level'], operation: string, data: any, duration?: number, requestId?: string) {
    const entry: ZApiLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      data,
      duration,
      requestId
    };

    this.logs.push(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log estruturado no console para produção
    const logPrefix = `[Z-API-${level}]`;
    const logMessage = `${logPrefix} ${operation}`;
    
    if (level === 'ERROR') {
      console.error(logMessage, {
        requestId,
        duration,
        data,
        timestamp: entry.timestamp
      });
    } else if (level === 'WARN') {
      console.warn(logMessage, {
        requestId,
        duration,
        data,
        timestamp: entry.timestamp
      });
    } else {
      console.log(logMessage, {
        requestId,
        duration,
        data,
        timestamp: entry.timestamp
      });
    }
  }

  // Logs para operações de envio de mensagens
  logSendStart(phone: string, message: string, channelId?: number): string {
    const requestId = this.generateRequestId();
    this.addLog('INFO', 'SEND_MESSAGE_START', {
      phone: phone.replace(/\d/g, '*'), // Mascarar telefone
      messageLength: message.length,
      messageType: 'text',
      channelId,
      hasChannelId: !!channelId
    }, undefined, requestId);
    return requestId;
  }

  logCredentialsValidation(isValid: boolean, source: 'env' | 'channel', error?: string, requestId?: string) {
    this.addLog(isValid ? 'INFO' : 'ERROR', 'CREDENTIALS_VALIDATION', {
      isValid,
      source,
      error,
      hasInstanceId: !!(process.env.ZAPI_INSTANCE_ID),
      hasToken: !!(process.env.ZAPI_TOKEN),
      hasClientToken: !!(process.env.ZAPI_CLIENT_TOKEN)
    }, undefined, requestId);
  }

  logChannelConfig(channelData: any, requestId?: string) {
    this.addLog('INFO', 'CHANNEL_CONFIG', {
      channelId: channelData.id,
      channelName: channelData.name,
      channelType: channelData.type,
      isActive: channelData.isActive,
      hasInstanceId: !!(channelData.instanceId || channelData.configuration?.instanceId),
      hasToken: !!(channelData.token || channelData.configuration?.token),
      hasClientToken: !!(channelData.clientToken || channelData.configuration?.clientToken)
    }, undefined, requestId);
  }

  logApiRequest(url: string, payload: any, headers: any, requestId?: string) {
    this.addLog('INFO', 'API_REQUEST', {
      url: url.replace(/token\/[^\/]+/, 'token/****'), // Mascarar token
      payloadSize: JSON.stringify(payload).length,
      phone: payload.phone?.replace(/\d/g, '*'),
      messageLength: payload.message?.length || 0,
      hasClientToken: !!(headers['Client-Token'])
    }, undefined, requestId);
  }

  logApiResponse(status: number, statusText: string, responseBody: any, duration: number, requestId?: string) {
    const isSuccess = status >= 200 && status < 300;
    this.addLog(isSuccess ? 'INFO' : 'ERROR', 'API_RESPONSE', {
      status,
      statusText,
      responseSize: typeof responseBody === 'string' ? responseBody.length : JSON.stringify(responseBody).length,
      messageId: responseBody?.messageId || responseBody?.id,
      hasError: !!(responseBody?.error),
      errorMessage: responseBody?.error,
      isSuccess
    }, duration, requestId);
  }

  logDatabaseUpdate(messageId: number, success: boolean, error?: string, requestId?: string) {
    this.addLog(success ? 'INFO' : 'ERROR', 'DATABASE_UPDATE', {
      messageId,
      success,
      error
    }, undefined, requestId);
  }

  logTimeout(duration: number, requestId?: string) {
    this.addLog('ERROR', 'REQUEST_TIMEOUT', {
      timeoutAfter: duration,
      message: 'Requisição cancelada por timeout'
    }, duration, requestId);
  }

  logError(operation: string, error: any, requestId?: string) {
    this.addLog('ERROR', operation, {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }, undefined, requestId);
  }

  // Métodos para análise e diagnóstico
  getRecentLogs(count: number = 50): ZApiLogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(since?: Date): ZApiLogEntry[] {
    const sinceTime = since?.getTime() || 0;
    return this.logs.filter(log => 
      log.level === 'ERROR' && 
      new Date(log.timestamp).getTime() > sinceTime
    );
  }

  getLogsByRequestId(requestId: string): ZApiLogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  generateDiagnosticReport(): any {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => new Date(log.timestamp) > last24h);
    
    const errorCount = recentLogs.filter(log => log.level === 'ERROR').length;
    const successCount = recentLogs.filter(log => 
      log.operation === 'API_RESPONSE' && log.data.isSuccess
    ).length;
    const timeoutCount = recentLogs.filter(log => 
      log.operation === 'REQUEST_TIMEOUT'
    ).length;

    const avgResponseTime = recentLogs
      .filter(log => log.operation === 'API_RESPONSE' && log.duration)
      .reduce((sum, log, _, arr) => sum + (log.duration || 0) / arr.length, 0);

    return {
      period: '24h',
      totalOperations: recentLogs.length,
      successCount,
      errorCount,
      timeoutCount,
      successRate: successCount > 0 ? ((successCount / (successCount + errorCount)) * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      commonErrors: this.getCommonErrors(recentLogs),
      lastErrors: this.getErrorLogs(last24h).slice(-5)
    };
  }

  private getCommonErrors(logs: ZApiLogEntry[]): any[] {
    const errorGroups: { [key: string]: number } = {};
    
    logs.filter(log => log.level === 'ERROR').forEach(log => {
      const errorKey = log.data.errorMessage || log.operation;
      errorGroups[errorKey] = (errorGroups[errorKey] || 0) + 1;
    });

    return Object.entries(errorGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  clearLogs() {
    this.logs = [];
  }
}

// Instância singleton
export const zapiLogger = new ZApiLogger();