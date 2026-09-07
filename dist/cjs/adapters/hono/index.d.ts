import { Hono } from 'hono';
import { SemanticQuery, SecurityContext, DatabaseExecutor, DrizzleDatabase, Cube, CacheConfig, RLSSetupFn } from '../../server/index.js';
import { AgentConfig } from '../../server/agent/types.js';
import { SemanticLayerCompiler } from '../../server/compiler.js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { MCPOptions } from '../utils.js';
export interface HonoAdapterOptions {
    /**
     * Array of cube definitions to register.
     * Optional when `semanticLayer` is provided (caller manages registration).
     */
    cubes?: Cube[];
    /**
     * Pre-configured SemanticLayerCompiler instance.
     * When provided, skips creating a new compiler and cube registration (caller manages it).
     */
    semanticLayer?: SemanticLayerCompiler;
    /**
     * Drizzle database instance.
     * Required unless `semanticLayer` is provided.
     * Accepts PostgreSQL, MySQL, or SQLite database instances.
     */
    drizzle?: PostgresJsDatabase<any> | MySql2Database<any> | BetterSQLite3Database<any> | DrizzleDatabase;
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
     * @param c - Hono context containing the incoming HTTP request
     * @returns Security context with organisationId, userId, roles, etc.
     *
     * @example
     * extractSecurityContext: async (c) => {
     *   // Extract JWT from Authorization header
     *   const token = c.req.header('Authorization')?.replace('Bearer ', '')
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
    extractSecurityContext: (c: any) => SecurityContext | Promise<SecurityContext>;
    /**
     * Database engine type (optional - auto-detected if not provided)
     */
    engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';
    /**
     * CORS configuration (optional)
     */
    cors?: {
        origin?: string | string[] | ((origin: string, c: any) => string | null | undefined);
        allowMethods?: string[];
        allowHeaders?: string[];
        credentials?: boolean;
    };
    /**
     * API base path (default: '/cubejs-api/v1')
     */
    basePath?: string;
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
}
/**
 * Create Hono routes for Cube.js-compatible API
 */
export declare function createCubeRoutes(options: HonoAdapterOptions): Hono<import('hono/types').BlankEnv, import('hono/types').BlankSchema, "/">;
/**
 * Convenience function to create routes and mount them on an existing Hono app
 */
export declare function mountCubeRoutes(app: Hono, options: HonoAdapterOptions): Hono<import('hono/types').BlankEnv, import('hono/types').BlankSchema, "/">;
/**
 * Create a complete Hono app with Cube.js routes
 *
 * @example
 * const app = createCubeApp({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (c) => {
 *     const token = c.req.header('Authorization')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 */
export declare function createCubeApp(options: HonoAdapterOptions): Hono<import('hono/types').BlankEnv, import('hono/types').BlankSchema, "/">;
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase };
