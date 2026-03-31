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
  TimeGranularity,
  RLSSetupFn
} from './types'
import { createDatabaseExecutor } from './executors'
import { QueryExecutor } from './executor'
import { formatSqlString } from '../adapters/utils'
import { CalculatedMeasureResolver } from './resolvers/calculated-measure-resolver'
import { validateTemplateSyntax } from './template-substitution'
import { resolveCubeReference } from './cube-utils'
import { t } from '../i18n/runtime'

export class SemanticLayerCompiler {
  private cubes: Map<string, Cube> = new Map()
  private metadataCache?: CubeMetadata[]
  private cacheConfig?: CacheConfig
  private rlsSetup?: RLSSetupFn

  // Database ingredients — stored so we can create a fresh executor per request.
  // This avoids sharing mutable state between concurrent requests, which is
  // critical for RLS transaction safety.
  private db?: DatabaseExecutor['db']
  private schema?: any
  private engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  constructor(options?: {
    drizzle?: DatabaseExecutor['db']
    schema?: any
    databaseExecutor?: DatabaseExecutor
    engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'
    /** Cache configuration for query result caching */
    cache?: CacheConfig
    /**
     * Row-Level Security setup function.
     * When provided, every query execution opens a transaction, calls this function
     * to configure RLS (e.g., set JWT claims and switch roles), then runs the query.
     * Dry-run/SQL generation is NOT wrapped in a transaction.
     */
    rlsSetup?: RLSSetupFn
  }) {
    if (options?.databaseExecutor) {
      // Extract ingredients from pre-built executor
      this.db = options.databaseExecutor.db
      this.schema = options.databaseExecutor.schema
      this.engineType = options.databaseExecutor.getEngineType()
    } else if (options?.drizzle) {
      this.db = options.drizzle
      this.schema = options.schema
      this.engineType = options.engineType
    }
    this.cacheConfig = options?.cache
    this.rlsSetup = options?.rlsSetup
  }

  /**
   * Set or update the database connection
   */
  setDatabaseExecutor(executor: DatabaseExecutor): void {
    this.db = executor.db
    this.schema = executor.schema
    this.engineType = executor.getEngineType()
  }

