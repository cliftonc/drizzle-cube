import { SQL, AnyColumn } from 'drizzle-orm';
import { Cube, CubeJoin, Dimension, QueryContext, MultiCubeQueryContext, SqlExpression } from './types/index.js';
/**
 * Resolve cube reference (handles direct, lazy, and string name references)
 *
 * String references are resolved from the optional `cubes` registry map.
 * Returns `null` when a string ref cannot be resolved (logs a warning).
 */
export declare function resolveCubeReference(ref: Cube | (() => Cube) | string, cubes?: Map<string, Cube>): Cube | null;
/**
 * Reverse a semantic relationship type for bidirectional join path resolution.
 * When traversing a join edge in reverse (target→source instead of source→target),
 * the relationship semantics flip: belongsTo↔hasMany, hasOne stays hasOne,
 * belongsToMany stays belongsToMany (symmetric).
 */
export declare function reverseRelationship(relationship: string): string;
/**
 * Derive SQL join type from semantic relationship
 */
export declare function getJoinType(relationship: string, override?: string): string;
/**
 * DRIZZLE ORM LIMITATION: SQL Object Mutation Protection
 *
 * Create an isolated copy of a SQL expression to prevent mutation issues
 * when the expression will be reused across multiple query contexts.
 *
 * ## Background
 *
 * Drizzle SQL objects are mutable - their internal `queryChunks` array can be
 * modified during query construction. When column objects (like employees.id)
 * are reused across multiple parts of a query (SELECT, WHERE, GROUP BY), this
 * mutation can cause:
 * - Duplicate SQL fragments in generated queries
 * - Incorrect parameter binding order
 * - Query execution failures
 *
 * ## Evidence from Drizzle Source Code
 *
 * Investigation of Drizzle ORM source code (/tmp/drizzle-orm/drizzle-orm/src/sql/sql.ts)
 * revealed:
 *
 * 1. SQL objects have a mutable `queryChunks` array (line 133)
 * 2. The `append()` method directly mutates this array
 * 3. No public `clone()` method exists (only internal SQL.Aliased.clone())
 * 4. The `sql` template function creates NEW arrays but chunks are pushed by reference
 *
 * ## The Double Wrapping Pattern
 *
 * `sql`${sql`${expr}`}`` creates two layers of SQL isolation:
 *
 * **Single wrap** (`sql`${expr}``):
 * - Creates a new SQL object
 * - But queryChunks contains REFERENCES to original objects
 * - Original objects can still be mutated
 *
 * **Double wrap** (`sql`${sql`${expr}`}``):
 * - Inner wrap: Creates fresh SQL from original expression
 * - Outer wrap: Creates complete isolation from shared state
 * - When Drizzle processes nested SQL, it recursively builds from inner chunks
 * - This prevents corruption when SQL expressions are reused
 *
 * ## When to Use
 *
 * - **resolveSqlExpression()**: ALWAYS (expressions may be reused)
 * - **buildMeasureExpression()**: ALWAYS (after resolveSqlExpression)
 * - **New aggregations**: Single wrap OK (creating fresh SQL for first time)
 *
 * ## Alternatives Investigated
 *
 * - ❌ Use Drizzle's clone() - Doesn't exist publicly
 * - ❌ Store SQL factory functions - Still returns same column objects
 * - ❌ Create fresh column references - Impossible, columns are singletons
 * - ❌ Avoid SQL reuse - Unavoidable (same dimension in SELECT, WHERE, GROUP BY)
 *
 * ## Performance Impact
 *
 * - Memory: ~200 bytes per wrap (negligible)
 * - CPU: Two function calls during query building (microseconds)
 * - No runtime query performance impact
 *
 * @param expr - SQL expression that may be reused across query contexts
 * @returns Isolated SQL expression safe for reuse
 */
export declare function isolateSqlExpression(expr: AnyColumn | SQL): SQL;
/**
 * Sanitize a property key to prevent prototype pollution.
 * Keys in this codebase come from validated cube field names (e.g., "Cube.measure")
 * but CodeQL cannot trace that validation across module boundaries.
 */
export declare function safeKey(key: string): string;
/**
 * Helper to resolve SQL expressions with mutation protection
 *
 * Evaluates function-based SQL expressions and applies isolation to prevent
 * Drizzle's internal mutation from corrupting reused SQL objects.
 *
 * @param expr - Column, SQL object, or function that returns one
 * @param ctx - Query context for function evaluation
 * @returns Isolated SQL expression safe for reuse
 */
export declare function resolveSqlExpression(expr: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL), ctx: QueryContext): AnyColumn | SQL;
/**
 * Resolve a dimension's SQL expression for use in a filter condition.
 *
 * For non-time dimensions, use the raw column so Drizzle preserves column type
 * metadata for proper parameter binding (e.g. UUID columns need type info) — this
 * deliberately bypasses isolateSqlExpression. For time dimensions, keep isolated
 * SQL because normalizeDate() returns strings.
 *
 * Centralises the filter-field resolution that was previously copy-pasted across
 * the filter builder, executor, and funnel/flow/retention builders.
 */
export declare function resolveFilterFieldExpr(dimension: Dimension, ctx: QueryContext): AnyColumn | SQL;
/**
 * Helper to create multi-cube query context
 */
export declare function createMultiCubeContext(baseContext: QueryContext, cubes: Map<string, Cube>, currentCube: Cube): MultiCubeQueryContext;
/**
 * Type guard to check if value is a function-based SQL expression
 */
export declare function isFunctionSqlExpression(expr: SqlExpression): expr is (ctx: QueryContext) => AnyColumn | SQL;
/**
 * Helper function to create cubes
 */
export declare function defineCube(name: string, definition: Omit<Cube, 'name'>): Cube;
/**
 * Build the Drizzle join condition for a regular (belongsTo/hasOne/hasMany)
 * join from its symbolic CubeJoin definition. Columns are isolated to prevent
 * Drizzle's mutable queryChunks from corrupting reused expressions. The
 * condition is symmetric, so it is correct for reversed joins as-is.
 *
 * This is the materialization counterpart used by DrizzlePlanBuilder; it
 * mirrors JoinPathResolver.buildJoinCondition(joinDef, null, null).
 */
export declare function buildRegularJoinCondition(joinDef: CubeJoin): SQL;
/**
 * Expanded join information for belongsToMany relationships
 */
export interface ExpandedBelongsToManyJoin {
    /** Junction table joins */
    junctionJoins: Array<{
        joinType: 'inner' | 'left' | 'right' | 'full';
        table: any;
        condition: SQL;
    }>;
}
/**
 * Expand a belongsToMany join into junction table joins
 * This converts a many-to-many relationship into two separate joins:
 * 1. Source cube -> Junction table
 * 2. Junction table -> Target cube
 *
 * Junction-table security is intentionally NOT materialized here: it must be
 * applied (in the WHERE clause) at physical-build time from the stored
 * `through.securitySql` function with the request's security context, so the
 * join conditions here are a pure function of the join definition.
 */
export declare function expandBelongsToManyJoin(joinDef: CubeJoin): ExpandedBelongsToManyJoin;
