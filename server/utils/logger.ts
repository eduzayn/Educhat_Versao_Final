/**
 * Sistema de logs otimizado para produção
 * Controla verbosidade baseado no ambiente
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private currentLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // Em produção: apenas WARN e ERROR
    // Em desenvolvimento: todos os logs
    this.currentLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = this.isProduction ? '' : this.getEmoji(level);
    
    if (data && !this.isProduction) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  private getEmoji(level: string): string {
    const emojis: Record<string, string> = {
      DEBUG: '🔍',
      INFO: '✅', 
      WARN: '⚠️',
      ERROR: '❌'
    };
    return emojis[level] || '';
  }

  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error;
      console.error(this.formatMessage('ERROR', message, errorData));
    }
  }

  // Métodos específicos para diferentes áreas
  webhook(message: string, data?: any) {
    // Em produção: apenas eventos críticos
    if (this.isProduction) {
      if (message.includes('erro') || message.includes('falha')) {
        this.error(`Webhook: ${message}`, data);
      }
    } else {
      this.debug(`📨 Webhook: ${message}`, data);
    }
  }

  performance(operation: string, duration: number, details?: any) {
    // Em produção: apenas operações lentas (>2s)
    if (this.isProduction) {
      if (duration > 2000) {
        this.warn(`Performance: ${operation} demorou ${duration}ms`, details);
      }
    } else {
      this.debug(`⏱️ ${operation} em ${duration}ms`, details);
    }
  }

  socket(message: string, data?: any) {
    // Em produção: apenas conexões/desconexões críticas
    if (this.isProduction) {
      if (message.includes('erro') || message.includes('falha')) {
        this.error(`Socket: ${message}`, data);
      }
    } else {
      this.debug(`🔌 Socket: ${message}`, data);
    }
  }

  database(message: string, data?: any) {
    // Em produção: apenas erros de banco
    if (this.isProduction) {
      if (message.includes('erro') || message.includes('falha')) {
        this.error(`Database: ${message}`, data);
      }
    } else {
      this.debug(`🗄️ Database: ${message}`, data);
    }
  }

  api(method: string, path: string, duration: number, status: number) {
    // Em produção: apenas erros 4xx/5xx e requisições muito lentas
    if (this.isProduction) {
      if (status >= 400 || duration > 3000) {
        if (status >= 500) {
          this.error(`API ${method} ${path} ${status} em ${duration}ms`);
        } else {
          this.warn(`API ${method} ${path} ${status} em ${duration}ms`);
        }
      }
    } else {
      this.debug(`🌐 API ${method} ${path} ${status} em ${duration}ms`);
    }
  }
}

export const logger = new Logger();