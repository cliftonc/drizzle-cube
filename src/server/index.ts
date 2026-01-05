/**
 * Drizzle Cube - Semantic Layer for Drizzle ORM
 * Drizzle ORM-first semantic layer with Cube.js compatibility
 */

// Export main classes with Drizzle integration
export { SemanticLayerCompiler } from './compiler'
export { QueryExecutor } from './executor'

// Export unified query building
export { QueryPlanner } from './query-planner'
export { QueryBuilder } from './query-builder'

// Export database executors
export { 
  createDatabaseExecutor,
  createPostgresExecutor,
  createSQLiteExecutor,
  createMySQLExecutor,
  BaseDatabaseExecutor,
  PostgresExecutor,
  SQLiteExecutor,
  MySQLExecutor
} from './executors'

// Export cube utilities
export {
  resolveSqlExpression,
  createMultiCubeContext,
  resolveCubeReference,
  getJoinType
} from './cube-utils'

// Export cube definitions
export { defineCube } from './cube-utils'

// Export cache utilities
export {
  generateCacheKey,
  normalizeQuery,
  fnv1aHash,
  getCubeInvalidationPattern
} from './cache-utils'

// Export cache providers
export { MemoryCacheProvider } from './cache-providers'

// Import types for use in utility functions
import type { DrizzleDatabase } from './types'
import { SemanticLayerCompiler } from './compiler'

// Export all types
export type * from './types'

// Re-export Drizzle SQL type for convenience
export type { SQL } from 'drizzle-orm'


/**
 * Create a new semantic layer instance with Drizzle integration
 * Use this when you need multiple isolated instances
 */
export function createDrizzleSemanticLayer(options: {
  drizzle: DrizzleDatabase
  schema?: any
}): SemanticLayerCompiler {
  return new SemanticLayerCompiler({
    drizzle: options.drizzle,
    schema: options.schema
  })
}