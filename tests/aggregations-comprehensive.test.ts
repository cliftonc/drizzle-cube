/**
 * Comprehensive Aggregations Test Suite
 * Tests all measure types, combinations, NULL handling, and complex aggregation scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import type { TestSchema } from './helpers/databases/types'
import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import type { Cube } from '../src/server/types-drizzle'

import { 
  TestQueryBuilder, 
  TestExecutor, 
  QueryValidator, 
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Comprehensive Aggregations', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube<TestSchema>>
  let close: () => void

  beforeAll(async () => {
    // Use the new test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    // Setup test executor with all cube definitions
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes() // Get all cubes (now async)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
    performanceMeasurer = new PerformanceMeasurer()
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Basic Aggregation Types', () => {
    it('should handle COUNT aggregation correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count'],
        { 'Employees.count': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
      expect(Number.isInteger(result.data[0]['Employees.count'])).toBe(true)
    })

    it('should handle SUM aggregation correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.totalSalary'],
        { 'Employees.totalSalary': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.totalSalary']).toBeGreaterThan(0)
    })

    it('should handle AVG aggregation correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.avgSalary'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.avgSalary'],
        { 'Employees.avgSalary': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.avgSalary']).toBeGreaterThan(0)
    })

    it('should handle MIN aggregation correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.minSalary'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.minSalary'],
        { 'Employees.minSalary': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.minSalary']).toBeGreaterThan(0)
    })

    it('should handle MAX aggregation correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.maxSalary'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.maxSalary'],
        { 'Employees.maxSalary': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.maxSalary']).toBeGreaterThan(0)
    })

    it('should handle COUNT DISTINCT aggregation correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.countDistinctDepartments'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.countDistinctDepartments'],
        { 'Employees.countDistinctDepartments': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.countDistinctDepartments']).toBeGreaterThan(0)
      expect(Number.isInteger(result.data[0]['Employees.countDistinctDepartments'])).toBe(true)
    })
  })

  describe('Conditional Aggregations (Filtered Measures)', () => {
    it('should handle filtered COUNT measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.activeCount', 'Employees.inactiveCount', 'Employees.count'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      const row = result.data[0]
      
      // Active + Inactive should equal total count
      expect(row['Employees.activeCount'] + row['Employees.inactiveCount']).toBe(row['Employees.count'])
      
      // Active count should be greater than inactive count (based on test data)
      expect(row['Employees.activeCount']).toBeGreaterThan(row['Employees.inactiveCount'])
    })

    it('should handle complex filtered measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.workingDaysCount', 'Productivity.daysOffCount', 'Productivity.recordCount'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      const row = result.data[0]
      
      // Working days + days off should equal total records
      expect(row['Productivity.workingDaysCount'] + row['Productivity.daysOffCount']).toBe(row['Productivity.recordCount'])
      
      // Working days should be much greater than days off
      expect(row['Productivity.workingDaysCount']).toBeGreaterThan(row['Productivity.daysOffCount'])
    })

    it('should handle multiple complex filter conditions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.highProductivityDays', 'Productivity.happyWorkDays', 'Productivity.workingDaysCount'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      const row = result.data[0]
      
      // High productivity and happy work days should be subsets of total working days
      expect(row['Productivity.highProductivityDays']).toBeLessThanOrEqual(row['Productivity.workingDaysCount'])
      expect(row['Productivity.happyWorkDays']).toBeLessThanOrEqual(row['Productivity.workingDaysCount'])
    })
  })

  describe('Multiple Aggregation Combinations', () => {
    it('should handle multiple COUNT aggregations', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count', 
          'Employees.activeCount', 
          'Productivity.recordCount', 
          'Productivity.workingDaysCount'
        ])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.activeCount', 'Productivity.recordCount', 'Productivity.workingDaysCount']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)

      const row = result.data[0]
      for (const measure of Object.keys(row)) {
        expect(typeof row[measure]).toBe('number')
        expect(Number.isInteger(row[measure])).toBe(true)
        expect(row[measure]).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle multiple SUM aggregations', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.totalSalary',
          'Productivity.totalLinesOfCode',
          'Productivity.totalPullRequests',
          'Productivity.totalDeployments'
        ])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.totalSalary', 'Productivity.totalLinesOfCode', 'Productivity.totalPullRequests', 'Productivity.totalDeployments']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)

      const row = result.data[0]
      for (const measure of Object.keys(row)) {
        expect(typeof row[measure]).toBe('number')
        expect(row[measure]).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle mixed aggregation types', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',           // COUNT
          'Employees.totalSalary',     // SUM
          'Employees.avgSalary',       // AVG
          'Employees.minSalary',       // MIN
          'Employees.maxSalary',       // MAX
          'Employees.countDistinctDepartments' // COUNT DISTINCT
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      const row = result.data[0]

      // Validate mathematical relationships
      expect(row['Employees.avgSalary']).toBeGreaterThanOrEqual(row['Employees.minSalary'])
      expect(row['Employees.avgSalary']).toBeLessThanOrEqual(row['Employees.maxSalary'])
      expect(row['Employees.minSalary']).toBeLessThanOrEqual(row['Employees.maxSalary'])
      
      // Count distinct departments should be reasonable
      expect(row['Employees.countDistinctDepartments']).toBeLessThanOrEqual(row['Employees.count'])
      expect(row['Employees.countDistinctDepartments']).toBeGreaterThan(0)
    })
  })

  describe('Aggregations with Grouping', () => {
    it('should handle aggregations with single dimension grouping', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions(['Employees.departmentId'])
        .order({ 'Employees.count': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(1) // Multiple departments
      
      // Each department should have positive count and salary
      for (const row of result.data) {
        expect(row['Employees.count']).toBeGreaterThan(0)
        // Some departments might have null avgSalary if all employees have null salary
        if (row['Employees.avgSalary'] !== null) {
          expect(row['Employees.avgSalary']).toBeGreaterThan(0)
        }
        expect(['number', 'object'].includes(typeof row['Employees.departmentId']) && (typeof row['Employees.departmentId'] !== 'object' || row['Employees.departmentId'] === null)).toBe(true)
      }
    })

    it('should handle aggregations with multiple dimension grouping', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.avgHappinessIndex'])
        .dimensions(['Employees.departmentId', 'Productivity.happinessLevel'])
        .order({ 'Productivity.recordCount': 'desc' })
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      
      // Validate grouping integrity
      for (const row of result.data) {
        expect(row['Productivity.recordCount']).toBeGreaterThan(0)
        expect(row['Productivity.avgHappinessIndex']).toBeGreaterThanOrEqual(1)
        expect(row['Productivity.avgHappinessIndex']).toBeLessThanOrEqual(10)
      }
    })

    it('should handle aggregations with time dimension grouping', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month'
        }])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-06-30'] }
        ])
        .order({ 'Productivity.date': 'asc' })
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.length).toBeLessThanOrEqual(6) // Max 6 months

      // Validate time ordering and aggregation values
      let previousDate: Date | null = null
      for (const row of result.data) {
        const currentDate = new Date(row['Productivity.date'])
        if (previousDate) {
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime())
        }
        previousDate = currentDate
        
        expect(row['Productivity.totalLinesOfCode']).toBeGreaterThanOrEqual(0)
        expect(row['Productivity.avgHappinessIndex']).toBeGreaterThanOrEqual(1)
        expect(row['Productivity.avgHappinessIndex']).toBeLessThanOrEqual(10)
      }
    })
  })

  describe('NULL Value Handling in Aggregations', () => {
    it('should handle COUNT with NULL values correctly', async () => {
      // COUNT should count all rows, including those with NULL values in other columns
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.salary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // Should have rows for both NULL and non-NULL salaries
      const nullSalaryRow = result.data.find(row => row['Employees.salary'] === null)
      const nonNullSalaryRows = result.data.filter(row => row['Employees.salary'] !== null)

      expect(nonNullSalaryRows.length).toBeGreaterThan(0)
      
      if (nullSalaryRow) {
        expect(nullSalaryRow['Employees.count']).toBeGreaterThan(0)
      }
    })

    it('should handle SUM with NULL values correctly', async () => {
      // SUM should ignore NULL values
      const query = TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .filter('Employees.salary', 'set', []) // Only non-NULL salaries
        .build()

      const resultWithNulls = await testExecutor.executeQuery({
        measures: ['Employees.totalSalary']
      })

      const resultWithoutNulls = await testExecutor.executeQuery(query)

      // Both should be equal since SUM ignores NULLs
      expect(resultWithNulls.data[0]['Employees.totalSalary']).toBe(resultWithoutNulls.data[0]['Employees.totalSalary'])
    })

    it('should handle AVG with NULL values correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.avgSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // AVG should ignore NULL values and compute average of non-NULL values
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.avgSalary']).toBeGreaterThan(0)
    })

    it('should handle MIN/MAX with NULL values correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.minSalary', 'Employees.maxSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // MIN/MAX should ignore NULL values
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.minSalary']).toBeGreaterThan(0)
      expect(result.data[0]['Employees.maxSalary']).toBeGreaterThan(0)
      expect(result.data[0]['Employees.minSalary']).toBeLessThanOrEqual(result.data[0]['Employees.maxSalary'])
    })

    it('should handle COUNT DISTINCT with NULL values correctly', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.countDistinctDepartments'])
        .build()

      const result = await testExecutor.executeQuery(query)

      // COUNT DISTINCT should ignore NULL values
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.countDistinctDepartments']).toBeGreaterThan(0)
    })
  })

  describe('Complex Calculated Aggregations', () => {
    it('should handle complex calculated measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.productivityScore'])
        .dimensions(['Employees.name'])
        .order({ 'Productivity.productivityScore': 'desc' })
        .limit(5)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.length).toBeLessThanOrEqual(5)

      // Validate productivity scores are reasonable
      for (const row of result.data) {
        expect(row['Productivity.productivityScore']).toBeGreaterThanOrEqual(0)
        expect(typeof row['Employees.name']).toBe('string')
      }
    })

    it('should handle multiple complex measures together', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.productivityScore',
          'Productivity.avgHappinessIndex',
          'Productivity.totalLinesOfCode',
          'Productivity.workingDaysCount'
        ])
        .dimensions(['Employees.departmentId'])
        .filters([
          { member: 'Productivity.isWorkDay', operator: 'equals', values: [true] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)

      for (const row of result.data) {
        // All measures should have reasonable values
        expect(row['Productivity.productivityScore']).toBeGreaterThanOrEqual(0)
        expect(row['Productivity.avgHappinessIndex']).toBeGreaterThanOrEqual(1)
        expect(row['Productivity.avgHappinessIndex']).toBeLessThanOrEqual(10)
        expect(row['Productivity.totalLinesOfCode']).toBeGreaterThanOrEqual(0)
        expect(row['Productivity.workingDaysCount']).toBeGreaterThan(0)
      }
    })
  })

  describe('Aggregation Performance and Scalability', () => {
    it('should efficiently compute multiple aggregations', async () => {
      const allMeasures = [
        'Employees.count', 'Employees.totalSalary', 'Employees.avgSalary',
        'Productivity.recordCount', 'Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex',
        'Departments.count', 'Departments.totalBudget'
      ]

      const query = TestQueryBuilder.create()
        .measures(allMeasures)
        .build()

      const result = await performanceMeasurer.measure(
        'multiple-aggregations',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data).toHaveLength(1)
      
      // Validate all measures are present and have reasonable values
      for (const measure of allMeasures) {
        expect(result.data[0]).toHaveProperty(measure)
        const value = result.data[0][measure]
        // Aggregations can return null when no matching data exists
        if (value !== null) {
          expect(typeof value).toBe('number')
          expect(value).toBeGreaterThanOrEqual(0)
        }
      }

      // Performance should be reasonable
      const stats = performanceMeasurer.getStats('multiple-aggregations')
      expect(stats.avgDuration).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should efficiently handle aggregations with large groupings', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.recordCount', 'Productivity.avgLinesOfCode'])
        .dimensions(['Employees.name', 'Productivity.date'])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-03-31'] }
        ])
        .limit(100)
        .build()

      const result = await performanceMeasurer.measure(
        'large-grouping',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.length).toBeLessThanOrEqual(100)

      // Performance should be reasonable even with many groups
      const stats = performanceMeasurer.getStats('large-grouping')
      expect(stats.avgDuration).toBeLessThan(10000) // Less than 10 seconds
    })

    it('should efficiently handle complex filtered aggregations', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.workingDaysCount',
          'Productivity.daysOffCount',
          'Productivity.highProductivityDays',
          'Productivity.happyWorkDays'
        ])
        .dimensions(['Employees.departmentId'])
        .build()

      const result = await performanceMeasurer.measure(
        'complex-filtered-aggregations',
        () => testExecutor.executeQuery(query)
      )

      expect(result.data.length).toBeGreaterThan(0)

      // Validate logical relationships between filtered measures
      for (const row of result.data) {
        expect(row['Productivity.workingDaysCount']).toBeGreaterThanOrEqual(row['Productivity.highProductivityDays'])
        expect(row['Productivity.workingDaysCount']).toBeGreaterThanOrEqual(row['Productivity.happyWorkDays'])
      }

      // Performance should be reasonable
      const stats = performanceMeasurer.getStats('complex-filtered-aggregations')
      expect(stats.avgDuration).toBeLessThan(3000) // Less than 3 seconds
    })
  })

  describe('Aggregation Annotation Validation', () => {
    it('should provide correct measure annotations', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary', 'Productivity.totalLinesOfCode'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.annotation).toBeDefined()
      expect(result.annotation.measures).toBeDefined()

      // Check COUNT annotation
      const countAnnotation = result.annotation.measures['Employees.count']
      expect(countAnnotation).toBeDefined()
      expect(countAnnotation.type).toBe('countDistinct')
      expect(countAnnotation.title).toBe('Total Employees')

      // Check AVG annotation
      const avgAnnotation = result.annotation.measures['Employees.avgSalary']
      expect(avgAnnotation).toBeDefined()
      expect(avgAnnotation.type).toBe('avg')
      expect(avgAnnotation.title).toBe('Average Salary')

      // Check SUM annotation
      const sumAnnotation = result.annotation.measures['Productivity.totalLinesOfCode']
      expect(sumAnnotation).toBeDefined()
      expect(sumAnnotation.type).toBe('sum')
      expect(sumAnnotation.title).toBe('Total Lines of Code')
    })

    it('should handle annotations for filtered measures', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.activeCount', 'Productivity.workingDaysCount'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.annotation.measures['Employees.activeCount']).toBeDefined()
      expect(result.annotation.measures['Employees.activeCount'].type).toBe('countDistinct')
      expect(result.annotation.measures['Employees.activeCount'].title).toBe('Active Employees')

      expect(result.annotation.measures['Productivity.workingDaysCount']).toBeDefined()
      expect(result.annotation.measures['Productivity.workingDaysCount'].type).toBe('count')
      expect(result.annotation.measures['Productivity.workingDaysCount'].title).toBe('Working Days')
    })
  })

  afterAll(() => {
    // Output performance statistics
    const allStats = performanceMeasurer.getStats()
    console.log(`Total measurements: ${allStats.count}`)
    console.log(`Average duration: ${allStats.avgDuration.toFixed(2)}ms`)
    console.log(`Min duration: ${allStats.minDuration.toFixed(2)}ms`)
    console.log(`Max duration: ${allStats.maxDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${allStats.totalDuration.toFixed(2)}ms`)
  })
})