/**
 * Generic query schemas for AI agents
 * Teaches AI how to construct analysis queries
 *
 * These schemas are returned by the `discover` tool to help LLMs
 * understand the correct query shape for each analysis mode.
 */

export const QUERY_SCHEMAS = {
  funnel: {
    description: 'Track conversion through sequential steps. Entities (identified by bindingKey) move through ordered steps.',
    structure: {
      funnel: {
        bindingKey: 'Cube.dimension - identifies entities moving through funnel',
        timeDimension: 'Cube.dimension - time field for ordering events',
        steps: [
          {
            name: 'string - human readable step name',
            filter: '{ member, operator, values } or array of filters. Put inDateRange ONLY on step 0.',
            timeToConvert: 'optional - ISO 8601 duration e.g. "P7D" for 7 days, "PT1H" for 1 hour'
          }
        ],
        includeTimeMetrics: 'optional boolean - include avg/median/p90 time-to-convert',
        globalTimeWindow: 'optional - ISO 8601 duration, all steps must complete within this window'
      }
    }
  },

  flow: {
    description: 'Analyze paths users take before/after a specific event. Shows event sequences as Sankey/sunburst.',
    structure: {
      flow: {
        bindingKey: 'Cube.dimension - identifies entities',
        timeDimension: 'Cube.dimension - time field for ordering',
        eventDimension: 'Cube.dimension - the event type field (values become node labels)',
        startingStep: {
          name: 'string - display name for the starting step',
          filter: '{ member, operator, values } - filter identifying the starting event'
        },
        stepsBefore: 'number (0-5) - how many steps to show before starting step',
        stepsAfter: 'number (0-5) - how many steps to show after starting step',
        entityLimit: 'optional number - max entities to process (performance)',
        outputMode: 'optional "sankey" | "sunburst" (default: sankey)'
      }
    }
  },

  retention: {
    description: 'Measure how many users return over time periods after initial activity.',
    structure: {
      retention: {
        timeDimension: 'Cube.dimension - time field for cohort assignment',
        bindingKey: 'Cube.dimension - identifies entities',
        dateRange: {
          start: 'YYYY-MM-DD - cohort start date',
          end: 'YYYY-MM-DD - cohort end date'
        },
        granularity: 'day | week | month - period size',
        periods: 'number - how many periods to analyze',
        retentionType: '"classic" (returned in period N) | "rolling" (returned in N or later)',
        cohortFilters: 'optional - filters on cohort entry events',
        activityFilters: 'optional - filters on return activity events',
        breakdownDimensions: 'optional string[] - segment by these dimensions'
      }
    }
  }
} as const

export type QuerySchemas = typeof QUERY_SCHEMAS
