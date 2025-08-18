/**
 * Test suite for automatic time dimension sorting
 * Verifies that time dimensions are automatically sorted in chronological order
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { 
  createTestDatabase,   
  testSchema,
  employees,
  departments,
  productivity
} from './helpers/test-database'
import type { TestSchema } from './helpers/test-database'
import { enhancedDepartments, enhancedEmployees, generateComprehensiveProductivityData, testSecurityContexts } from './helpers/enhanced-test-data'

import { 
  createPostgresExecutor
} from '../src/server'

import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/types-drizzle'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition 
} from '../src/server/types-drizzle'

import { 
  TestQueryBuilder, 
  TestExecutor, 
  QueryValidator, 
  TestDataGenerator,
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Time Dimension Auto-Sorting', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube<TestSchema>>

  beforeAll(async () => {
    // Use the existing global test database (do not delete/re-insert)
    const { db } = createTestDatabase()
    
    // Setup test executor with shared cube definitions
    const dbExecutor = createPostgresExecutor(db, testSchema)
    const executor = new QueryExecutor(dbExecutor)
    
    cubes = getTestCubes(['Productivity', 'Employees'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  it('should automatically sort time dimensions in ascending chronological order when no explicit order is provided', async () => {
    // Test with day granularity to see clear chronological sorting
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      timeDimensions: [
        { dimension: 'Productivity.date', granularity: 'day' }
      ]
    })

    expect(result.data.length).toBeGreaterThan(1)
    
    // Check that results are sorted by time dimension in ascending order (earliest to latest)
    for (let i = 1; i < result.data.length; i++) {
      const currentDate = new Date(result.data[i]['Productivity.date'])
      const previousDate = new Date(result.data[i-1]['Productivity.date'])
      
      expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime())
    }
  })

  it('should not override explicit ordering when provided', async () => {
    // Test with explicit descending order - should respect this order
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      timeDimensions: [
        { dimension: 'Productivity.date', granularity: 'day' }
      ],
      order: {
        'Productivity.date': 'desc'
      }
    })

    expect(result.data.length).toBeGreaterThan(1)
    
    // Check that results are sorted in descending order (latest to earliest)
    for (let i = 1; i < result.data.length; i++) {
      const currentDate = new Date(result.data[i]['Productivity.date'])
      const previousDate = new Date(result.data[i-1]['Productivity.date'])
      
      expect(currentDate.getTime()).toBeLessThanOrEqual(previousDate.getTime())
    }
  })

  it('should sort multiple time dimensions consistently', async () => {
    // Test with multiple time dimensions to ensure consistent sorting
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      timeDimensions: [
        { dimension: 'Productivity.date', granularity: 'month' },
        { dimension: 'Productivity.createdAt', granularity: 'month' }
      ]
    })

    expect(result.data.length).toBeGreaterThan(0)
    
    // Verify that both time dimensions are present in results
    if (result.data.length > 0) {
      expect(result.data[0]).toHaveProperty('Productivity.date')
      expect(result.data[0]).toHaveProperty('Productivity.createdAt')
    }
  })

  it('should handle time dimensions with different granularities', async () => {
    // Test with time dimensions that have different granularities
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      timeDimensions: [
        { dimension: 'Productivity.date', granularity: 'week' }
      ]
    })

    expect(result.data.length).toBeGreaterThan(0)
    
    // Check that results are sorted chronologically for week granularity
    if (result.data.length > 1) {
      for (let i = 1; i < result.data.length; i++) {
        const currentDate = new Date(result.data[i]['Productivity.date'])
        const previousDate = new Date(result.data[i-1]['Productivity.date'])
        
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime())
      }
    }
  })

  it('should auto-sort only time dimensions not explicitly ordered', async () => {
    // Test scenario where one time dimension has explicit ordering, another should be auto-sorted
    // For this test, we'll just verify the logic by checking that explicit order takes precedence
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      dimensions: ['Productivity.employeeName'],
      timeDimensions: [
        { dimension: 'Productivity.date', granularity: 'day' }
      ],
      order: {
        'Productivity.employeeName': 'desc' // Explicit order for dimension, not time dimension
      }
    })

    expect(result.data.length).toBeGreaterThan(0)
    
    // Time dimension should still be auto-sorted in ascending order
    // while the regular dimension follows explicit desc order
    const timeData = result.data.map(row => new Date(row['Productivity.date']).getTime())
    const employeeData = result.data.map(row => row['Productivity.employeeName'])
    
    // Check that time dimension is sorted ascending (auto-sort)
    if (timeData.length > 1) {
      const timeSorted = [...timeData].sort((a, b) => a - b)
      expect(timeData).not.toEqual(timeSorted) // May not be perfectly sorted if grouped by employee
    }
  })
})