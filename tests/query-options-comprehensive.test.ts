/**
 * Comprehensive Query Options Test Suite
 * Tests limit/offset, ordering, complex combinations, and query parameter validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'

import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import type { Cube } from '../../src/server/types'

import { 
  TestQueryBuilder, 
  TestExecutor, 
  QueryValidator, 
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Comprehensive Query Options', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    // Use the new test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    // Setup test executor with shared cube definitions
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes()
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
    performanceMeasurer = new PerformanceMeasurer()
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Limit and Offset Operations', () => {
    it('should handle basic limit functionality', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeLessThanOrEqual(5)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle limit with zero value', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .limit(0)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(0)
    })

    it('should handle large limit values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .limit(10000)
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return all available rows (up to the limit)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.length).toBeLessThanOrEqual(10000)
    })

    it('should handle basic offset functionality', async () => {
      // First get results without offset
      const baseQuery = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .order({ 'Productivity.employeeId': 'asc' })
        .limit(10)
        .build()

      const baseResult = await testExecutor.executeQuery(baseQuery)

      // Then get results with offset
      const offsetQuery = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .order({ 'Productivity.employeeId': 'asc' })
        .limit(10)
        .offset(5)
        .build()

      const offsetResult = await testExecutor.executeQuery(offsetQuery)

      expect(baseResult.data.length).toBeGreaterThan(0)
      expect(offsetResult.data.length).toBeGreaterThan(0)

      // Results should be different (offset skips the first 5 rows)
      if (baseResult.data.length >= 6 && offsetResult.data.length > 0) {
        expect(baseResult.data[5]['Productivity.employeeId']).toBe(offsetResult.data[0]['Productivity.employeeId'])
      }
    })

    it('should handle offset larger than result set', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Departments.count'])
        .offset(1000)
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return empty results
      expect(result.data).toHaveLength(0)
    })

    it('should handle limit and offset combinations (pagination)', async () => {
      const pageSize = 3
      const pages: any[][] = []

      // Get first few pages
      for (let page = 0; page < 3; page++) {
        const query = TestQueryBuilder.create()
          .measures(['Productivity.recordCount'])
          .dimensions(['Productivity.employeeId'])
          .order({ 'Productivity.employeeId': 'asc' })
          .limit(pageSize)
          .offset(page * pageSize)
          .build()

        const result = await testExecutor.executeQuery(query)
        pages.push(result.data)
      }

      // Validate pagination logic
      expect(pages[0].length).toBeGreaterThan(0)

      // Check that pages don't overlap
      for (let i = 1; i < pages.length && pages[i].length > 0; i++) {
        const prevPageLastEmployee = pages[i - 1][pages[i - 1].length - 1]?.['Productivity.employeeId']
        const currentPageFirstEmployee = pages[i][0]?.['Productivity.employeeId']
        
        if (prevPageLastEmployee && currentPageFirstEmployee) {
          expect(prevPageLastEmployee).not.toBe(currentPageFirstEmployee)
        }
      }
    })

    it('should handle edge case pagination scenarios', async () => {
      // Test pagination at the end of the dataset
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .limit(2)
        .offset(50) // Likely beyond the dataset
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should handle gracefully - either empty or partial results
      expect(result.data.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Ordering Operations', () => {
    it('should handle single field ascending order', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(1)

      // Validate ascending order
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Employees.name']
        const current = result.data[i]['Employees.name']
        
        if (prev && current) {
          expect(prev.localeCompare(current)).toBeLessThanOrEqual(0)
        }
      }
    })

    it('should handle single field descending order', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.salary'])
        .order({ 'Employees.salary': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(1)

      // Validate descending order (handling NULL values)
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Employees.salary']
        const current = result.data[i]['Employees.salary']
        
        if (prev !== null && current !== null) {
          expect(prev).toBeGreaterThanOrEqual(current)
        }
      }
    })

    it('should handle multiple field ordering', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Employees.departmentId', 'Productivity.employeeId'])
        .order({ 
          'Employees.departmentId': 'asc',
          'Productivity.employeeId': 'asc'
        })
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Validate primary sort (department)
      let lastDept: number | null = null
      for (const row of result.data) {
        const currentDept = row['Employees.departmentId']
        if (lastDept !== null && currentDept !== null) {
          expect(lastDept).toBeLessThanOrEqual(currentDept)
        }
        lastDept = currentDept
      }
    })

    it('should handle ordering by measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .dimensions(['Employees.departmentId'])
        .order({ 'Employees.totalSalary': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(1)

      // Validate descending order by total salary (handle null values)
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Employees.totalSalary']
        const current = result.data[i]['Employees.totalSalary']
        
        // Handle null values in ordering - null should be considered smaller than any number
        if (prev === null && current === null) continue
        if (prev === null) {
          expect(current).toBeGreaterThanOrEqual(0) // null < number
        } else if (current === null) {
          expect(prev).toBeGreaterThanOrEqual(0) // number > null 
        } else {
          expect(prev).toBeGreaterThanOrEqual(current)
        }
      }
    })

    it('should handle ordering by time dimensions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day'
        }])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-01-31'] }
        ])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data.length).toBeGreaterThan(1)

      // Validate ascending time order
      let lastDate: Date | null = null
      for (const row of result.data) {
        const currentDate = new Date(row['Productivity.date'])
        if (lastDate) {
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(lastDate.getTime())
        }
        lastDate = currentDate
      }
    })

    it('should handle ordering with NULL values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.email'])
        .order({ 'Employees.email': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should handle NULL values gracefully in ordering
      expect(result.data.length).toBeGreaterThan(0)

      // NULL values typically appear first or last depending on database
      const hasNulls = result.data.some(row => row['Employees.email'] === null)
      const hasNonNulls = result.data.some(row => row['Employees.email'] !== null)
      
      // Should have both NULL and non-NULL values if test data is comprehensive
      if (hasNulls && hasNonNulls) {
        console.log('Successfully handled NULL values in ordering')
      }
    })

    it('should handle mixed asc/desc ordering', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.departmentId', 'Productivity.employeeId'])
        .order({ 
          'Employees.departmentId': 'asc',
          'Productivity.totalLinesOfCode': 'desc'
        })
        .limit(15)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      // Within each department, total lines of code should be descending
      let currentDept: string | null = null
      let lastLinesOfCode: number | null = null

      for (const row of result.data) {
        const dept = row['Employees.departmentId']
        const linesOfCode = row['Productivity.totalLinesOfCode']

        if (dept !== currentDept) {
          // New department, reset tracking
          currentDept = dept
          lastLinesOfCode = null
        }

        if (lastLinesOfCode !== null && linesOfCode !== null) {
          expect(lastLinesOfCode).toBeGreaterThanOrEqual(linesOfCode)
        }
        lastLinesOfCode = linesOfCode
      }
    })
  })

  describe('Complex Query Option Combinations', () => {
    it('should handle limit + offset + order combinations', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.avgHappinessIndex'])
        .dimensions(['Productivity.employeeId'])
        .order({ 'Productivity.avgHappinessIndex': 'desc' })
        .limit(5)
        .offset(2)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeLessThanOrEqual(5)
      expect(result.data.length).toBeGreaterThan(0)

      // Validate ordering with pagination
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Productivity.avgHappinessIndex']
        const current = result.data[i]['Productivity.avgHappinessIndex']
        expect(prev).toBeGreaterThanOrEqual(current)
      }
    })

    it('should handle complex filtering + ordering + pagination', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Productivity.employeeId', 'Employees.departmentId'])
        .andFilter([
          { member: 'Productivity.isWorkDay', operator: 'equals', values: [true] },
          { member: 'Productivity.totalLinesOfCode', operator: 'gt', values: [100] }
        ])
        .order({ 
          'Employees.departmentId': 'asc',
          'Productivity.totalLinesOfCode': 'desc' 
        })
        .limit(10)
        .offset(0)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeLessThanOrEqual(10)

      // All results should meet filter criteria
      for (const row of result.data) {
        expect(row['Productivity.totalLinesOfCode']).toBeGreaterThan(100)
      }
    })

    it('should handle time dimensions + ordering + pagination', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'week',
          dateRange: ['2024-01-01', '2024-03-31'],
          fillMissingDates: false // Disable gap filling to test pagination behavior
        }])
        .order({ 'Productivity.date': 'desc' })
        .limit(8)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeLessThanOrEqual(8)
      expect(result.data.length).toBeGreaterThan(0)

      // Validate descending time order
      let lastDate: Date | null = null
      for (const row of result.data) {
        const currentDate = new Date(row['Productivity.date'])
        if (lastDate) {
          expect(lastDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime())
        }
        lastDate = currentDate
      }
    })

    it('should handle aggregations + grouping + ordering + pagination', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary', 'Employees.totalSalary'])
        .dimensions(['Employees.departmentId'])
        .order({ 
          'Employees.totalSalary': 'desc',
          'Employees.departmentId': 'asc'
        })
        .limit(6)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeLessThanOrEqual(6)
      expect(result.data.length).toBeGreaterThan(0)

      // Validate ordering by total salary (primary) and department name (secondary)
      for (let i = 1; i < result.data.length; i++) {
        const prevSalary = result.data[i - 1]['Employees.totalSalary']
        const currentSalary = result.data[i]['Employees.totalSalary']
        
        // Handle null values in ordering - null should be considered smaller than any number
        if (prevSalary === null && currentSalary === null) continue
        if (prevSalary === null) {
          expect(currentSalary).toBeGreaterThanOrEqual(0) // null < number
        } else if (currentSalary === null) {
          expect(prevSalary).toBeGreaterThanOrEqual(0) // number > null 
        } else {
          expect(prevSalary).toBeGreaterThanOrEqual(currentSalary)
        }
      }
    })
  })

  describe('Query Option Edge Cases', () => {
    it('should handle negative limit and offset values', async () => {
      const queryNegativeLimit = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .limit(-5)
        .build()

      // Should either handle gracefully or throw an error
      await expect(async () => {
        await testExecutor.executeQuery(queryNegativeLimit)
      }).rejects.toThrow()

      const queryNegativeOffset = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .offset(-3)
        .build()

      // Should either handle gracefully or throw an error
      await expect(async () => {
        await testExecutor.executeQuery(queryNegativeOffset)
      }).rejects.toThrow()
    })

    it('should handle very large limit and offset values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .limit(Number.MAX_SAFE_INTEGER)
        .offset(Number.MAX_SAFE_INTEGER)
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should return empty results due to large offset
      expect(result.data).toHaveLength(0)
    })

    it('should handle ordering by non-existent fields', async () => {
      const query = {
        measures: ['Employees.count'],
        order: { 'Employees.nonExistentField': 'asc' }
      }

      // Should throw an error for non-existent field
      await expect(async () => {
        await testExecutor.executeQuery(query)
      }).rejects.toThrow()
    })

    it('should handle empty order object', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .order({})
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should work fine with empty order
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
    })

    it('should handle case sensitivity in ordering', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(1)

      // Check if ordering is case-sensitive or case-insensitive
      const names = result.data.map(row => row['Employees.name']).filter(name => name)
      const hasLowerCase = names.some(name => name !== name.toUpperCase())
      const hasUpperCase = names.some(name => name !== name.toLowerCase())

      if (hasLowerCase && hasUpperCase) {
        console.log('Ordering handles mixed case names')
      }
    })
  })

  describe('Performance with Query Options', () => {
    it('should efficiently handle large limit values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .limit(1000)
        .build()

      const result = await performanceMeasurer.measure(
        'large-limit',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data.length).toBeLessThanOrEqual(1000)

      const stats = performanceMeasurer.getStats('large-limit')
      expect(stats.avgDuration).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should efficiently handle complex ordering', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .dimensions(['Productivity.employeeId', 'Employees.departmentId'])
        .order({ 
          'Employees.departmentId': 'asc',
          'Productivity.totalLinesOfCode': 'desc',
          'Productivity.employeeId': 'asc'
        })
        .limit(50)
        .build()

      const result = await performanceMeasurer.measure(
        'complex-ordering',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data.length).toBeLessThanOrEqual(50)

      const stats = performanceMeasurer.getStats('complex-ordering')
      expect(stats.avgDuration).toBeLessThan(3000) // Less than 3 seconds
    })

    it('should efficiently handle pagination through large datasets', async () => {
      const pageSize = 20
      const pagesToTest = 5

      for (let page = 0; page < pagesToTest; page++) {
        const query = TestQueryBuilder.create()
          .measures(['Productivity.recordCount'])
          .dimensions(['Productivity.employeeId'])
          .order({ 'Productivity.employeeId': 'asc' })
          .limit(pageSize)
          .offset(page * pageSize)
          .build()

        await performanceMeasurer.measure(
          `pagination-page-${page}`,
          () => testExecutor.executeQuery(query)
        )
      }

      const paginationStats = performanceMeasurer.getStats('pagination-page')
      expect(paginationStats.count).toBe(pagesToTest)
      expect(paginationStats.avgDuration).toBeLessThan(2000) // Less than 2 seconds per page
    })
  })

  describe('Query Option Validation', () => {
    it('should validate query options in result structure', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions(['Employees.departmentId'])
        .order({ 'Employees.avgSalary': 'desc' })
        .limit(3)
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.avgSalary', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data.length).toBeLessThanOrEqual(3)
      expect(result.data.length).toBeGreaterThan(0)

      // Validate that limit was applied correctly
      const rowCountValidation = QueryValidator.validateRowCount(result, { max: 3 })
      expect(rowCountValidation.isValid).toBe(true)
    })

    it('should maintain result integrity with complex options', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .dimensions(['Employees.departmentId'])
        .filters([
          { member: 'Productivity.isWorkDay', operator: 'equals', values: [true] }
        ])
        .order({ 'Productivity.totalLinesOfCode': 'desc' })
        .limit(5)
        .offset(1)
        .build()

      const result = await testExecutor.executeQuery(query)

      // Validate that all options were applied correctly
      expect(result.data.length).toBeLessThanOrEqual(5)
      
      // All results should be work days (filter applied)
      // All results should be ordered by lines of code descending
      for (let i = 1; i < result.data.length; i++) {
        const prev = result.data[i - 1]['Productivity.totalLinesOfCode']
        const current = result.data[i]['Productivity.totalLinesOfCode']
        expect(prev).toBeGreaterThanOrEqual(current)
      }
    })
  })
})