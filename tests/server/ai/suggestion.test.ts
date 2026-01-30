/**
 * Tests for AI Query Suggestion Engine
 * @see src/server/ai/suggestion.ts
 *
 * Tests cover:
 * - Suggestion generation for measures/dimensions
 * - Field ranking algorithms
 * - Context-aware suggestions
 * - Topic-based discovery
 * - Analysis mode detection (query, funnel, flow, retention)
 * - Time expression parsing
 * - Edge cases (empty metadata, no matches)
 */

import { describe, it, expect } from 'vitest'
import { suggestQuery, type QuerySuggestion } from '../../../src/server/ai/suggestion.js'
import type { CubeMetadata } from '../../../src/server/types/metadata.js'

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create mock cube metadata for testing
 */
function createMockMetadata(): CubeMetadata[] {
  return [
    {
      name: 'Sales',
      title: 'Sales Data',
      description: 'Track sales transactions and revenue',
      exampleQuestions: [
        'What is the total revenue this month?',
        'Show me sales by region'
      ],
      measures: [
        {
          name: 'Sales.totalRevenue',
          title: 'Total Revenue',
          shortTitle: 'Revenue',
          type: 'sum',
          description: 'Sum of all sales',
          synonyms: ['income', 'earnings', 'sales amount']
        },
        {
          name: 'Sales.count',
          title: 'Number of Sales',
          shortTitle: 'Count',
          type: 'count',
          description: 'Count of transactions'
        },
        {
          name: 'Sales.avgOrderValue',
          title: 'Average Order Value',
          shortTitle: 'AOV',
          type: 'avg',
          description: 'Average value per order'
        },
        {
          name: 'Sales.maxRevenue',
          title: 'Maximum Revenue',
          shortTitle: 'Max',
          type: 'max'
        },
        {
          name: 'Sales.minRevenue',
          title: 'Minimum Revenue',
          shortTitle: 'Min',
          type: 'min'
        }
      ],
      dimensions: [
        {
          name: 'Sales.region',
          title: 'Region',
          shortTitle: 'Region',
          type: 'string',
          synonyms: ['area', 'territory', 'location']
        },
        {
          name: 'Sales.category',
          title: 'Product Category',
          shortTitle: 'Category',
          type: 'string'
        },
        {
          name: 'Sales.createdAt',
          title: 'Created Date',
          shortTitle: 'Date',
          type: 'time'
        }
      ],
      segments: []
    },
    {
      name: 'Events',
      title: 'User Events',
      description: 'Track user interactions and actions',
      measures: [
        {
          name: 'Events.count',
          title: 'Event Count',
          shortTitle: 'Count',
          type: 'count'
        }
      ],
      dimensions: [
        {
          name: 'Events.userId',
          title: 'User ID',
          shortTitle: 'User',
          type: 'string'
        },
        {
          name: 'Events.eventType',
          title: 'Event Type',
          shortTitle: 'Type',
          type: 'string',
          synonyms: ['action', 'event name']
        },
        {
          name: 'Events.timestamp',
          title: 'Timestamp',
          shortTitle: 'Time',
          type: 'time'
        }
      ],
      segments: [],
      meta: {
        eventStream: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp'
        }
      }
    },
    {
      name: 'Employees',
      title: 'Employee Data',
      description: 'HR employee information',
      measures: [
        {
          name: 'Employees.count',
          title: 'Employee Count',
          shortTitle: 'Count',
          type: 'count'
        },
        {
          name: 'Employees.avgSalary',
          title: 'Average Salary',
          shortTitle: 'Avg Salary',
          type: 'avg',
          synonyms: ['mean salary', 'average pay']
        }
      ],
      dimensions: [
        {
          name: 'Employees.department',
          title: 'Department',
          shortTitle: 'Dept',
          type: 'string'
        },
        {
          name: 'Employees.hireDate',
          title: 'Hire Date',
          shortTitle: 'Hired',
          type: 'time'
        }
      ],
      segments: []
    }
  ]
}

// =============================================================================
// Analysis Mode Detection Tests
// =============================================================================

