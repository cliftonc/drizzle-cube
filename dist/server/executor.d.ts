import { SecurityContext, SemanticQuery, QueryResult, DatabaseExecutor, Cube, CacheConfig, ExplainOptions, ExplainResult, ExecutionOptions, QueryAnalysis, RLSSetupFn } from './types/index.js';
import { PlanOptimiser } from './logical-plan/index.js';
export declare class QueryExecutor {
    private dbExecutor;
    private queryBuilder;
    private drizzlePlanBuilder;
    private databaseAdapter;
    private comparisonQueryBuilder;
    private funnelQueryBuilder;
    private flowQueryBuilder;
    private retentionQueryBuilder;
    private logicalPlanBuilder;
    private planOptimiser;
    private modeRouter;
    private resultCache;
    private filterCachePreloader;
    private rlsSetup?;
    constructor(dbExecutor: DatabaseExecutor, cacheConfig?: CacheConfig, rlsSetup?: RLSSetupFn, planOptimiser?: PlanOptimiser);
    /**
     * Execute a function within a RLS-configured transaction context.
     * If no rlsSetup function is configured, the function is called directly.
     * Otherwise, opens a transaction, calls rlsSetup to configure RLS, then
     * runs fn with this.dbExecutor replaced by a transaction-scoped executor.
     *
     * Concurrency-safe: the dbExecutor is per-request (created fresh by
     * SemanticLayerCompiler.createQueryExecutor), so reassigning this.dbExecutor
     * only affects this request.
     */
    private withRLSContext;
    /**
     * Unified query execution method that handles both single and multi-cube queries
     * @param options.skipCache - Skip cache lookup (but still cache the fresh result)
     */
    execute(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext, options?: ExecutionOptions): Promise<QueryResult>;
    /**
     * Build a logical plan for a query without executing it.
     * Useful for testing, debugging, and plan inspection.
     */
    buildLogicalPlan(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): import('./logical-plan/index.js').QueryNode;
    /**
     * Analyze planning decisions for a regular query using the same logical
     * planning path as execution and dry-run SQL generation.
     */
    analyzeQuery(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): QueryAnalysis;
    /**
     * Legacy interface for single cube queries
     */
    executeQuery(cube: Cube, query: SemanticQuery, securityContext: SecurityContext): Promise<QueryResult>;
    /**
     * Execute a comparison query with caching support
     * Wraps executeComparisonQuery with cache set logic
     */
    private executeComparisonQueryWithCache;
    /**
     * Execute a comparison query with multiple date periods
     * Expands compareDateRange into multiple sub-queries and merges results
     */
    private executeComparisonQuery;
    private buildComparisonExecutionPlan;
    /**
     * Execute an analysis query (funnel/flow/retention) with caching support.
     * Wraps the inner execute callback with cache-set logic; the three analysis
     * modes share identical wrapper behaviour, differing only in which inner
     * execute method they invoke.
     *
     * Cache metadata is intentionally NOT attached here: fresh results across all
     * query modes (regular, comparison, and analysis) uniformly carry no `cache`
     * field — only cache *hits* (handled in execute()) carry cache metadata.
     */
    private executeAnalysisQueryWithCache;
    /**
     * Execute a funnel analysis query
     */
    private executeFunnelQuery;
    /**
     * Execute a flow analysis query
     * Produces Sankey diagram data (nodes and links)
     */
    private executeFlowQuery;
    /**
     * Execute a retention analysis query
     * Calculates cohort-based retention rates
     */
    private executeRetentionQuery;
    /**
     * Standard (regular/non-comparison) query execution.
     *
     * This is the single core execution path used by both the regular query mode
     * and comparison-mode period sub-queries. It always runs the dev-time
     * security-context validation and propagates planner warnings; the optional
     * `cacheKey` controls whether the fresh result is written to the cache.
     *
     * @param cacheKey - When provided (and a cache provider is configured), the
     *   fresh result is written to the cache. Pass `undefined` to skip caching
     *   (e.g. comparison period sub-queries cache at the comparison level).
     */
    private executeStandardQuery;
    /**
     * Count the rows the query would return with no limit or offset — Cube's
     * `total`.
     *
     * Rebuilds the *same* physical plan with pagination and ordering stripped and
     * counts over it as a subquery. The wrapper is what makes a grouped query
     * count groups rather than base rows, and rebuilding from `planQuery` rather
     * than reading the paginated query's effective values matters because
     * `applyLimitAndOffset` injects a default limit when an offset arrives
     * without one.
     *
     * Runs inside the caller's RLS context, so the count sees exactly the rows
     * the page did.
     */
    private executeTotalCount;
    /**
     * Create a query context with optional filter cache.
     */
    private createQueryContext;
    /**
     * Resolve the real database engine type for optimiser passes.
     * Returns the true engine for all 7 supported engines (no collapsing);
     * passes decide for themselves whether to treat e.g. SingleStore like MySQL.
     */
    private getOptimiserEngineType;
    /**
     * Shared regular-query planning pipeline used by execute, dry-run SQL,
     * and analysis. This is the single source of planning truth.
     */
    private buildRegularQueryArtifacts;
    /**
     * Validate that all cubes in the query plan have proper security filtering.
     * Emits a warning if a cube's sql() function doesn't return a WHERE clause.
     *
     * Security is critical in multi-tenant applications - this validation helps
     * detect cubes that may leak data across tenants.
     */
    private validateSecurityContext;
    /**
     * Generate raw SQL for debugging (without execution) - unified approach
     */
    generateSQL(cube: Cube, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generate raw SQL for multi-cube queries without execution - unified approach
     */
    generateMultiCubeSQL(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generate SQL for a funnel query without execution (dry-run)
     * Returns the actual CTE-based SQL that would be executed
     */
    dryRunFunnel(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generate SQL for a flow query without execution (dry-run)
     * Returns the actual CTE-based SQL that would be executed
     */
    dryRunFlow(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generate SQL for a retention query without execution (dry-run)
     * Returns the actual CTE-based SQL that would be executed
     */
    dryRunRetention(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generic dry-run SQL generator for analysis modes (funnel/flow/retention).
     * The three modes share an identical shape (mode guard → config validation →
     * build query → toSQL()), differing only in which builder/config they use.
     */
    private dryRunAnalysis;
    /**
     * Execute EXPLAIN on a query to get the execution plan
     * Generates the SQL using the same secure path as execute/generateSQL,
     * then runs EXPLAIN on the database.
     */
    explainQuery(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext, options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Generate SQL for any query mode without execution.
     * This is the canonical dry-run SQL entrypoint used by explain/adapters.
     */
    dryRunSQL(cubes: Map<string, Cube>, query: SemanticQuery, securityContext: SecurityContext): Promise<{
        sql: string;
        params?: any[];
    }>;
    /**
     * Generate SQL using unified approach (works for both single and multi-cube)
     */
    private generateUnifiedSQL;
    private executeQueryByModeWithCache;
    private generateSqlForMode;
    private generateComparisonSQL;
}
