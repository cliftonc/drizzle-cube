import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { FlowQueryConfig, FlowResultRow } from '../types/flow.js';
import { AnalysisConfigValidationResult } from '../types/validation.js';
import { Cube, QueryContext, SemanticQuery } from '../types/index.js';
export declare class FlowQueryBuilder {
    private filterBuilder;
    private dateTimeBuilder;
    private databaseAdapter;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Check if query contains flow configuration
     */
    hasFlow(query: SemanticQuery): boolean;
    /**
     * Validate flow configuration
     */
    validateConfig(config: FlowQueryConfig, cubes: Map<string, Cube>): AnalysisConfigValidationResult;
    /**
     * Validate a `Cube.dimension` member string: format, cube existence, and
     * dimension existence. i18n message factories let each call site supply its
     * own keys while sharing the branch structure.
     */
    private validateMemberDimension;
    /** Validate the flow binding key (single member or per-cube mappings). */
    private validateBindingKey;
    /** Validate the flow starting step (required + filter + name warning). */
    private validateStartingStep;
    /** Validate flow step-depth bounds and emit high-depth performance warnings. */
    private validateDepthBounds;
    /** Validate the flow join strategy and its engine support. */
    private validateJoinStrategy;
    /**
     * Build complete flow query using Drizzle's query builder pattern
     *
     * Creates a series of CTEs to:
     * 1. Find entities at the starting step
     * 2. Walk backwards N steps to find preceding events
     * 3. Walk forwards N steps to find following events
     * 4. Aggregate into nodes and links for Sankey visualization
     */
    buildFlowQuery(config: FlowQueryConfig, cubes: Map<string, Cube>, context: QueryContext): ReturnType<typeof context.db.select>;
    /**
     * Transform raw SQL result to FlowResultRow
     * The raw result contains rows with record_type = 'node' or 'link'
     */
    transformResult(rawResult: Record<string, unknown>[]): FlowResultRow;
    /**
     * Resolve flow configuration to SQL expressions
     */
    private resolveFlowConfig;
    /**
     * Resolve the cube for flow analysis
     */
    private resolveCube;
    /**
     * Resolve binding key expression
     */
    private resolveBindingKey;
    /**
     * Resolve time dimension expression
     */
    private resolveTimeDimension;
    /**
     * Resolve event dimension expression
     */
    private resolveEventDimension;
    /**
     * Build filter conditions for the starting step
     */
    private buildStartingStepFilters;
    /**
     * Build a single filter condition
     */
    private buildFilterCondition;
    /** Build the non-null sub-conditions of a logical/group filter. */
    private buildSubConditions;
    /** Combine sub-conditions with AND/OR, collapsing the 0- and 1-element cases. */
    private combineConditions;
    /**
     * Build the starting entities CTE
     * Finds all entities matching the starting step filter with their start time and event type
     * For sunburst mode, also initializes event_path with the starting event type
     */
    private buildStartingEntitiesCTE;
    /**
     * Build CTEs for steps BEFORE/AFTER the starting point using LATERAL joins
     *
     * Direction-parameterised: 'before' walks backwards (time `<` reference,
     * ORDER BY DESC, `before_step_N` aliases, bounded by `stepsBefore`); 'after'
     * walks forwards (time `>`, ORDER BY ASC, `after_step_N`, `stepsAfter`).
     * Uses ORDER BY ... LIMIT 1 to fetch the immediate predecessor/successor via index.
     */
    private buildDirectionalCTEsLateral;
    /**
     * Build CTEs for steps BEFORE/AFTER the starting point using ROW_NUMBER()
     *
     * Direction-parameterised: 'before' finds the immediate predecessor (time `<`
     * reference, ROW_NUMBER ORDER BY DESC, `before_step_N` aliases, bounded by
     * `stepsBefore`); 'after' finds the immediate successor (time `>`, ORDER BY ASC,
     * `after_step_N`, `stepsAfter`). For sunburst mode, accumulates event_path
     * (prepend for before, append for after).
     */
    private buildDirectionalCTEsWindow;
    /**
     * Build a single node-aggregation UNION arm for a before/after step.
     *
     * Sankey groups by `event_type` (converging paths); sunburst groups by
     * `event_path` (unique tree branches). The node-id prefix and layer are
     * emitted via sql.raw() because they're hardcoded constants (not user input)
     * and avoid multi-digit parameter issues in DuckDB.
     */
    private buildNodeArm;
    /**
     * Build a single link-aggregation UNION arm between two adjacent step CTEs
     * (before→before or after→after). Sankey keys transitions on `event_type`,
     * sunburst on `event_path`. Source/target id prefixes are sql.raw() constants.
     */
    private buildAdjacentLinkArm;
    /**
     * Build the nodes aggregation CTE
     * Aggregates counts per (layer, event_type) combination using UNION ALL
     * For sunburst mode, aggregates by event_path for unique tree branches
     */
    private buildNodesAggregationCTE;
    /**
     * Build the links aggregation CTE
     * Counts transitions between adjacent layers
     * For sunburst mode, uses event_path for unique branch identification
     */
    private buildLinksAggregationCTE;
    /**
     * Build the final result CTE
     * Combines nodes and links into a single result set with record_type discriminator
     */
    private buildFinalResultCTE;
}
