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
  Cube,
  QueryAnalysis,
  CacheConfig,
  ExplainOptions,
  ExplainResult,
  ExecutionOptions,
  RLSSetupFn
} from './types/index.js'
import { createDatabaseExecutor } from './executors/index.js'
import { QueryExecutor } from './executor.js'
import { formatSqlString } from './sql-format.js'
import { CalculatedMeasureResolver } from './resolvers/calculated-measure-resolver.js'
import { validateTemplateSyntax } from './template-substitution.js'
import {
  buildMeasureMetadata,
  buildDimensionMetadata,
  buildRelationshipMetadata,
  buildHierarchyMetadata
} from './compiler-metadata.js'
import { validateQueryAgainstCubes } from './query-validator.js'
import type { QueryValidationResult } from './query-validator.js'
import type { PlanOptimiser } from './logical-plan/index.js'
import { t } from '../i18n/runtime.js'

// Re-exported for backward compatibility — the implementation now lives in
// query-validator.ts so the executor can import it without depending on the
// compiler (breaks the compiler ↔ executor cycle).
export { validateQueryAgainstCubes } from './query-validator.js'
export type { QueryValidationIssue, QueryValidationResult } from './query-validator.js'

/**
 * Identifier of the base cube set — the cubes registered with {@link
 * SemanticLayerCompiler.registerCube}, shared by every tenant. The empty string
 * is used so a set id can never collide with it (`registerCubeSet` rejects it).
 */
export const BASE_CUBE_SET_ID = ''

/**
 * Security context for deployments with no tenancy at all.
 *
 * Every cube-resolving method requires a `SecurityContext` so that omitting one
 * is a compile error rather than a silent fall back to the wrong tenant's
 * cubes. Single-tenant callers pass this constant to say "no tenancy here" out
 * loud, instead of an anonymous `{}` that reads like an oversight.
 */
export const SINGLE_TENANT_CONTEXT: SecurityContext = Object.freeze({})

/** Reported to `onCubeSetRegistered` after each {@link SemanticLayerCompiler.registerCubeSet}. */
export interface CubeSetRegistrationInfo {
  /** The set that was registered. */
  setId: string
  /** Cubes in the set after merging over the base set. */
  cubeCount: number
  /** Total dimensions across those cubes — the number that explains a slow boot. */
  dimensionCount: number
  /**
   * Monotonic across the whole compiler — incremented on every registration of
   * any set, never reset. Part of the cache key, so results computed from
   * superseded definitions can never be served.
   */
  generation: number
  /** Wall-clock cost of this registration. */
  durationMs: number
}

/** Aggregate registration cost, for a single summary line after the boot loop. */
export interface CubeSetStats {
  /** Number of registered sets, excluding the base set. */
  setCount: number
  /** Total cubes across all sets (merged), excluding the base set. */
  cubeCount: number
  /** Sum of every set's most recent registration time. */
  totalRegistrationMs: number
  /** The most expensive set to register, if any sets are registered. */
  slowestSet?: { setId: string; durationMs: number }
}

/** Internal per-set state. `merged` is precomputed so request paths never merge. */
interface CubeSetEntry {
  /** Cubes registered for this set, before merging. */
  overlay: Map<string, Cube>
  /** Base cubes with the overlay applied over them — what queries actually see. */
  merged: Map<string, Cube>
  generation: number
  durationMs: number
}

/** Log cube-set registration when DC_DEBUG=true or DC_DEBUG=cubesets */
function debugCubeSet(message: string): void {
  if (typeof process === 'undefined') return
  const flag = process.env?.DC_DEBUG
  if (flag !== 'true' && flag !== 'cubesets') return
  console.log(`[DC_DEBUG] ${message}`)
}

