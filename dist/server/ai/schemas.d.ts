/**
 * Generic query schemas for AI agents
 * Teaches AI how to construct analysis queries
 *
 * These schemas are returned by the `discover` tool to help LLMs
 * understand the correct query shape for each analysis mode.
 */
export declare const QUERY_SCHEMAS: {
    readonly funnel: {
        readonly description: "Track conversion through sequential steps. Entities (identified by bindingKey) move through ordered steps.";
        readonly structure: {
            readonly funnel: {
                readonly bindingKey: "Cube.dimension - identifies entities moving through funnel";
                readonly timeDimension: "Cube.dimension - time field for ordering events";
                readonly steps: readonly [{
                    readonly name: "string - human readable step name";
                    readonly filter: "{ member, operator, values } or array of filters. Put inDateRange ONLY on step 0.";
                    readonly timeToConvert: "optional - ISO 8601 duration e.g. \"P7D\" for 7 days, \"PT1H\" for 1 hour";
                }];
                readonly includeTimeMetrics: "optional boolean - include avg/median/p90 time-to-convert";
                readonly globalTimeWindow: "optional - ISO 8601 duration, all steps must complete within this window";
            };
        };
    };
    readonly flow: {
        readonly description: "Analyze paths users take before/after a specific event. Shows event sequences as Sankey/sunburst.";
        readonly structure: {
            readonly flow: {
                readonly bindingKey: "Cube.dimension - identifies entities";
                readonly timeDimension: "Cube.dimension - time field for ordering";
                readonly eventDimension: "Cube.dimension - the event type field (values become node labels)";
                readonly startingStep: {
                    readonly name: "string - display name for the starting step";
                    readonly filter: "{ member, operator, values } - filter identifying the starting event";
                };
                readonly stepsBefore: "number (0-5) - how many steps to show before starting step";
                readonly stepsAfter: "number (0-5) - how many steps to show after starting step";
                readonly entityLimit: "optional number - max entities to process (performance)";
                readonly outputMode: "optional \"sankey\" | \"sunburst\" (default: sankey)";
            };
        };
    };
    readonly retention: {
        readonly description: "Measure how many users return over time periods after initial activity.";
        readonly structure: {
            readonly retention: {
                readonly timeDimension: "Cube.dimension - time field for cohort assignment";
                readonly bindingKey: "Cube.dimension - identifies entities";
                readonly dateRange: {
                    readonly start: "YYYY-MM-DD - cohort start date";
                    readonly end: "YYYY-MM-DD - cohort end date";
                };
                readonly granularity: "day | week | month - period size";
                readonly periods: "number - how many periods to analyze";
                readonly retentionType: "\"classic\" (returned in period N) | \"rolling\" (returned in N or later)";
                readonly cohortFilters: "optional - filters on cohort entry events";
                readonly activityFilters: "optional - filters on return activity events";
                readonly breakdownDimensions: "optional string[] - segment by these dimensions";
            };
        };
    };
};
export type QuerySchemas = typeof QUERY_SCHEMAS;
