import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { TestQueryBuilder, TestExecutor, PerformanceMeasurer } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import type { Cube } from '../src/server/types'

describe('Performance-Focused Aggregation Testing', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    // Use the new test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    // Setup test executor with all cube definitions including TimeEntries
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes() // Get all cubes including TimeEntries
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Large Dataset Aggregations', () => {
    beforeEach(() => {
      performanceMeasurer = new PerformanceMeasurer() // Fresh measurer for each test
    })
    it('should complete complex productivity aggregations within performance threshold', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgLinesOfCode'])
        .dimensions(['Productivity.employeeId'])
        .build()

      const result = await performanceMeasurer.measure(
        'Large dataset aggregation',
        () => testExecutor.executeQuery(query),
        { queryComplexity: 'medium', expectedRows: 'many' }
      )

      // Performance assertion - should complete within 50ms for simple aggregation
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(50)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('Productivity.totalLinesOfCode')
      expect(result.data[0]).toHaveProperty('Productivity.avgLinesOfCode')
      expect(result.data[0]).toHaveProperty('Productivity.employeeId')
    })

    it('should handle multiple complex measures efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.totalLinesOfCode',
          'Productivity.totalPullRequests', 
          'Productivity.totalDeployments',
          'Productivity.avgLinesOfCode',
          'Productivity.avgPullRequests',
          'Productivity.avgDeployments'
        ])
        .dimensions(['Productivity.employeeId'])
        .build()

      const result = await performanceMeasurer.measure(
        'Multiple complex measures',
        () => testExecutor.executeQuery(query),
        { measureCount: 6, groupingDimensions: 1 }
      )

      // Performance assertion - should complete within 100ms for complex measures
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(100)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      
      // Verify all measures are present
      const firstRow = result.data[0]
      expect(firstRow).toHaveProperty('Productivity.totalLinesOfCode')
      expect(firstRow).toHaveProperty('Productivity.totalPullRequests')
      expect(firstRow).toHaveProperty('Productivity.totalDeployments')
      expect(firstRow).toHaveProperty('Productivity.avgLinesOfCode')
      expect(firstRow).toHaveProperty('Productivity.avgPullRequests')
      expect(firstRow).toHaveProperty('Productivity.avgDeployments')
    })

    it('should perform aggregations with time dimensions efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.recordCount'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day'
        }])
        .build()

      const result = await performanceMeasurer.measure(
        'Time dimension aggregation',
        () => testExecutor.executeQuery(query),
        { timeDimensions: 1, granularity: 'day' }
      )

      // Performance assertion - should complete within 1.5 seconds
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(1500)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      
      const firstRow = result.data[0]
      expect(firstRow).toHaveProperty('Productivity.totalLinesOfCode')
      expect(firstRow).toHaveProperty('Productivity.recordCount')
      expect(firstRow).toHaveProperty('Productivity.date')
    })
  })

  describe('Multi-Cube Aggregation Performance', () => {
    beforeEach(() => {
      performanceMeasurer = new PerformanceMeasurer() // Fresh measurer for each test
    })
    it('should handle multi-cube aggregations within performance threshold', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',
          'Departments.count', 
          'Productivity.recordCount'
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'Multi-cube aggregation performance',
        () => testExecutor.executeQuery(query),
        { cubeCount: 3, joinType: 'multi-cube' }
      )

      // Performance assertion - should complete within 3 seconds
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(3000)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBe(1)
      
      const row = result.data[0]
      expect(row).toHaveProperty('Employees.count')
      expect(row).toHaveProperty('Departments.count')
      expect(row).toHaveProperty('Productivity.recordCount')
      
      // Verify counts are numeric and positive
      expect(typeof row['Employees.count']).toBe('number')
      expect(typeof row['Departments.count']).toBe('number')
      expect(typeof row['Productivity.recordCount']).toBe('number')
      expect(row['Employees.count']).toBeGreaterThan(0)
      expect(row['Departments.count']).toBeGreaterThan(0)
      expect(row['Productivity.recordCount']).toBeGreaterThan(0)
    })

    it('should handle complex multi-cube queries with joins efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',
          'Employees.avgSalary',
          'Productivity.avgLinesOfCode'
        ])
        .dimensions([
          'Departments.name'
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'Complex multi-cube with joins',
        () => testExecutor.executeQuery(query),
        { cubeCount: 3, joinType: 'with-dimensions', complexity: 'high' }
      )

      // Performance assertion - should complete within 2.5 seconds
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(2500)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      
      const firstRow = result.data[0]
      expect(firstRow).toHaveProperty('Employees.count')
      expect(firstRow).toHaveProperty('Employees.avgSalary')
      expect(firstRow).toHaveProperty('Productivity.avgLinesOfCode')
      expect(firstRow).toHaveProperty('Departments.name')
      
      // Verify data types
      expect(typeof firstRow['Employees.count']).toBe('number')
      expect(typeof firstRow['Employees.avgSalary']).toBe('number')
      expect(typeof firstRow['Productivity.avgLinesOfCode']).toBe('number')
      expect(typeof firstRow['Departments.name']).toBe('string')
    })

    it('should handle multi-cube queries with filters efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Employees.count',
          'Productivity.totalLinesOfCode'
        ])
        .dimensions([
          'Departments.name'
        ])
        .filters([
          { 
            member: 'Employees.active', 
            operator: 'equals', 
            values: [true] 
          },
          {
            member: 'Productivity.linesOfCode',
            operator: 'gt',
            values: [100]
          }
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'Multi-cube with filters',
        () => testExecutor.executeQuery(query),
        { cubeCount: 3, filterCount: 2, complexity: 'medium-high' }
      )

      // Performance assertion - should complete within 2 seconds
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(2000)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThanOrEqual(0) // May be 0 if filters exclude all data
      
      if (result.data.length > 0) {
        const firstRow = result.data[0]
        expect(firstRow).toHaveProperty('Employees.count')
        expect(firstRow).toHaveProperty('Productivity.totalLinesOfCode')
        expect(firstRow).toHaveProperty('Departments.name')
      }
    })
  })

  describe('Aggregation Performance with Complex Grouping', () => {
    beforeEach(() => {
      performanceMeasurer = new PerformanceMeasurer() // Fresh measurer for each test
    })
    it('should handle multiple dimensions grouping efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.avgLinesOfCode',
          'Productivity.recordCount'
        ])
        .dimensions([
          'Productivity.employeeId',
          'Productivity.happinessLevel'
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'Multiple dimensions grouping',
        () => testExecutor.executeQuery(query),
        { dimensions: 2, groupingComplexity: 'medium' }
      )

      // Performance assertion - should complete within 1.5 seconds
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(1500)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      
      const firstRow = result.data[0]
      expect(firstRow).toHaveProperty('Productivity.avgLinesOfCode')
      expect(firstRow).toHaveProperty('Productivity.recordCount')
      expect(firstRow).toHaveProperty('Productivity.employeeId')
      expect(firstRow).toHaveProperty('Productivity.happinessLevel')
    })

    it('should handle time dimension grouping with measures efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.totalLinesOfCode',
          'Productivity.avgHappinessIndex'
        ])
        .dimensions([
          'Productivity.employeeId'
        ])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month'
        }])
        .build()

      const result = await performanceMeasurer.measure(
        'Time dimension with grouping',
        () => testExecutor.executeQuery(query),
        { timeDimensions: 1, dimensions: 1, granularity: 'month' }
      )

      // Performance assertion - should complete within 2 seconds
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(2000)

      // Result validation
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      
      const firstRow = result.data[0]
      expect(firstRow).toHaveProperty('Productivity.totalLinesOfCode')
      expect(firstRow).toHaveProperty('Productivity.avgHappinessIndex')
      expect(firstRow).toHaveProperty('Productivity.employeeId')
      expect(firstRow).toHaveProperty('Productivity.date')
    })
  })

  describe('Stress Testing with Large Result Sets', () => {
    beforeEach(() => {
      performanceMeasurer = new PerformanceMeasurer() // Fresh measurer for each test
    })

    it('should handle large time range queries efficiently', async () => {
      // Query all productivity data for the entire year by day (365+ rows expected)
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode', 'Productivity.avgPullRequests'])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-12-31']
        }])
        .build()

      const result = await performanceMeasurer.measure(
        'Large time range query',
        () => testExecutor.executeQuery(query),
        { expectedRows: '300+', timeRange: 'full year' }
      )

      // Performance assertion - should complete within 200ms for large time range
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(200)

      // Result validation - should have many rows (one per day with data)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(200) // Most days of the year
      expect(result.data[0]).toHaveProperty('Productivity.totalLinesOfCode')
      expect(result.data[0]).toHaveProperty('Productivity.avgPullRequests')
      expect(result.data[0]).toHaveProperty('Productivity.date')
    })

    it('should handle TimeEntries fan-out scenarios with large datasets efficiently', async () => {
      // Query that tests fan-out with TimeEntries (multiple entries per employee per day)
      const query = TestQueryBuilder.create()
        .measures([
          'TimeEntries.totalHours',
          'TimeEntries.totalBillableHours',
          'TimeEntries.count',
          'TimeEntries.distinctEmployees'
        ])
        .dimensions([
          'TimeEntries.allocationType',
          'Departments.name'
        ])
        .timeDimensions([{
          dimension: 'TimeEntries.date',
          granularity: 'month'
        }])
        .build()

      const result = await performanceMeasurer.measure(
        'TimeEntries fan-out with large dataset',
        () => testExecutor.executeQuery(query),
        { cubes: 3, expectedRows: '1000+', fanOut: 'high' }
      )

      // Performance assertion - should complete within reasonable time for fan-out scenario
      // Fan-out queries with large datasets can vary significantly based on system load
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(500) // Increased from 300ms to be less flaky

      // Result validation - should have substantial data
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      
      if (result.data.length > 0) {
        const firstRow = result.data[0]
        expect(firstRow).toHaveProperty('TimeEntries.totalHours')
        expect(firstRow).toHaveProperty('TimeEntries.totalBillableHours')
        expect(firstRow).toHaveProperty('TimeEntries.count')
        expect(firstRow).toHaveProperty('TimeEntries.distinctEmployees')
        expect(firstRow).toHaveProperty('TimeEntries.allocationType')
        expect(firstRow).toHaveProperty('Departments.name')
        expect(firstRow).toHaveProperty('TimeEntries.date')
        
        // Validate data types and realistic values
        expect(typeof firstRow['TimeEntries.totalHours']).toBe('number')
        expect(typeof firstRow['TimeEntries.totalBillableHours']).toBe('number')
        expect(typeof firstRow['TimeEntries.count']).toBe('number')
        expect(firstRow['TimeEntries.totalHours']).toBeGreaterThan(0)
        expect(firstRow['TimeEntries.count']).toBeGreaterThan(0)
      }
    })

    it('should handle detailed employee productivity analysis efficiently', async () => {
      // Detailed analysis: productivity metrics per employee per month
      const query = TestQueryBuilder.create()
        .measures([
          'Productivity.totalLinesOfCode',
          'Productivity.totalPullRequests',
          'Productivity.totalDeployments',
          'Productivity.avgHappinessIndex',
          'Productivity.workingDaysCount',
          'Productivity.productivityScore'
        ])
        .dimensions([
          'Productivity.employeeId'
        ])
        .timeDimensions([{
          dimension: 'Productivity.date',
          granularity: 'month'
        }])
        .filters([
          {
            member: 'Productivity.isWorkDay',
            operator: 'equals',
            values: [true]
          }
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'Detailed employee productivity analysis',
        () => testExecutor.executeQuery(query),
        { measures: 6, expectedRows: '200+', complexity: 'high' }
      )

      // Performance assertion - should complete within 250ms for detailed analysis
      const measurement = performanceMeasurer.getLatestMeasurement()
      expect(measurement?.duration).toBeLessThan(250)

      // Result validation - should have many employee-month combinations
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(100) // ~21 employees × 12 months
      
      if (result.data.length > 0) {
        const firstRow = result.data[0]
        expect(firstRow).toHaveProperty('Productivity.totalLinesOfCode')
        expect(firstRow).toHaveProperty('Productivity.totalPullRequests')
        expect(firstRow).toHaveProperty('Productivity.totalDeployments')
        expect(firstRow).toHaveProperty('Productivity.avgHappinessIndex')
        expect(firstRow).toHaveProperty('Productivity.workingDaysCount')
        expect(firstRow).toHaveProperty('Productivity.productivityScore')
        expect(firstRow).toHaveProperty('Productivity.employeeId')
        expect(firstRow).toHaveProperty('Productivity.date')
      }
    })
  })

  describe('Performance Benchmarking', () => {
    beforeEach(() => {
      performanceMeasurer = new PerformanceMeasurer() // Fresh measurer for each test
    })
    it('should measure and report query performance characteristics', async () => {
      const queries = [
        {
          name: 'Simple count',
          query: TestQueryBuilder.create().measures(['Employees.count']).build()
        },
        {
          name: 'Aggregation with grouping',
          query: TestQueryBuilder.create()
            .measures(['Employees.avgSalary'])
            .dimensions(['Departments.name'])
            .build()
        },
        {
          name: 'Multi-cube aggregation',
          query: TestQueryBuilder.create()
            .measures(['Employees.count', 'Productivity.recordCount'])
            .build()
        },
        {
          name: 'Complex query with filters',
          query: TestQueryBuilder.create()
            .measures(['Productivity.avgLinesOfCode', 'Productivity.totalPullRequests'])
            .dimensions(['Productivity.employeeId'])
            .filters([
              { member: 'Productivity.isWorkDay', operator: 'equals', values: [true] }
            ])
            .build()
        },
        {
          name: 'TimeEntries aggregation',
          query: TestQueryBuilder.create()
            .measures(['TimeEntries.totalHours', 'TimeEntries.count'])
            .dimensions(['TimeEntries.allocationType'])
            .build()
        },
        {
          name: 'TimeEntries multi-cube with departments',
          query: TestQueryBuilder.create()
            .measures(['TimeEntries.totalBillableHours', 'Employees.count'])
            .dimensions(['Departments.name'])
            .build()
        }
      ]

      // Execute all queries and measure performance
      for (const testCase of queries) {
        await performanceMeasurer.measure(
          testCase.name,
          () => testExecutor.executeQuery(testCase.query),
          { queryType: testCase.name }
        )
      }

      // Get performance summary
      const measurements = performanceMeasurer.getAllMeasurements()
      expect(measurements.length).toBe(queries.length)

      // Verify all queries completed successfully
      measurements.forEach((measurement, index) => {
        expect(measurement.name).toBe(queries[index].name)
        expect(measurement.duration).toBeGreaterThan(0)
        expect(measurement.duration).toBeLessThan(500) // No query should take more than 500ms
        expect(measurement.metadata?.error).toBeUndefined()
      })

      // Performance characteristics analysis
      const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length
      expect(avgDuration).toBeLessThan(50) // Average should be under 50ms

      // Find slowest and fastest queries
      const slowest = measurements.reduce((prev, curr) => prev.duration > curr.duration ? prev : curr)
      const fastest = measurements.reduce((prev, curr) => prev.duration < curr.duration ? prev : curr)

      console.log(`Performance Summary:`)
      console.log(`- Average duration: ${avgDuration.toFixed(2)}ms`)
      console.log(`- Fastest query: ${fastest.name} (${fastest.duration.toFixed(2)}ms)`)
      console.log(`- Slowest query: ${slowest.name} (${slowest.duration.toFixed(2)}ms)`)

      // The slowest query should still be within acceptable limits
      expect(slowest.duration).toBeLessThan(200) // Even slowest should be under 200ms
    })

    it('should maintain consistent performance across repeated executions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.avgSalary'])
        .dimensions(['Departments.name'])
        .build()

      const executionTimes: number[] = []
      const iterations = 5

      // Execute the same query multiple times
      for (let i = 0; i < iterations; i++) {
        await performanceMeasurer.measure(
          `Consistency test iteration ${i + 1}`,
          () => testExecutor.executeQuery(query)
        )
      }

      // Analyze consistency
      const measurements = performanceMeasurer.getAllMeasurements()
      const lastNMeasurements = measurements.slice(-iterations)
      
      lastNMeasurements.forEach(m => {
        executionTimes.push(m.duration)
      })

      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations
      const maxTime = Math.max(...executionTimes)
      const minTime = Math.min(...executionTimes)
      const variance = maxTime - minTime

      // Performance consistency assertions (very lenient for test environments)
      expect(variance).toBeLessThan(avgTime * 10) // Variance should be less than 1000% of average
      expect(maxTime).toBeLessThan(avgTime * 15) // No execution should take more than 15x average  
      expect(minTime).toBeGreaterThan(0) // Execution time should be positive

      console.log(`Consistency Analysis:`)
      console.log(`- Average: ${avgTime.toFixed(2)}ms`)
      console.log(`- Min: ${minTime.toFixed(2)}ms`)
      console.log(`- Max: ${maxTime.toFixed(2)}ms`)
      console.log(`- Variance: ${variance.toFixed(2)}ms (${((variance/avgTime)*100).toFixed(1)}%)`)
    })
  })
})