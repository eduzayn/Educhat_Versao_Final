import { db } from "../../core/db";
import { eq, desc, and, or, ilike, count, isNotNull, ne, not, like, sql, gt, isNull } from "drizzle-orm";

/**
 * Base storage class with common database utilities and connection
 * All storage modules extend from this base class
 */
export abstract class BaseStorage {
  protected db = db;
  
  // Common query operators for reuse across modules
  protected eq = eq;
  protected desc = desc;
  protected and = and;
  protected or = or;
  protected ilike = ilike;
  protected count = count;
  protected isNotNull = isNotNull;
  protected ne = ne;
  protected not = not;
  protected like = like;
  protected sql = sql;
  protected gt = gt;
  protected isNull = isNull;

  /**
   * Generic error handler for database operations
   */
  protected handleError(error: any, operation: string): never {
    console.error(`Storage error in ${operation}:`, error);
    throw new Error(`Database operation failed: ${operation}`);
  }

  /**
   * Validate required fields for database operations
   */
  protected validateRequired<T>(data: T, requiredFields: (keyof T)[], operation: string): void {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Required field '${String(field)}' missing for ${operation}`);
      }
    }
  }

  /**
   * Build pagination parameters
   */
  protected buildPagination(limit?: number, offset?: number) {
    return {
      limit: limit || 50,
      offset: offset || 0
    };
  }

  /**
   * Build search pattern for LIKE queries
   */
  protected buildSearchPattern(query: string): string {
    return `%${query.toLowerCase()}%`;
  }
}