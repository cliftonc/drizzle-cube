import { SemanticLayerCompiler, SemanticQuery, SecurityContext, QuerySuggestion, AIValidationResult, QueryValidationIssue } from '../server/index.js';
import { normalizeQueryFields } from '../server/query-handlers.js';
import { MCPPromptResolver, MCPResourceResolver, MCPInstructionsResolver } from './mcp-transport.js';
export { handleDiscover, handleLoad } from '../server/query-handlers.js';
export type { DiscoverRequest, LoadRequest, DiscoverResponse } from '../server/query-handlers.js';
export { formatSqlString } from '../server/sql-format.js';
export { normalizeQueryFields };
/**
 * Calculate query complexity based on query structure
 */
export declare function calculateQueryComplexity(query: SemanticQuery): string;
/**
 * Generate a unique request ID
 */
export declare function generateRequestId(): string;
/**
 * Build transformed query metadata for Cube.js compatibility
 */
export declare function buildTransformedQuery(query: SemanticQuery): any;
/**
 * Get database type from semantic layer
 */
export declare function getDatabaseType(semanticLayer: SemanticLayerCompiler): string;
/**
 * Helper function to handle dry-run logic for all adapters
 */
export declare function handleDryRun(query: SemanticQuery, securityContext: SecurityContext, semanticLayer: SemanticLayerCompiler): Promise<any>;
/**
 * Format standard Cube.js API response
 */
export declare function formatCubeResponse(query: SemanticQuery, result: {
    data: any[];
    annotation?: any;
    cache?: {
        hit: boolean;
        cachedAt?: string;
        ttlMs?: number;
        ttlRemainingMs?: number;
    };
    warnings?: Array<{
        code: string;
        message: string;
        severity: string;
        cubes?: string[];
        measures?: string[];
        suggestion?: string;
    }>;
    total?: number;
}, semanticLayer: SemanticLayerCompiler): {
    queryType: string;
    results: {
        total?: number | undefined;
        warnings?: {
            code: string;
            message: string;
            severity: string;
            cubes?: string[];
            measures?: string[];
            suggestion?: string;
        }[] | undefined;
        cache?: {
            hit: boolean;
            cachedAt?: string;
            ttlMs?: number;
            ttlRemainingMs?: number;
        } | undefined;
        query: SemanticQuery;
        lastRefreshTime: string;
        usedPreAggregations: {};
        transformedQuery: any;
        requestId: string;
        annotation: any;
        dataSource: string;
        dbType: string;
        extDbType: string;
        external: boolean;
        slowQuery: boolean;
        data: any[];
    }[];
    pivotQuery: {
        queryType: string;
        measures?: string[];
        dimensions?: string[];
        filters?: Array<import('../server/index.js').Filter>;
        timeDimensions?: Array<import('../server/index.js').TimeDimension>;
        limit?: number;
        offset?: number;
        order?: Record<string, "asc" | "desc">;
        fillMissingDatesValue?: number | null;
        ungrouped?: boolean;
        total?: boolean;
        funnel?: import('../server/index.js').FunnelQueryConfig;
        flow?: import('../server/types/flow.js').FlowQueryConfig;
        retention?: import('../server/index.js').RetentionQueryConfig;
    };
    slowQuery: boolean;
};
/**
 * Format SQL generation response
 */
export declare function formatSqlResponse(query: SemanticQuery, sqlResult: {
    sql: string;
    params?: any[];
}): {
    sql: string;
    params: any[];
    query: SemanticQuery;
};
/**
 * Format metadata response with query guidance for AI consumers
 */
