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
import { setupSQLiteDatabase } from './databases/sqlite/setup'

// Dynamic schema imports based on database type
function getSchema() {
  const dbType = getTestDatabaseType()
  if (dbType === 'mysql') {
    return import('./databases/mysql/schema')
  }
  if (dbType === 'sqlite') {
    return import('./databases/sqlite/schema')
  }
  return import('./databases/postgres/schema')
}

// Remove static schema exports - use dynamic functions instead
// Tests should use createTestDatabaseExecutor() which handles schema dynamically
export { enhancedDepartments as sampleDepartments, enhancedEmployees as sampleEmployees } from './enhanced-test-data'

/**
 * Get schema and tables for the current test database type
 * This replaces static imports and provides database-specific schemas
 */
export async function getTestSchema() {
  const dbType = getTestDatabaseType()
  
  if (dbType === 'mysql') {
    const { 
      mysqlTestSchema, 
      employees, 
      departments, 
      productivity,
      timeEntries, 
      analyticsPages 
    } = await import('./databases/mysql/schema')
    
    return {
      schema: mysqlTestSchema,
      employees,
      departments,
      productivity,
      timeEntries,
      analyticsPages,
      type: 'MySQLTestSchema' as const,
      // Database-specific value helpers
      dbTrue: true,
      dbFalse: false,
      dbDate: (date: Date) => date
    }
  } else if (dbType === 'sqlite') {
    const { 
      sqliteTestSchema, 
      employees, 
      departments, 
      productivity,
      timeEntries, 
      analyticsPages 
    } = await import('./databases/sqlite/schema')
    
    return {
      schema: sqliteTestSchema,
      employees,
      departments,
      productivity,
      timeEntries,
      analyticsPages,
      type: 'SQLiteTestSchema' as const,
      // Database-specific value helpers for SQLite
      dbTrue: 1,
      dbFalse: 0,
      dbDate: (date: Date) => date.getTime() // Convert to milliseconds for SQLite
    }
  } else {
    const { 
      testSchema, 
      employees, 
      departments, 
      productivity,
      timeEntries, 
      analyticsPages 
    } = await import('./databases/postgres/schema')
    
    return {
      schema: testSchema,
      employees,
      departments,
      productivity,
      timeEntries,
      analyticsPages,
      type: 'TestSchema' as const,
      // Database-specific value helpers
      dbTrue: true,
      dbFalse: false,
      dbDate: (date: Date) => date
    }
  }
}

/**
 * Database type for testing - can be set via environment variable
 */
export type TestDatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'both'

/**
 * Get the database type to use for testing
 */
export function getTestDatabaseType(): TestDatabaseType {
  const dbType = process.env.TEST_DB_TYPE?.toLowerCase()
  
  if (dbType === 'mysql') return 'mysql'
  if (dbType === 'sqlite') return 'sqlite'
  if (dbType === 'both') return 'both'
  return 'postgres' // Default to postgres
}

/**
 * Get database setup function for a specific database type
 */
export function getDatabaseSetup(type: 'postgres' | 'mysql' | 'sqlite') {
  switch (type) {
    case 'postgres':
      return setupPostgresDatabase
    case 'mysql':
      return setupMySQLDatabase
    case 'sqlite':
      return setupSQLiteDatabase
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
    
  } else if (dbType === 'sqlite') {
    // Create fresh connection for each test
    const { createSQLiteConnection } = await import('./databases/sqlite/setup')
    const connection = createSQLiteConnection()
    db = connection.db
    close = connection.close
    
    const { createSQLiteExecutor } = await import('../../src/server')
    const { sqliteTestSchema } = await import('./databases/sqlite/schema')
    schema = sqliteTestSchema
    executor = createSQLiteExecutor(db, schema)
    
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
  } else if (dbType === 'sqlite') {
    const { createSQLiteConnection } = await import('./databases/sqlite/setup')
    const connection = createSQLiteConnection()
    db = connection.db
    const { sqliteTestSchema } = await import('./databases/sqlite/schema')
    schema = sqliteTestSchema
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