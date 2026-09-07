import { SemanticQuery } from './types/index.js';
export type QueryMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention';
export interface QueryModeFlags {
    comparison: boolean;
    funnel: boolean;
    flow: boolean;
    retention: boolean;
}
/** A query is a comparison when a time dimension carries a compareDateRange with ≥2 ranges. */
export declare function hasComparisonMode(query: SemanticQuery): boolean;
/**
 * A query is a funnel when it has a funnel config with ≥2 steps.
 * Null-safe on `steps` — a `funnel: {}` payload must not throw here.
 */
export declare function hasFunnelMode(query: SemanticQuery): boolean;
/** A query is a flow when it has a flow config with a startingStep and eventDimension. */
export declare function hasFlowMode(query: SemanticQuery): boolean;
/** A query is a retention when it has a retention config with a timeDimension and bindingKey. */
export declare function hasRetentionMode(query: SemanticQuery): boolean;
/** Per-mode booleans for a query. */
export declare function detectQueryModes(query: SemanticQuery): QueryModeFlags;
/**
 * Active non-regular modes for a query, in execution-priority order
 * (comparison, funnel, flow, retention). A well-formed query matches at most one.
 */
export declare function getActiveQueryModes(query: SemanticQuery): Exclude<QueryMode, 'regular'>[];
/** The single priority mode for a query, or 'regular' when none match. */
export declare function detectQueryMode(query: SemanticQuery): QueryMode;
