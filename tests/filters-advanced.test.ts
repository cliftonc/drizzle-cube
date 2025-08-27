/**
 * Advanced Filter Operations Test Suite
 * Tests new filter operators: between, notBetween, in, notIn, like, notLike, ilike, regex, isEmpty, isNotEmpty
 * Phase 1 Priority from testing roadmap
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
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Advanced Filter Operations', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube>
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

  describe('Range Filters', () => {
    it('should handle between operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.salary',
          operator: 'between',
          values: [50000, 100000]
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should handle notBetween operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.salary',
          operator: 'notBetween',
          values: [60000, 80000]
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should handle between with insufficient values gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.salary',
          operator: 'between',
          values: [50000] // Only one value
        }])
        .build()

      // Should not throw error, filter should be ignored
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Array Filters', () => {
    it('should handle in operator with multiple values', async () => {
      // First get the actual department IDs from the database
      const deptQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .build()
      
      const deptResult = await testExecutor.executeQuery(deptQuery)
      const departmentIds = deptResult.data
        .filter(row => row['Employees.departmentId'] !== null && row['Employees.count'] > 0)
        .map(row => row['Employees.departmentId'])
        .slice(0, 2) // Take first 2 department IDs
      
      expect(departmentIds.length).toBeGreaterThanOrEqual(2) // Ensure we have test data
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.departmentId',
          operator: 'in',
          values: departmentIds
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0) // Should actually match employees
    })

    it('should handle notIn operator', async () => {
      // First get total employee count
      const totalQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()
      const totalResult = await testExecutor.executeQuery(totalQuery)
      const totalEmployees = totalResult.data[0]['Employees.count']
      
      // Get a small department ID to exclude
      const deptQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .build()
      const deptResult = await testExecutor.executeQuery(deptQuery)
      const smallDept = deptResult.data
        .filter(row => row['Employees.departmentId'] !== null && row['Employees.count'] === 1)
        .map(row => row['Employees.departmentId'])[0]
      
      expect(smallDept).toBeDefined() // Ensure we have test data
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.departmentId',
          operator: 'notIn',
          values: [smallDept]
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      // Should be less than total but greater than 0
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
      expect(result.data[0]['Employees.count']).toBeLessThan(totalEmployees)
    })

    it('should handle in operator with single value', async () => {
      // Get the department with the most employees
      const deptQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .build()
      const deptResult = await testExecutor.executeQuery(deptQuery)
      const biggestDept = deptResult.data
        .filter(row => row['Employees.departmentId'] !== null)
        .sort((a, b) => b['Employees.count'] - a['Employees.count'])[0]
      
      expect(biggestDept).toBeDefined() // Ensure we have test data
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.departmentId',
          operator: 'in',
          values: [biggestDept['Employees.departmentId']]
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toEqual(biggestDept['Employees.count']) // Should match exactly
    })

    it('should handle in operator with empty array gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.departmentId',
          operator: 'in',
          values: []
        }])
        .build()

      // Should not throw error, filter should be ignored (returns all employees)
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      
      // Compare to unfiltered query to ensure empty array is ignored
      const unfilteredQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()
      const unfilteredResult = await testExecutor.executeQuery(unfilteredQuery)
      
      // Empty array filter should be ignored, so should return same count as unfiltered
      expect(result.data[0]['Employees.count']).toEqual(unfilteredResult.data[0]['Employees.count'])
    })
  })

  describe('Pattern Matching Filters', () => {
    it('should handle like operator with wildcards', async () => {
      // Use a pattern that should match - looking for names starting with 'A' (Alex, Alice, etc.)
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'like',
          values: ['A%']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0) // Should match Alex Chen and Alice Research
    })

    it('should handle notLike operator', async () => {
      // Get total count first
      const totalQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()
      const totalResult = await testExecutor.executeQuery(totalQuery)
      const totalEmployees = totalResult.data[0]['Employees.count']
      
      // Filter out names starting with 'A'
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'notLike',
          values: ['A%']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0) // Should have employees not starting with A
      expect(result.data[0]['Employees.count']).toBeLessThan(totalEmployees) // Should be less than total
    })

    it('should handle ilike operator (case-insensitive)', async () => {
      // Test case-insensitive match - use lowercase 'alex' to match 'Alex Chen'
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'ilike',
          values: ['alex%']
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0) // Should match 'Alex Chen'
    })
  })

  describe('Regular Expression Filters', () => {
    it('should handle regex operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'regex',
          values: ['^[A-Z][a-z]+\\s[A-Z][a-z]+$'] // First Last format
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should handle notRegex operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'notRegex',
          values: ['\\d+'] // No numbers in names
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Empty/Non-Empty Filters', () => {
    it('should handle isEmpty operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.email', // Test isEmpty on email field
          operator: 'isEmpty',
          values: []
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should handle isNotEmpty operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'isNotEmpty',
          values: []
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Complex Nested Filter Logic', () => {
    it('should handle complex AND/OR combinations with new operators', async () => {
      // Get real department IDs first
      const deptQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .build()
      const deptResult = await testExecutor.executeQuery(deptQuery)
      const departmentIds = deptResult.data
        .filter(row => row['Employees.departmentId'] !== null && row['Employees.count'] > 0)
        .map(row => row['Employees.departmentId'])
        .slice(0, 2)
        
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          {
            and: [
              {
                member: 'Employees.departmentId',
                operator: 'in',
                values: departmentIds
              },
              {
                or: [
                  {
                    member: 'Employees.salary',
                    operator: 'between',
                    values: [70000, 100000]
                  },
                  {
                    member: 'Employees.name',
                    operator: 'like',
                    values: ['A%'] // Names starting with A
                  }
                ]
              }
            ]
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0) // Should match some employees
    })

    it('should handle multiple filter types in sequence', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          {
            member: 'Employees.active',
            operator: 'notIn',
            values: [false]
          },
          {
            member: 'Employees.salary',
            operator: 'between',
            values: [40000, 120000]
          },
          {
            member: 'Employees.name',
            operator: 'isNotEmpty',
            values: []
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Multi-Cube Queries with Advanced Filters', () => {
    it('should apply advanced filters correctly in multi-cube scenarios', async () => {
      // Get real department IDs first
      const deptQuery = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .build()
      const deptResult = await testExecutor.executeQuery(deptQuery)
      const departmentIds = deptResult.data
        .filter(row => row['Employees.departmentId'] !== null && row['Employees.count'] > 0)
        .map(row => row['Employees.departmentId'])
        .slice(0, 3)
        
      const query = TestQueryBuilder.create()
        .measures(['Employees.count', 'Departments.count'])
        .filters([
          {
            member: 'Employees.departmentId',
            operator: 'in',
            values: departmentIds
          }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]).toHaveProperty('Employees.count')
      expect(result.data[0]).toHaveProperty('Departments.count')
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0) // Should have matching employees
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in filter values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'like',
          values: ["%O'Connor%"] // Apostrophe handling
        }])
        .build()

      // Should not throw SQL errors due to improper escaping
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle Unicode characters in filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'contains',
          values: ['José'] // Unicode character
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle very long filter values', async () => {
      const longValue = 'x'.repeat(1000)
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.name',
          operator: 'contains',
          values: [longValue]
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBe(0) // No matches expected
    })

    it('should handle large IN arrays', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([{
          member: 'Employees.departmentId',
          operator: 'in',
          values: Array.from({length: 100}, (_, i) => i + 1)
        }])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })
})