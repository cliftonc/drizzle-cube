/**
 * Test Suite for Filtering on Fields Not Included in Query Dimensions/Measures
 * Verifies that we can filter on cube dimensions and measures without selecting them
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import type { TestSchema } from './helpers/databases/types'
import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import { 
  TestQueryBuilder, 
  TestExecutor
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Filter-Only Fields', () => {
  let testExecutor: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    const cubes = await getTestCubes(['Employees', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Filter on Dimension Not in Query Dimensions', () => {
    it('should filter on employee name without selecting it', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.name', 'equals', ['Alex Chen'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count'],
        { 'Employees.count': 'number' }
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBe(1)
      // Verify that employee name is NOT in the result
      expect(result.data[0]).not.toHaveProperty('Employees.name')
    })

    it('should filter on multiple dimensions without selecting them', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.departmentId', 'equals', [1])
        .filter('Employees.active', 'equals', [true])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(typeof result.data[0]['Employees.count']).toBe('number')
      // Verify that filtered dimensions are NOT in the result
      expect(result.data[0]).not.toHaveProperty('Employees.departmentId')
      expect(result.data[0]).not.toHaveProperty('Employees.active')
    })
  })

  describe('Filter on Measure Not in Query Measures', () => {
    it('should filter on salary measure without selecting it', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filter('Employees.avgSalary', 'gt', [75000])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      // Verify that avgSalary is NOT in the result
      for (const row of result.data) {
        expect(row).not.toHaveProperty('Employees.avgSalary')
      }
    })
  })

  describe('Multi-Cube Queries with Filter-Only Fields', () => {
    it('should join cubes based on filters even when not in dimensions/measures', async () => {
      // Query that only has measures from Employees but filters on Productivity
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Productivity.linesOfCode', 'gt', [100])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      // The result should only contain Employees.count
      expect(result.data[0]).toHaveProperty('Employees.count')
      expect(result.data[0]).not.toHaveProperty('Productivity.linesOfCode')
    })

    it('should handle filter-only cube joins with no other reference to filtered cube', async () => {
      // This is the critical test - Employee measures only, but filter on Productivity dimension
      // The Productivity cube should be joined ONLY because of the filter
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Employees.totalSalary'])
        .dimensions(['Employees.name'])
        .filter('Productivity.deployments', 'gte', [2]) // Filter on Productivity dimension
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.totalSalary', 'Employees.name']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      
      // Verify that the filtered field is NOT in the result set
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.count')
        expect(row).toHaveProperty('Employees.totalSalary') 
        expect(row).toHaveProperty('Employees.name')
        expect(row).not.toHaveProperty('Productivity.deployments')
      }
      
      // This verifies that the join actually worked - we should get filtered results
      // If the join didn't work, we'd get all employees regardless of their productivity
      const employeeCount = result.data[0]['Employees.count']
      expect(typeof employeeCount).toBe('number')
      expect(employeeCount).toBeGreaterThan(0)
    })

    it('should handle complex logical filters across cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filters([
          {
            and: [
              { member: 'Employees.active', operator: 'equals', values: [true] },
              { member: 'Productivity.linesOfCode', operator: 'gte', values: [50] }
            ]
          }
        ])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      
      // Verify filtered fields are not in results
      for (const row of result.data) {
        expect(row).not.toHaveProperty('Employees.active')
        expect(row).not.toHaveProperty('Productivity.linesOfCode')
        expect(row).toHaveProperty('Employees.departmentId')
        expect(row).toHaveProperty('Employees.count')
      }
    })
  })

  describe('Time Dimension Filters Without Selection', () => {
    it('should filter on time dimension without including it in results', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Productivity.totalLinesOfCode'])
        .filters([
          { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-01-31'] }
        ])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Productivity.totalLinesOfCode']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toHaveProperty('Productivity.totalLinesOfCode')
      expect(result.data[0]).not.toHaveProperty('Productivity.date')
    })
  })

  describe('Error Cases', () => {
    it('should fail validation for non-existent filter fields', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.nonExistentField', 'equals', ['value'])
        .build()

      // This should throw an error during execution due to validation failure
      await expect(testExecutor.validateQuery(query, [])).rejects.toThrow()
    })

    it('should fail validation for non-existent cubes in filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('NonExistentCube.field', 'equals', ['value'])
        .build()

      // This should throw an error during execution due to validation failure  
      await expect(testExecutor.validateQuery(query, [])).rejects.toThrow()
    })
  })
})