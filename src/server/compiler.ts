/**
 * Semantic Layer Compiler
 * Drizzle ORM-first cube compilation and registration with type safety
 */

import type { 
  SemanticCube, 
  CompiledCube, 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  DatabaseExecutor,
  CubeMetadata,
  MeasureMetadata,
  DimensionMetadata
} from './types'
import { createDatabaseExecutor } from './types'
import { SemanticQueryExecutor } from './executor'

export class SemanticLayerCompiler<TSchema extends Record<string, any> = Record<string, any>> {
  private cubes: Map<string, CompiledCube<TSchema>> = new Map()
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
   * Register a semantic cube with type safety
   */
  registerCube(cube: SemanticCube<TSchema>): void {
    // Validate cube definition
    this.validateCube(cube)

    // Compile the cube
    const compiledCube = this.compileCube(cube)
    
    this.cubes.set(cube.name, compiledCube)
  }

  /**
   * Get a compiled cube by name
   */
  getCube(name: string): CompiledCube<TSchema> | undefined {
    return this.cubes.get(name)
  }

  /**
   * Get all registered cubes
   */
  getAllCubes(): CompiledCube<TSchema>[] {
    return Array.from(this.cubes.values())
  }

  /**
   * Get metadata for all cubes (for API responses)
   */
  getMetadata(): CubeMetadata[] {
    return Array.from(this.cubes.values()).map(cube => this.generateCubeMetadata(cube))
  }

  /**
   * Validate cube definition before compilation
   */
  private validateCube(cube: SemanticCube<TSchema>): void {
    if (!cube.name) {
      throw new Error('Cube must have a name')
    }
    
    if (!cube.sql) {
      throw new Error(`Cube ${cube.name} must have SQL definition`)
    }
    
    if (!cube.measures || Object.keys(cube.measures).length === 0) {
      throw new Error(`Cube ${cube.name} must have at least one measure`)
    }

    // Validate measures
    Object.entries(cube.measures).forEach(([key, measure]) => {
      if (!measure.name) {
        measure.name = key
      }
      if (!measure.type) {
        throw new Error(`Measure ${cube.name}.${key} must have a type`)
      }
      if (!measure.sql) {
        throw new Error(`Measure ${cube.name}.${key} must have SQL definition`)
      }
    })

    // Validate dimensions
    Object.entries(cube.dimensions).forEach(([key, dimension]) => {
      if (!dimension.name) {
        dimension.name = key
      }
      if (!dimension.type) {
        throw new Error(`Dimension ${cube.name}.${key} must have a type`)
      }
      if (!dimension.sql) {
        throw new Error(`Dimension ${cube.name}.${key} must have SQL definition`)
      }
    })

    // Validate joins if present
    if (cube.joins) {
      Object.entries(cube.joins).forEach(([key, join]) => {
        if (!join.sql) {
          throw new Error(`Join ${cube.name}.${key} must have SQL definition`)
        }
        if (!join.relationship) {
          throw new Error(`Join ${cube.name}.${key} must have relationship type`)
        }
      })
    }
  }

  /**
   * Compile cube into executable form
   */
  private compileCube(cube: SemanticCube<TSchema>): CompiledCube<TSchema> {
    const queryFn = async (query: SemanticQuery, securityContext: SecurityContext): Promise<QueryResult> => {
      if (!this.dbExecutor) {
        throw new Error('Database executor not configured. Call setDatabaseExecutor() or setDrizzle() first.')
      }

      // Create type-safe executor
      const executor = new SemanticQueryExecutor<TSchema>(this.dbExecutor)
      return executor.executeQuery(cube, query, securityContext)
    }

    return {
      ...cube,
      queryFn
    }
  }

  /**
   * Generate cube metadata for API responses
   */
  private generateCubeMetadata(cube: CompiledCube<TSchema>): CubeMetadata {
    const measures: MeasureMetadata[] = Object.entries(cube.measures).map(([key, measure]) => ({
      name: `${cube.name}.${key}`,
      title: measure.title || key,
      shortTitle: measure.title || key,
      type: measure.type,
      format: measure.format,
      description: measure.description
    }))

    const dimensions: DimensionMetadata[] = Object.entries(cube.dimensions).map(([key, dimension]) => ({
      name: `${cube.name}.${key}`,
      title: dimension.title || key,
      shortTitle: dimension.title || key,
      type: dimension.type,
      format: dimension.format,
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

    const executor = new SemanticQueryExecutor<TSchema>(this.dbExecutor)
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