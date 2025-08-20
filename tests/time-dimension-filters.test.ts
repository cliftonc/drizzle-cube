/**
 * Time Dimension Filter Test Suite
 * Tests filtering on timeDimensions using both the filters array and dateRange property
 * to identify and fix filtering issues
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { 
  createTestDatabase,
  testSchema
} from './helpers/test-database'
import type { TestSchema } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'

import { createPostgresExecutor } from '../src/server'
import { QueryExecutor } from '../src/server/executor'
import { getTestCubes } from './helpers/test-cubes'
import type { Cube } from '../src/server/types-drizzle'

describe('Time Dimension Filters', () => {
  let executor: QueryExecutor<TestSchema>
  let cubes: Map<string, Cube<TestSchema>>

  beforeAll(async () => {
    const { db } = createTestDatabase()
    const dbExecutor = createPostgresExecutor(db, testSchema)
    executor = new QueryExecutor(dbExecutor)
    cubes = getTestCubes(['Employees', 'Productivity'])
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

      console.log('=== Testing timeDimension filter in filters array ===')
      
      // Generate SQL to debug
      const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)
      console.log('Generated SQL:', generatedSQL.sql)
      console.log('Generated Params:', generatedSQL.params)

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)
      
      console.log('Query result data:', JSON.stringify(result.data, null, 2))
      console.log('Query result annotation:', JSON.stringify(result.annotation, null, 2))

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

      console.log('=== Testing timeDimension equals filter in filters array ===')
      
      // Generate SQL to debug
      const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)
      console.log('Generated SQL:', generatedSQL.sql)
      console.log('Generated Params:', generatedSQL.params)

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)
      
      console.log('Query result data:', JSON.stringify(result.data, null, 2))

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

      console.log('=== Testing timeDimension dateRange property ===')
      
      // Generate SQL to debug
      const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)
      console.log('Generated SQL:', generatedSQL.sql)
      console.log('Generated Params:', generatedSQL.params)

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)
      
      console.log('Query result data:', JSON.stringify(result.data, null, 2))

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

      console.log('=== Comparing both filter methods ===')
      
      const result1 = await executor.execute(cubes, query1, testSecurityContexts.org1)
      const result2 = await executor.execute(cubes, query2, testSecurityContexts.org1)

      console.log('Filters array result:', JSON.stringify(result1.data, null, 2))
      console.log('DateRange property result:', JSON.stringify(result2.data, null, 2))

      // Both methods should produce similar filtering results
      expect(result1.data).toBeDefined()
      expect(result2.data).toBeDefined()
      
      // If both have data, the filtered results should be comparable
      if (result1.data.length > 0 && result2.data.length > 0) {
        // Total record count should be similar for same date range
        const total1 = result1.data.reduce((sum, row) => sum + (row['Productivity.recordCount'] || 0), 0)
        const total2 = result2.data.reduce((sum, row) => sum + (row['Productivity.recordCount'] || 0), 0)
        
        console.log('Total records method 1:', total1)
        console.log('Total records method 2:', total2)
        
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

      console.log('=== Debugging exact user example ===')
      
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
      console.log('Unfiltered data:', JSON.stringify(unfilteredResult.data, null, 2))

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
      console.log('Name-only filtered data:', JSON.stringify(nameFilterResult.data, null, 2))

      // Finally, test with both filters
      const generatedSQL = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)
      console.log('Generated SQL for both filters:', generatedSQL.sql)
      console.log('Generated Params:', generatedSQL.params)

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)
      console.log('Both filters result:', JSON.stringify(result.data, null, 2))

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // Compare record counts to see if date filter is actually working
      const unfilteredCount = unfilteredResult.data.length
      const nameOnlyCount = nameFilterResult.data.length  
      const bothFiltersCount = result.data.length
      
      console.log('Unfiltered count:', unfilteredCount)
      console.log('Name-only count:', nameOnlyCount)
      console.log('Both filters count:', bothFiltersCount)
      
      // If date filtering is working, bothFiltersCount should be <= nameOnlyCount
      expect(bothFiltersCount).toBeLessThanOrEqual(nameOnlyCount)
    })
  })
})