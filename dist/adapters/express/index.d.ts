import { Router, Request, Response, Express } from 'express';
import { CorsOptions } from 'cors';
import { SemanticQuery, SecurityContext, DatabaseExecutor, DrizzleDatabase, Cube, CacheConfig, RLSSetupFn } from '../../server/index.js';
import { AgentConfig } from '../../server/agent/types.js';
import { SemanticLayerCompiler } from '../../server/compiler.js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { MCPOptions } from '../utils.js';
export interface ExpressAdapterOptions {
    /**
     * Pre-configured SemanticLayerCompiler instance.
     * When provided, skips creating a new compiler and cube registration (caller
     * manages it). Required to use per-tenant cube sets, since the caller must own
     * the compiler to call `registerCubeSet` — see docs/per-tenant-cube-sets.md.
     */
    semanticLayer?: SemanticLayerCompiler;
    /**
     * Array of cube definitions to register.
     * Required unless `semanticLayer` is provided.
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
     * @param req - Express Request object containing the incoming HTTP request
     * @param res - Express Response object
     * @returns Security context with organisationId, userId, roles, etc.
     *
     * @example
     * extractSecurityContext: async (req, res) => {
     *   // Extract JWT from Authorization header
     *   const token = req.headers.authorization?.replace('Bearer ', '')
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
    extractSecurityContext: (req: Request, res: Response) => SecurityContext | Promise<SecurityContext>;
    /**
     * Database engine type (optional - auto-detected if not provided)
     */
    engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';
    /**
     * CORS configuration (optional)
     */
    cors?: CorsOptions;
    /**
     * API base path (default: '/cubejs-api/v1')
     */
    basePath?: string;
    /**
     * JSON body parser limit (default: '10mb')
     */
    jsonLimit?: string;
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
 * Create Express router for Cube.js-compatible API
 */
export declare function createCubeRouter(options: ExpressAdapterOptions): Router;
/**
 * Convenience function to mount Cube routes on an existing Express app
 */
export declare function mountCubeRoutes(app: Express, options: ExpressAdapterOptions): Express;
/**
 * Create a complete Express app with Cube.js routes
 *
 * @example
 * const app = createCubeApp({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (req, res) => {
 *     const token = req.headers.authorization?.replace('Bearer ', '')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 */
export declare function createCubeApp(options: ExpressAdapterOptions): Express;
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase, CorsOptions };
