/**
 * Semantic Layer Compiler
 * Drizzle ORM-first cube compilation and registration with type safety
 */

import type { 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  DatabaseExecutor,
  CubeMetadata,
  MeasureMetadata,
  DimensionMetadata
} from './types'
import { createDatabaseExecutor } from './types'
import { QueryExecutor } from './executor'
import type { CubeWithJoins } from './types-drizzle'

export class SemanticLayerCompiler<TSchema extends Record<string, any> = Record<string, any>> {
  private cubes: Map<string, CubeWithJoins<TSchema>> = new Map()
  private dbExecutor?: DatabaseExecutor<TSchema>

  constructor(options?: {
    drizzle?: DatabaseExecutor<TSchema>['db']
    schema?: TSchema
    databaseExecutor?: DatabaseExecutor<TSchema>
    engineType?: 'postgres' | 'mysql' | 'sqlite'
  }) {
    if (options?.databaseExecutor) {
      this.dbExecutor = options.databaseExecutor
    } else if (options?.drizzle) {
      // Create database executor from Drizzle instance using the factory
      this.dbExecutor = createDatabaseExecutor(
        options.drizzle,
        options.schema,
        options.engineType
      )
    }
  }

  /**
   * Set or update the database executor
   */
  setDatabaseExecutor(executor: DatabaseExecutor<TSchema>): void {
    this.dbExecutor = executor
  }

  /**
   * Set Drizzle instance and schema directly
   */
  setDrizzle(db: DatabaseExecutor<TSchema>['db'], schema?: TSchema, engineType?: 'postgres' | 'mysql' | 'sqlite'): void {
    this.dbExecutor = createDatabaseExecutor(db, schema, engineType)
  }

  /**
   * Check if database executor is configured
   */
  hasExecutor(): boolean {
    return !!this.dbExecutor
  }

  /**
   * Register a simplified cube with dynamic query building
   */
  registerCube(cube: CubeWithJoins<TSchema>): void {
    this.cubes.set(cube.name, cube)
  }

  /**
   * Get a cube by name
   */
  getCube(name: string): CubeWithJoins<TSchema> | undefined {
    return this.cubes.get(name)
  }

  /**
   * Get all registered cubes
   */
  getAllCubes(): CubeWithJoins<TSchema>[] {
    return Array.from(this.cubes.values())
  }

  /**
   * Get all cubes as a Map for multi-cube queries
   */
  getAllCubesMap(): Map<string, CubeWithJoins<TSchema>> {
    return this.cubes
  }

  /**
   * Unified query execution method that handles both single and multi-cube queries
   */
  async execute(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    if (!this.dbExecutor) {
      throw new Error('Database executor not configured')
    }

    const executor = new QueryExecutor<TSchema>(this.dbExecutor)
    return executor.execute(this.cubes, query, securityContext)
  }

  /**
   * Execute a multi-cube query
   */
  async executeMultiCubeQuery(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    return this.execute(query, securityContext)
  }

  /**
   * Execute a single cube query
   */
  async executeQuery(
    cubeName: string,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Validate cube exists
    const cube = this.cubes.get(cubeName)
    if (!cube) {
      throw new Error(`Cube '${cubeName}' not found`)
    }
    
    // Use unified execution which will auto-detect single cube
    return this.execute(query, securityContext)
  }

  /**
   * Get metadata for all cubes (for API responses)
   */
  getMetadata(): CubeMetadata[] {
    return Array.from(this.cubes.values()).map(cube => this.generateCubeMetadata(cube))
  }

  /**
   * Generate cube metadata for API responses from cubes
   */
  private generateCubeMetadata(cube: CubeWithJoins<TSchema>): CubeMetadata {
    const measures: MeasureMetadata[] = Object.entries(cube.measures).map(([key, measure]) => ({
      name: `${cube.name}.${key}`,
      title: measure.title || key,
      shortTitle: measure.title || key,
      type: measure.type,
      format: undefined, // Measure doesn't have format field
      description: measure.description
    }))

    const dimensions: DimensionMetadata[] = Object.entries(cube.dimensions).map(([key, dimension]) => ({
      name: `${cube.name}.${key}`,
      title: dimension.title || key,
      shortTitle: dimension.title || key,
      type: dimension.type,
      format: undefined, // Dimension doesn't have format field
      description: dimension.description
    }))

    return {
      name: cube.name,
      title: cube.title || cube.name,
      description: cube.description,
      measures,
      dimensions,
      segments: [] // Add segments support later if needed
    }
  }

  /**
   * Get SQL for a query without executing it (debugging)
   */
  async generateSQL(
    cubeName: string, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const cube = this.getCube(cubeName)
    if (!cube) {
      throw new Error(`Cube '${cubeName}' not found`)
    }

    if (!this.dbExecutor) {
      throw new Error('Database executor not configured')
    }

    const executor = new QueryExecutor<TSchema>(this.dbExecutor)
    return executor.generateSQL(cube, query, securityContext)
  }

  /**
   * Get SQL for a multi-cube query without executing it (debugging)
   */
  async generateMultiCubeSQL(
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    if (!this.dbExecutor) {
      throw new Error('Database executor not configured')
    }

    const executor = new QueryExecutor<TSchema>(this.dbExecutor)
    return executor.generateMultiCubeSQL(this.cubes, query, securityContext)
  }

