import { db } from '../../db';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Base storage class providing database connection to all storage modules
 */
export class BaseStorage {
  protected db: NodePgDatabase<any>;

  constructor(database?: NodePgDatabase<any>) {
    this.db = database || db;
  }
}