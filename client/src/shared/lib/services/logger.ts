import { toast } from '@/hooks/use-toast';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private logs: LogEntry[] = [];

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date()
    };
  }

  debug(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    this.logs.push(entry);
    
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    this.logs.push(entry);
    
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    this.logs.push(entry);
    
    console.warn(`[WARN] ${message}`, data);
    
    toast({
      title: "Aviso",
      description: message,
      variant: "default"
    });
  }

  error(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, data);
    this.logs.push(entry);
    
    console.error(`[ERROR] ${message}`, data);
    
    toast({
      title: "Erro",
      description: message,
      variant: "destructive"
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();