export declare function formatMetaResponse(metadata: any): {
    cubes: any;
    queryGuidance: {
        dateHandling: {
            critical: string;
            forAggregatedTotals: {
                description: string;
                example: {
                    filters: {
                        member: string;
                        operator: string;
                        values: string[];
                    }[];
                };
                useCase: string;
            };
            forTimeSeries: {
                description: string;
                example: {
                    timeDimensions: {
                        dimension: string;
                        granularity: string;
                        dateRange: string;
                    }[];
                };
                useCase: string;
            };
            warning: string;
        };
        crossCubeQueries: {
            description: string;
            example: string;
            howToFind: string;
        };
        topNPattern: {
            description: string;
            example: {
                measures: string[];
                dimensions: string[];
                filters: {
                    member: string;
                    operator: string;
                    values: string[];
                }[];
                order: {
                    'Cube.total': string;
                };
                limit: number;
            };
        };
        filterSyntax: {
            description: string;
            operators: string[];
            dateRangeValues: {
                relative: string[];
                absolute: string[];
            };
        };
    };
};
/**
 * Standard error response format.
 *
 * `issues` is additive: the `error` string keeps its exact shape for existing
 * clients, while a caller that needs to act on a *particular* unknown member —
 * a dashboard dropping the column for a deleted attribute, say — has something
 * structured to read. Splitting the joined string back apart is not reliable,
 * since the per-field hints contain the same separator.
 */
export declare function formatErrorResponse(error: string | Error, status?: number, issues?: QueryValidationIssue[]): {
    issues?: QueryValidationIssue[] | undefined;
    error: string;
    status: number;
};
/**
 * Options for batch request handling
 */
export interface BatchRequestOptions {
    /**
     * Whether to bypass server-side cache for all queries in the batch
     * When true, all queries will be executed fresh without cache
     */
    skipCache?: boolean;
}
/**
 * Handle batch query requests - wrapper around existing single query execution
 * Executes multiple queries in parallel and returns partial success results
 *
 * @param queries - Array of semantic queries to execute
 * @param securityContext - Security context (extracted once, shared across all queries)
 * @param semanticLayer - Semantic layer compiler instance
 * @param options - Optional batch request options (e.g., skipCache)
 * @returns Array of results matching input query order (successful or error results)
 */
export declare function handleBatchRequest(queries: SemanticQuery[], securityContext: SecurityContext, semanticLayer: SemanticLayerCompiler, options?: BatchRequestOptions): Promise<{
    results: ({
        queryType: string;
        results: {
            total?: number | undefined;
            warnings?: {
                code: string;
                message: string;
                severity: string;
                cubes?: string[];
                measures?: string[];
                suggestion?: string;
            }[] | undefined;
            cache?: {
                hit: boolean;
                cachedAt?: string;
                ttlMs?: number;
                ttlRemainingMs?: number;
            } | undefined;
            query: SemanticQuery;
            lastRefreshTime: string;
            usedPreAggregations: {};
            transformedQuery: any;
            requestId: string;
            annotation: any;
            dataSource: string;
            dbType: string;
            extDbType: string;
            external: boolean;
            slowQuery: boolean;
            data: any[];
        }[];
        pivotQuery: {
            queryType: string;
            measures?: string[];
            dimensions?: string[];
            filters?: Array<import('../server/index.js').Filter>;
            timeDimensions?: Array<import('../server/index.js').TimeDimension>;
            limit?: number;
            offset?: number;
            order?: Record<string, "asc" | "desc">;
            fillMissingDatesValue?: number | null;
            ungrouped?: boolean;
            total?: boolean;
            funnel?: import('../server/index.js').FunnelQueryConfig;
            flow?: import('../server/types/flow.js').FlowQueryConfig;
            retention?: import('../server/index.js').RetentionQueryConfig;
        };
        slowQuery: boolean;
        success: boolean;
        error?: undefined;
        issues?: undefined;
        query?: undefined;
    } | {
        success: boolean;
        error: string;
        issues: QueryValidationIssue[] | undefined;
        query: SemanticQuery;
    })[];
}>;
/**
 * Locale configuration for the MCP App visualization.
 */
export interface McpAppConfig {
    /**
     * Default locale to use when the browser locale is unavailable or detection is disabled.
     * BCP-47 format (e.g. 'en-GB', 'nl-NL', 'en-US'). Defaults to 'en-GB'.
     */
    defaultLocale?: string;
    /**
     * When true (default), the MCP App will prefer the browser/runtime locale over defaultLocale.
     * Set to false to force defaultLocale regardless of the browser setting.
     */
    detectBrowserLocale?: boolean;
}
/**
 * MCP Endpoint Options
 */
