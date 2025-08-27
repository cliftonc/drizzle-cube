/**
 * Database executor type definitions
 * Interfaces for database execution with different engines
 */

import type { SQL } from 'drizzle-orm'
import type { DrizzleDatabase } from './core'
import type { DatabaseAdapter } from '../adapters/base-adapter'

/**
 * Database executor interface that wraps Drizzle ORM
 * Provides type-safe SQL execution with engine-specific implementations
 */
export interface DatabaseExecutor {
  /** The Drizzle database instance */
  db: DrizzleDatabase
  /** Optional schema for type inference */
  schema?: any
  /** Database adapter for SQL dialect-specific operations */
  databaseAdapter: DatabaseAdapter
  /** Execute a Drizzle SQL query or query object */
  execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>
  /** Get the database engine type */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite'
}