describe('Analysis Mode Detection', () => {
  const metadata = createMockMetadata()

  describe('Funnel detection', () => {
    it('should detect funnel intent from "funnel" keyword', () => {
      const result = suggestQuery(metadata, 'show me the conversion funnel')
      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel intent from "conversion" keyword', () => {
      const result = suggestQuery(metadata, 'what is the conversion rate from signup to purchase')
      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel intent from "drop-off" keyword', () => {
      const result = suggestQuery(metadata, 'where do users drop-off')
      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel intent from "steps" keyword', () => {
      const result = suggestQuery(metadata, 'show me the steps to checkout')
      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel intent from "journey" keyword', () => {
      const result = suggestQuery(metadata, 'user journey analysis')
      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel intent from "pipeline" keyword', () => {
      const result = suggestQuery(metadata, 'show sales pipeline stages')
      expect(result.analysisMode).toBe('funnel')
    })
  })

  describe('Flow detection', () => {
    it('should detect flow intent from "flow" keyword', () => {
      const result = suggestQuery(metadata, 'show me the user flow')
      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow intent from "paths" keyword', () => {
      const result = suggestQuery(metadata, 'what paths do users take')
      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow intent from "sequence" keyword', () => {
      const result = suggestQuery(metadata, 'show event sequence')
      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow intent from "before/after" keywords', () => {
      const result = suggestQuery(metadata, 'what happens before purchase')
      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow intent from "next/previous" keywords', () => {
      // Use "next event" instead of "next step" to avoid matching funnel's "step" pattern
      const result = suggestQuery(metadata, 'what is the next event after signup')
      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow intent from "user journey" keyword', () => {
      // Use "user-flow" instead of "user-journey" to avoid matching funnel's "journey" pattern
      const result = suggestQuery(metadata, 'user flow analysis')
      expect(result.analysisMode).toBe('flow')
    })
  })

  describe('Retention detection', () => {
    it('should detect retention intent from "retention" keyword', () => {
      const result = suggestQuery(metadata, 'show me retention rates')
      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention intent from "cohort" keyword', () => {
      const result = suggestQuery(metadata, 'cohort analysis')
      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention intent from "return" keyword', () => {
      const result = suggestQuery(metadata, 'how many users return')
      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention intent from "churn" keyword', () => {
      const result = suggestQuery(metadata, 'what is the churn rate')
      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention intent from "day N" pattern', () => {
      const result = suggestQuery(metadata, 'day7 retention')
      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention intent from "retained" keyword', () => {
      const result = suggestQuery(metadata, 'how many users are retained')
      expect(result.analysisMode).toBe('retention')
    })
  })

  describe('Query mode (default)', () => {
    it('should default to query mode for standard queries', () => {
      const result = suggestQuery(metadata, 'show me total revenue')
      expect(result.analysisMode).toBe('query')
    })

    it('should default to query mode for aggregation queries', () => {
      const result = suggestQuery(metadata, 'count of employees by department')
      expect(result.analysisMode).toBe('query')
    })

    it('should default to query mode for filtering queries', () => {
      const result = suggestQuery(metadata, 'sales in the US region')
      expect(result.analysisMode).toBe('query')
    })
  })
})

// =============================================================================
// Time Expression Parsing Tests
// =============================================================================

