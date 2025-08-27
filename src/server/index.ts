/**
 * Drizzle Cube - Semantic Layer for Drizzle ORM
 * Drizzle ORM-first semantic layer with Cube.js compatibility
 */

// Export main classes with Drizzle integration
export { SemanticLayerCompiler, semanticLayer, createSemanticLayer } from './compiler'
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

// Import types for use in utility functions
import type { TimeGranularity, DrizzleDatabase } from './types'
import { SemanticLayerCompiler, semanticLayer } from './compiler'

// Export all types
export type * from './types'

// Re-export Drizzle SQL type for convenience
export type { SQL } from 'drizzle-orm'


// Re-export examples for documentation (optional - uncomment if examples exist)
// export * from '../../examples/example-schema'

/**
 * Main semantic layer instance
 * Use this for simple single-instance usage
 */
export const defaultSemanticLayer = semanticLayer

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

/**
 * Utility functions for working with the semantic layer
 */
export const SemanticLayerUtils = {
  /**
   * Create a simple query builder
   */
  query: () => {
    const createQuery = (
      measures: string[], 
      dimensions: string[] = [],
      filters: any[] = [],
      timeDimensions: any[] = [],
      limit?: number,
      order?: Record<string, 'asc' | 'desc'>
    ) => ({
      measures,
      dimensions,
      filters,
      timeDimensions,
      limit,
      order
    })

    return {
      measures: (measures: string[]) => ({
        dimensions: (dimensions: string[] = []) => ({
          filters: (filters: any[] = []) => ({
            timeDimensions: (timeDimensions: any[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, [], limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, filters, [], undefined, order)
          }),
          timeDimensions: (timeDimensions: any[] = []) => ({
            filters: (filters: any[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, [], timeDimensions, limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, [], timeDimensions, undefined, order)
          }),
          limit: (limit?: number) => ({
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, [], [], limit, order)
          }),
          order: (order?: Record<string, 'asc' | 'desc'>) => 
            createQuery(measures, dimensions, [], [], undefined, order)
        }),
        filters: (filters: any[] = []) => ({
          dimensions: (dimensions: string[] = []) => ({
            timeDimensions: (timeDimensions: any[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, [], limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, filters, [], undefined, order)
          }),
          timeDimensions: (timeDimensions: any[] = []) => ({
            dimensions: (dimensions: string[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, [], filters, timeDimensions, limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, [], filters, timeDimensions, undefined, order)
          }),
          limit: (limit?: number) => ({
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, [], filters, [], limit, order)
          }),
          order: (order?: Record<string, 'asc' | 'desc'>) => 
            createQuery(measures, [], filters, [], undefined, order)
        })
      })
    }
  },

  /**
   * Create filters
   */
  filters: {
    equals: (member: string, value: any) => ({ member, operator: 'equals' as const, values: [value] }),
    notEquals: (member: string, value: any) => ({ member, operator: 'notEquals' as const, values: [value] }),
    contains: (member: string, value: string) => ({ member, operator: 'contains' as const, values: [value] }),
    greaterThan: (member: string, value: any) => ({ member, operator: 'gt' as const, values: [value] }),
    lessThan: (member: string, value: any) => ({ member, operator: 'lt' as const, values: [value] }),
    inDateRange: (member: string, from: string, to: string) => ({ 
      member, 
      operator: 'inDateRange' as const, 
      values: [from, to] 
    }),
    set: (member: string) => ({ member, operator: 'set' as const, values: [] }),
    notSet: (member: string) => ({ member, operator: 'notSet' as const, values: [] })
  },

  /**
   * Create time dimensions
   */
  timeDimensions: {
    create: (dimension: string, granularity?: TimeGranularity, dateRange?: string | string[]) => ({
      dimension,
      granularity,
      dateRange
    })
  }
}