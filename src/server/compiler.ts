/**
 * Semantic Layer Compiler
 * Framework-agnostic cube compilation and registration
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
import { SemanticQueryExecutor } from './executor'

export class SemanticLayerCompiler {
  private cubes: Map<string, CompiledCube> = new Map()
  private dbExecutor?: DatabaseExecutor

  constructor(dbExecutor?: DatabaseExecutor) {
    this.dbExecutor = dbExecutor
  }

  setDatabaseExecutor(executor: DatabaseExecutor): void {
    this.dbExecutor = executor
  }

  registerCube(cube: SemanticCube): void {
    // Validate cube definition
    this.validateCube(cube)

    // Compile the cube
    const compiledCube = this.compileCube(cube)
    
    this.cubes.set(cube.name, compiledCube)
  }

  getCube(name: string): CompiledCube | undefined {
    return this.cubes.get(name)
  }

  getAllCubes(): CompiledCube[] {
    return Array.from(this.cubes.values())
  }

  getMetadata(): CubeMetadata[] {
    return Array.from(this.cubes.values()).map(cube => this.generateCubeMetadata(cube))
  }

  private validateCube(cube: SemanticCube): void {
    if (!cube.name) {
      throw new Error('Cube must have a name')
    }
    if (!cube.sql) {
      throw new Error(`Cube ${cube.name} must have SQL definition`)
    }
    if (!cube.measures || Object.keys(cube.measures).length === 0) {
      throw new Error(`Cube ${cube.name} must have at least one measure`)
    }
    // Add more validation as needed
  }

  private compileCube(cube: SemanticCube): CompiledCube {
    const queryFn = async (query: SemanticQuery, securityContext: SecurityContext): Promise<QueryResult> => {
      if (!this.dbExecutor) {
        throw new Error('Database executor not configured. Call setDatabaseExecutor() first.')
      }

      const executor = new SemanticQueryExecutor(this.dbExecutor)
      return executor.executeQuery(cube, query, securityContext)
    }

    return {
      ...cube,
      queryFn
    }
  }

  private generateCubeMetadata(cube: CompiledCube): CubeMetadata {
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
}

// Export singleton instance
export const semanticLayer = new SemanticLayerCompiler()