export class SemanticLayerCompiler {
  /** Cubes shared by every tenant. */
  private baseCubes: Map<string, Cube> = new Map()
  /** Per-tenant overlays, keyed by cube-set id. */
  private cubeSets: Map<string, CubeSetEntry> = new Map()
  /** Generated metadata per cube set (`BASE_CUBE_SET_ID` for the base set). */
  private metadataCache: Map<string, CubeMetadata[]> = new Map()
  /** Bumped on every base-set mutation; part of every set's cache key. */
  private baseGeneration = 0
  /**
   * Monotonic registration counter, never reset. Used as each set's generation
   * so that unregistering a set and registering a different one under the same
   * id cannot reproduce an earlier cache key and serve its stale results.
   */
  private registrationCounter = 0
  private contextToCubeSetId?: (securityContext: SecurityContext) => string | number | undefined
  private missingCubeSet: 'base' | 'throw' = 'base'
  private onCubeSetRegistered?: (info: CubeSetRegistrationInfo) => void
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
    /**
     * Maps a security context to the cube set that serves it — drizzle-cube's
     * equivalent of Cube's `contextToAppId`. Return `undefined` (or omit this
     * option entirely) to serve the base set, which is the single-tenant
     * behaviour and the default.
     */
    contextToCubeSetId?: (securityContext: SecurityContext) => string | number | undefined
    /**
     * What to do when `contextToCubeSetId` names a set that is not registered.
     * `'base'` (default) serves the base set; `'throw'` fails the request, for
     * deployments where every tenant is required to have its own set.
     */
    missingCubeSet?: 'base' | 'throw'
    /**
     * Called after each `registerCubeSet` with its cost. Registering a set per
     * tenant is real startup work, so it is reported rather than hidden; emit
     * it to your own logger or metrics.
     */
    onCubeSetRegistered?: (info: CubeSetRegistrationInfo) => void
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
    this.contextToCubeSetId = options?.contextToCubeSetId
    this.missingCubeSet = options?.missingCubeSet ?? 'base'
    this.onCubeSetRegistered = options?.onCubeSetRegistered
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
    this.prepareCube(cube, this.baseCubes)
    this.baseCubes.set(cube.name, cube)