  /**
   * Get the database engine type for SQL formatting
   */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake' | undefined {
    return this.engineType
  }

  /**
   * Set Drizzle instance and schema directly
   */
  setDrizzle(db: DatabaseExecutor['db'], schema?: any, engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'): void {
    this.db = db
    this.schema = schema
    this.engineType = engineType
  }

  /**
   * Check if database executor is configured
   */
  hasExecutor(): boolean {
    return !!this.db
  }

  /**
   * Create a fresh DatabaseExecutor from stored ingredients, or throw.
   */
  private createDbExecutor(): DatabaseExecutor {
    if (!this.db) {
      throw new Error(t('server.errors.dbNotConfigured'))
    }
    return createDatabaseExecutor(this.db, this.schema, this.engineType)
  }

  /**
   * Create a query executor with optional cache integration.
   * Each call creates a fresh DatabaseExecutor so concurrent requests
   * never share mutable state.
   */
  private createQueryExecutor(withCache: boolean = false): QueryExecutor {
    const dbExecutor = this.createDbExecutor()
    return new QueryExecutor(dbExecutor, withCache ? this.cacheConfig : undefined, this.rlsSetup)
  }

  /**
   * Format SQL result using current engine dialect.
   */
  private formatSqlResult(result: { sql: string; params?: any[] }): { sql: string; params?: any[] } {
    const engineType = this.getEngineType() ?? 'postgres'
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
          errors.push(t('server.errors.cubeRefUnresolved', { cubeName, joinName, targetCube: joinDef.targetCube }))
        }
      }
    }
    if (errors.length > 0) {
      throw new Error(t('server.errors.unresolvedCubeRefs', { details: errors.map(e => `  - ${e}`).join('\n') }))
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
            t('server.validation.calculatedMeasure.mustHaveCalculatedSql', { cubeName: cube.name, fieldName })
          )
          continue
        }

        // Validate template syntax
        const syntaxValidation = validateTemplateSyntax(measure.calculatedSql)
        if (!syntaxValidation.isValid) {
          errors.push(
            t('server.validation.calculatedMeasure.invalidSyntax', { cubeName: cube.name, fieldName, errors: syntaxValidation.errors.join(', ') })
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
          t('server.validation.calculatedMeasure.circularDependency', { cycle: cycle.join(' -> ') })
        )
      }
    }

    // Throw if any validation errors
    if (errors.length > 0) {
      throw new Error(
        t('server.errors.calculatedMeasureValidation', { cubeName: cube.name, details: errors.join('\n') })
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
      throw new Error(t('server.errors.cubeNotFound', { cubeName }))
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
      throw new Error(t('server.errors.cubeNotFound', { cubeName }))
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
    errors.push(t('server.validation.query.multipleQueryModes', { modes: activeModes.join(', ') }))
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
          errors.push(t('server.validation.query.funnelBindingKeyCubeNotFound', { cubeName }))
        }
      } else if (Array.isArray(bindingKey)) {
        for (const mapping of bindingKey) {
          if (!cubes.has(mapping.cube)) {
            errors.push(t('server.validation.query.funnelBindingKeyCubeNotFound', { cubeName: mapping.cube }))
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
          errors.push(t('server.validation.query.flowBindingKeyCubeNotFound', { cubeName }))
        }
      }
    },
    retention: () => {
      const retention = query.retention!

      // Validate cube from time dimension exists
      const cubeName = extractCubeFromRetentionTimeDimension(retention.timeDimension)
      if (cubeName && !cubes.has(cubeName)) {
        errors.push(t('server.validation.query.retentionCubeNotFound', { cubeName }))
      }

      // Validate binding key cube(s) exist
      const bindingKey = retention.bindingKey
      if (typeof bindingKey === 'string') {
        const [bkCubeName] = bindingKey.split('.')
        if (bkCubeName && !cubes.has(bkCubeName)) {
          errors.push(t('server.validation.query.retentionBindingKeyCubeNotFound', { cubeName: bkCubeName }))
        }
      } else if (Array.isArray(bindingKey)) {
        for (const mapping of bindingKey) {
          if (!cubes.has(mapping.cube)) {
            errors.push(t('server.validation.query.retentionBindingKeyCubeNotFound', { cubeName: mapping.cube }))
          }
        }
      }

      // Validate breakdown dimension cubes exist
      if (retention.breakdownDimensions && Array.isArray(retention.breakdownDimensions)) {
        for (const dim of retention.breakdownDimensions) {
          const [bdCubeName] = dim.split('.')
          if (bdCubeName && !cubes.has(bdCubeName)) {
            errors.push(t('server.validation.query.retentionBreakdownCubeNotFound', { cubeName: bdCubeName }))
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
        errors.push(t('server.validation.query.invalidMeasureFormat', { measure }))
        continue
      }

      referencedCubes.add(cubeName)

      // Check if cube exists
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(t('server.validation.query.cubeNotFoundForMeasure', { cubeName, measure }))
        continue
      }

      // Check if measure exists on cube
      if (!cube.measures[fieldName]) {
        const hint = fieldName === cubeName
          ? `. Did you mean one of: ${Object.keys(cube.measures).slice(0, 5).map(m => `'${cubeName}.${m}'`).join(', ')}?`
          : ''
        errors.push(t('server.validation.query.measureNotFound', { fieldName, cubeName, hint }))
      }
    }
  }

  // Validate dimensions
  if (query.dimensions) {
    for (const dimension of query.dimensions) {
      const [cubeName, fieldName] = dimension.split('.')
      
      if (!cubeName || !fieldName) {
        errors.push(t('server.validation.query.invalidDimensionFormat', { dimension }))
        continue
      }

      referencedCubes.add(cubeName)

      // Check if cube exists
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(t('server.validation.query.cubeNotFoundForDimension', { cubeName, dimension }))
        continue
      }

      // Check if dimension exists on cube
      if (!cube.dimensions[fieldName]) {
        const hint = fieldName === cubeName
          ? `. Did you mean one of: ${Object.keys(cube.dimensions).slice(0, 5).map(d => `'${cubeName}.${d}'`).join(', ')}?`
          : ''
        errors.push(t('server.validation.query.dimensionNotFound', { fieldName, cubeName, hint }))
      }
    }
  }

  // Validate timeDimensions
  if (query.timeDimensions) {
    for (const timeDimension of query.timeDimensions) {
      const [cubeName, fieldName] = timeDimension.dimension.split('.')
      
      if (!cubeName || !fieldName) {
        errors.push(t('server.validation.query.invalidTimeDimensionFormat', { dimension: timeDimension.dimension }))
        continue
      }

      referencedCubes.add(cubeName)

      // Check if cube exists
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(t('server.validation.query.cubeNotFoundForTimeDimension', { cubeName, dimension: timeDimension.dimension }))
        continue
      }

      // Check if dimension exists on cube (timeDimensions reference dimensions)
      if (!cube.dimensions[fieldName]) {
        errors.push(t('server.validation.query.timeDimensionNotFound', { fieldName, cubeName }))
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
    errors.push(t('server.validation.query.mustReferenceAtLeastOneCube'))
  }

  // Validate ungrouped query constraints
  if (query.ungrouped) {
    const hasDimensions = (query.dimensions && query.dimensions.length > 0) ||
                          (query.timeDimensions && query.timeDimensions.length > 0)
    if (!hasDimensions) {
      errors.push(t('server.validation.query.ungroupedRequiresDimension'))
    }

    // Reject incompatible query modes
    if (query.funnel) {
      errors.push(t('server.validation.query.ungroupedIncompatibleFunnel'))
    }
    if (query.flow) {
      errors.push(t('server.validation.query.ungroupedIncompatibleFlow'))
    }
    if (query.retention) {
      errors.push(t('server.validation.query.ungroupedIncompatibleRetention'))
    }

    // Reject compareDateRange
    if (query.timeDimensions?.some(td => td.compareDateRange && td.compareDateRange.length > 0)) {
      errors.push(t('server.validation.query.ungroupedIncompatibleCompareDateRange'))
    }

    // Reject fillMissingDates
    if (query.timeDimensions?.some(td => td.fillMissingDates === true)) {
      errors.push(t('server.validation.query.ungroupedIncompatibleFillMissingDates'))
    }

    // Validate measure types — only raw-column-compatible types allowed
    const allowedUngroupedTypes = new Set(['sum', 'avg', 'min', 'max', 'number'])
    const incompatibleTypes = new Set([
      'count', 'countDistinct', 'countDistinctApprox',
      'calculated',
      'stddev', 'stddevSamp', 'variance', 'varianceSamp',
      'median', 'p95', 'p99', 'percentile',
      'lag', 'lead', 'rank', 'denseRank', 'rowNumber',
      'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'
    ])

    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = cubes.get(cubeName)
        if (cube && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]

          if (incompatibleTypes.has(measure.type)) {
            errors.push(
              `Measure '${measureName}' has type '${measure.type}' which is incompatible with ungrouped queries. ` +
              `Only ${[...allowedUngroupedTypes].join(', ')} types are allowed.`
            )
          }

          // Reject measures with filters (require CASE WHEN + aggregate)
          if (measure.filters && measure.filters.length > 0) {
            errors.push(
              `Measure '${measureName}' has filters which are incompatible with ungrouped queries ` +
              `(measure filters require aggregation)`
            )
          }
        }
      }
    }

    // Reject hasMany joins between referenced cubes
    for (const cubeName of referencedCubes) {
      const cube = cubes.get(cubeName)
      if (cube && cube.joins) {
        for (const [joinName, joinDef] of Object.entries(cube.joins)) {
          if (joinDef.relationship === 'hasMany') {
            // Check if the target cube is also referenced in this query
            const targetCube = resolveCubeReference(joinDef.targetCube, cubes)
            if (targetCube && referencedCubes.has(targetCube.name)) {
              errors.push(
                `Ungrouped queries are incompatible with hasMany relationships ` +
                `(${cubeName} → ${joinName} is hasMany)`
              )
            }
          }
        }
      }
    }
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
    errors.push(t('server.validation.query.filterMustHaveMember'))
    return
  }

  const [cubeName, fieldName] = filter.member.split('.')
  
  if (!cubeName || !fieldName) {
    errors.push(t('server.validation.query.invalidFilterMemberFormat', { member: filter.member }))
    return
  }

  referencedCubes.add(cubeName)

  // Check if cube exists
  const cube = cubes.get(cubeName)
  if (!cube) {
    errors.push(t('server.validation.query.cubeNotFoundForFilter', { cubeName, member: filter.member }))
    return
  }

  // Check if field exists on cube (can be dimension or measure)
  if (!cube.dimensions[fieldName] && !cube.measures[fieldName]) {
    const hint = fieldName === cubeName
      ? `. Did you mean one of: ${[...Object.keys(cube.dimensions), ...Object.keys(cube.measures)].slice(0, 5).map(f => `'${cubeName}.${f}'`).join(', ')}?`
      : ''
    errors.push(t('server.validation.query.filterFieldNotFound', { fieldName, cubeName, hint }))
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
