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