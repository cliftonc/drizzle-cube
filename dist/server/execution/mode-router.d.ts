import { Cube, SemanticQuery } from '../types/index.js';
import { ComparisonQueryBuilder } from '../builders/comparison-query-builder.js';
import { FunnelQueryBuilder } from '../builders/funnel-query-builder.js';
import { FlowQueryBuilder } from '../builders/flow-query-builder.js';
import { RetentionQueryBuilder } from '../builders/retention-query-builder.js';
export type QueryExecutionMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention';
export interface ModeRouterBuilders {
    comparison: ComparisonQueryBuilder;
    funnel: FunnelQueryBuilder;
    flow: FlowQueryBuilder;
    retention: RetentionQueryBuilder;
}
export declare class ModeRouter {
    private readonly builders;
    constructor(builders: ModeRouterBuilders);
    /**
     * Resolve the single active execution mode for a query.
     * Throws if more than one analysis mode is present.
     */
    resolveMode(query: SemanticQuery): QueryExecutionMode;
    /**
     * Validate a query for its resolved mode. Throws a translated error on failure.
     */
    validateForMode(mode: QueryExecutionMode, cubes: Map<string, Cube>, query: SemanticQuery): void;
}