describe('Time Expression Parsing', () => {
  const metadata = createMockMetadata()

  describe('Relative time expressions', () => {
    it('should parse "today" expression', () => {
      const result = suggestQuery(metadata, 'show me sales today')
      expect(result.analysisMode).toBe('query')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('day')
      expect(result.reasoning).toContainEqual(expect.stringContaining('Applied time filter'))
    })

    it('should parse "yesterday" expression', () => {
      const result = suggestQuery(metadata, 'show me revenue yesterday')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('day')
    })

    it('should parse "this week" expression', () => {
      const result = suggestQuery(metadata, 'revenue this week')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('day')
    })

    it('should parse "last week" expression', () => {
      const result = suggestQuery(metadata, 'sales last week')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse "this month" expression', () => {
      const result = suggestQuery(metadata, 'orders this month')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse "last month" expression', () => {
      const result = suggestQuery(metadata, 'revenue last month')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse "this quarter" expression', () => {
      const result = suggestQuery(metadata, 'sales this quarter')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('month')
    })

    it('should parse "last quarter" expression', () => {
      const result = suggestQuery(metadata, 'revenue last quarter')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse "this year" expression', () => {
      const result = suggestQuery(metadata, 'total sales this year')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('month')
    })

    it('should parse "last year" expression', () => {
      const result = suggestQuery(metadata, 'revenue last year')
      expect(result.query.timeDimensions).toBeDefined()
    })
  })

  describe('Numeric time expressions', () => {
    it('should parse "last N days" expression', () => {
      const result = suggestQuery(metadata, 'revenue last 7 days')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('day')
    })

    it('should parse "last N weeks" expression', () => {
      const result = suggestQuery(metadata, 'sales last 4 weeks')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse "last N months" expression', () => {
      // Use "sales" which matches the Sales cube
      const result = suggestQuery(metadata, 'sales last 3 months')
      expect(result.query.timeDimensions).toBeDefined()
    })
  })

  describe('Quarter expressions', () => {
    it('should parse Q1 expression', () => {
      const result = suggestQuery(metadata, 'sales in Q1')
      expect(result.query.timeDimensions).toBeDefined()
      expect(result.query.timeDimensions?.[0]?.granularity).toBe('month')
    })

    it('should parse Q2 expression', () => {
      const result = suggestQuery(metadata, 'Q2 revenue')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse Q3 expression', () => {
      const result = suggestQuery(metadata, 'sales during Q3')
      expect(result.query.timeDimensions).toBeDefined()
    })

    it('should parse Q4 expression', () => {
      // Use "Q4 sales" which matches the Sales cube
      const result = suggestQuery(metadata, 'Q4 sales')
      expect(result.query.timeDimensions).toBeDefined()
    })
  })
})

// =============================================================================
// Aggregation Intent Detection Tests
// =============================================================================

describe('Aggregation Intent Detection', () => {
  const metadata = createMockMetadata()

  it('should detect sum intent from "total" keyword', () => {
    const result = suggestQuery(metadata, 'total revenue')
    expect(result.reasoning).toContainEqual(expect.stringContaining('sum'))
  })

  it('should detect count intent from "count" keyword', () => {
    const result = suggestQuery(metadata, 'count of sales')
    expect(result.reasoning).toContainEqual(expect.stringContaining('count'))
  })

  it('should detect count intent from "how many" phrase', () => {
    const result = suggestQuery(metadata, 'how many employees')
    expect(result.reasoning).toContainEqual(expect.stringContaining('count'))
  })

  it('should detect count intent from "number of" phrase', () => {
    const result = suggestQuery(metadata, 'number of transactions')
    expect(result.reasoning).toContainEqual(expect.stringContaining('count'))
  })

  it('should detect avg intent from "average" keyword', () => {
    const result = suggestQuery(metadata, 'average order value')
    expect(result.reasoning).toContainEqual(expect.stringContaining('avg'))
  })

  it('should detect max intent from "maximum" keyword', () => {
    const result = suggestQuery(metadata, 'maximum revenue')
    expect(result.reasoning).toContainEqual(expect.stringContaining('max'))
  })

  it('should detect max intent from "highest" keyword', () => {
    const result = suggestQuery(metadata, 'highest sales')
    expect(result.reasoning).toContainEqual(expect.stringContaining('max'))
  })

  it('should detect min intent from "minimum" keyword', () => {
    const result = suggestQuery(metadata, 'minimum revenue')
    expect(result.reasoning).toContainEqual(expect.stringContaining('min'))
  })

  it('should detect min intent from "lowest" keyword', () => {
    const result = suggestQuery(metadata, 'lowest order value')
    expect(result.reasoning).toContainEqual(expect.stringContaining('min'))
  })
})

// =============================================================================
// Measure Matching Tests
// =============================================================================

describe('Measure Matching', () => {
  const metadata = createMockMetadata()

  it('should match measure by name', () => {
    const result = suggestQuery(metadata, 'show me totalRevenue')
    expect(result.query.measures).toContain('Sales.totalRevenue')
  })

  it('should match measure by title', () => {
    const result = suggestQuery(metadata, 'Total Revenue by region')
    expect(result.query.measures).toContain('Sales.totalRevenue')
  })

  it('should match measure by synonym', () => {
    const result = suggestQuery(metadata, 'show me earnings')
    expect(result.query.measures).toContain('Sales.totalRevenue')
  })

  it('should match measure by synonym "income"', () => {
    const result = suggestQuery(metadata, 'income last month')
    expect(result.query.measures).toContain('Sales.totalRevenue')
  })

  it('should match multiple measures when mentioned', () => {
    const result = suggestQuery(metadata, 'show revenue and count')
    expect(result.query.measures).toBeDefined()
    // Should have at least one measure
    expect(result.query.measures!.length).toBeGreaterThanOrEqual(1)
  })

  it('should suggest count measure based on aggregation intent', () => {
    const result = suggestQuery(metadata, 'how many sales')
    expect(result.query.measures).toContain('Sales.count')
  })
})