  /**
   * Check if a cube exists
   */
  hasCube(name: string): boolean {
    return this.cubes.has(name)
  }

  /**
   * Remove a cube
   */
  removeCube(name: string): boolean {
    return this.cubes.delete(name)
  }

  /**
   * Clear all cubes
   */
  clearCubes(): void {
    this.cubes.clear()
  }

  /**
   * Get cube names
   */
  getCubeNames(): string[] {
    return Array.from(this.cubes.keys())
  }

  /**
   * Validate a query against registered cubes
   * Ensures all referenced cubes and fields exist
   */
  validateQuery(query: SemanticQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Track all referenced cubes
    const referencedCubes = new Set<string>()

    // Validate measures
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName, fieldName] = measure.split('.')
        
        if (!cubeName || !fieldName) {
          errors.push(`Invalid measure format: ${measure}. Expected format: 'CubeName.fieldName'`)
          continue
        }

        referencedCubes.add(cubeName)

        // Check if cube exists
        const cube = this.getCube(cubeName)
        if (!cube) {
          errors.push(`Cube '${cubeName}' not found (referenced in measure '${measure}')`)
          continue
        }

        // Check if measure exists on cube
        if (!cube.measures[fieldName]) {
          errors.push(`Measure '${fieldName}' not found on cube '${cubeName}'`)
        }
      }
    }

    // Validate dimensions
    if (query.dimensions) {
      for (const dimension of query.dimensions) {
        const [cubeName, fieldName] = dimension.split('.')
        
        if (!cubeName || !fieldName) {
          errors.push(`Invalid dimension format: ${dimension}. Expected format: 'CubeName.fieldName'`)
          continue
        }

        referencedCubes.add(cubeName)

        // Check if cube exists
        const cube = this.getCube(cubeName)
        if (!cube) {
          errors.push(`Cube '${cubeName}' not found (referenced in dimension '${dimension}')`)
          continue
        }

        // Check if dimension exists on cube
        if (!cube.dimensions[fieldName]) {
          errors.push(`Dimension '${fieldName}' not found on cube '${cubeName}'`)
        }
      }
    }

    // Validate timeDimensions
    if (query.timeDimensions) {
      for (const timeDimension of query.timeDimensions) {
        const [cubeName, fieldName] = timeDimension.dimension.split('.')
        
        if (!cubeName || !fieldName) {
          errors.push(`Invalid timeDimension format: ${timeDimension.dimension}. Expected format: 'CubeName.fieldName'`)
          continue
        }

        referencedCubes.add(cubeName)

        // Check if cube exists
        const cube = this.getCube(cubeName)
        if (!cube) {
          errors.push(`Cube '${cubeName}' not found (referenced in timeDimension '${timeDimension.dimension}')`)
          continue
        }

        // Check if dimension exists on cube (timeDimensions reference dimensions)
        if (!cube.dimensions[fieldName]) {
          errors.push(`TimeDimension '${fieldName}' not found on cube '${cubeName}' (must be a dimension with time type)`)
        }
      }
    }

    // Validate filters
    if (query.filters) {
      for (const filter of query.filters) {
        // Handle both simple filters and logical filters
        if ('member' in filter) {
          // Simple filter condition
          const [cubeName, fieldName] = filter.member.split('.')
          
          if (!cubeName || !fieldName) {
            errors.push(`Invalid filter member format: ${filter.member}. Expected format: 'CubeName.fieldName'`)
            continue
          }

          referencedCubes.add(cubeName)

          // Check if cube exists
          const cube = this.getCube(cubeName)
          if (!cube) {
            errors.push(`Cube '${cubeName}' not found (referenced in filter '${filter.member}')`)
            continue
          }

          // Check if field exists on cube (can be dimension or measure)
          if (!cube.dimensions[fieldName] && !cube.measures[fieldName]) {
            errors.push(`Filter field '${fieldName}' not found on cube '${cubeName}' (must be a dimension or measure)`)
          }
        } else if ('and' in filter || 'or' in filter) {
          // Logical filter - recursively validate
          const logicalFilters = filter.and || filter.or || []
          for (const subFilter of logicalFilters) {
            const subValidation = this.validateQuery({ filters: [subFilter] } as SemanticQuery)
            errors.push(...subValidation.errors)
          }
        }
      }
    }

    // Ensure at least one cube is referenced
    if (referencedCubes.size === 0) {
      errors.push('Query must reference at least one cube through measures, dimensions, or filters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Create a new semantic layer compiler with type inference
 */
export function createSemanticLayer<TSchema extends Record<string, any>>(options?: {
  drizzle?: DatabaseExecutor<TSchema>['db']
  schema?: TSchema
  databaseExecutor?: DatabaseExecutor<TSchema>
  engineType?: 'postgres' | 'mysql' | 'sqlite'
}): SemanticLayerCompiler<TSchema> {
  return new SemanticLayerCompiler<TSchema>(options)
}

// Export singleton instance (for backward compatibility)
export const semanticLayer = new SemanticLayerCompiler()