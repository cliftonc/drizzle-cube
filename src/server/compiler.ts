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
import { validateQueryAgainstCubes } from './query-validator'
import type { PlanOptimiser } from './logical-plan'
import { t } from '../i18n/runtime'

// Re-exported for backward compatibility — the implementation now lives in
// query-validator.ts so the executor can import it without depending on the
// compiler (breaks the compiler ↔ executor cycle).
export { validateQueryAgainstCubes } from './query-validator'

export class SemanticLayerCompiler {
  private cubes: Map<string, Cube> = new Map()
  private metadataCache?: CubeMetadata[]
  private cacheConfig?: CacheConfig
  private rlsSetup?: RLSSetupFn
  private planOptimiser?: PlanOptimiser

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
    /**
     * Optional logical-plan optimiser injected into every QueryExecutor.
     * Defaults to a no-op IdentityOptimiser when omitted.
     */
    planOptimiser?: PlanOptimiser
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
    this.planOptimiser = options?.planOptimiser
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
    return new QueryExecutor(
      dbExecutor,
      withCache ? this.cacheConfig : undefined,
      this.rlsSetup,
      this.planOptimiser
    )
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