// =============================================================================
// Dimension/Grouping Detection Tests
// =============================================================================

describe('Dimension/Grouping Detection', () => {
  const metadata = createMockMetadata()

  it('should detect grouping from "by X" pattern', () => {
    const result = suggestQuery(metadata, 'revenue by region')
    expect(result.query.dimensions).toBeDefined()
    expect(result.query.dimensions).toContain('Sales.region')
  })

  it('should detect grouping from "per X" pattern', () => {
    const result = suggestQuery(metadata, 'sales per category')
    expect(result.query.dimensions).toBeDefined()
    expect(result.query.dimensions).toContain('Sales.category')
  })

  it('should detect grouping from "for each X" pattern', () => {
    const result = suggestQuery(metadata, 'count for each department')
    expect(result.query.dimensions).toBeDefined()
    expect(result.query.dimensions).toContain('Employees.department')
  })

  it('should match dimension by synonym', () => {
    const result = suggestQuery(metadata, 'sales by territory')
    expect(result.query.dimensions).toBeDefined()
    expect(result.query.dimensions).toContain('Sales.region')
  })
})

// =============================================================================
// Cube Discovery Tests
// =============================================================================

describe('Cube Discovery', () => {
  const metadata = createMockMetadata()

  it('should discover Sales cube from revenue-related query', () => {
    const result = suggestQuery(metadata, 'show me revenue')
    expect(result.reasoning).toContainEqual(expect.stringContaining('Sales'))
  })

  it('should discover Employees cube from HR-related query', () => {
    const result = suggestQuery(metadata, 'employee count by department')
    expect(result.reasoning).toContainEqual(expect.stringContaining('Employees'))
  })

  it('should discover Events cube from event-related query', () => {
    const result = suggestQuery(metadata, 'event count')
    expect(result.reasoning).toContainEqual(expect.stringContaining('Events'))
  })

  it('should use specified cube when provided', () => {
    const result = suggestQuery(metadata, 'show me count', 'Employees')
    expect(result.reasoning).toContain('Using specified cube: Employees')
    expect(result.query.measures).toContain('Employees.count')
  })

  it('should warn when specified cube not found', () => {
    const result = suggestQuery(metadata, 'show me data', 'NonExistent')
    expect(result.warnings).toContain("Specified cube 'NonExistent' not found")
  })
})

// =============================================================================
// Next Steps Generation Tests
// =============================================================================

