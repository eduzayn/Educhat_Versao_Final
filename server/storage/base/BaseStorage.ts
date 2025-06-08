import { db } from "../../core/db";
import type { DrizzleD3Database } from "drizzle-orm/d3-adapter";

/**
 * Classe base para todas as operações de storage
 * Fornece acesso ao banco de dados e utilitários comuns
 */
export abstract class BaseStorage {
  protected db = db;

  /**
   * Utilitário para verificar se um valor é válido (não null/undefined/empty)
   */
  protected isValidValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Utilitário para sanitizar dados de entrada
   */
  protected sanitizeInput(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isValidValue(value)) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Utilitário para criar timestamps
   */
  protected now(): Date {
    return new Date();
  }

  /**
   * Utilitário para logging (pode ser expandido)
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    console.log(`[${level.toUpperCase()}] ${this.constructor.name}: ${message}`);
  }

  /**
   * Utilitário para tratamento de erros
   */
  protected handleError(error: any, operation: string): never {
    this.log(`Erro em ${operation}: ${error.message}`, 'error');
    throw error;
  }
}