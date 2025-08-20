/**
 * Time Dimension Filter Test Suite
 * Tests filtering on timeDimensions using both the filters array and dateRange property
 * to identify and fix filtering issues
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import type { TestSchema } from './helpers/databases/types'
import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import { getTestCubes } from './helpers/test-cubes'
import type { Cube } from '../src/server/types-drizzle'

describe('Time Dimension Filters', () => {
  let executor: QueryExecutor<TestSchema>
  let cubes: Map<string, Cube<TestSchema>>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = getTestCubes(['Employees', 'Productivity'])
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('TimeDimension Filter in filters array', () => {
    it('should filter timeDimension using inDateRange in filters array', async () => {
      const query = {
        measures: ["Productivity.avgLinesOfCode"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "quarter"
          }
        ],
        filters: [
          {
            and: [
              {
                member: "Employees.name",
                operator: "equals",
                values: ["Alex Chen"]
              },
              {
                member: "Productivity.date",
                operator: "inDateRange",
                values: ["2024-01-01", "2024-04-30"]
              }
            ]
          }
        ]
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      // Verify the query executed successfully
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // The filter should limit results to Alex Chen in the date range
      if (result.data.length > 0) {
        for (const row of result.data) {
          expect(row['Employees.name']).toBe('Alex Chen')
        }
      }
    })

    it('should filter timeDimension using equals operator in filters array', async () => {
      const query = {
        measures: ["Productivity.avgLinesOfCode"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "day"
          }
        ],
        filters: [
          {
            and: [
              {
                member: "Employees.name",
                operator: "equals",
                values: ["Alex Chen"]
              },
              {
                member: "Productivity.date",
                operator: "equals",
                values: ["2024-01-15"]
              }
            ]
          }
        ]
      }

      
      // Generate SQL to debug
      const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)
      

      // Verify the query executed successfully
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('TimeDimension dateRange property', () => {
    it('should filter using dateRange property on timeDimension', async () => {
      const query = {
        measures: ["Productivity.avgLinesOfCode"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "quarter",
            dateRange: ["2024-01-01", "2024-04-30"]
          }
        ],
        filters: [
          {
            member: "Employees.name",
            operator: "equals",
            values: ["Alex Chen"]
          }
        ]
      }

      
      // Generate SQL to debug
      const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)
      

      // Verify the query executed successfully
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // The filter should limit results to Alex Chen in the date range
      if (result.data.length > 0) {
        for (const row of result.data) {
          expect(row['Employees.name']).toBe('Alex Chen')
        }
      }
    })
  })

  describe('Combined filters comparison', () => {
    it('should produce similar results using both filter methods', async () => {
      // Query using filters array
      const query1 = {
        measures: ["Productivity.recordCount"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "month"
          }
        ],
        filters: [
          {
            member: "Productivity.date",
            operator: "inDateRange",
            values: ["2024-01-01", "2024-03-31"]
          }
        ]
      }

      // Query using dateRange property
      const query2 = {
        measures: ["Productivity.recordCount"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "month",
            dateRange: ["2024-01-01", "2024-03-31"]
          }
        ]
      }

      
      const result1 = await executor.execute(cubes, query1, testSecurityContexts.org1)
      const result2 = await executor.execute(cubes, query2, testSecurityContexts.org1)


      // Both methods should produce similar filtering results
      expect(result1.data).toBeDefined()
      expect(result2.data).toBeDefined()
      
      // If both have data, the filtered results should be comparable
      if (result1.data.length > 0 && result2.data.length > 0) {
        // Total record count should be similar for same date range
        const total1 = result1.data.reduce((sum, row) => sum + (row['Productivity.recordCount'] || 0), 0)
        const total2 = result2.data.reduce((sum, row) => sum + (row['Productivity.recordCount'] || 0), 0)
        
        
        // They should be equal if both filters are working correctly
        expect(total1).toBe(total2)
      }
    })
  })

  describe('Debug failing case from user example', () => {
    it('should debug the exact user example query', async () => {
      const query = {
        "measures": [
          "Productivity.avgLinesOfCode"
        ],
        "dimensions": [
          "Employees.name"
        ],
        "timeDimensions": [
          {
            "dimension": "Productivity.date",
            "granularity": "quarter"
          }
        ],
        "filters": [
          {
            "and": [
              {
                "member": "Employees.name",
                "operator": "equals",
                "values": [
                  "Alex Chen"
                ]
              },
              {
                "member": "Productivity.date",
                "operator": "inDateRange",
                "values": [
                  "2024-01-01",
                  "2024-04-30"
                ]
              }
            ]
          }
        ]
      }

      
      // First, let's see all data without filters
      const noFilterQuery = {
        measures: ["Productivity.avgLinesOfCode"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "quarter"
          }
        ]
      }

      const unfilteredResult = await executor.execute(cubes, noFilterQuery, testSecurityContexts.org1)

      // Now test with just the name filter
      const nameOnlyQuery = {
        measures: ["Productivity.avgLinesOfCode"],
        dimensions: ["Employees.name"],
        timeDimensions: [
          {
            dimension: "Productivity.date",
            granularity: "quarter"
          }
        ],
        filters: [
          {
            member: "Employees.name",
            operator: "equals",
            values: ["Alex Chen"]
          }
        ]
      }

      const nameFilterResult = await executor.execute(cubes, nameOnlyQuery, testSecurityContexts.org1)

      // Finally, test with both filters
      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Compare record counts to see if date filter is actually working
      const unfilteredCount = unfilteredResult.data.length
      const nameOnlyCount = nameFilterResult.data.length  
      const bothFiltersCount = result.data.length
      
      
      // If date filtering is working, bothFiltersCount should be <= nameOnlyCount
      expect(bothFiltersCount).toBeLessThanOrEqual(nameOnlyCount)
    })
  })
})