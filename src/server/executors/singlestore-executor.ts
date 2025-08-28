/**
 * SingleStore database executor
 * Works with mysql2 driver and drizzle-orm/singlestore
 * Extends MySQL executor since SingleStore is MySQL-compatible
 */

import type { DrizzleDatabase } from '../types'
import { MySQLExecutor } from './mysql-executor'

export class SingleStoreExecutor extends MySQLExecutor {
  getEngineType(): 'singlestore' {
    return 'singlestore'
  }

  // SingleStore-specific optimizations can be added here if needed
  // For now, we inherit all behavior from MySQLExecutor since
  // SingleStore is largely MySQL-compatible
}

/**
 * Factory function for creating SingleStore executors
 */
export function createSingleStoreExecutor(
  db: DrizzleDatabase,
  schema?: any
): SingleStoreExecutor {
  return new SingleStoreExecutor(db, schema)
}