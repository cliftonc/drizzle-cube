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
export const QUERY_PARAMS_SCHEMA = {
  measures: {
    type: 'array',
    items: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$' },
    description: 'Aggregation measures — EXACTLY "CubeName.measureName" (two parts, one dot). Copy field names verbatim from discover results. WRONG: "Sales.Sales.count" (double-prefixed). RIGHT: "Sales.count".'
  },
  dimensions: {
    type: 'array',
    items: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$' },
    description: 'Grouping dimensions — EXACTLY "CubeName.dimensionName" (two parts, one dot). Copy from discover results. Can include dimensions from RELATED cubes via joins. WRONG: "Teams.Teams.name". RIGHT: "Teams.name".'
  },
  filters: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        member: { type: 'string', description: '"CubeName.fieldName"' },
        operator: {
          type: 'string',
          enum: [
            'equals', 'notEquals',
            'contains', 'notContains', 'startsWith', 'notStartsWith', 'endsWith', 'notEndsWith',
            'gt', 'gte', 'lt', 'lte', 'between', 'notBetween',
            'in', 'notIn',
            'like', 'notLike', 'ilike',
            'regex', 'notRegex',
            'set', 'notSet', 'isEmpty', 'isNotEmpty',
            'inDateRange', 'beforeDate', 'afterDate',
            'arrayContains', 'arrayOverlaps', 'arrayContained'
          ]
        },
        values: { type: 'array', items: {}, description: 'Filter values. Omit for set/notSet/isEmpty/isNotEmpty.' }
      },
      required: ['member', 'operator']
    },
    description: 'Filter conditions. Flat array — for AND/OR logic use { "and": [...] } or { "or": [...] } wrappers.'
  },
  timeDimensions: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        dimension: { type: 'string', description: '"CubeName.timeDimension"' },
        granularity: {
          type: 'string',
          enum: ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
          description: 'Time bucket size. REQUIRED for time series; omit only for date range filtering.'
        },
        dateRange: {
          description: 'Relative string ("last 7 days", "this month", "last quarter") or absolute tuple ["YYYY-MM-DD", "YYYY-MM-DD"]'
        },
        fillMissingDates: {
          type: 'boolean',
          description: 'Fill gaps in time series with fillMissingDatesValue (default: true). Requires granularity + dateRange.'
        },
        compareDateRange: {
          type: 'array',
          items: {},
          description: 'Period-over-period comparison. Array of date ranges: ["last 30 days", ["2024-01-01", "2024-01-30"]]'
        }
      },
      required: ['dimension']
    },
    description: 'Time dimensions with optional granularity for time series. Use filters with inDateRange for aggregated totals instead.'
  },
  order: {
    type: 'object',
    description: 'Sort order. Keys MUST be a measure or dimension already in this query, in "CubeName.fieldName" format. Values: "asc" or "desc". Example: {"Sales.revenue": "desc"}'
  },
  limit: {
    type: 'number',
    description: 'Maximum rows to return'
  },
  offset: {
    type: 'number',
    description: 'Number of rows to skip (for pagination)'
  },
  ungrouped: {
    type: 'boolean',
    description: 'When true, returns raw row-level data without GROUP BY. Requires at least one dimension. Incompatible with count/countDistinct measures and analysis modes.'
  },
  funnel: {
    type: 'object',
    properties: {
      bindingKey: { type: 'string', description: 'Entity identifier dimension (e.g., "Events.userId")' },
      timeDimension: { type: 'string', description: 'Time ordering dimension (e.g., "Events.timestamp")' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Human-readable step name' },
            filter: { description: 'Filter or array of filters for this step' },
            timeToConvert: { type: 'string', description: 'ISO 8601 duration — max time from previous step (e.g., "P7D" for 7 days, "PT1H" for 1 hour)' }
          },
          required: ['name']
        },
        description: 'Ordered funnel steps (minimum 2). Put inDateRange time filter ONLY on step 0.'
      },
      includeTimeMetrics: { type: 'boolean', description: 'Include avg/median/p90 time-to-convert per step' },
      globalTimeWindow: { type: 'string', description: 'ISO 8601 duration — all steps must complete within this window from step 0' }
    },
    required: ['bindingKey', 'timeDimension', 'steps'],
    description: 'Funnel analysis. When provided, measures/dimensions are ignored.'
  },
  flow: {
    type: 'object',
    properties: {
      bindingKey: { type: 'string', description: 'Entity identifier dimension (e.g., "Events.userId")' },
      timeDimension: { type: 'string', description: 'Time ordering dimension (e.g., "Events.timestamp")' },
      eventDimension: { type: 'string', description: 'Dimension whose values become node labels (e.g., "Events.eventType")' },
      startingStep: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Display name for the starting step' },
          filter: { description: 'Filter(s) identifying the starting event' }
        },
        required: ['name'],
        description: 'The anchor point — an object with { name, filter }, NOT a plain string.'
      },
      stepsBefore: { type: 'number', description: 'Steps to explore before starting step (0-5)' },
      stepsAfter: { type: 'number', description: 'Steps to explore after starting step (0-5)' },
      entityLimit: { type: 'number', description: 'Max entities to process (performance tuning)' },
      outputMode: { type: 'string', enum: ['sankey', 'sunburst'], description: 'Visualization mode (default: sankey)' }
    },
    required: ['bindingKey', 'timeDimension', 'eventDimension', 'startingStep'],
    description: 'Flow (path) analysis. When provided, measures/dimensions are ignored.'
  },
  retention: {
    type: 'object',
    properties: {
      timeDimension: { type: 'string', description: 'Timestamp dimension (e.g., "Events.timestamp")' },
      bindingKey: { type: 'string', description: 'Entity identifier (e.g., "Events.userId")' },
      dateRange: {
        type: 'object',
        properties: {
          start: { type: 'string', description: 'YYYY-MM-DD' },
          end: { type: 'string', description: 'YYYY-MM-DD' }
        },
        required: ['start', 'end'],
        description: 'Cohort date range — MUST be an object { start, end }, NOT an array or string.'
      },
      granularity: { type: 'string', enum: ['day', 'week', 'month'], description: 'Period size for retention buckets' },
      periods: { type: 'number', description: 'Number of retention periods to calculate' },
      retentionType: { type: 'string', enum: ['classic', 'rolling'], description: 'classic = returned in period N exactly; rolling = returned in period N or later' },
      cohortFilters: { description: 'Optional filters on cohort entry events' },
      activityFilters: { description: 'Optional filters on return activity events' },
      breakdownDimensions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Segment retention by these dimensions (e.g., ["Events.country"])'
      }
    },
    required: ['timeDimension', 'bindingKey', 'dateRange', 'granularity', 'periods'],
    description: 'Retention (cohort) analysis. When provided, measures/dimensions are ignored.'
  }
} as const

