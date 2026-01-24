/**
 * Generic query schemas for AI agents
 * Teaches AI how to construct analysis queries
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
            filter: {
              member: 'Cube.dimension',
              operator: 'equals | notEquals | contains | ...',
              values: ['array of filter values']
            },
            timeToConvert: 'optional - max time window e.g. "7 days"'
          }
        ],
        dateRange: '[start, end] array OR string like "last 7 days", "last 3 months", "this quarter"'
      }
    }
  },

  flow: {
    description: 'Analyze paths users take before/after a specific event. Shows event sequences.',
    structure: {
      flow: {
        bindingKey: 'Cube.dimension - identifies entities',
        timeDimension: 'Cube.dimension - time field for ordering',
        eventDimension: 'Cube.dimension - the event type field',
        startingStep: {
          filter: { member: 'Cube.dimension', operator: 'equals', values: ['event value'] }
        },
        stepsBefore: 'number - how many steps to show before starting step',
        stepsAfter: 'number - how many steps to show after starting step',
        dateRange: '[start, end] array OR string like "last 7 days", "last 3 months", "this quarter"'
      }
    }
  },

  retention: {
    description: 'Measure how many users return over time periods after initial activity.',
    structure: {
      retention: {
        bindingKey: 'Cube.dimension - identifies entities',
        timeDimension: 'Cube.dimension - time field for cohort assignment',
        granularity: 'day | week | month - period size',
        periods: 'number - how many periods to analyze',
        dateRange: '[start, end] array OR string like "last 7 days", "last 3 months", "this quarter"'
      }
    }
  }
} as const

export type QuerySchemas = typeof QUERY_SCHEMAS
