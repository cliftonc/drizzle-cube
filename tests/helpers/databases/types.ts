/**
 * Shared types for database testing utilities
 */

import type { DatabaseExecutor } from '../../../src/server/types'
import type { TestSchema } from '../schema'

/**
 * Database connection interface for testing
 */
export interface TestDatabaseConnection {
  db: any // Database instance (different for each database type)
  close: () => void
}

/**
 * Database executor with cleanup
 */
export interface TestDatabaseExecutor {
  executor: DatabaseExecutor<TestSchema>
  close: () => void
}

/**
 * Database-specific test utilities interface
 */
export interface DatabaseTestUtilities {
  /**
   * Create a raw database connection
   */
  createTestDatabase(): TestDatabaseConnection

  /**
   * Setup database with migrations and test data
   */
  setupTestDatabase(db: any): Promise<void>

  /**
   * Create database connection with test data already populated
   */
  createTestDatabaseWithData(): Promise<TestDatabaseConnection>

  /**
   * Create database executor for testing
   */
  createTestDatabaseExecutor(): Promise<TestDatabaseExecutor>

  /**
   * Get the engine type for this database
   */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite'
}

/**
 * Database configuration for testing
 */
export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'sqlite'
  connectionString: string
  migrationPath: string
}