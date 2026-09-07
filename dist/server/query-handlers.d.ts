import { SemanticLayerCompiler } from './compiler.js';
import { SemanticQuery, SecurityContext } from './types/index.js';
import { CubeDiscoveryResult } from './ai/discovery.js';
/**
 * Discovery request body
 */
export interface DiscoverRequest {
    /** Topic or keyword to search for */
    topic?: string;
    /** Natural language intent */
    intent?: string;
    /** Maximum results to return */
    limit?: number;
    /** Minimum relevance score (0-1) */
    minScore?: number;
}
/**
 * Load request body - execute a query
 */
export interface LoadRequest {
    /** Query to execute */
    query: SemanticQuery;
}
/**
 * Discovery response shape returned by `handleDiscover`.
 *
 * In addition to the matched cubes, the response embeds the full query
 * language reference and the date filtering decision tree. This is the
 * primary delivery mechanism for query-construction guidance: clients
 * cannot be relied upon to forward `prompts/*` content to the model, so
 * we piggyback on `discover` (the mandated first call in our workflow)
 * to guarantee the model sees the rules before it builds a query.
 *
 * The fields are stable strings — consumers may render or strip them as
 * they see fit, but the MCP `discover` tool relies on them being present.
 */
export interface DiscoverResponse {
    /** Matched cubes (possibly empty) with measures, dimensions, and joins */
    cubes: CubeDiscoveryResult[];
    /**
     * Complete TypeScript DSL reference for query construction. Source of
     * truth for field naming, filter operators, time dimensions, and
     * analysis modes (funnel/flow/retention).
     */
    queryLanguageReference: string;
    /**
     * Decision tree for date filtering vs time grouping. The single most
     * common source of incorrect queries — read this whenever the user
     * mentions a time period.
     */
    dateFilteringGuide: string;
}
/**
 * Handle /discover endpoint - find relevant cubes based on topic/intent.
 *
 * Always returns `queryLanguageReference` and `dateFilteringGuide` alongside
 * the matched cubes. See `DiscoverResponse` for the rationale.
 */
export declare function handleDiscover(semanticLayer: SemanticLayerCompiler, securityContext: SecurityContext, body: DiscoverRequest): Promise<DiscoverResponse>;
/**
 * Normalize AI-generated query fields before validation/execution.
 * Fixes common LLM mistakes:
 * - Double-prefixed fields: "Teams.Teams.name" -> "Teams.name"
 * - Order as array: [{key: dir}] -> {key: dir}
 * - Underscore order keys: "Teams_count" -> "Teams.count"
 * - Invalid order keys dropped (falls back to first measure desc)
 *
 * This runs in the shared handleLoad path so both MCP and Agent benefit.
 */
export declare function normalizeQueryFields(query: Record<string, unknown>): Record<string, unknown>;
/**
 * Handle /load endpoint - execute a query and return results
 * This completes the AI workflow: discover → suggest → validate → load
 */
export declare function handleLoad(semanticLayer: SemanticLayerCompiler, securityContext: SecurityContext, body: LoadRequest): Promise<{
    data: Record<string, unknown>[];
    annotation: any;
    query: SemanticQuery;
    total?: number;
}>;
