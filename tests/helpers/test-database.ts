/**
 * Unified test database utilities
 * Provides a single interface for testing against different database types
 */

import { sql } from 'drizzle-orm'
import { SemanticLayerCompiler } from '../../src/server'
import type { DatabaseExecutor } from '../../src/server'
import type { DatabaseConfig } from './databases/types'
import { setupPostgresDatabase } from './databases/postgres/setup'
import { setupMySQLDatabase } from './databases/mysql/setup'

// Dynamic schema imports based on database type
function getSchema() {
  const dbType = getTestDatabaseType()
  if (dbType === 'mysql') {
    return import('./databases/mysql/schema')
  }
  return import('./databases/postgres/schema')
}

// Re-export schema based on environment - default to PostgreSQL for backward compatibility
// NOTE: When TEST_DB_TYPE=mysql, tests should use createTestDatabaseExecutor() which handles schema dynamically
export { testSchema, employees, departments, productivity, analyticsPages } from './databases/postgres/schema'
export type { TestSchema } from './databases/postgres/schema'

// Also export MySQL schema with different names for dynamic usage
export { 
  mysqlTestSchema, 
  employees as mysqlEmployees, 
  departments as mysqlDepartments, 
  productivity as mysqlProductivity,
  analyticsPages as mysqlAnalyticsPages 
} from './databases/mysql/schema'
export type { MySQLTestSchema } from './databases/mysql/schema'
export { sampleDepartments, sampleEmployees } from './enhanced-test-data'

/**
 * Database type for testing - can be set via environment variable
 */
export type TestDatabaseType = 'postgres' | 'mysql' | 'both'

/**
 * Get the database type to use for testing
 */
export function getTestDatabaseType(): TestDatabaseType {
  const dbType = process.env.TEST_DB_TYPE?.toLowerCase()
  
  if (dbType === 'mysql') return 'mysql'
  if (dbType === 'both') return 'both'
  return 'postgres' // Default to postgres
}

/**
 * Get database setup function for a specific database type
 */
export function getDatabaseSetup(type: 'postgres' | 'mysql') {
  switch (type) {
    case 'postgres':
      return setupPostgresDatabase
    case 'mysql':
      return setupMySQLDatabase
    default:
      throw new Error(`Unsupported database type: ${type}`)
  }
}

/**
 * Unified database functions that work with the currently configured database type
 * These are simplified wrappers around the database-specific setup functions
 */

/**
 * Create test database with data using the configured database type
 */
export async function createTestDatabaseWithData(): Promise<{ db: any, close: () => void }> {
  const dbType = getTestDatabaseType()
  
  if (dbType === 'both') {
    throw new Error('Cannot create single database with data when TEST_DB_TYPE=both. Use setup functions directly.')
  }
  
  const setupFn = getDatabaseSetup(dbType)
  return setupFn()
}

/**
 * Create database executor using the configured database type
 * Each test gets its own fresh database connection for proper isolation
 */
export async function createTestDatabaseExecutor(): Promise<{ executor: DatabaseExecutor<any>, close: () => void }> {
  const dbType = getTestDatabaseType()
  
  let db: any
  let close: () => void
  let executor: DatabaseExecutor<any>
  let schema: any
  
  if (dbType === 'postgres') {
    // Create fresh connection for each test
    const { createPostgresConnection } = await import('./databases/postgres/setup')
    const connection = createPostgresConnection()
    db = connection.db
    close = connection.close
    
    // Connection established to existing test database
    
    const { createPostgresExecutor } = await import('../../src/server')
    const { testSchema } = await import('./databases/postgres/schema')
    schema = testSchema
    executor = createPostgresExecutor(db, schema)
    
  } else if (dbType === 'mysql') {
    // Create fresh connection for each test
    const { createMySQLConnection } = await import('./databases/mysql/setup')
    const connection = await createMySQLConnection()
    db = connection.db
    close = connection.close
    
    const { createMySQLExecutor } = await import('../../src/server')
    const { mysqlTestSchema } = await import('./databases/mysql/schema')
    schema = mysqlTestSchema
    executor = createMySQLExecutor(db, schema)
    
  } else {
    throw new Error(`Unsupported database type: ${dbType}`)
  }

  return {
    executor,
    close
  }
}

/**
 * Create semantic layer using the configured database type
 * Uses existing database connection without re-setting up data
 */
export async function createTestSemanticLayer(): Promise<{
  semanticLayer: SemanticLayerCompiler<any>
  db: any
  close: () => void
}> {
  const { executor, close } = await createTestDatabaseExecutor()
  const dbType = getTestDatabaseType()
  
  let db: any
  let schema: any
  
  if (dbType === 'postgres') {
    const { createPostgresConnection } = await import('./databases/postgres/setup')
    const connection = createPostgresConnection()
    db = connection.db
    const { testSchema } = await import('./databases/postgres/schema')
    schema = testSchema
  } else if (dbType === 'mysql') {
    const { createMySQLConnection } = await import('./databases/mysql/setup')
    const connection = await createMySQLConnection()
    db = connection.db
    const { mysqlTestSchema } = await import('./databases/mysql/schema')
    schema = mysqlTestSchema
  } else {
    throw new Error(`Unsupported database type: ${dbType}`)
  }
  
  const semanticLayer = new SemanticLayerCompiler({
    drizzle: db,
    schema,
    engineType: dbType
  })

  return { semanticLayer, db, close }
}

// Connection isolation - each test gets its own fresh database connection

// Legacy functions for backward compatibility
export const createTestDatabase = createTestDatabaseWithData
export async function setupTestDatabase(db: any): Promise<void> {
  // This is now handled by the setup functions automatically
  console.log('setupTestDatabase is deprecated - data is set up automatically by createTestDatabaseWithData')
}


/**
 * Database configuration helpers
 */
export const DATABASE_CONFIGS: Record<'postgres' | 'mysql', DatabaseConfig> = {
  postgres: {
    type: 'postgres',
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/drizzle_cube_test',
    migrationPath: './tests/helpers/migrations'
  },
  mysql: {
    type: 'mysql', 
    connectionString: process.env.MYSQL_TEST_DATABASE_URL || 'mysql://test:test@localhost:3307/drizzle_cube_test',
    migrationPath: './tests/helpers/mysql-migrations'
  }
}