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
  DimensionMetadata,
  CubeRelationshipMetadata,
  HierarchyMetadata,
  Cube,
  QueryAnalysis,
  CacheConfig,
  ExplainOptions,
  ExplainResult,
  ExecutionOptions,
  TimeGranularity
} from './types'
import { createDatabaseExecutor } from './executors'
import { QueryExecutor } from './executor'
import { formatSqlString } from '../adapters/utils'
import { CalculatedMeasureResolver } from './resolvers/calculated-measure-resolver'
import { validateTemplateSyntax } from './template-substitution'
import { resolveCubeReference } from './cube-utils'

export class SemanticLayerCompiler {
  private cubes: Map<string, Cube> = new Map()
  private dbExecutor?: DatabaseExecutor
  private metadataCache?: CubeMetadata[]
  private cacheConfig?: CacheConfig

  constructor(options?: {
    drizzle?: DatabaseExecutor['db']
    schema?: any
    databaseExecutor?: DatabaseExecutor
    engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend'
    /** Cache configuration for query result caching */
    cache?: CacheConfig
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
    this.cacheConfig = options?.cache
  }

  /**
   * Set or update the database executor
   */
  setDatabaseExecutor(executor: DatabaseExecutor): void {
    this.dbExecutor = executor
  }

  /**
   * Get the database engine type for SQL formatting
   */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | undefined {
    return this.dbExecutor?.getEngineType()
  }

  /**
   * Set Drizzle instance and schema directly
   */
  setDrizzle(db: DatabaseExecutor['db'], schema?: any, engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend'): void {
    this.dbExecutor = createDatabaseExecutor(db, schema, engineType)
  }

  /**
   * Check if database executor is configured
   */
  hasExecutor(): boolean {
    return !!this.dbExecutor
  }

  /**
   * Get configured executor or throw.
   */
  private requireExecutor(): DatabaseExecutor {
    if (!this.dbExecutor) {
      throw new Error('Database executor not configured')
    }
    return this.dbExecutor
  }

  /**
   * Create a query executor with optional cache integration.
   */
  private createQueryExecutor(withCache: boolean = false): QueryExecutor {
    const dbExecutor = this.requireExecutor()
    return new QueryExecutor(dbExecutor, withCache ? this.cacheConfig : undefined)
  }

  /**
   * Format SQL result using current engine dialect.
   */
  private formatSqlResult(result: { sql: string; params?: any[] }): { sql: string; params?: any[] } {
    const engineType = this.requireExecutor().getEngineType()
    return {
      sql: formatSqlString(result.sql, engineType),
      params: result.params
    }
  }

  /**
   * Register a simplified cube with dynamic query building
   * Validates calculated measures during registration
   */
  registerCube(cube: Cube): void {
    // Validate calculated measures
    this.validateCalculatedMeasures(cube)

    // Auto-populate dependencies for calculated measures
    const resolver = new CalculatedMeasureResolver(this.cubes)
    resolver.populateDependencies(cube)

    // Register the cube
    this.cubes.set(cube.name, cube)

    // Invalidate metadata cache when cubes change
    this.invalidateMetadataCache()
  }

  /**
   * Validate that all string-based cube references in joins resolve to registered cubes.
   * Call after all cubes are registered for strict startup validation.
   * Throws an error listing all unresolved references.
   */
  validateCubeReferences(): void {
    const errors: string[] = []
    for (const [cubeName, cube] of this.cubes) {
      if (!cube.joins) continue
      for (const [joinName, joinDef] of Object.entries(cube.joins)) {
        if (typeof joinDef.targetCube === 'string' && !this.cubes.has(joinDef.targetCube)) {
          errors.push(`${cubeName}.joins.${joinName}: target cube '${joinDef.targetCube}' is not registered`)
        }
      }
    }
    if (errors.length > 0) {
      throw new Error(`Unresolved cube references:\n${errors.map(e => `  - ${e}`).join('\n')}`)
    }
  }

  /**
   * Validate calculated measures in a cube
   * Checks template syntax, dependency existence, and circular dependencies
   */
  private validateCalculatedMeasures(cube: Cube): void {
    const errors: string[] = []

    // Check each measure
    for (const [fieldName, measure] of Object.entries(cube.measures)) {
      if (measure.type === 'calculated') {
        // Validate calculatedSql exists
        if (!measure.calculatedSql) {
          errors.push(
            `Calculated measure '${cube.name}.${fieldName}' must have calculatedSql property`
          )
          continue
        }

        // Validate template syntax
        const syntaxValidation = validateTemplateSyntax(measure.calculatedSql)
        if (!syntaxValidation.isValid) {
          errors.push(
            `Invalid calculatedSql syntax in '${cube.name}.${fieldName}': ${syntaxValidation.errors.join(', ')}`
          )
          continue
        }

        // Validate dependencies exist (using current cubes + this cube)
        const tempCubes = new Map(this.cubes)
        tempCubes.set(cube.name, cube)
        const resolver = new CalculatedMeasureResolver(tempCubes)

        try {
          resolver.validateDependencies(cube)
        } catch (err) {
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
    }

    // Check for circular dependencies across all calculated measures in the cube
    if (errors.length === 0) {
      const tempCubes = new Map(this.cubes)
      tempCubes.set(cube.name, cube)
      const resolver = new CalculatedMeasureResolver(tempCubes)
      resolver.buildGraph(cube)

      const cycle = resolver.detectCycle()
      if (cycle) {
        errors.push(
          `Circular dependency detected in calculated measures: ${cycle.join(' -> ')}`
        )
      }
    }

    // Throw if any validation errors
    if (errors.length > 0) {
      throw new Error(
        `Calculated measure validation failed for cube '${cube.name}':\n${errors.join('\n')}`
      )
    }
  }

  /**
   * Get a cube by name
   */
  getCube(name: string): Cube | undefined {
    return this.cubes.get(name)
  }

  /**
   * Get all registered cubes
   */
  getAllCubes(): Cube[] {
    return Array.from(this.cubes.values())
  }

  /**
   * Get all cubes as a Map for multi-cube queries
   */
  getAllCubesMap(): Map<string, Cube> {
    return this.cubes
  }

  /**
   * Unified query execution method that handles both single and multi-cube queries
   * @param options.skipCache - Skip cache lookup (but still cache the fresh result)
   */
  async execute(
    query: SemanticQuery,
    securityContext: SecurityContext,
    options?: ExecutionOptions
  ): Promise<QueryResult> {
    const executor = this.createQueryExecutor(true)
    return executor.execute(this.cubes, query, securityContext, options)
  }

  /**
   * Execute a multi-cube query
   * @param options.skipCache - Skip cache lookup (but still cache the fresh result)
   */
  async executeMultiCubeQuery(
    query: SemanticQuery,
    securityContext: SecurityContext,
    options?: ExecutionOptions
  ): Promise<QueryResult> {
    return this.execute(query, securityContext, options)
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
    
    // Use unified execution which will auto-detect single cube and includes validation
    return this.execute(query, securityContext)
  }

  /**
   * Get metadata for all cubes (for API responses)
   * Uses caching to improve performance for repeated requests
   * Cache is invalidated when cubes are modified (registerCube, removeCube, clearCubes)
   */
  getMetadata(): CubeMetadata[] {
    // Return cached metadata if available
    if (this.metadataCache) {
      return this.metadataCache
    }

    // Generate and cache metadata
    this.metadataCache = Array.from(this.cubes.values()).map(cube => this.generateCubeMetadata(cube))

    return this.metadataCache
  }

  /**
   * Extract column name from Drizzle column reference
   * Handles different column types and extracts the actual column name
   */
  private getColumnName(column: any): string {
    // If it's a simple column object with name property
    if (column && column.name) {
      return column.name
    }
    
    // If it's a column with columnType and name
    if (column && column.columnType && column.name) {
      return column.name
    }
    
    // If it's a string, return as-is
    if (typeof column === 'string') {
      return column
    }
    
    // Fallback: try to extract from object properties
    if (column && typeof column === 'object') {
      // Try common property names
      if (column._.name) return column._.name
      if (column.name) return column.name
      if (column.columnName) return column.columnName
    }
    
    // If we can't determine the column name, return a fallback
    return 'unknown_column'
  }

  /**
   * Default time granularities for time dimensions (ordered from least to most granular)
   * Used when dimension.granularities is not specified
   */
  private static readonly DEFAULT_TIME_GRANULARITIES: TimeGranularity[] = [
    'year', 'quarter', 'month', 'week', 'day', 'hour'
  ]

  /**
   * Generate cube metadata for API responses from cubes
   * Optimized version that minimizes object iterations
   * Includes drill-down support: drillMembers on measures, granularities on time dimensions, hierarchies
   */
  private generateCubeMetadata(cube: Cube): CubeMetadata {
    // Pre-allocate arrays for better performance
    const measureKeys = Object.keys(cube.measures)
    const dimensionKeys = Object.keys(cube.dimensions)

    const measures: MeasureMetadata[] = new Array(measureKeys.length)
    const dimensions: DimensionMetadata[] = new Array(dimensionKeys.length)

    // Process measures efficiently - include drillMembers for drill-down support
    for (let i = 0; i < measureKeys.length; i++) {
      const key = measureKeys[i]
      const measure = cube.measures[key]

      // Normalize drillMembers to full qualified names (CubeName.fieldName)
      let drillMembers: string[] | undefined
      if (measure.drillMembers && measure.drillMembers.length > 0) {
        drillMembers = measure.drillMembers.map(member => {
          // If already qualified (contains dot), use as-is
          if (member.includes('.')) {
            return member
          }
          // Otherwise, prefix with cube name
          return `${cube.name}.${member}`
        })
      }

      measures[i] = {
        name: `${cube.name}.${key}`,
        title: measure.title || key,
        shortTitle: measure.title || key,
        type: measure.type,
        format: undefined, // Measure doesn't have format field
        description: measure.description,
        synonyms: measure.synonyms,
        drillMembers
      }
    }

    // Process dimensions efficiently - include granularities for time dimensions
    for (let i = 0; i < dimensionKeys.length; i++) {
      const key = dimensionKeys[i]
      const dimension = cube.dimensions[key]

      // For time dimensions, include granularities (use defaults if not specified)
      let granularities: TimeGranularity[] | undefined
      if (dimension.type === 'time') {
        granularities = dimension.granularities || SemanticLayerCompiler.DEFAULT_TIME_GRANULARITIES
      }

      dimensions[i] = {
        name: `${cube.name}.${key}`,
        title: dimension.title || key,
        shortTitle: dimension.title || key,
        type: dimension.type,
        format: undefined, // Dimension doesn't have format field
        description: dimension.description,
        synonyms: dimension.synonyms,
        granularities
      }
    }

    // Process relationships if they exist
    const relationships: CubeRelationshipMetadata[] = []
    if (cube.joins) {
      for (const [, join] of Object.entries(cube.joins)) {
        const targetCube = resolveCubeReference(join.targetCube, this.cubes)
        if (!targetCube) continue

        relationships.push({
          targetCube: targetCube.name,
          relationship: join.relationship,
          joinFields: join.on.map(condition => ({
            sourceField: this.getColumnName(condition.source),
            targetField: this.getColumnName(condition.target)
          }))
        })
      }
    }

    // Process hierarchies if they exist - convert to full qualified names
    const hierarchies: HierarchyMetadata[] = []
    if (cube.hierarchies) {
      for (const [, hierarchy] of Object.entries(cube.hierarchies)) {
        hierarchies.push({
          name: hierarchy.name,
          title: hierarchy.title || hierarchy.name,
          cubeName: cube.name,
          // Convert level names to full qualified names
          levels: hierarchy.levels.map(level => {
            if (level.includes('.')) {
              return level
            }
            return `${cube.name}.${level}`
          })
        })
      }
    }

    const result: CubeMetadata = {
      name: cube.name,
      title: cube.title || cube.name,
      description: cube.description,
      exampleQuestions: cube.exampleQuestions,
      measures,
      dimensions,
      segments: [], // Add segments support later if needed
      relationships: relationships.length > 0 ? relationships : undefined,
      hierarchies: hierarchies.length > 0 ? hierarchies : undefined,
      meta: cube.meta
    }

    return result
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

    const executor = this.createQueryExecutor()
    const result = await executor.generateSQL(cube, query, securityContext)
    return this.formatSqlResult(result)
  }

  /**
   * Get SQL for a multi-cube query without executing it (debugging)
   */
  async generateMultiCubeSQL(
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const executor = this.createQueryExecutor()
    const result = await executor.generateMultiCubeSQL(this.cubes, query, securityContext)
    return this.formatSqlResult(result)
  }

  /**
   * Canonical dry-run SQL generation entrypoint for all query modes.
   */
  async dryRun(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const executor = this.createQueryExecutor()
    const result = await executor.dryRunSQL(this.cubes, query, securityContext)
    return this.formatSqlResult(result)
  }

  /**
   * Get SQL for a funnel query without executing it (debugging)
   * Returns the actual CTE-based SQL that would be executed for funnel queries
   */
  async dryRunFunnel(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    return this.dryRun(query, securityContext)
  }

  /**
   * Get SQL for a flow query without executing it (debugging)
   * Returns the actual CTE-based SQL that would be executed for flow queries
   */
  async dryRunFlow(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    return this.dryRun(query, securityContext)
  }

  /**
   * Generate SQL for a retention query without execution (dry-run)
   * Returns the CTE-based SQL that would be executed for retention analysis
   */
  async dryRunRetention(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    return this.dryRun(query, securityContext)
  }

  /**
   * Execute EXPLAIN on a query to get the execution plan
   * Uses the same secure path as execute/dryRun to generate SQL,
   * then runs database EXPLAIN on it.
   */
  async explainQuery(
    query: SemanticQuery,
    securityContext: SecurityContext,
    options?: ExplainOptions
  ): Promise<ExplainResult> {
    const executor = this.createQueryExecutor()
    return executor.explainQuery(this.cubes, query, securityContext, options)
  }

  /**
   * Check if a cube exists
   */
  hasCube(name: string): boolean {
    return this.cubes.has(name)
  }

  /**
   * Unregister a cube by name.
   * Returns true if the cube existed and was removed, false if not found.
   */
  unregisterCube(name: string): boolean {
    return this.removeCube(name)
  }

  /**
   * Remove a cube
   */
  removeCube(name: string): boolean {
    const result = this.cubes.delete(name)
    if (result) {
      this.invalidateMetadataCache()
    }
    return result
  }

  /**
   * Clear all cubes
   */
  clearCubes(): void {
    this.cubes.clear()
    this.invalidateMetadataCache()
  }

  /**
   * Invalidate the metadata cache
   * Called whenever cubes are modified
   */
  private invalidateMetadataCache(): void {
    this.metadataCache = undefined
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
    return validateQueryAgainstCubes(this.cubes, query)
  }

  /**
   * Analyze query planning decisions for debugging and transparency
   * Returns detailed metadata about how the query would be planned
   * Used by the playground UI to help users understand query structure
   */
  analyzeQuery(
    query: SemanticQuery,
    securityContext: SecurityContext
  ): QueryAnalysis {
    const executor = this.createQueryExecutor(true)
    return executor.analyzeQuery(this.cubes, query, securityContext)
  }
}

type ValidationMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

function getActiveValidationModes(query: SemanticQuery): Exclude<ValidationMode, 'regular'>[] {
  const activeModes: Exclude<ValidationMode, 'regular'>[] = []

  if (query.timeDimensions?.some(td => td.compareDateRange && td.compareDateRange.length >= 2)) {
    activeModes.push('comparison')
  }

  if (query.funnel !== undefined && query.funnel.steps?.length >= 2) {
    activeModes.push('funnel')
  }

  if (query.flow !== undefined && query.flow.startingStep !== undefined && query.flow.eventDimension !== undefined) {
    activeModes.push('flow')
  }

  if (
    query.retention !== undefined &&
    query.retention.timeDimension != null &&
    query.retention.bindingKey != null
  ) {
    activeModes.push('retention')
  }

  if (activeModes.length === 0) {
    return []
  }

  return activeModes
}

/**
 * Validate a query against a cubes map
 * Standalone function that can be used by both compiler and executor
 */
export function validateQueryAgainstCubes(
  cubes: Map<string, Cube>,
  query: SemanticQuery
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const activeModes = getActiveValidationModes(query)
  if (activeModes.length > 1) {
    errors.push(`Query contains multiple query modes: ${activeModes.join(', ')}`)
    return { isValid: false, errors }
  }

  const specialValidators: Record<Exclude<ValidationMode, 'regular' | 'comparison'>, () => void> = {
    funnel: () => {
      // Basic funnel validation here - full validation happens in executor
      // Just ensure the cube referenced by bindingKey exists
      const bindingKey = query.funnel!.bindingKey
      if (typeof bindingKey === 'string') {
        const [cubeName] = bindingKey.split('.')
        if (cubeName && !cubes.has(cubeName)) {
          errors.push(`Funnel binding key cube not found: ${cubeName}`)
        }
      } else if (Array.isArray(bindingKey)) {
        for (const mapping of bindingKey) {
          if (!cubes.has(mapping.cube)) {
            errors.push(`Funnel binding key cube not found: ${mapping.cube}`)
          }
        }
      }
    },
    flow: () => {
      // Basic flow validation here - full validation happens in executor
      // Just ensure the cube referenced by bindingKey exists
      const bindingKey = query.flow!.bindingKey
      if (typeof bindingKey === 'string') {
        const [cubeName] = bindingKey.split('.')
        if (cubeName && !cubes.has(cubeName)) {
          errors.push(`Flow binding key cube not found: ${cubeName}`)
        }
      }
    },
    retention: () => {
      const retention = query.retention!

      // Validate cube from time dimension exists
      const cubeName = extractCubeFromRetentionTimeDimension(retention.timeDimension)
      if (cubeName && !cubes.has(cubeName)) {
        errors.push(`Retention cube not found: ${cubeName}`)
      }

      // Validate binding key cube(s) exist
      const bindingKey = retention.bindingKey
      if (typeof bindingKey === 'string') {
        const [bkCubeName] = bindingKey.split('.')
        if (bkCubeName && !cubes.has(bkCubeName)) {
          errors.push(`Retention binding key cube not found: ${bkCubeName}`)
        }
      } else if (Array.isArray(bindingKey)) {
        for (const mapping of bindingKey) {
          if (!cubes.has(mapping.cube)) {
            errors.push(`Retention binding key cube not found: ${mapping.cube}`)
          }
        }
      }

      // Validate breakdown dimension cubes exist
      if (retention.breakdownDimensions && Array.isArray(retention.breakdownDimensions)) {
        for (const dim of retention.breakdownDimensions) {
          const [bdCubeName] = dim.split('.')
          if (bdCubeName && !cubes.has(bdCubeName)) {
            errors.push(`Retention breakdown cube not found: ${bdCubeName}`)
          }
        }
      }
    }
  }

  if (activeModes.length === 1 && activeModes[0] !== 'comparison') {
    const mode = activeModes[0]
    specialValidators[mode as keyof typeof specialValidators]()
    return { isValid: errors.length === 0, errors }
  }

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
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(`Cube '${cubeName}' not found (referenced in measure '${measure}')`)
        continue
      }

      // Check if measure exists on cube
      if (!cube.measures[fieldName]) {
        const hint = fieldName === cubeName
          ? `. Did you mean one of: ${Object.keys(cube.measures).slice(0, 5).map(m => `'${cubeName}.${m}'`).join(', ')}?`
          : ''
        errors.push(`Measure '${fieldName}' not found on cube '${cubeName}'${hint}`)
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
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(`Cube '${cubeName}' not found (referenced in dimension '${dimension}')`)
        continue
      }

      // Check if dimension exists on cube
      if (!cube.dimensions[fieldName]) {
        const hint = fieldName === cubeName
          ? `. Did you mean one of: ${Object.keys(cube.dimensions).slice(0, 5).map(d => `'${cubeName}.${d}'`).join(', ')}?`
          : ''
        errors.push(`Dimension '${fieldName}' not found on cube '${cubeName}'${hint}`)
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
      const cube = cubes.get(cubeName)
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
      validateFilter(filter, cubes, errors, referencedCubes)
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

/**
 * Validate a single filter (recursive for logical filters)
 */
function validateFilter(
  filter: any,
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  // Handle logical filters (AND/OR)
  if ('and' in filter || 'or' in filter) {
    const logicalFilters = filter.and || filter.or || []
    for (const subFilter of logicalFilters) {
      validateFilter(subFilter, cubes, errors, referencedCubes)
    }
    return
  }

  // Handle simple filter condition
  if (!('member' in filter)) {
    errors.push('Filter must have a member field')
    return
  }

  const [cubeName, fieldName] = filter.member.split('.')
  
  if (!cubeName || !fieldName) {
    errors.push(`Invalid filter member format: ${filter.member}. Expected format: 'CubeName.fieldName'`)
    return
  }

  referencedCubes.add(cubeName)

  // Check if cube exists
  const cube = cubes.get(cubeName)
  if (!cube) {
    errors.push(`Cube '${cubeName}' not found (referenced in filter '${filter.member}')`)
    return
  }

  // Check if field exists on cube (can be dimension or measure)
  if (!cube.dimensions[fieldName] && !cube.measures[fieldName]) {
    const hint = fieldName === cubeName
      ? `. Did you mean one of: ${[...Object.keys(cube.dimensions), ...Object.keys(cube.measures)].slice(0, 5).map(f => `'${cubeName}.${f}'`).join(', ')}?`
      : ''
    errors.push(`Filter field '${fieldName}' not found on cube '${cubeName}' (must be a dimension or measure)${hint}`)
  }
}

/**
 * Extract cube name from retention time dimension (string or object format)
 */
function extractCubeFromRetentionTimeDimension(
  timeDim: string | { cube: string; dimension: string }
): string | null {
  if (typeof timeDim === 'string') {
    const [cubeName] = timeDim.split('.')
    return cubeName || null
  }
  return timeDim.cube
}
