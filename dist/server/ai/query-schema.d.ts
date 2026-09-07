/**
 * Unified Query Schema — Single Source of Truth
 *
 * This module defines the canonical query parameter schema used by BOTH:
 * - MCP `load` tool (mcp-transport.ts)
 * - Agent `execute_query` tool (agent/tools.ts)
 *
 * It also exports a TypeScript DSL reference string used in prompts.
 */
/**
 * JSON Schema for query parameters shared across MCP and Agent tools.
 * Covers regular queries (measures/dimensions/filters/timeDimensions/order/limit/offset/ungrouped)
 * and analysis modes (funnel/flow/retention).
 */
export declare const QUERY_PARAMS_SCHEMA: {
    readonly measures: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
            readonly pattern: "^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$";
        };
        readonly description: "Aggregation measures — EXACTLY \"CubeName.measureName\" (two parts, one dot). Copy field names verbatim from discover results. WRONG: \"Sales.Sales.count\" (double-prefixed). RIGHT: \"Sales.count\".";
    };
    readonly dimensions: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
            readonly pattern: "^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$";
        };
        readonly description: "Grouping dimensions — EXACTLY \"CubeName.dimensionName\" (two parts, one dot). Copy from discover results. Can include dimensions from RELATED cubes via joins. WRONG: \"Teams.Teams.name\". RIGHT: \"Teams.name\".";
    };
    readonly filters: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly member: {
                    readonly type: "string";
                    readonly description: "\"CubeName.fieldName\"";
                };
                readonly operator: {
                    readonly type: "string";
                    readonly enum: readonly ["equals", "notEquals", "contains", "notContains", "startsWith", "notStartsWith", "endsWith", "notEndsWith", "gt", "gte", "lt", "lte", "between", "notBetween", "in", "notIn", "like", "notLike", "ilike", "regex", "notRegex", "set", "notSet", "isEmpty", "isNotEmpty", "inDateRange", "beforeDate", "afterDate", "arrayContains", "arrayOverlaps", "arrayContained"];
                };
                readonly values: {
                    readonly type: "array";
                    readonly items: {};
                    readonly description: "Filter values. Omit for set/notSet/isEmpty/isNotEmpty.";
                };
            };
            readonly required: readonly ["member", "operator"];
        };
        readonly description: "Filter conditions. Flat array — for AND/OR logic use { \"and\": [...] } or { \"or\": [...] } wrappers.";
    };
    readonly timeDimensions: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly dimension: {
                    readonly type: "string";
                    readonly description: "\"CubeName.timeDimension\"";
                };
                readonly granularity: {
                    readonly type: "string";
                    readonly enum: readonly ["second", "minute", "hour", "day", "week", "month", "quarter", "year"];
                    readonly description: "Time bucket size. REQUIRED for time series; omit only for date range filtering.";
                };
                readonly dateRange: {
                    readonly description: "Relative string (\"last 7 days\", \"this month\", \"last quarter\") or absolute tuple [\"YYYY-MM-DD\", \"YYYY-MM-DD\"]";
                };
                readonly fillMissingDates: {
                    readonly type: "boolean";
                    readonly description: "Fill gaps in time series with fillMissingDatesValue (default: true). Requires granularity + dateRange.";
                };
                readonly compareDateRange: {
                    readonly type: "array";
                    readonly items: {};
                    readonly description: "Period-over-period comparison. Array of date ranges: [\"last 30 days\", [\"2024-01-01\", \"2024-01-30\"]]";
                };
            };
            readonly required: readonly ["dimension"];
        };
        readonly description: "Time dimensions with optional granularity for time series. Use filters with inDateRange for aggregated totals instead.";
    };
    readonly order: {
        readonly type: "object";
        readonly description: "Sort order. Keys MUST be a measure or dimension already in this query, in \"CubeName.fieldName\" format. Values: \"asc\" or \"desc\". Example: {\"Sales.revenue\": \"desc\"}";
    };
    readonly limit: {
        readonly type: "number";
        readonly description: "Maximum rows to return";
    };
    readonly offset: {
        readonly type: "number";
        readonly description: "Number of rows to skip (for pagination)";
    };
    readonly ungrouped: {
        readonly type: "boolean";
        readonly description: "When true, returns raw row-level data without GROUP BY. Requires at least one dimension. Incompatible with count/countDistinct measures and analysis modes. Cannot reference two cubes joined by a hasMany relationship in EITHER direction (e.g. Departments hasMany Employees) — an ungrouped query stays at one record grain, so keep it to a single cube plus its to-one joins. A field from a hasMany-related cube has to be pre-aggregated in a grouped query instead.";
    };
    readonly funnel: {
        readonly type: "object";
        readonly properties: {
            readonly bindingKey: {
                readonly type: "string";
                readonly description: "Entity identifier dimension (e.g., \"Events.userId\")";
            };
            readonly timeDimension: {
                readonly type: "string";
                readonly description: "Time ordering dimension (e.g., \"Events.timestamp\")";
            };
            readonly steps: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly description: "Human-readable step name";
                        };
                        readonly filter: {
                            readonly description: "Filter or array of filters for this step";
                        };
                        readonly timeToConvert: {
                            readonly type: "string";
                            readonly description: "ISO 8601 duration — max time from previous step (e.g., \"P7D\" for 7 days, \"PT1H\" for 1 hour)";
                        };
                    };
                    readonly required: readonly ["name"];
                };
                readonly description: "Ordered funnel steps (minimum 2). Put inDateRange time filter ONLY on step 0.";
            };
            readonly includeTimeMetrics: {
                readonly type: "boolean";
                readonly description: "Include avg/median/p90 time-to-convert per step";
            };
            readonly globalTimeWindow: {
                readonly type: "string";
                readonly description: "ISO 8601 duration — all steps must complete within this window from step 0";
            };
        };
        readonly required: readonly ["bindingKey", "timeDimension", "steps"];
        readonly description: "Funnel analysis. When provided, measures/dimensions are ignored.";
    };
    readonly flow: {
        readonly type: "object";
        readonly properties: {
            readonly bindingKey: {
                readonly type: "string";
                readonly description: "Entity identifier dimension (e.g., \"Events.userId\")";
            };
            readonly timeDimension: {
                readonly type: "string";
                readonly description: "Time ordering dimension (e.g., \"Events.timestamp\")";
            };
            readonly eventDimension: {
                readonly type: "string";
                readonly description: "Dimension whose values become node labels (e.g., \"Events.eventType\")";
            };
            readonly startingStep: {
                readonly type: "object";
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly description: "Display name for the starting step";
                    };
                    readonly filter: {
                        readonly description: "Filter(s) identifying the starting event";
                    };
                };
                readonly required: readonly ["name"];
                readonly description: "The anchor point — an object with { name, filter }, NOT a plain string.";
            };
            readonly stepsBefore: {
                readonly type: "number";
                readonly description: "Steps to explore before starting step (0-5)";
            };
            readonly stepsAfter: {
                readonly type: "number";
                readonly description: "Steps to explore after starting step (0-5)";
            };
            readonly entityLimit: {
                readonly type: "number";
                readonly description: "Max entities to process (performance tuning)";
            };
            readonly outputMode: {
                readonly type: "string";
                readonly enum: readonly ["sankey", "sunburst"];
                readonly description: "Visualization mode (default: sankey)";
            };
        };
        readonly required: readonly ["bindingKey", "timeDimension", "eventDimension", "startingStep"];
        readonly description: "Flow (path) analysis. When provided, measures/dimensions are ignored.";
    };
    readonly retention: {
        readonly type: "object";
        readonly properties: {
            readonly timeDimension: {
                readonly type: "string";
                readonly description: "Timestamp dimension (e.g., \"Events.timestamp\")";
            };
            readonly bindingKey: {
                readonly type: "string";
                readonly description: "Entity identifier (e.g., \"Events.userId\")";
            };
            readonly dateRange: {
                readonly type: "object";
                readonly properties: {
                    readonly start: {
                        readonly type: "string";
                        readonly description: "YYYY-MM-DD";
                    };
                    readonly end: {
                        readonly type: "string";
                        readonly description: "YYYY-MM-DD";
                    };
                };
                readonly required: readonly ["start", "end"];
                readonly description: "Cohort date range — MUST be an object { start, end }, NOT an array or string.";
            };
            readonly granularity: {
                readonly type: "string";
                readonly enum: readonly ["day", "week", "month"];
                readonly description: "Period size for retention buckets";
            };
            readonly periods: {
                readonly type: "number";
                readonly description: "Number of retention periods to calculate";
            };
            readonly retentionType: {
                readonly type: "string";
                readonly enum: readonly ["classic", "rolling"];
                readonly description: "classic = returned in period N exactly; rolling = returned in period N or later";
            };
            readonly cohortFilters: {
                readonly description: "Optional filters on cohort entry events";
            };
            readonly activityFilters: {
                readonly description: "Optional filters on return activity events";
            };
            readonly breakdownDimensions: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly description: "Segment retention by these dimensions (e.g., [\"Events.country\"])";
            };
        };
        readonly required: readonly ["timeDimension", "bindingKey", "dateRange", "granularity", "periods"];
        readonly description: "Retention (cohort) analysis. When provided, measures/dimensions are ignored.";
    };
};
/**
 * TypeScript DSL reference for query construction.
 * Used in MCP prompts and agent system prompt as the authoritative query language spec.
 */
export declare const QUERY_LANGUAGE_REFERENCE: string;
