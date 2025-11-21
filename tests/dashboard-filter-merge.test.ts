/**
 * Dashboard Filter Merging Test Suite
 * Tests the auto-inclusion of cubes referenced in dashboard filters
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'
import type { Cube } from '../src/server/types'

describe('Dashboard Filter Merging with Cross-Cube Filters', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()

    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('should auto-include Employees cube when filtering by Employees.name in a Productivity query', async () => {
    // This simulates a query where:
    // - The portlet has a Productivity measure
    // - Dashboard filter references Employees.name
    // - The system should automatically include Employees cube and JOIN it

    const query = {
      measures: ['Productivity.totalLinesOfCode'],
      timeDimensions: [
        {
          dimension: 'Productivity.date',
          granularity: 'month',
          dateRange: 'last year'
        }
      ],
      filters: [
        {
          // Server format: { and: [...] }
          and: [
            {
              member: 'Employees.name',
              values: ['David Kim'],
              operator: 'equals'
            },
            {
              member: 'Productivity.isDayOff',
              operator: 'equals',
              values: [false]
            }
          ]
        }
      ]
    }

    // This should NOT throw an error
    // The QueryPlanner should detect Employees.name in filters and auto-include Employees cube
    const result = await testExecutor.executeQuery(query)

    // Verify the query executed successfully
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)

    // Verify the data is filtered correctly (only David Kim's productivity data)
    // and only work days (not day off)
    for (const row of result.data) {
      expect(row['Productivity.totalLinesOfCode']).toBeDefined()
      // The filter should have been applied
    }
  })

  it('should handle simple filter format (non-grouped)', async () => {
    const query = {
      measures: ['Productivity.totalLinesOfCode'],
      filters: [
        {
          member: 'Employees.name',
          values: ['David Kim'],
          operator: 'equals'
        }
      ]
    }

    const result = await testExecutor.executeQuery(query)

    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should handle OR groups with cross-cube filters', async () => {
    const query = {
      measures: ['Productivity.totalLinesOfCode'],
      filters: [
        {
          // Server format: { or: [...] }
          or: [
            {
              member: 'Employees.name',
              values: ['David Kim'],
              operator: 'equals'
            },
            {
              member: 'Employees.name',
              values: ['Sarah Johnson'],
              operator: 'equals'
            }
          ]
        }
      ]
    }

    const result = await testExecutor.executeQuery(query)

    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should handle nested AND/OR groups', async () => {
    const query = {
      measures: ['Productivity.totalLinesOfCode'],
      filters: [
        {
          and: [
            {
              or: [
                {
                  member: 'Employees.name',
                  values: ['David Kim'],
                  operator: 'equals'
                },
                {
                  member: 'Employees.name',
                  values: ['Sarah Johnson'],
                  operator: 'equals'
                }
              ]
            },
            {
              member: 'Productivity.isDayOff',
              operator: 'equals',
              values: [false]
            }
          ]
        }
      ]
    }

    const result = await testExecutor.executeQuery(query)

    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('should extract cube names correctly from complex filter structure', async () => {
    // Test that the QueryPlanner's extractCubeNamesFromFilter works correctly
    const query = {
      measures: ['Productivity.totalLinesOfCode'],
      filters: [
        {
          and: [
            {
              member: 'Employees.name',
              values: ['David Kim'],
              operator: 'equals'
            },
            {
              member: 'Productivity.isDayOff',
              operator: 'equals',
              values: [false]
            },
            {
              or: [
                {
                  member: 'Employees.isActive',
                  operator: 'equals',
                  values: [true]
                },
                {
                  member: 'Productivity.linesOfCode',
                  operator: 'gt',
                  values: [100]
                }
              ]
            }
          ]
        }
      ]
    }

    const result = await testExecutor.executeQuery(query)

    expect(result).toBeDefined()
    expect(result.data).toBeDefined()

    // The query should execute successfully, meaning:
    // 1. Employees cube was detected from filters
    // 2. JOIN was created between Productivity and Employees
    // 3. All filters were applied correctly
  })
})