export interface MCPOptions {
    /** Enable MCP endpoints (default: true) */
    enabled?: boolean;
    /** Which MCP tools to expose (default: all) */
    tools?: ('discover' | 'suggest' | 'validate' | 'load')[];
    /** Base path for MCP endpoints (default: '/mcp') */
    basePath?: string;
    /**
     * Allowed origins for MCP requests (Origin header validation per MCP 2025-11-25,
     * mitigating DNS rebinding).
     *
     * Default (when omitted): admit loopback origins (localhost / 127.x / [::1]) plus
     * non-browser / server-to-server clients that send no Origin header (e.g. the Claude
     * MCP connector, curl); every other browser Origin is rejected with 403.
     *
     * If a **browser front-end** calls `/mcp`, you MUST list its origin here to allow it,
     * e.g. ['https://app.example.com']. Include the wildcard '*' to allow ALL origins
     * (permissive mode — discouraged; prefer exact origins and/or {@link resourceMetadataUrl}
     * auth as the primary control for public deployments).
     */
    allowedOrigins?: string[];
    /**
     * Enable MCP App visualization for load tool results.
     * Pass `true` to enable with defaults, or a config object to set locale options.
     * @example app: { defaultLocale: 'nl-NL', detectBrowserLocale: false }
     */
    app?: boolean | McpAppConfig;
    /**
     * Override the MCP prompt set exposed by the built-in endpoint.
     * Pass an array to replace the defaults, or a function to derive from them.
     */
    prompts?: MCPPromptResolver;
    /**
     * Override the MCP resources exposed by the built-in endpoint.
     * Pass an array to replace the defaults, or a function to derive from them.
     * The live schema resource is always appended automatically.
     */
    resources?: MCPResourceResolver;
    /**
     * Override the `InitializeResult.instructions` string returned by the
     * MCP `initialize` handshake. Per the MCP spec, this is the only
     * server-authored guidance that clients are expected to surface to the
     * model (it is typically merged into the system prompt).
     *
     * Pass a string to replace the defaults entirely, or a function to
     * derive from / extend them. Use this to append project-specific
     * guidance (e.g. cube semantics, naming conventions) without losing
     * the built-in workflow rules.
     */
    instructions?: MCPInstructionsResolver;
    /**
     * OAuth 2.1 Protected Resource Metadata URL (RFC 9728).
     * When set, MCP endpoints require a Bearer token in the Authorization header.
     * Unauthenticated requests receive 401 with WWW-Authenticate pointing to this URL.
     * Token validation is the responsibility of extractSecurityContext.
     *
     * Strongly recommended for any public deployment: auth is the primary access control
     * for `/mcp`, while {@link allowedOrigins} validation is defense-in-depth against
     * browser-driven (DNS-rebinding) requests. The Claude MCP connector supports the
     * OAuth 2.1 / PRM flow this enables.
     */
    resourceMetadataUrl?: string;
    /**
     * Optional name to use in the MCP serverInfo.name field (initialize response).
     * Defaults to 'drizzle-cube'. Override to match your product branding.
     */
    serverName?: string;
}
/**
 * Suggest request body
 */
export interface SuggestRequest {
    /** Natural language query */
    naturalLanguage: string;
    /** Optional target cube name */
    cube?: string;
}
/**
 * Validate request body
 */
export interface ValidateRequest {
    /** Query to validate */
    query: SemanticQuery;
}
/**
 * Handle /suggest endpoint - generate query from natural language
 */
export declare function handleSuggest(semanticLayer: SemanticLayerCompiler, securityContext: SecurityContext, body: SuggestRequest): Promise<QuerySuggestion>;
/**
 * Handle /validate endpoint - validate query with corrections
 */
export declare function handleValidate(semanticLayer: SemanticLayerCompiler, securityContext: SecurityContext, body: ValidateRequest): Promise<AIValidationResult & {
    sql?: {
        sql: string;
        params?: any[];
    };
}>;
