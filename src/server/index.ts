/**
 * Drizzle Cube - Semantic Layer for Drizzle ORM
 * Drizzle ORM-first semantic layer with Cube.js compatibility
 */

// Export main classes with Drizzle integration
export { SemanticLayerCompiler, semanticLayer, createSemanticLayer } from './compiler'
export { SemanticQueryExecutor } from './executor'

// Export utility functions from types
export { 
  defineCube, 
  createDatabaseExecutor,
  createPostgresExecutor,
  createSQLiteExecutor,
  createMySQLExecutor,
  BaseDatabaseExecutor,
  PostgresExecutor,
  SQLiteExecutor,
  MySQLExecutor
} from './types'

// Import types for use in utility functions
import type { TimeGranularity, DrizzleDatabase } from './types'
import { SemanticLayerCompiler, semanticLayer } from './compiler'

// Export all types with Drizzle integration
export type {
  // Core interfaces with Drizzle support
  SemanticCube,
  SemanticDimension,
  SemanticMeasure,
  SemanticJoin,
  SemanticQuery,
  SecurityContext,
  DatabaseExecutor,
  DrizzleDatabase,
  DrizzleColumn,
  
  // Query types
  QueryContext,
  QueryResult,
  SqlResult,
  
  // Filter types
  Filter,
  FilterCondition,
  LogicalFilter,
  TimeDimension,
  
  // Metadata types  
  CubeMetadata,
  MeasureMetadata,
  DimensionMetadata,
  
  // Annotation types
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation,
  
  // Enum types
  MeasureType,
  MeasureFormat,
  DimensionFormat,
  DimensionType,
  JoinType,
  TimeGranularity,
  FilterOperator,
  
  // Compiled types
  CompiledCube,
  
  // Pre-aggregation types
  SemanticPreAggregation,
  
  // Utility types
  CubeDefinition,
  CubeDefiner
} from './types'

// Re-export Drizzle SQL type for convenience
export type { SQL } from 'drizzle-orm'

// Export YAML types
export type {
  YamlSchema,
  YamlCube,
  YamlDimension,
  YamlMeasure,
  YamlJoin,
  YamlPreAggregation,
  YamlView,
  YamlValidationResult
} from './yaml-types'

// Export YAML utilities
export { 
  parseYamlCubes, 
  loadYamlCubesFromFile, 
  loadYamlCubes,
  semanticCubeToYaml, 
  yamlCubeToSemanticCube,
  convertCubeReferences 
} from './yaml-loader'

// Re-export examples for documentation
export * from './example-cubes'

/**
 * Main semantic layer instance
 * Use this for simple single-instance usage
 */
export const defaultSemanticLayer = semanticLayer

/**
 * Create a new semantic layer instance with Drizzle integration
 * Use this when you need multiple isolated instances
 */
export function createDrizzleSemanticLayer<TSchema extends Record<string, any>>(options: {
  drizzle: DrizzleDatabase<TSchema>
  schema?: TSchema
}): SemanticLayerCompiler<TSchema> {
  return new SemanticLayerCompiler<TSchema>({
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
  query: (_cubeName: string) => {
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