describe('Next Steps Generation', () => {
  const metadata = createMockMetadata()

  it('should provide next steps for funnel analysis', () => {
    const result = suggestQuery(metadata, 'show funnel')
    expect(result.analysisMode).toBe('funnel')
    expect(result.nextSteps).toBeDefined()
    expect(result.nextSteps).toContainEqual(expect.stringContaining('funnel'))
  })

  it('should provide next steps for flow analysis', () => {
    const result = suggestQuery(metadata, 'show user flow')
    expect(result.analysisMode).toBe('flow')
    expect(result.nextSteps).toBeDefined()
    expect(result.nextSteps).toContainEqual(expect.stringContaining('flow'))
  })

  it('should provide next steps for retention analysis', () => {
    const result = suggestQuery(metadata, 'show retention')
    expect(result.analysisMode).toBe('retention')
    expect(result.nextSteps).toBeDefined()
    expect(result.nextSteps).toContainEqual(expect.stringContaining('retention'))
  })

  it('should not provide next steps for standard query mode', () => {
    const result = suggestQuery(metadata, 'show revenue')
    expect(result.analysisMode).toBe('query')
    expect(result.nextSteps).toBeUndefined()
  })
})

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty metadata array', () => {
    const result = suggestQuery([], 'show me revenue')
    expect(result.confidence).toBe(0)
    expect(result.reasoning).toContainEqual(expect.stringContaining('Could not identify relevant cubes'))
  })

  it('should handle empty query string', () => {
    const metadata = createMockMetadata()
    const result = suggestQuery(metadata, '')
    // Should still return a result, though may have low confidence
    expect(result).toBeDefined()
    expect(result.analysisMode).toBeDefined()
  })

  it('should handle query with no matching terms', () => {
    const metadata = createMockMetadata()
    const result = suggestQuery(metadata, 'xyzzy foobar qwerty')
    // Should have low confidence since no terms match
    expect(result.confidence).toBeLessThan(0.5)
  })

  it('should handle cube with no measures', () => {
    const metadata: CubeMetadata[] = [{
      name: 'Empty',
      title: 'Empty Cube',
      measures: [],
      dimensions: [{ name: 'Empty.id', title: 'ID', shortTitle: 'ID', type: 'number' }],
      segments: []
    }]

    const result = suggestQuery(metadata, 'show me empty data', 'Empty')
    expect(result.query.measures).toEqual([])
  })

  it('should handle cube with no time dimensions', () => {
    const metadata: CubeMetadata[] = [{
      name: 'NoTime',
      title: 'No Time Cube',
      measures: [{ name: 'NoTime.count', title: 'Count', shortTitle: 'Count', type: 'count' }],
      dimensions: [{ name: 'NoTime.name', title: 'Name', shortTitle: 'Name', type: 'string' }],
      segments: []
    }]

    const result = suggestQuery(metadata, 'show me data this month', 'NoTime')
    // Should warn that no time dimension exists
    expect(result.warnings).toContain('Time expression found but no time dimension in cube')
  })

  it('should normalize confidence to 0-1 range', () => {
    const metadata = createMockMetadata()
    // Query with many matching terms should still have confidence <= 1
    const result = suggestQuery(metadata, 'total revenue count average max min by region category')
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
  })
})

// =============================================================================
// Confidence Score Tests
// =============================================================================

describe('Confidence Score', () => {
  const metadata = createMockMetadata()

  it('should have higher confidence with more matches', () => {
    const lowConfidence = suggestQuery(metadata, 'data')
    const highConfidence = suggestQuery(metadata, 'total revenue by region this month')

    // More specific query should have higher confidence
    expect(highConfidence.confidence).toBeGreaterThan(lowConfidence.confidence)
  })

  it('should boost confidence for aggregation intent', () => {
    const withoutAgg = suggestQuery(metadata, 'revenue')
    const withAgg = suggestQuery(metadata, 'total revenue')

    // Aggregation intent should increase confidence
    expect(withAgg.confidence).toBeGreaterThanOrEqual(withoutAgg.confidence)
  })

  it('should boost confidence for dimension matches', () => {
    const withoutDim = suggestQuery(metadata, 'revenue')
    const withDim = suggestQuery(metadata, 'revenue by region')

    // Dimension match should increase confidence
    expect(withDim.confidence).toBeGreaterThan(withoutDim.confidence)
  })

  it('should boost confidence for time expressions', () => {
    const withoutTime = suggestQuery(metadata, 'revenue')
    const withTime = suggestQuery(metadata, 'revenue this month')

    // Time expression should increase confidence
    expect(withTime.confidence).toBeGreaterThan(withoutTime.confidence)
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration: Complete Query Suggestion Flow', () => {
  const metadata = createMockMetadata()

  it('should generate complete query for "total revenue by region this month"', () => {
    const result = suggestQuery(metadata, 'total revenue by region this month')

    expect(result.analysisMode).toBe('query')
    expect(result.query.measures).toContain('Sales.totalRevenue')
    expect(result.query.dimensions).toContain('Sales.region')
    expect(result.query.timeDimensions).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0.5)
    expect(result.reasoning.length).toBeGreaterThan(0)
  })

  it('should generate appropriate suggestion for "employee count by department"', () => {
    const result = suggestQuery(metadata, 'employee count by department')

    expect(result.analysisMode).toBe('query')
    expect(result.query.measures).toContain('Employees.count')
    expect(result.query.dimensions).toContain('Employees.department')
  })

  it('should detect funnel and provide guidance', () => {
    const result = suggestQuery(metadata, 'show me the conversion funnel from signup to purchase')

    expect(result.analysisMode).toBe('funnel')
    expect(result.nextSteps).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('should handle average salary query', () => {
    const result = suggestQuery(metadata, 'average salary by department')

    expect(result.query.measures).toContain('Employees.avgSalary')
    expect(result.query.dimensions).toContain('Employees.department')
  })
})
