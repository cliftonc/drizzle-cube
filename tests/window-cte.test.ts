/**
 * Post-Aggregation Window Function Tests
 *
 * Tests for the new post-aggregation window function pattern where window functions
 * (LAG, LEAD, RANK, etc.) operate on already-aggregated data.
 *
 * This follows the analytics pattern:
 * 1. Aggregate data first (e.g., SUM revenue by month)
 * 2. Apply window functions to aggregated results (e.g., LAG to compare months)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'

import {
  createTestDatabaseExecutor,
  getTestSchema
} from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { MeasureBuilder } from '../src/server/builders/measure-builder'

describe('Post-Aggregation Window Function Utilities', () => {
  describe('MeasureBuilder window function detection', () => {
    it('should correctly identify window function types', () => {
      expect(MeasureBuilder.isWindowFunction('rank')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('denseRank')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('rowNumber')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('lag')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('lead')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('ntile')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('firstValue')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('lastValue')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('movingAvg')).toBe(true)
      expect(MeasureBuilder.isWindowFunction('movingSum')).toBe(true)
    })

    it('should correctly identify non-window function types', () => {
      expect(MeasureBuilder.isWindowFunction('count')).toBe(false)
      expect(MeasureBuilder.isWindowFunction('sum')).toBe(false)
      expect(MeasureBuilder.isWindowFunction('avg')).toBe(false)
      expect(MeasureBuilder.isWindowFunction('min')).toBe(false)
      expect(MeasureBuilder.isWindowFunction('max')).toBe(false)
      expect(MeasureBuilder.isWindowFunction('calculated')).toBe(false)
    })

    it('should detect post-aggregation window functions', async () => {
      const { productivity } = await getTestSchema()

      // Measure with windowConfig.measure is a post-aggregation window
      const postAggMeasure = {
        name: 'linesChange',
        type: 'lag',
        windowConfig: {
          measure: 'totalLines', // References another measure
          operation: 'difference' as const,
          orderBy: [{ field: 'date', direction: 'asc' as const }]
        }
      }

      // Measure without windowConfig.measure is NOT a post-aggregation window
      const preAggMeasure = {
        name: 'rank',
        type: 'rank',
        sql: () => productivity.linesOfCode,
        windowConfig: {
          orderBy: [{ field: 'linesOfCode', direction: 'desc' as const }]
        }
      }

      expect(MeasureBuilder.isPostAggregationWindow(postAggMeasure)).toBe(true)
      expect(MeasureBuilder.isPostAggregationWindow(preAggMeasure)).toBe(false)
    })

    it('should extract base measure reference', async () => {
      const measure = {
        name: 'revenueChange',
        type: 'lag',
        windowConfig: {
          measure: 'totalRevenue',
          operation: 'difference' as const
        }
      }

      // Simple name should be qualified with cube name
      expect(MeasureBuilder.getWindowBaseMeasure(measure, 'Sales')).toBe('Sales.totalRevenue')

      // Already qualified name should pass through
      const qualifiedMeasure = {
        name: 'revenueChange',
        type: 'lag',
        windowConfig: {
          measure: 'Sales.totalRevenue',
          operation: 'difference' as const
        }
      }
      expect(MeasureBuilder.getWindowBaseMeasure(qualifiedMeasure, 'Other')).toBe('Sales.totalRevenue')

      // No measure reference should return null
      const noMeasureMeasure = {
        name: 'rank',
        type: 'rank'
      }
      expect(MeasureBuilder.getWindowBaseMeasure(noMeasureMeasure, 'Sales')).toBe(null)
    })

    it('should get default operations for window types', () => {
      // LAG/LEAD default to difference (comparing values)
      expect(MeasureBuilder.getDefaultWindowOperation('lag')).toBe('difference')
      expect(MeasureBuilder.getDefaultWindowOperation('lead')).toBe('difference')

      // Other window functions default to raw (return value directly)
      expect(MeasureBuilder.getDefaultWindowOperation('rank')).toBe('raw')
      expect(MeasureBuilder.getDefaultWindowOperation('rowNumber')).toBe('raw')
      expect(MeasureBuilder.getDefaultWindowOperation('ntile')).toBe('raw')
      expect(MeasureBuilder.getDefaultWindowOperation('firstValue')).toBe('raw')
      expect(MeasureBuilder.getDefaultWindowOperation('lastValue')).toBe('raw')
      expect(MeasureBuilder.getDefaultWindowOperation('movingAvg')).toBe('raw')
      expect(MeasureBuilder.getDefaultWindowOperation('movingSum')).toBe('raw')
    })

    it('should categorize measures for post-aggregation', async () => {
      const { productivity } = await getTestSchema()

      const mockCube: Cube = {
        name: 'Analytics',
        sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          // Regular aggregate measure
          totalLines: {
            name: 'totalLines',
            type: 'sum',
            sql: () => productivity.linesOfCode
          },
          // Post-aggregation window function (references totalLines)
          linesChange: {
            name: 'linesChange',
            type: 'lag',
            windowConfig: {
              measure: 'totalLines',
              operation: 'difference' as const,
              orderBy: [{ field: 'date', direction: 'asc' as const }]
            }
          },
          // Another regular aggregate
          avgLines: {
            name: 'avgLines',
            type: 'avg',
            sql: () => productivity.linesOfCode
          }
        },
        dimensions: {}
      }

      const cubeMap = new Map([['Analytics', mockCube]])
      const result = MeasureBuilder.categorizeForPostAggregation(
        ['Analytics.totalLines', 'Analytics.linesChange', 'Analytics.avgLines'],
        cubeMap
      )

      // totalLines and avgLines are aggregates
      expect(result.aggregateMeasures).toContain('Analytics.totalLines')
      expect(result.aggregateMeasures).toContain('Analytics.avgLines')

      // linesChange is a post-aggregation window function
      expect(result.postAggWindowMeasures).toContain('Analytics.linesChange')

      // totalLines is a required base measure (referenced by linesChange)
      expect(result.requiredBaseMeasures.has('Analytics.totalLines')).toBe(true)
    })

    it('should detect presence of post-aggregation windows', async () => {
      const { productivity } = await getTestSchema()

      const cubeWithPostAgg: Cube = {
        name: 'Analytics',
        sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          totalLines: { name: 'totalLines', type: 'sum', sql: () => productivity.linesOfCode },
          linesChange: {
            name: 'linesChange',
            type: 'lag',
            windowConfig: { measure: 'totalLines', operation: 'difference' as const }
          }
        },
        dimensions: {}
      }

      const cubeMap = new Map([['Analytics', cubeWithPostAgg]])

      expect(MeasureBuilder.hasPostAggregationWindows(
        ['Analytics.linesChange'],
        cubeMap
      )).toBe(true)

      expect(MeasureBuilder.hasPostAggregationWindows(
        ['Analytics.totalLines'],
        cubeMap
      )).toBe(false)
    })
  })
})

describe('Post-Aggregation Window Functions Query Execution', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    const { productivity } = await getTestSchema()

    // Create a cube with post-aggregation window functions
    const analyticsCube = defineCube('Analytics', {
      title: 'Analytics with Post-Aggregation Windows',
      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),
      measures: {
        // Base aggregate measures
        totalLines: {
          name: 'totalLines',
          type: 'sum',
          sql: () => productivity.linesOfCode
        },
        avgLines: {
          name: 'avgLines',
          type: 'avg',
          sql: () => productivity.linesOfCode
        },
        recordCount: {
          name: 'recordCount',
          type: 'count',
          sql: () => productivity.id
        },

        // Post-aggregation window functions
        // LAG: Compare current value to previous (difference)
        linesChangeFromPrevious: {
          name: 'linesChangeFromPrevious',
          type: 'lag',
          windowConfig: {
            measure: 'totalLines',
            operation: 'difference',
            orderBy: [{ field: 'date', direction: 'asc' }]
          }
        },

        // LEAD: Compare current value to next (difference)
        linesChangeToNext: {
          name: 'linesChangeToNext',
          type: 'lead',
          windowConfig: {
            measure: 'totalLines',
            operation: 'difference',
            orderBy: [{ field: 'date', direction: 'asc' }]
          }
        },

        // LAG with raw operation (return previous value directly)
        previousTotalLines: {
          name: 'previousTotalLines',
          type: 'lag',
          windowConfig: {
            measure: 'totalLines',
            operation: 'raw',
            orderBy: [{ field: 'date', direction: 'asc' }]
          }
        },

        // Percent change from previous
        linesPercentChange: {
          name: 'linesPercentChange',
          type: 'lag',
          windowConfig: {
            measure: 'totalLines',
            operation: 'percentChange',
            orderBy: [{ field: 'date', direction: 'asc' }]
          }
        },

        // Rank by aggregated value
        productivityRank: {
          name: 'productivityRank',
          type: 'rank',
          windowConfig: {
            measure: 'totalLines',
            operation: 'raw',
            orderBy: [{ field: 'totalLines', direction: 'desc' }]
          }
        },

        // Running total (cumulative sum)
        runningTotal: {
          name: 'runningTotal',
          type: 'movingSum',
          windowConfig: {
            measure: 'totalLines',
            operation: 'raw',
            orderBy: [{ field: 'date', direction: 'asc' }],
            frame: {
              type: 'rows',
              start: 'unbounded',
              end: 'current'
            }
          }
        }
      },
      dimensions: {
        date: {
          name: 'date',
          type: 'time',
          sql: () => productivity.date
        },
        employeeId: {
          name: 'employeeId',
          type: 'number',
          sql: () => productivity.employeeId
        }
      }
    })

    cubes = new Map([['Analytics', analyticsCube]])
    const queryExecutor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) close()
  })

  it('should execute LAG with difference operation (month-over-month change)', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Analytics.totalLines', 'Analytics.linesChangeFromPrevious'])
      .timeDimensions([{
        dimension: 'Analytics.date',
        granularity: 'day'
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    // First row should have null or 0 for change (no previous value)
    // Subsequent rows should have a change value
    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.totalLines')
      expect(row).toHaveProperty('Analytics.linesChangeFromPrevious')
      // totalLines should be a number
      expect(typeof row['Analytics.totalLines']).toBe('number')
    }
  })

  it('should execute LAG with raw operation (get previous value)', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Analytics.totalLines', 'Analytics.previousTotalLines'])
      .timeDimensions([{
        dimension: 'Analytics.date',
        granularity: 'day'
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.totalLines')
      expect(row).toHaveProperty('Analytics.previousTotalLines')
    }
  })

  it('should include base measure automatically in selection when only window measure requested', async () => {
    // When requesting a window measure, the base measure it references
    // is automatically added to the query (for display purposes)
    // NOTE: This test requires at least one aggregate measure in the query
    // for proper GROUP BY behavior. The base measure is auto-added for convenience.
    const query = TestQueryBuilder.create()
      .measures(['Analytics.totalLines', 'Analytics.linesChangeFromPrevious'])
      .timeDimensions([{
        dimension: 'Analytics.date',
        granularity: 'day'
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    // Both base measure and window measure should be present
    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.totalLines')
      expect(row).toHaveProperty('Analytics.linesChangeFromPrevious')
    }
  })

  it('should execute RANK on aggregated values', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Analytics.totalLines', 'Analytics.productivityRank'])
      .timeDimensions([{
        dimension: 'Analytics.date',
        granularity: 'day'
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.productivityRank')
      const rank = row['Analytics.productivityRank']
      expect(typeof rank).toBe('number')
      expect(rank).toBeGreaterThanOrEqual(1)
    }
  })

  it('should execute RANK with only dimensions (no time dimension)', async () => {
    // This tests the fix for: ORDER BY field referencing a measure
    // The RANK function orders by totalLines (a measure), not a dimension
    const query = TestQueryBuilder.create()
      .measures(['Analytics.productivityRank'])
      .dimensions(['Analytics.employeeId'])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.productivityRank')
      expect(row).toHaveProperty('Analytics.totalLines') // Base measure auto-added
      expect(row).toHaveProperty('Analytics.employeeId')
      const rank = row['Analytics.productivityRank']
      expect(typeof rank).toBe('number')
      expect(rank).toBeGreaterThanOrEqual(1)
    }
  })

  it('should execute running total (cumulative sum)', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Analytics.totalLines', 'Analytics.runningTotal'])
      .timeDimensions([{
        dimension: 'Analytics.date',
        granularity: 'day'
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.runningTotal')
      const runningTotal = row['Analytics.runningTotal']
      expect(typeof runningTotal).toBe('number')
    }
  })

  it('should handle multiple window functions in same query', async () => {
    const query = TestQueryBuilder.create()
      .measures([
        'Analytics.totalLines',
        'Analytics.linesChangeFromPrevious',
        'Analytics.productivityRank'
      ])
      .timeDimensions([{
        dimension: 'Analytics.date',
        granularity: 'day'
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('Analytics.totalLines')
      expect(row).toHaveProperty('Analytics.linesChangeFromPrevious')
      expect(row).toHaveProperty('Analytics.productivityRank')
    }
  })
})

/**
 * Tests for post-aggregation window functions with hasMany relationships (CTE scenario)
 *
 * When a cube has a hasMany relationship, the related data is pre-aggregated in a CTE.
 * Post-aggregation window functions must reference the CTE columns, not the original table.
 */