/**
 * TypeScript DSL reference for query construction.
 * Used in MCP prompts and agent system prompt as the authoritative query language spec.
 */
export const QUERY_LANGUAGE_REFERENCE = `
// === DRIZZLE CUBE QUERY LANGUAGE (TypeScript DSL) ===

type RegularQuery = {
  measures?: string[]           // "CubeName.measureName" — aggregations
  dimensions?: string[]         // "CubeName.dimensionName" — groupings (can cross cubes via joins)
  filters?: (FilterCondition | LogicalFilter)[]
  timeDimensions?: TimeDimension[]
  order?: Record<string, 'asc' | 'desc'>  // keys MUST be in measures or dimensions
  limit?: number
  offset?: number
  ungrouped?: boolean           // raw rows without GROUP BY
  fillMissingDatesValue?: number | null
}

type FilterCondition = {
  member: string                // "CubeName.fieldName"
  operator: FilterOperator
  values?: any[]                // omit for set/notSet/isEmpty/isNotEmpty
}

type LogicalFilter = { and: Filter[] } | { or: Filter[] }

type FilterOperator =
  // String
  | 'equals' | 'notEquals' | 'contains' | 'notContains'
  | 'startsWith' | 'notStartsWith' | 'endsWith' | 'notEndsWith'
  | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex'
  // Numeric
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween'
  // Set membership
  | 'in' | 'notIn'
  // Null/empty
  | 'set' | 'notSet' | 'isEmpty' | 'isNotEmpty'
  // Date
  | 'inDateRange' | 'beforeDate' | 'afterDate'
  // Array (PostgreSQL)
  | 'arrayContains' | 'arrayOverlaps' | 'arrayContained'

type TimeDimension = {
  dimension: string             // "CubeName.timeDimension"
  granularity?: Granularity     // REQUIRED for time series; omit for date-range-only filtering
  dateRange?: string | [string, string]  // "last 7 days" | ["2024-01-01", "2024-03-31"]
  fillMissingDates?: boolean    // gap-fill (requires granularity + dateRange)
  compareDateRange?: (string | [string, string])[]  // period-over-period
}

type Granularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

// --- Analysis Modes (mutually exclusive with measures/dimensions) ---

type FunnelQuery = {
  funnel: {
    bindingKey: string          // "Events.userId"
    timeDimension: string       // "Events.timestamp"
    steps: FunnelStep[]         // min 2; put inDateRange filter ONLY on step 0
    includeTimeMetrics?: boolean
    globalTimeWindow?: string   // ISO 8601 duration, e.g. "P30D"
  }
}
type FunnelStep = {
  name: string
  filter?: Filter | Filter[]
  timeToConvert?: string        // ISO 8601 duration, e.g. "P7D", "PT1H"
}

type FlowQuery = {
  flow: {
    bindingKey: string          // "Events.userId"
    timeDimension: string       // "Events.timestamp"
    eventDimension: string      // "Events.eventType" — values become node labels
    startingStep: {             // OBJECT, not a string!
      name: string
      filter?: Filter | Filter[]
    }
    stepsBefore: number         // 0-5
    stepsAfter: number          // 0-5
    entityLimit?: number
    outputMode?: 'sankey' | 'sunburst'
  }
}

type RetentionQuery = {
  retention: {
    timeDimension: string       // "Events.timestamp"
    bindingKey: string          // "Events.userId"
    dateRange: {                // OBJECT with start/end, NOT array/string
      start: string             // "YYYY-MM-DD"
      end: string               // "YYYY-MM-DD"
    }
    granularity: 'day' | 'week' | 'month'
    periods: number
    retentionType: 'classic' | 'rolling'
    cohortFilters?: Filter | Filter[]
    activityFilters?: Filter | Filter[]
    breakdownDimensions?: string[]
  }
}

// --- Rules ---
// 1. Fields are EXACTLY "CubeName.fieldName" (two parts, one dot). Copy verbatim from discover.
//    WRONG: "Teams.Teams.name" (double-prefixed!), "PullRequests" (bare cube), "Teams_count" (underscore)
//    RIGHT: "Teams.name", "PullRequests.count"
// 2. Cross-cube joins: include dimensions from related cubes — the system auto-joins
// 3. For AGGREGATED TOTALS: use filters with inDateRange (NOT timeDimensions)
// 4. For TIME SERIES: use timeDimensions WITH granularity
// 5. timeDimensions WITHOUT granularity = daily grouping (usually wrong)
// 6. Order keys MUST appear in measures or dimensions of the same query
// 7. Funnel/flow/retention are mutually exclusive with measures/dimensions
// 8. Always discover cubes first — never guess field names
`.trim()
