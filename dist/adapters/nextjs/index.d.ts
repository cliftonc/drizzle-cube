import { NextRequest } from 'next/server';
import { SemanticQuery, SecurityContext, DatabaseExecutor, DrizzleDatabase, Cube, CacheConfig, RLSSetupFn } from '../../server/index.js';
import { AgentConfig } from '../../server/agent/types.js';
import { SemanticLayerCompiler } from '../../server/compiler.js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { MCPOptions } from '../utils.js';
export interface NextCorsOptions {
    /**
     * Allowed origins for CORS
     */
    origin?: string | string[] | ((origin: string) => boolean);
    /**
     * Allowed HTTP methods
     */
    methods?: string[];
    /**
     * Allowed headers
     */
    allowedHeaders?: string[];
    /**
     * Allow credentials
     */
    credentials?: boolean;
}
export interface NextAdapterOptions {
    /**
     * Array of cube definitions to register.
     * Required unless `semanticLayer` is provided — `createSemanticLayer` returns
     * an injected compiler untouched, so a caller managing their own (which
     * per-tenant cube sets require) supplies no cubes here.
     */
    cubes?: Cube[];
    /**
     * Drizzle database instance (REQUIRED)
     * This is the core of drizzle-cube - Drizzle ORM integration
     * Accepts PostgreSQL, MySQL, or SQLite database instances
     */
    drizzle: PostgresJsDatabase<any> | MySql2Database<any> | BetterSQLite3Database<any> | DrizzleDatabase;
    /**
     * Database schema for type inference (RECOMMENDED)
     * Provides full type safety for cube definitions
     */
    schema?: any;
    /**
     * Extract security context from incoming HTTP request.
     * Called for EVERY API request to determine user permissions and multi-tenant isolation.
     *
     * This is your security boundary - ensure proper authentication and authorization here.
     *
     * @param request - Next.js Request object containing the incoming HTTP request
     * @param context - Route context with params (optional)
     * @returns Security context with organisationId, userId, roles, etc.
     *
     * @example
     * extractSecurityContext: async (request, context) => {
     *   // Extract JWT from Authorization header
     *   const token = request.headers.get('Authorization')?.replace('Bearer ', '')
     *   const decoded = await verifyJWT(token)
     *
     *   // Return context that will be available in all cube SQL functions
     *   return {
     *     organisationId: decoded.orgId,
     *     userId: decoded.userId,
     *     roles: decoded.roles
     *   }
     * }
     */
    extractSecurityContext: (request: NextRequest, context?: RouteContext) => SecurityContext | Promise<SecurityContext>;
    /**
     * Database engine type (optional - auto-detected if not provided)
     */
    engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';
    /**
     * CORS configuration (optional)
     */
    cors?: NextCorsOptions;
    /**
     * Runtime environment (default: 'nodejs')
     * 'edge' for Edge Runtime, 'nodejs' for Node.js Runtime
     */
    runtime?: 'edge' | 'nodejs';
    /**
     * Cache configuration for query result caching
     * When provided, query results will be cached using the specified provider
     */
    cache?: CacheConfig;
    /**
     * MCP (AI-Ready) endpoint configuration
     * Enables AI agents to discover and query your data
     * @default { enabled: true }
     */
    mcp?: MCPOptions;
    /**
     * Agent configuration for the agentic AI notebook feature.
     * When provided, enables the POST /agent/chat SSE endpoint.
     * Requires `@anthropic-ai/sdk` as a peer dependency.
     */
    agent?: AgentConfig;
    /**
     * Row-Level Security setup function.
     * When provided, every query execution opens a transaction, calls this function
     * to configure RLS (e.g., set JWT claims and switch Postgres roles), then runs the query.
     */
    rlsSetup?: RLSSetupFn;
    /**
     * Pre-built semantic layer to reuse across handlers.
     * When provided, the adapter reuses this compiler instead of constructing a
     * new one (and skips cube registration — register cubes on it yourself).
     * `createCubeHandlers` sets this internally so every handler it returns shares
     * one compiler, keeping metadata/result caches consistent. Mirrors the Hono
     * adapter's `semanticLayer` option.
     */
    semanticLayer?: SemanticLayerCompiler;
}
export interface RouteContext {
    params?: Record<string, string | string[]>;
}
export type RouteHandler = (request: NextRequest, context?: RouteContext) => Promise<Response>;
export interface CubeHandlers {
    load: RouteHandler;
    meta: RouteHandler;
    sql: RouteHandler;
    dryRun: RouteHandler;
    batch: RouteHandler;
    explain: RouteHandler;
    mcpRpc?: RouteHandler;
    agentChat?: RouteHandler;
}
/**
 * Create OPTIONS handler for CORS preflight requests
 */
export declare function createOptionsHandler(corsOptions: NextCorsOptions): RouteHandler;
/**
 * Create load handler - Execute queries (GET + POST via the core)
 */
export declare function createLoadHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create meta handler - Get cube metadata
 */
export declare function createMetaHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create SQL handler - Generate SQL without execution (GET + POST via the core)
 */
export declare function createSqlHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create dry-run handler - Validate queries without execution (GET + POST via the core)
 */
export declare function createDryRunHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create batch handler - Execute multiple queries in a single request (POST via the core)
 */
export declare function createBatchHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create explain handler - Get execution plan for a query (POST via the core)
 */
export declare function createExplainHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create discover handler - Find relevant cubes based on topic/intent
 */
export declare function createDiscoverHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create suggest handler - Generate query from natural language
 */
export declare function createSuggestHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create validate handler - Validate query with helpful corrections
 */
export declare function createValidateHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create MCP load handler - Execute a query and return results
 * Completes the AI workflow: discover → suggest → validate → load
 */
export declare function createMcpLoadHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create MCP Streamable HTTP handler (JSON-RPC 2.0 + optional SSE)
 * Implements MCP 2025-11-25 spec. POST is dispatched via the core; the GET
 * streaming connection and DELETE lifecycle stay inline (transport-bound).
 */
export declare function createMcpRpcHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Create agent chat handler - Agentic AI notebook chat
 * Streams SSE events as the agent discovers data, executes queries,
 * and creates visualizations. Inherently transport-bound, so it stays inline.
 */
export declare function createAgentChatHandler(options: NextAdapterOptions): RouteHandler;
/**
 * Convenience function to create all route handlers
 *
 * @example
 * const handlers = createCubeHandlers({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (request, context) => {
 *     const token = request.headers.get('Authorization')?.replace('Bearer ', '')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 *
 * // Use in your API routes:
 * export const GET = handlers.load
 * export const POST = handlers.load
 */
export declare function createCubeHandlers(options: NextAdapterOptions): CubeHandlers;
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase, NextCorsOptions as CorsOptions };
