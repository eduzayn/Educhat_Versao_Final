import { db } from '../../db';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Base storage class providing database connection to all storage modules
 */
export class BaseStorage {
  protected db: NodePgDatabase<any>;
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 3000; // 3 segundos para evitar reprocessamento constante

  constructor(database?: NodePgDatabase<any>) {
    this.db = database || db;
  }

  protected getFromCache(key: string): any {
    const cached = BaseStorage.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < BaseStorage.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  protected setCache(key: string, data: any): void {
    BaseStorage.cache.set(key, { data, timestamp: Date.now() });
    
    // Limpar cache antigo (manter apenas 50 itens)
    if (BaseStorage.cache.size > 50) {
      const oldest = Array.from(BaseStorage.cache.keys())[0];
      BaseStorage.cache.delete(oldest);
    }
  }
}