    // A base cube is visible to every tenant, so every set's merged view and
    // every cached metadata entry is now stale.
    this.baseGeneration++
    this.rebuildAllMergedSets()
    this.metadataCache.clear()
  }

  // ============================================
  // Cube sets — per-tenant cube definitions
  //
  // Lifecycle (register / unregister / stats) is boot-and-admin API and takes
  // no security context: registering *defines* tenancy rather than operating
  // within it. Every path that reads cube *contents* goes through
  // `resolveCubes`, which requires a context.
  // ============================================

  /**
   * Register the cubes that serve one tenant, overlaying the base set.
   *
   * Cubes are matched to the base set by name, so a set can either add cubes or
   * replace a base cube with a tenant-specific version (the usual case for
   * generated per-tenant dimensions). Call once per tenant at application boot;
   * calling again for the same id replaces that set and invalidates its cached
   * metadata and query results.
   */
  registerCubeSet(setId: string, cubes: Cube[]): void {
    if (setId === BASE_CUBE_SET_ID) {
      throw new Error(t('server.errors.cubeSetIdEmpty'))
    }

    const startedAt = Date.now()
    const overlay = new Map<string, Cube>()

    // Prepare each cube against base + the overlay built so far, so a set cube
    // may reference another cube in the same set as well as a base cube.
    for (const cube of cubes) {
      const visible = new Map(this.baseCubes)
      for (const [name, registered] of overlay) visible.set(name, registered)
      this.prepareCube(cube, visible)
      overlay.set(cube.name, cube)
    }

    const generation = ++this.registrationCounter
    const merged = this.mergeWithBase(overlay)
    const durationMs = Date.now() - startedAt

    this.cubeSets.set(setId, { overlay, merged, generation, durationMs })
    this.metadataCache.delete(setId)

    let dimensionCount = 0
    for (const cube of overlay.values()) {
      dimensionCount += Object.keys(cube.dimensions ?? {}).length
    }
    const info: CubeSetRegistrationInfo = {
      setId,
      cubeCount: merged.size,
      dimensionCount,
      generation,
      durationMs
    }
    debugCubeSet(
      `registered cube set '${setId}': ${overlay.size} cube(s), ${dimensionCount} dimension(s), ` +
      `generation ${generation}, ${durationMs}ms`
    )
    this.onCubeSetRegistered?.(info)
  }

  /**
   * Remove a tenant's cube set. That tenant then resolves to the base set (or
   * throws, under `missingCubeSet: 'throw'`).
   * Returns true if the set existed.
   */
  unregisterCubeSet(setId: string): boolean {
    const removed = this.cubeSets.delete(setId)
    if (removed) {
      this.metadataCache.delete(setId)
    }
    return removed
  }

  /** Whether a cube set is registered for this id. */
  hasCubeSet(setId: string): boolean {
    return this.cubeSets.has(setId)
  }

  /** Ids of every registered cube set, excluding the base set. */
  getCubeSetIds(): string[] {
    return Array.from(this.cubeSets.keys())
  }

  /**
   * Aggregate registration cost across all sets — for the single summary line
   * worth logging after a boot loop.
   */
  getCubeSetStats(): CubeSetStats {
    let cubeCount = 0
    let totalRegistrationMs = 0
    let slowestSet: { setId: string; durationMs: number } | undefined

    for (const [setId, entry] of this.cubeSets) {
      cubeCount += entry.merged.size
      totalRegistrationMs += entry.durationMs
      if (!slowestSet || entry.durationMs > slowestSet.durationMs) {
        slowestSet = { setId, durationMs: entry.durationMs }
      }
    }

    return { setCount: this.cubeSets.size, cubeCount, totalRegistrationMs, slowestSet }
  }

  /**
   * Validate and enrich a cube ahead of registration, against the cubes that
   * will be visible alongside it.
   */
  private prepareCube(cube: Cube, visibleCubes: Map<string, Cube>): void {
    this.validateCalculatedMeasures(cube, visibleCubes)
    const resolver = new CalculatedMeasureResolver(visibleCubes)
    resolver.populateDependencies(cube)
  }

  /** Base cubes with an overlay applied over them, by cube name. */
  private mergeWithBase(overlay: Map<string, Cube>): Map<string, Cube> {
    const merged = new Map(this.baseCubes)
    for (const [name, cube] of overlay) {
      merged.set(name, cube)
    }
    return merged
  }

  /** Recompute every set's merged view — after any base-set mutation. */
  private rebuildAllMergedSets(): void {
    for (const entry of this.cubeSets.values()) {
      entry.merged = this.mergeWithBase(entry.overlay)
    }
  }

  /**
   * Resolve the cube set serving this security context.
   *
   * Returns {@link BASE_CUBE_SET_ID} when no mapping is configured or the
   * mapping yields nothing. A configured id that has no registered set falls
   * back to the base set, or throws under `missingCubeSet: 'throw'`.
   */
  private resolveSetId(securityContext: SecurityContext): string {
    if (!this.contextToCubeSetId) return BASE_CUBE_SET_ID

    const resolved = this.contextToCubeSetId(securityContext)
    if (resolved === undefined || resolved === null || resolved === '') {
      return BASE_CUBE_SET_ID
    }

    const setId = String(resolved)
    if (!this.cubeSets.has(setId)) {
      if (this.missingCubeSet === 'throw') {
        throw new Error(t('server.errors.cubeSetNotFound', { setId }))
      }
      return BASE_CUBE_SET_ID
    }
    return setId
  }

  /**
   * The cubes this security context may see.
   *
   * This is the only path by which cube *contents* are read for a query,
   * metadata, validation or MCP response — so no such path can reach a cube
   * list without a security context. The returned map must be treated as
   * read-only; it is the live merged view, not a copy.
   */
  private resolveCubes(securityContext: SecurityContext): Map<string, Cube> {
    const setId = this.resolveSetId(securityContext)
    if (setId === BASE_CUBE_SET_ID) return this.baseCubes
    return this.cubeSets.get(setId)?.merged ?? this.baseCubes
  }

  /**
   * Cache-key component identifying which cube definitions produced a result.
   *
   * Appended unconditionally to every query cache key: the security-context
   * hash is not enough, because `includeSecurityContext: false` and a custom
   * `securityContextSerializer` can both hash two tenants identically. The
   * generation makes re-registering a set invalidate its cached results, so a
   * retyped or renamed dimension cannot be served stale for the TTL.
   */
  private cubeSetCacheKey(setId: string): string {
    const setGeneration = this.cubeSets.get(setId)?.generation ?? 0
    return `${setId}:${this.baseGeneration}.${setGeneration}`
  }

  /**
   * Validate that all string-based cube references in joins resolve to registered cubes.
   * Call after all cubes are registered for strict startup validation.
   * Throws an error listing all unresolved references.
   */
  validateCubeReferences(): void {
    // Each set is validated against its own merged view: an overlay cube
    // joining a base cube is the normal case, and a base cube may be replaced
    // by a set whose joins differ.
    const errors = new Set<string>()

    for (const message of this.unresolvedJoinRefs(this.baseCubes)) errors.add(message)
    for (const entry of this.cubeSets.values()) {
      for (const message of this.unresolvedJoinRefs(entry.merged)) errors.add(message)
    }

    if (errors.size > 0) {
      const details = Array.from(errors, message => `  - ${message}`).join('\n')
      throw new Error(t('server.errors.unresolvedCubeRefs', { details }))
    }
  }

  /** Join targets naming a cube that is absent from the given cube scope. */
  private *unresolvedJoinRefs(cubes: Map<string, Cube>): Generator<string> {
    for (const [cubeName, cube] of cubes) {
      if (!cube.joins) continue
      for (const [joinName, joinDef] of Object.entries(cube.joins)) {
        const { targetCube } = joinDef
        if (typeof targetCube === 'string' && !cubes.has(targetCube)) {
          yield t('server.errors.cubeRefUnresolved', { cubeName, joinName, targetCube })
        }
      }
    }
  }

  /**
   * Validate calculated measures in a cube
   * Checks template syntax, dependency existence, and circular dependencies
   */
  private validateCalculatedMeasures(cube: Cube, visibleCubes: Map<string, Cube>): void {
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

        // Validate dependencies exist (using the visible cubes + this cube)
        const tempCubes = new Map(visibleCubes)
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
      const tempCubes = new Map(visibleCubes)
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
  getCube(name: string, securityContext: SecurityContext): Cube | undefined {
    return this.resolveCubes(securityContext).get(name)
  }

  /**
   * Get all registered cubes
   */
  getAllCubes(securityContext: SecurityContext): Cube[] {
    return Array.from(this.resolveCubes(securityContext).values())
  }

  /**
   * Get all cubes as a Map for multi-cube queries.
   *
   * Returns the live merged view for this context — treat it as read-only.
   */
  getAllCubesMap(securityContext: SecurityContext): Map<string, Cube> {
    return this.resolveCubes(securityContext)
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
    const setId = this.resolveSetId(securityContext)
    return executor.execute(this.cubeSetId2Cubes(setId), query, securityContext, {
      ...options,
      cubeSetKey: this.cubeSetCacheKey(setId)
    })
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
    // Validate cube exists for this tenant
    const cube = this.resolveCubes(securityContext).get(cubeName)
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
  getMetadata(securityContext: SecurityContext): CubeMetadata[] {
    const setId = this.resolveSetId(securityContext)

    // Return cached metadata for this cube set if available
    const cached = this.metadataCache.get(setId)
    if (cached) {
      return cached
    }

    // Generate and cache metadata for this cube set
    const cubes = this.cubeSetId2Cubes(setId)
    const metadata = Array.from(cubes.values())
      .map(cube => this.generateCubeMetadata(cube, cubes))
    this.metadataCache.set(setId, metadata)

    return metadata
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
   * Generate cube metadata for API responses from cubes
   * Includes drill-down support: drillMembers on measures, granularities on time dimensions, hierarchies
   */
  private generateCubeMetadata(cube: Cube, cubes: Map<string, Cube>): CubeMetadata {
    const measures = buildMeasureMetadata(cube)
    const dimensions = buildDimensionMetadata(cube)
    const relationships = buildRelationshipMetadata(cube, cubes, c => this.getColumnName(c))
    const hierarchies = buildHierarchyMetadata(cube)

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
    const cube = this.getCube(cubeName, securityContext)
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
    const result = await executor.generateMultiCubeSQL(this.resolveCubes(securityContext), query, securityContext)
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
    const result = await executor.dryRunSQL(this.resolveCubes(securityContext), query, securityContext)
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
    return executor.explainQuery(this.resolveCubes(securityContext), query, securityContext, options)
  }

  /**
   * Check if a cube exists
   */
  hasCube(name: string, securityContext: SecurityContext): boolean {
    return this.resolveCubes(securityContext).has(name)
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
    const result = this.baseCubes.delete(name)
    if (result) {
      this.baseGeneration++
      this.rebuildAllMergedSets()
      this.invalidateMetadataCache()
    }
    return result
  }

  /**
   * Clear all cubes
   */
  clearCubes(): void {
    this.baseCubes.clear()
    this.baseGeneration++
    this.rebuildAllMergedSets()
    this.invalidateMetadataCache()
  }

  /**
   * Invalidate the metadata cache
   * Called whenever cubes are modified
   */
  private invalidateMetadataCache(): void {
    this.metadataCache.clear()
  }

  /** Cubes for an already-resolved set id. */
  private cubeSetId2Cubes(setId: string): Map<string, Cube> {
    if (setId === BASE_CUBE_SET_ID) return this.baseCubes
    return this.cubeSets.get(setId)?.merged ?? this.baseCubes
  }

  /**
   * Get cube names
   */
  getCubeNames(securityContext: SecurityContext): string[] {
    return Array.from(this.resolveCubes(securityContext).keys())
  }

  /**
   * Validate a query against registered cubes
   * Ensures all referenced cubes and fields exist
   */
  validateQuery(query: SemanticQuery, securityContext: SecurityContext): QueryValidationResult {
    return validateQueryAgainstCubes(this.resolveCubes(securityContext), query)
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
    return executor.analyzeQuery(this.resolveCubes(securityContext), query, securityContext)
  }
}
