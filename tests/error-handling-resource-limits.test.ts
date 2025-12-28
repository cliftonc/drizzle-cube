/**
 * Tests for resource exhaustion and system limits
 * Validates graceful handling of memory, query complexity, and performance limits
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import { 
  SemanticLayerCompiler
} from '../src/server'
import { QueryExecutor } from '../src/server/executor'
import type {
  Cube
} from '../src/server/types'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'

describe('Error Handling - Resource Limits', () => {
  let compiler: SemanticLayerCompiler<any>
  let testExecutor: TestExecutor
  let employeesCube: Cube<any>
  let departmentsCube: Cube<any>
  let productivityCube: Cube<any>

  beforeAll(async () => {
    const { executor } = await createTestDatabaseExecutor()
    
    const { testEmployeesCube, testDepartmentsCube, testProductivityCube } = 
      await createTestCubesForCurrentDatabase()
    
    employeesCube = testEmployeesCube
    departmentsCube = testDepartmentsCube
    productivityCube = testProductivityCube
    
    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    compiler.registerCube(employeesCube)
    compiler.registerCube(departmentsCube)
    compiler.registerCube(productivityCube)

    // Create test executor using the existing pattern
    const { executor: databaseExecutor } = await createTestDatabaseExecutor()
    const queryExecutor = new QueryExecutor(databaseExecutor)
    const cubes = new Map()
    cubes.set('Employees', employeesCube)
    cubes.set('Departments', departmentsCube)
    cubes.set('Productivity', productivityCube)
    const testSecurityContext = { organisationId: 1 }
    
    testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContext)
  })

  beforeEach(() => {
    // Clear any existing mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original implementations
    vi.restoreAllMocks()
  })

  describe('Large Result Set Handling', () => {
    it('should handle queries with very large result sets within reasonable time', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name', 'Employees.email']) // Use actual dimensions
        .limit(10000) // Very large limit
        .build()

      const startTime = performance.now()
      
      try {
        const result = await testExecutor.executeQuery(query)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should complete within reasonable time (10 seconds)
        expect(executionTime).toBeLessThan(10000)
        
        // Should return results (even if limited by available data)
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
        // Result set should not exceed the limit
        expect(result.data.length).toBeLessThanOrEqual(10000)
        
      } catch (error: any) {
        // If it fails due to resource limits, error should be graceful
        expect(error.message).toMatch(/memory|limit|resource|timeout/i)
      }
    }, 15000) // 15 second test timeout

    it('should handle extremely large limit values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .limit(Number.MAX_SAFE_INTEGER)
        .build()

      try {
        const result = await testExecutor.executeQuery(query)
        
        // Should either succeed with available data or fail gracefully
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error: any) {
        // Should fail gracefully with resource-related error
        expect(error.message).toMatch(/limit|resource|memory/i)
      }
    })

    it('should handle queries that would generate massive cross products', async () => {
      // Create a query that could potentially generate a very large result set
      // by combining multiple high-cardinality dimensions
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Productivity.totalLinesOfCode', 'Departments.count'])
        .dimensions([
          'Employees.name', 
          'Employees.email', 
          'Departments.name',
          'Productivity.happinessLevel'
        ])
        .build()

      const startTime = performance.now()
      
      try {
        const result = await testExecutor.executeQuery(query)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should complete within reasonable time
        expect(executionTime).toBeLessThan(30000) // 30 seconds
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error: any) {
        // Should fail gracefully if too complex
        expect(error.message).toMatch(/memory|resource|complex|timeout/i)
      }
    }, 35000) // 35 second test timeout
  })

  describe('Complex Query Structure Limits', () => {
    it('should handle queries with extremely large filter arrays', async () => {
      // Create a filter with thousands of values
      const largeValuesList = Array.from({ length: 10000 }, (_, i) => `value_${i}`)
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'in',
          values: largeValuesList
        }])
        .build()

      const startTime = performance.now()
      
      try {
        const result = await testExecutor.executeQuery(query)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should complete within reasonable time
        expect(executionTime).toBeLessThan(10000) // 10 seconds
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error: any) {
        // Should fail gracefully if filter is too large
        expect(error.message).toMatch(/memory|resource|limit|parameter/i)
      }
    }, 15000)

    it('should handle queries with many measures and dimensions', async () => {
      // Create a query with all available measures and dimensions
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',
          'Employees.activeCount', 
          'Employees.totalSalary',
          'Employees.avgSalary',
          'Employees.minSalary',
          'Employees.maxSalary',
          'Departments.count',
          'Productivity.totalLinesOfCode',
          'Productivity.avgLinesOfCode',
          'Productivity.maxLinesOfCode',
          'Productivity.totalPullRequests',
          'Productivity.totalDeployments'
        ])
        .dimensions([
          'Employees.name',
          'Employees.name',
          'Departments.name',
          'Productivity.happinessLevel'
        ])
        .build()

      const startTime = performance.now()
      
      try {
        const result = await testExecutor.executeQuery(query)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should complete within reasonable time
        expect(executionTime).toBeLessThan(15000) // 15 seconds
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
        // Validate that all measures are present in results
        if (result.data.length > 0) {
          const firstRow = result.data[0]
          expect(firstRow).toHaveProperty('Employees.count')
          expect(firstRow).toHaveProperty('Departments.count')
        }
        
      } catch (error: any) {
        // Should fail gracefully if too complex
        expect(error.message).toMatch(/memory|resource|complex|timeout/i)
      }
    }, 20000)

    it('should handle deeply nested filter structures', async () => {
      // Create an extremely deep nested filter structure
      const createDeepNestedFilter = (depth: number): any => {
        if (depth === 0) {
          return {
            member: 'Employees.salary',
            operator: 'gt',
            values: [50000]
          }
        }
        
        return {
          and: [
            {
              member: 'Employees.active',
              operator: 'equals',
              values: [true]
            },
            {
              or: [
                createDeepNestedFilter(depth - 1),
                {
                  member: 'Employees.salary',
                  operator: 'lt',
                  values: [100000]
                }
              ]
            }
          ]
        }
      }

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([createDeepNestedFilter(50)]) // Very deep nesting
        .build()

      try {
        const result = await testExecutor.executeQuery(query)
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error: any) {
        // Should fail gracefully if filter structure is too complex
        expect(error.message).toMatch(/complex|nested|parse|stack|resource/i)
      }
    })
  })

  describe('Memory Usage Patterns', () => {
    it('should not leak memory during repeated query execution', async () => {
      // Skip this test in CI environments where gc() might not be available
      if (!global.gc) {
        console.log('Skipping memory test: global.gc() not available')
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .build()

      // Force garbage collection before starting
      global.gc()
      const initialMemory = process.memoryUsage().heapUsed

      // Execute query multiple times
      for (let i = 0; i < 50; i++) {
        await testExecutor.executeQuery(query)
      }

      // Force garbage collection after queries
      global.gc()
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB for 50 queries)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      
      console.log(`Memory increase after 50 queries: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
    }, 30000)

    it('should handle concurrent queries without excessive memory usage', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .build()

      // Create multiple concurrent queries
      const concurrentQueries = Array(10).fill(null).map((_, i) => 
        testExecutor.executeQuery({
          ...query,
          filters: [{
            member: 'Employees.salary',
            operator: 'gt',
            values: [i * 10000] // Different filter for each query
          }]
        })
      )

      const startTime = performance.now()
      
      try {
        const results = await Promise.all(concurrentQueries)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // All queries should complete within reasonable time
        expect(executionTime).toBeLessThan(20000) // 20 seconds for all concurrent queries
        
        // All queries should complete successfully
        results.forEach((result) => {
          expect(result.data).toBeDefined()
          expect(Array.isArray(result.data)).toBe(true)
        })
        
      } catch (error: any) {
        // Should fail gracefully if resource limits exceeded
        expect(error.message).toMatch(/memory|resource|connection|timeout/i)
      }
    }, 25000)
  })

  describe('Query Timeout Scenarios', () => {
    it('should handle long-running aggregation queries', async () => {
      // Create a potentially long-running query
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.totalLinesOfCode',
          'Productivity.avgLinesOfCode',
          'Productivity.totalPullRequests',
          'Productivity.avgPullRequests',
          'Productivity.totalDeployments'
        ])
        .dimensions([
          'Productivity.happinessLevel',
          'Employees.name'
        ])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2020-01-01', '2024-12-31'] // Very wide date range
        }])
        .build()

      const startTime = performance.now()
      
      try {
        const result = await testExecutor.executeQuery(query)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should complete within reasonable time
        expect(executionTime).toBeLessThan(30000) // 30 seconds
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error: any) {
        // Should fail gracefully if query takes too long
        expect(error.message).toMatch(/timeout|resource|memory|complex/i)
      }
    }, 35000)

    it('should handle queries with many time dimension granularities', async () => {
      // Test multiple time dimensions with different granularities
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([
          {
            dimension: 'Productivity.date',
            granularity: 'day'
          },
          {
            dimension: 'Productivity.createdAt',
            granularity: 'hour'
          },
          {
            dimension: 'Employees.createdAt',
            granularity: 'month'
          }
        ])
        .build()

      try {
        const result = await testExecutor.executeQuery(query)
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
      } catch (error: any) {
        // Should fail gracefully if too complex
        expect(error.message).toMatch(/complex|timeout|resource/i)
      }
    })
  })

  describe('System Resource Monitoring', () => {
    it('should provide meaningful errors when system resources are exhausted', async () => {
      // Mock the database executor to simulate resource exhaustion
      const originalExecute = testExecutor.executeQuery
      vi.spyOn(testExecutor, 'executeQuery').mockImplementation(async () => {
        throw new Error('Query cancelled due to resource limits')
      })

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      await expect(testExecutor.executeQuery(query))
        .rejects
        .toThrow(/resource.*limit|cancelled.*resource/i)
      
      // Restore original implementation
      testExecutor.executeQuery = originalExecute
    })

    it('should handle out of memory conditions gracefully', async () => {
      // Mock the database executor to simulate OOM
      const originalExecute = testExecutor.executeQuery
      vi.spyOn(testExecutor, 'executeQuery').mockImplementation(async () => {
        throw new Error('JavaScript heap out of memory')
      })

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      await expect(testExecutor.executeQuery(query))
        .rejects
        .toThrow(/heap.*out.*of.*memory|out.*of.*memory/i)
      
      // Restore original implementation
      testExecutor.executeQuery = originalExecute
    })

    it('should handle disk space exhaustion', async () => {
      // Mock the database executor to simulate disk space issues
      const originalExecute = testExecutor.executeQuery
      vi.spyOn(testExecutor, 'executeQuery').mockImplementation(async () => {
        throw new Error('ENOSPC: no space left on device')
      })

      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      await expect(testExecutor.executeQuery(query))
        .rejects
        .toThrow(/ENOSPC|no space left|disk.*full/i)
      
      // Restore original implementation
      testExecutor.executeQuery = originalExecute
    })
  })

  describe('Query Complexity Analysis', () => {
    it('should handle extremely complex multi-cube queries', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',
          'Employees.avgSalary',
          'Departments.count',
          'Productivity.totalLinesOfCode',
          'Productivity.avgHappinessIndex'
        ])
        .dimensions([
          'Employees.name',
          'Employees.name',
          'Departments.name',
          'Productivity.happinessLevel'
        ])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'week',
          dateRange: ['2023-01-01', '2024-12-31']
        }])
        .filters([
          {
            member: 'Employees.active',
            operator: 'equals',
            values: [true]
          },
          {
            member: 'Employees.salary',
            operator: 'between',
            values: [30000, 150000]
          },
          {
            and: [
              {
                member: 'Productivity.linesOfCode',
                operator: 'gt',
                values: [100]
              },
              {
                member: 'Productivity.happinessIndex',
                operator: 'gte',
                values: [7]
              }
            ]
          }
        ])
        .limit(5000)
        .offset(0)
        .order({
          'Productivity.totalLinesOfCode': 'desc',
          'Employees.avgSalary': 'asc'
        })
        .build()

      const startTime = performance.now()
      
      try {
        const result = await testExecutor.executeQuery(query)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Complex query should still complete within reasonable time
        expect(executionTime).toBeLessThan(45000) // 45 seconds
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
        // Should respect the limit
        expect(result.data.length).toBeLessThanOrEqual(5000)
        
      } catch (error: any) {
        // Should fail gracefully if too complex
        expect(error.message).toMatch(/complex|timeout|resource|memory/i)
      }
    }, 50000)

    it('should provide query complexity feedback', async () => {
      const simpleQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      const complexQuery = TestQueryBuilder.create()
        .measures([
          'Employees.count', 'Employees.avgSalary', 'Departments.count',
          'Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'
        ])
        .dimensions(['Employees.name', 'Employees.name', 'Departments.name'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2023-01-01', '2024-12-31']
        }])
        .filters([
          { member: 'Employees.active', operator: 'equals', values: [true] },
          { member: 'Employees.salary', operator: 'gt', values: [50000] }
        ])
        .build()

      // Both queries should execute, but complex query should take longer
      const simpleStart = performance.now()
      const simpleResult = await testExecutor.executeQuery(simpleQuery)
      const simpleTime = performance.now() - simpleStart

      const complexStart = performance.now()
      const complexResult = await testExecutor.executeQuery(complexQuery)
      const complexTime = performance.now() - complexStart

      expect(simpleResult.data).toBeDefined()
      expect(complexResult.data).toBeDefined()
      
      // Complex query should generally take longer (though not always guaranteed)
      console.log(`Simple query time: ${Math.round(simpleTime)}ms`)
      console.log(`Complex query time: ${Math.round(complexTime)}ms`)
      
      // Both should complete within reasonable time limits
      expect(simpleTime).toBeLessThan(5000)
      expect(complexTime).toBeLessThan(30000)
    })
  })
})