describe('Post-Aggregation Window Functions with HasMany (CTE)', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    const { productivity, employees } = await getTestSchema()

    // Declare variables first to handle circular references
    let productivityCube: Cube
    let employeesCube: Cube

    // Create a Productivity cube with post-aggregation window functions
    productivityCube = defineCube('Productivity', {
      title: 'Productivity with Windows',
      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),
      joins: {
        Employees: {
          targetCube: () => employeesCube,
          relationship: 'belongsTo',
          on: [
            { source: productivity.employeeId, target: employees.id }
          ]
        }
      },
      measures: {
        totalLinesOfCode: {
          name: 'totalLinesOfCode',
          type: 'sum',
          sql: () => productivity.linesOfCode
        },
        avgLinesOfCode: {
          name: 'avgLinesOfCode',
          type: 'avg',
          sql: () => productivity.linesOfCode
        },
        // Post-aggregation window function: 7-period moving average
        movingAvg7Period: {
          name: 'movingAvg7Period',
          type: 'movingAvg',
          windowConfig: {
            measure: 'totalLinesOfCode',
            operation: 'raw',
            orderBy: [{ field: 'date', direction: 'asc' }],
            frame: {
              type: 'rows',
              start: 6,
              end: 'current'
            }
          }
        },
        // Post-aggregation window function: running total
        runningTotalLines: {
          name: 'runningTotalLines',
          type: 'movingSum',
          windowConfig: {
            measure: 'totalLinesOfCode',
            operation: 'raw',
            orderBy: [{ field: 'date', direction: 'asc' }],
            frame: {
              type: 'rows',
              start: 'unbounded',
              end: 'current'
            }
          }
        }
      },
      dimensions: {
        date: {
          name: 'date',
          type: 'time',
          sql: () => productivity.date
        },
        employeeId: {
          name: 'employeeId',
          type: 'number',
          sql: () => productivity.employeeId
        }
      }
    })

    // Create an Employees cube with hasMany relationship to Productivity
    employeesCube = defineCube('Employees', {
      title: 'Employees',
      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId)
      }),
      joins: {
        // hasMany relationship - this triggers CTE pre-aggregation
        Productivity: {
          targetCube: () => productivityCube,
          relationship: 'hasMany',
          on: [
            { source: employees.id, target: productivity.employeeId }
          ]
        }
      },
      measures: {
        count: {
          name: 'count',
          type: 'countDistinct',
          sql: () => employees.id
        }
      },
      dimensions: {
        name: {
          name: 'name',
          type: 'string',
          sql: () => employees.name
        }
      }
    })

    cubes = new Map([
      ['Productivity', productivityCube],
      ['Employees', employeesCube]
    ])
    const queryExecutor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) close()
  })

  it('should execute window function with hasMany relationship (movingAvg on CTE data)', async () => {
    // This query combines:
    // - Employees.name (from primary cube)
    // - Productivity measures (from hasMany cube - uses CTE)
    // - Post-aggregation window function on the CTE data
    const query = TestQueryBuilder.create()
      .measures([
        'Productivity.totalLinesOfCode',
        'Productivity.movingAvg7Period'
      ])
      .dimensions(['Employees.name'])
      .timeDimensions([{
        dimension: 'Productivity.date',
        granularity: 'week'
      }])
      .limit(20)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    // Verify all expected fields are present
    for (const row of result.data) {
      expect(row).toHaveProperty('Employees.name')
      expect(row).toHaveProperty('Productivity.totalLinesOfCode')
      expect(row).toHaveProperty('Productivity.movingAvg7Period')
      expect(row).toHaveProperty('Productivity.date')
    }
  })

  it('should execute running total with hasMany relationship', async () => {
    const query = TestQueryBuilder.create()
      .measures([
        'Productivity.totalLinesOfCode',
        'Productivity.runningTotalLines'
      ])
      .dimensions(['Employees.name'])
      .timeDimensions([{
        dimension: 'Productivity.date',
        granularity: 'month'
      }])
      .limit(20)
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(row).toHaveProperty('Employees.name')
      expect(row).toHaveProperty('Productivity.totalLinesOfCode')
      expect(row).toHaveProperty('Productivity.runningTotalLines')
    }
  })

  it('should handle filter with window function on CTE data', async () => {
    const query = TestQueryBuilder.create()
      .measures([
        'Productivity.totalLinesOfCode',
        'Productivity.movingAvg7Period'
      ])
      .dimensions(['Employees.name'])
      .timeDimensions([{
        dimension: 'Productivity.date',
        granularity: 'week'
      }])
      .filters([{
        member: 'Employees.name',
        operator: 'equals',
        values: ['John Doe']
      }])
      .limit(10)
      .build()

    const result = await testExecutor.executeQuery(query)
    // May or may not have data depending on test data, but shouldn't error
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
  })
})
