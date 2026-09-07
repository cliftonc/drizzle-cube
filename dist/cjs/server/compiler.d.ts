import { SemanticQuery, QueryResult, SecurityContext, DatabaseExecutor, CubeMetadata, Cube, QueryAnalysis, CacheConfig, ExplainOptions, ExplainResult, ExecutionOptions, RLSSetupFn } from './types/index.js';
import { QueryValidationResult } from './query-validator.js';
import { PlanOptimiser } from './logical-plan/index.js';
export { validateQueryAgainstCubes } from './query-validator.js';
export type { QueryValidationIssue, QueryValidationResult } from './query-validator.js';
/**
 * Identifier of the base cube set — the cubes registered with {@link
 * SemanticLayerCompiler.registerCube}, shared by every tenant. The empty string
 * is used so a set id can never collide with it (`registerCubeSet` rejects it).
 */
export declare const BASE_CUBE_SET_ID = "";
/**
 * Security context for deployments with no tenancy at all.
 *
 * Every cube-resolving method requires a `SecurityContext` so that omitting one
 * is a compile error rather than a silent fall back to the wrong tenant's
 * cubes. Single-tenant callers pass this constant to say "no tenancy here" out
 * loud, instead of an anonymous `{}` that reads like an oversight.
 */
export declare const SINGLE_TENANT_CONTEXT: SecurityContext;
/** Reported to `onCubeSetRegistered` after each {@link SemanticLayerCompiler.registerCubeSet}. */
export interface CubeSetRegistrationInfo {
    /** The set that was registered. */
    setId: string;
    /** Cubes in the set after merging over the base set. */
    cubeCount: number;
    /** Total dimensions across those cubes — the number that explains a slow boot. */
    dimensionCount: number;
    /**
     * Monotonic across the whole compiler — incremented on every registration of
     * any set, never reset. Part of the cache key, so results computed from
     * superseded definitions can never be served.
     */
    generation: number;
    /** Wall-clock cost of this registration. */
    durationMs: number;
}
/** Aggregate registration cost, for a single summary line after the boot loop. */
export interface CubeSetStats {
    /** Number of registered sets, excluding the base set. */
    setCount: number;
    /** Total cubes across all sets (merged), excluding the base set. */
    cubeCount: number;
    /** Sum of every set's most recent registration time. */
    totalRegistrationMs: number;
    /** The most expensive set to register, if any sets are registered. */
    slowestSet?: {
        setId: string;
        durationMs: number;
    };
}
export declare class SemanticLayerCompiler {
    /** Cubes shared by every tenant. */
    private baseCubes;
    /** Per-tenant overlays, keyed by cube-set id. */
    private cubeSets;
    /** Generated metadata per cube set (`BASE_CUBE_SET_ID` for the base set). */
    private metadataCache;
    /** Bumped on every base-set mutation; part of every set's cache key. */
    private baseGeneration;
    /**
     * Monotonic registration counter, never reset. Used as each set's generation
     * so that unregistering a set and registering a different one under the same
     * id cannot reproduce an earlier cache key and serve its stale results.
     */
    private registrationCounter;
    private contextToCubeSetId?;
    private missingCubeSet;
    private onCubeSetRegistered?;
    private cacheConfig?;
    private rlsSetup?;
    private planOptimiser?;
    private db?;
    private schema?;
    private engineType?;
    constructor(options?: {
        drizzle?: DatabaseExecutor['db'];
        schema?: any;
        databaseExecutor?: DatabaseExecutor;
        engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';
        /** Cache configuration for query result caching */
        cache?: CacheConfig;
        /**
         * Row-Level Security setup function.
         * When provided, every query execution opens a transaction, calls this function
         * to configure RLS (e.g., set JWT claims and switch roles), then runs the query.
         * Dry-run/SQL generation is NOT wrapped in a transaction.
         */
        rlsSetup?: RLSSetupFn;
        /**
         * Optional logical-plan optimiser injected into every QueryExecutor.
         * Defaults to a no-op IdentityOptimiser when omitted.
         */
        planOptimiser?: PlanOptimiser;
        /**
         * Maps a security context to the cube set that serves it — drizzle-cube's
         * equivalent of Cube's `contextToAppId`. Return `undefined` (or omit this
         * option entirely) to serve the base set, which is the single-tenant
         * behaviour and the default.
         */
        contextToCubeSetId?: (securityContext: SecurityContext) => string | number | undefined;
        /**
         * What to do when `contextToCubeSetId` names a set that is not registered.
         * `'base'` (default) serves the base set; `'throw'` fails the request, for
         * deployments where every tenant is required to have its own set.
         */
        missingCubeSet?: 'base' | 'throw';
        /**
         * Called after each `registerCubeSet` with its cost. Registering a set per
         * tenant is real startup work, so it is reported rather than hidden; emit
         * it to your own logger or metrics.
         */
        onCubeSetRegistered?: (info: CubeSetRegistrationInfo) => void;
    });
    /**
     * Set or update the database connection
     */
    setDatabaseExecutor(executor: DatabaseExecutor): void;
    /**
     * Get the database engine type for SQL formatting
     */
    getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake' | undefined;
    /**
     * Set Drizzle instance and schema directly
     */
    setDrizzle(db: DatabaseExecutor['db'], schema?: any, engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'): void;
    /**
     * Check if database executor is configured
     */
    hasExecutor(): boolean;
    /**
     * Create a fresh DatabaseExecutor from stored ingredients, or throw.
     */
    private createDbExecutor;
    /**
     * Create a query executor with optional cache integration.
     * Each call creates a fresh DatabaseExecutor so concurrent requests
     * never share mutable state.
     */
    private createQueryExecutor;
    /**
     * Format SQL result using current engine dialect.
     */
    private formatSqlResult;
    /**
     * Register a simplified cube with dynamic query building
     * Validates calculated measures during registration
     */
    registerCube(cube: Cube): void;
    /**
     * Register the cubes that serve one tenant, overlaying the base set.
     *
     * Cubes are matched to the base set by name, so a set can either add cubes or
     * replace a base cube with a tenant-specific version (the usual case for
     * generated per-tenant dimensions). Call once per tenant at application boot;
     * calling again for the same id replaces that set and invalidates its cached
     * metadata and query results.
     */
    registerCubeSet(setId: string, cubes: Cube[]): void;
    /**
     * Remove a tenant's cube set. That tenant then resolves to the base set (or
     * throws, under `missingCubeSet: 'throw'`).
     * Returns true if the set existed.
     */
    unregisterCubeSet(setId: string): boolean;
    /** Whether a cube set is registered for this id. */
    hasCubeSet(setId: string): boolean;
    /** Ids of every registered cube set, excluding the base set. */
    getCubeSetIds(): string[];
    /**
     * Aggregate registration cost across all sets — for the single summary line
     * worth logging after a boot loop.
     */
    getCubeSetStats(): CubeSetStats;
    /**
     * Validate and enrich a cube ahead of registration, against the cubes that
     * will be visible alongside it.
     */
    private prepareCube;
    /** Base cubes with an overlay applied over them, by cube name. */
    private mergeWithBase;
    /** Recompute every set's merged view — after any base-set mutation. */
    private rebuildAllMergedSets;
    /**
     * Resolve the cube set serving this security context.
     *
     * Returns {@link BASE_CUBE_SET_ID} when no mapping is configured or the
     * mapping yields nothing. A configured id that has no registered set falls
     * back to the base set, or throws under `missingCubeSet: 'throw'`.
     */
    private resolveSetId;
    /**
     * The cubes this security context may see.
     *
     * This is the only path by which cube *contents* are read for a query,
     * metadata, validation or MCP response — so no such path can reach a cube
     * list without a security context. The returned map must be treated as
     * read-only; it is the live merged view, not a copy.
     */
    private resolveCubes;
    /**
     * Cache-key component identifying which cube definitions produced a result.
     *
     * Appended unconditionally to every query cache key: the security-context
     * hash is not enough, because `includeSecurityContext: false` and a custom
     * `securityContextSerializer` can both hash two tenants identically. The
     * generation makes re-registering a set invalidate its cached results, so a
     * retyped or renamed dimension cannot be served stale for the TTL.
     */
    private cubeSetCacheKey;
    /**
     * Validate that all string-based cube references in joins resolve to registered cubes.
     * Call after all cubes are registered for strict startup validation.
     * Throws an error listing all unresolved references.
     */
    validateCubeReferences(): void;
    /** Join targets naming a cube that is absent from the given cube scope. */
    private unresolvedJoinRefs;
    /**
     * Validate calculated measures in a cube
     * Checks template syntax, dependency existence, and circular dependencies
     */
    private validateCalculatedMeasures;
    /**
     * Get a cube by name
     */
    getCube(name: string, securityContext: SecurityContext): Cube | undefined;
    /**
     * Get all registered cubes
     */
    getAllCubes(securityContext: SecurityContext): Cube[];
    /**
     * Get all cubes as a Map for multi-cube queries.
     *
     * Returns the live merged view for this context — treat it as read-only.
     */
    getAllCubesMap(securityContext: SecurityContext): Map<string, Cube>;
    /**
     * Unified query execution method that handles both single and multi-cube queries
     * @param options.skipCache - Skip cache lookup (but still cache the fresh result)
     */
    execute(query: SemanticQuery, securityContext: SecurityContext, options?: ExecutionOptions): Promise<QueryResult>;
    /**
     * Execute a multi-cube query
     * @param options.skipCache - Skip cache lookup (but still cache the fresh result)
     */
    executeMultiCubeQuery(query: SemanticQuery, securityContext: SecurityContext, options?: ExecutionOptions): Promise<QueryResult>;
    /**
     * Execute a single cube query
     */
    executeQuery(cubeName: string, query: SemanticQuery, securityContext: SecurityContext): Promise<QueryResult>;
    /**
     * Get metadata for all cubes (for API responses)
     * Uses caching to improve performance for repeated requests
     * Cache is invalidated when cubes are modified (registerCube, removeCube, clearCubes)
     */
    getMetadata(securityContext: SecurityContext): CubeMetadata[];
    /**
     * Extract column name from Drizzle column reference
     * Handles different column types and extracts the actual column name
     */
    private getColumnName;
    /**
     * Generate cube metadata for API responses from cubes
     * Includes drill-down support: drillMembers on measures, granularities on time dimensions, hierarchies
     */
    private generateCubeMetadata;
    /**
     * Get SQL for a query without executing it (debugging)
     */
    generateSQL(cubeName: string, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Get SQL for a multi-cube query without executing it (debugging)
     */
    generateMultiCubeSQL(query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Canonical dry-run SQL generation entrypoint for all query modes.
     */
    dryRun(query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Get SQL for a funnel query without executing it (debugging)
     * Returns the actual CTE-based SQL that would be executed for funnel queries
     */
    dryRunFunnel(query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Get SQL for a flow query without executing it (debugging)
     * Returns the actual CTE-based SQL that would be executed for flow queries
     */
    dryRunFlow(query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generate SQL for a retention query without execution (dry-run)
     * Returns the CTE-based SQL that would be executed for retention analysis
     */
    dryRunRetention(query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Execute EXPLAIN on a query to get the execution plan
     * Uses the same secure path as execute/dryRun to generate SQL,
     * then runs database EXPLAIN on it.
     */
    explainQuery(query: SemanticQuery, securityContext: SecurityContext, options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Check if a cube exists
     */
    hasCube(name: string, securityContext: SecurityContext): boolean;
    /**
     * Unregister a cube by name.
     * Returns true if the cube existed and was removed, false if not found.
     */
    unregisterCube(name: string): boolean;
    /**
     * Remove a cube
     */
    removeCube(name: string): boolean;
    /**
     * Clear all cubes
     */
    clearCubes(): void;
    /**
     * Invalidate the metadata cache
     * Called whenever cubes are modified
     */
    private invalidateMetadataCache;
    /** Cubes for an already-resolved set id. */
    private cubeSetId2Cubes;
    /**
     * Get cube names
     */
    getCubeNames(securityContext: SecurityContext): string[];
    /**
     * Validate a query against registered cubes
     * Ensures all referenced cubes and fields exist
     */
    validateQuery(query: SemanticQuery, securityContext: SecurityContext): QueryValidationResult;
    /**
     * Analyze query planning decisions for debugging and transparency
     * Returns detailed metadata about how the query would be planned
     * Used by the playground UI to help users understand query structure
     */
    analyzeQuery(query: SemanticQuery, securityContext: SecurityContext): QueryAnalysis;
}
