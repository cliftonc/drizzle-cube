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
  PerformanceMeasurer,
  SecurityTestUtils
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
    it('should handle 4-level deep nested AND/OR structures', async () => {
      // Complex enterprise filter pattern: 
      // (Active employees in Engineering OR Sales) AND 
      // ((High salary AND experienced) OR (New hire AND high potential))
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name', 'Employees.departmentId'],
        filters: [
          {
            and: [
              // Level 1: Employee must be active
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              
              // Level 2: Department constraint (Engineering OR Sales)
              {
                or: [
                  { member: 'Employees.departmentId', operator: 'in', values: [1, 2] },
                  { member: 'Employees.salary', operator: 'gte', values: [100000] }
                ]
              },
              
              // Level 3: Complex performance criteria
              {
                or: [
                  // Level 4: Senior employee path
                  {
                    and: [
                      { member: 'Employees.salary', operator: 'between', values: [90000, 150000] },
                      { member: 'Employees.createdAt', operator: 'beforeDate', values: ['2023-01-01'] },
                      { member: 'Employees.name', operator: 'isNotEmpty', values: [] }
                    ]
                  },
                  // Level 4: High-potential new hire path  
                  {
                    and: [
                      { member: 'Employees.salary', operator: 'gte', values: [75000] },
                      { member: 'Employees.createdAt', operator: 'afterDate', values: ['2023-06-01'] },
                      { member: 'Employees.email', operator: 'like', values: ['%@company.com'] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      // All returned employees should meet the nested criteria
      for (const row of result.data) {
        expect(row['Employees.name']).toBeDefined()
        expect(row['Employees.departmentId']).toBeDefined()
      }
    })

    it('should handle complex multi-cube nested filters with advanced operators', async () => {
      const query = {
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Employees.name', 'Employees.departmentId'],
        filters: [
          {
            and: [
              // Employee criteria with advanced operators
              {
                or: [
                  { member: 'Employees.departmentId', operator: 'in', values: [1, 2, 3] },
                  { member: 'Employees.salary', operator: 'between', values: [80000, 120000] }
                ]
              },
              // Productivity criteria with nested logic
              {
                and: [
                  {
                    or: [
                      { member: 'Productivity.happinessIndex', operator: 'between', values: [7, 10] },
                      { member: 'Productivity.linesOfCode', operator: 'gte', values: [200] }
                    ]
                  },
                  { member: 'Productivity.isWorkDay', operator: 'notIn', values: [false] }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle alternating AND/OR pattern with all operator types', async () => {
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name', 'Employees.salary'],
        filters: [
          {
            or: [
              // Path 1: High earners with specific criteria
              {
                and: [
                  { member: 'Employees.salary', operator: 'between', values: [100000, 200000] },
                  { member: 'Employees.isActive', operator: 'notIn', values: [false] },
                  { member: 'Employees.name', operator: 'like', values: ['A%'] }
                ]
              },
              // Path 2: Mid-level employees in specific departments
              {
                and: [
                  { member: 'Employees.departmentId', operator: 'in', values: [1, 2] },
                  { member: 'Employees.salary', operator: 'between', values: [70000, 99999] },
                  { member: 'Employees.email', operator: 'isNotEmpty', values: [] }
                ]
              },
              // Path 3: New hires with potential
              {
                and: [
                  { member: 'Employees.createdAt', operator: 'afterDate', values: ['2023-01-01'] },
                  { member: 'Employees.name', operator: 'notLike', values: ['Test%'] },
                  {
                    or: [
                      { member: 'Employees.email', operator: 'like', values: ['%@company.com'] },
                      { member: 'Employees.salary', operator: 'gte', values: [80000] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle deeply nested same-type groups with advanced operators', async () => {
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [
          {
            and: [
              {
                and: [
                  {
                    and: [
                      { member: 'Employees.isActive', operator: 'notIn', values: [false] },
                      { member: 'Employees.salary', operator: 'between', values: [60000, 120000] },
                      { member: 'Employees.name', operator: 'isNotEmpty', values: [] }
                    ]
                  },
                  { member: 'Employees.departmentId', operator: 'in', values: [1, 2, 3] }
                ]
              },
              {
                or: [
                  { member: 'Employees.email', operator: 'like', values: ['%@company.com'] },
                  { member: 'Employees.createdAt', operator: 'beforeDate', values: ['2024-01-01'] }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle very wide nested structures with many siblings', async () => {
      // Test performance and correctness with many OR conditions
      const manyOrConditions = [
        { member: 'Employees.name', operator: 'like', values: ['A%'] },
        { member: 'Employees.name', operator: 'like', values: ['B%'] },
        { member: 'Employees.name', operator: 'like', values: ['C%'] },
        { member: 'Employees.salary', operator: 'between', values: [50000, 70000] },
        { member: 'Employees.salary', operator: 'between', values: [70000, 90000] },
        { member: 'Employees.salary', operator: 'between', values: [90000, 110000] },
        { member: 'Employees.departmentId', operator: 'in', values: [1] },
        { member: 'Employees.departmentId', operator: 'in', values: [2] },
        { member: 'Employees.departmentId', operator: 'in', values: [3] },
        { member: 'Employees.createdAt', operator: 'afterDate', values: ['2023-01-01'] },
        { member: 'Employees.createdAt', operator: 'beforeDate', values: ['2022-12-31'] },
        { member: 'Employees.email', operator: 'like', values: ['%@gmail.com'] }
      ]

      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [
          {
            and: [
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              {
                or: manyOrConditions
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle real-world HR analytics complex filter', async () => {
      // Realistic HR query: Find high-potential employees for promotion consideration
      const query = {
        measures: ['Employees.count', 'Employees.avgSalary'],
        dimensions: ['Employees.name', 'Employees.departmentId'],
        filters: [
          {
            and: [
              // Must be currently active
              { member: 'Employees.isActive', operator: 'notIn', values: [false] },
              
              // Must be in eligible departments
              { member: 'Employees.departmentId', operator: 'in', values: [1, 2, 3, 4] },
              
              // Complex promotion eligibility criteria
              {
                or: [
                  // High performer track
                  {
                    and: [
                      { member: 'Employees.salary', operator: 'between', values: [80000, 120000] },
                      { member: 'Employees.createdAt', operator: 'beforeDate', values: ['2022-01-01'] },
                      { member: 'Employees.name', operator: 'isNotEmpty', values: [] }
                    ]
                  },
                  
                  // Rising star track
                  {
                    and: [
                      { member: 'Employees.salary', operator: 'between', values: [70000, 100000] },
                      { member: 'Employees.createdAt', operator: 'afterDate', values: ['2022-01-01'] },
                      { member: 'Employees.email', operator: 'like', values: ['%@company.com'] }
                    ]
                  },
                  
                  // Special cases (external hires, returnees)
                  {
                    and: [
                      { member: 'Employees.salary', operator: 'gte', values: [90000] },
                      {
                        or: [
                          { member: 'Employees.email', operator: 'notLike', values: ['%@company.com'] },
                          { member: 'Employees.name', operator: 'like', values: ['%Senior%'] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle contradictory nested conditions with advanced operators', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              { member: 'Employees.salary', operator: 'between', values: [100000, 120000] },
              { member: 'Employees.salary', operator: 'notBetween', values: [80000, 150000] }, // Contradiction
              { member: 'Employees.departmentId', operator: 'in', values: [1, 2] },
              { member: 'Employees.departmentId', operator: 'notIn', values: [1, 2, 3] } // Contradiction
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBe(0) // Should return 0 results due to contradictions
    })

    it('should handle empty nested groups gracefully with advanced operators', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              { member: 'Employees.salary', operator: 'between', values: [50000, 100000] },
              {
                or: [] // Empty OR group - should be handled gracefully
              }
            ]
          }
        ]
      }

      // Should either handle gracefully or throw a clear validation error
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('filter') // Should be a meaningful error message
      }
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

  describe('Performance with Complex Nested Filters', () => {
    it('should execute deeply nested filters within performance threshold', async () => {
      const complexNestedQuery = {
        measures: ['Employees.count', 'Employees.avgSalary'],
        dimensions: ['Employees.departmentId'],
        filters: [
          {
            or: [
              {
                and: [
                  { member: 'Employees.salary', operator: 'between', values: [80000, 120000] },
                  { member: 'Employees.isActive', operator: 'notIn', values: [false] },
                  {
                    or: [
                      { member: 'Employees.departmentId', operator: 'in', values: [1, 2] },
                      { member: 'Employees.name', operator: 'like', values: ['A%'] }
                    ]
                  }
                ]
              },
              {
                and: [
                  { member: 'Employees.salary', operator: 'gte', values: [120000] },
                  { member: 'Employees.createdAt', operator: 'beforeDate', values: ['2023-01-01'] },
                  {
                    or: [
                      { member: 'Employees.email', operator: 'like', values: ['%@company.com'] },
                      { member: 'Employees.departmentId', operator: 'notIn', values: [5, 6, 7] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = await performanceMeasurer.measure(
        'complex-nested-advanced-filters',
        () => testExecutor.executeQuery(complexNestedQuery)
      )
      
      expect(result.data).toBeDefined()
      
      const stats = performanceMeasurer.getStats('complex-nested-advanced-filters')
      expect(stats.avgDuration).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should handle multi-cube complex nested filters efficiently', async () => {
      const multiCubeNestedQuery = {
        measures: ['Employees.count', 'Productivity.recordCount'],
        dimensions: ['Employees.name'],
        filters: [
          {
            and: [
              // Employee complex filters
              {
                or: [
                  {
                    and: [
                      { member: 'Employees.salary', operator: 'between', values: [75000, 125000] },
                      { member: 'Employees.departmentId', operator: 'in', values: [1, 2, 3] }
                    ]
                  },
                  { member: 'Employees.name', operator: 'like', values: ['%Manager%'] }
                ]
              },
              // Productivity complex filters
              {
                and: [
                  { member: 'Productivity.happinessIndex', operator: 'between', values: [6, 10] },
                  {
                    or: [
                      { member: 'Productivity.linesOfCode', operator: 'gte', values: [300] },
                      { member: 'Productivity.pullRequests', operator: 'between', values: [3, 10] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = await performanceMeasurer.measure(
        'multi-cube-nested-filters',
        () => testExecutor.executeQuery(multiCubeNestedQuery)
      )
      
      expect(result.data).toBeDefined()
      
      const stats = performanceMeasurer.getStats('multi-cube-nested-filters')
      expect(stats.avgDuration).toBeLessThan(3000) // Less than 3 seconds
    })

    it('should handle wide complex filter structures efficiently', async () => {
      // Many OR conditions with nested AND groups
      const wideComplexQuery = {
        measures: ['Employees.count'],
        filters: [
          {
            or: [
              { and: [{ member: 'Employees.salary', operator: 'between', values: [50000, 60000] }, { member: 'Employees.departmentId', operator: 'in', values: [1] }] },
              { and: [{ member: 'Employees.salary', operator: 'between', values: [60000, 70000] }, { member: 'Employees.departmentId', operator: 'in', values: [2] }] },
              { and: [{ member: 'Employees.salary', operator: 'between', values: [70000, 80000] }, { member: 'Employees.departmentId', operator: 'in', values: [3] }] },
              { and: [{ member: 'Employees.salary', operator: 'between', values: [80000, 90000] }, { member: 'Employees.departmentId', operator: 'in', values: [1] }] },
              { and: [{ member: 'Employees.salary', operator: 'between', values: [90000, 100000] }, { member: 'Employees.departmentId', operator: 'in', values: [2] }] },
              { and: [{ member: 'Employees.salary', operator: 'between', values: [100000, 110000] }, { member: 'Employees.departmentId', operator: 'in', values: [3] }] },
              { and: [{ member: 'Employees.name', operator: 'like', values: ['A%'] }, { member: 'Employees.isActive', operator: 'equals', values: [true] }] },
              { and: [{ member: 'Employees.name', operator: 'like', values: ['B%'] }, { member: 'Employees.isActive', operator: 'equals', values: [true] }] },
              { and: [{ member: 'Employees.email', operator: 'like', values: ['%@company.com'] }, { member: 'Employees.salary', operator: 'gte', values: [75000] }] }
            ]
          }
        ]
      }

      const result = await performanceMeasurer.measure(
        'wide-complex-filters',
        () => testExecutor.executeQuery(wideComplexQuery)
      )
      
      expect(result.data).toBeDefined()
      
      const stats = performanceMeasurer.getStats('wide-complex-filters')
      expect(stats.avgDuration).toBeLessThan(4000) // Less than 4 seconds
    })
  })

  describe('SQL Injection Prevention in Complex Nested Filters', () => {
    it('should prevent SQL injection in deeply nested filter structures', async () => {
      const maliciousValues = [
        "'; DROP TABLE employees; --",
        "' UNION SELECT * FROM passwords --",
        "'; INSERT INTO admin (user) VALUES ('hacker'); --",
        "%'; DELETE FROM employees WHERE '1'='1",
        "1' OR '1'='1' --"
      ]

      for (const maliciousValue of maliciousValues) {
        const query = {
          measures: ['Employees.count'],
          filters: [
            {
              and: [
                {
                  or: [
                    { member: 'Employees.name', operator: 'like', values: [maliciousValue] },
                    { member: 'Employees.email', operator: 'contains', values: [maliciousValue] }
                  ]
                },
                {
                  and: [
                    { member: 'Employees.isActive', operator: 'equals', values: [true] },
                    { member: 'Employees.salary', operator: 'between', values: [50000, 100000] }
                  ]
                }
              ]
            }
          ]
        }

        const result = await testExecutor.executeQuery(query)
        
        // Should execute safely and return structured results
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data[0]['Employees.count']).toBe(0) // No matches for malicious input
        
        // Validate no SQL injection occurred
        const securityValidation = SecurityTestUtils.validateNoSQLInjection(result, query)
        expect(securityValidation.isValid).toBe(true)
      }
    })

    it('should prevent injection in advanced operators within nested structures', async () => {
      const maliciousInput = "'; DROP TABLE employees; SELECT 'injected"
      
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            or: [
              {
                and: [
                  { member: 'Employees.name', operator: 'regex', values: [maliciousInput] },
                  { member: 'Employees.salary', operator: 'between', values: [50000, 100000] }
                ]
              },
              {
                and: [
                  { member: 'Employees.departmentId', operator: 'in', values: [1, 2, 3] },
                  { member: 'Employees.email', operator: 'ilike', values: [maliciousInput] }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      
      // Should handle malicious regex/ilike patterns safely
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      const securityValidation = SecurityTestUtils.validateNoSQLInjection(result, query)
      expect(securityValidation.isValid).toBe(true)
    })

    it('should prevent injection across multiple nested levels with advanced operators', async () => {
      const injectionTestCases = SecurityTestUtils.generateSQLInjectionTestCases()
      
      for (const testCase of injectionTestCases.slice(0, 3)) {
        const complexQuery = {
          measures: ['Employees.count'],
          filters: [
            {
              or: [
                {
                  and: [
                    { member: 'Employees.name', operator: 'like', values: [testCase.maliciousInput] },
                    { member: 'Employees.salary', operator: 'between', values: [50000, 150000] }
                  ]
                },
                {
                  and: [
                    { member: 'Employees.email', operator: 'notLike', values: [testCase.maliciousInput] },
                    { member: 'Employees.departmentId', operator: 'notIn', values: [99, 100] }
                  ]
                },
                {
                  and: [
                    { member: 'Employees.createdAt', operator: 'afterDate', values: ['2020-01-01'] },
                    { member: 'Employees.name', operator: 'isNotEmpty', values: [] }
                  ]
                }
              ]
            }
          ]
        }

        const result = await testExecutor.executeQuery(complexQuery)
        
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        
        const securityValidation = SecurityTestUtils.validateNoSQLInjection(result, complexQuery)
        expect(securityValidation.isValid).toBe(true)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in nested filter values', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            or: [
              {
                and: [
                  { member: 'Employees.name', operator: 'like', values: ["%O'Connor%"] },
                  { member: 'Employees.email', operator: 'contains', values: ['@'] }
                ]
              },
              {
                and: [
                  { member: 'Employees.name', operator: 'like', values: ['%Jean-Luc%'] },
                  { member: 'Employees.salary', operator: 'gte', values: [50000] }
                ]
              }
            ]
          }
        ]
      }

      // Should handle apostrophes and hyphens without SQL errors
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle Unicode characters in complex nested filters', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              {
                or: [
                  { member: 'Employees.name', operator: 'contains', values: ['José'] },
                  { member: 'Employees.name', operator: 'contains', values: ['北京'] },
                  { member: 'Employees.name', operator: 'contains', values: ['🚀'] }
                ]
              },
              { member: 'Employees.isActive', operator: 'equals', values: [true] }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle very long values in nested structures', async () => {
      const longValue = 'x'.repeat(2000)
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              {
                or: [
                  { member: 'Employees.name', operator: 'contains', values: [longValue] },
                  { member: 'Employees.email', operator: 'startsWith', values: [longValue] }
                ]
              },
              { member: 'Employees.salary', operator: 'gte', values: [0] }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBe(0) // No matches expected for very long values
    })

    it('should handle large nested filter arrays', async () => {
      const manyIds = Array.from({length: 500}, (_, i) => i + 1)
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              { member: 'Employees.departmentId', operator: 'in', values: manyIds },
              {
                or: [
                  { member: 'Employees.salary', operator: 'between', values: [50000, 100000] },
                  { member: 'Employees.isActive', operator: 'equals', values: [true] }
                ]
              }
            ]
          }
        ]
      }

      const result = await performanceMeasurer.measure(
        'large-nested-arrays',
        () => testExecutor.executeQuery(query)
      )
      
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
      
      const stats = performanceMeasurer.getStats('large-nested-arrays')
      expect(stats.avgDuration).toBeLessThan(8000) // Large arrays might take longer but should be reasonable
    })

    it('should handle type mismatches in nested filters gracefully', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              { member: 'Employees.salary', operator: 'between', values: ['not-a-number', 'also-not-a-number'] },
              { member: 'Employees.departmentId', operator: 'in', values: ['string-instead-of-number'] }
            ]
          }
        ]
      }

      // Should either handle gracefully (ignore invalid filters) or throw clear validation error
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        // Should provide meaningful error about query execution failure
        expect(error.message).toMatch(/Query execution failed|Failed query|not-a-number/)
      }
    })

    it('should handle mixed valid and invalid nested filters', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            or: [
              // Valid filter
              {
                and: [
                  { member: 'Employees.isActive', operator: 'equals', values: [true] },
                  { member: 'Employees.salary', operator: 'gte', values: [50000] }
                ]
              },
              // Invalid filter (non-existent field)
              {
                and: [
                  { member: 'Employees.nonExistentField', operator: 'equals', values: ['test'] },
                  { member: 'Employees.salary', operator: 'lte', values: [100000] }
                ]
              }
            ]
          }
        ]
      }

      // Should throw error due to non-existent field
      await expect(async () => {
        await testExecutor.executeQuery(query)
      }).rejects.toThrow()
    })
  })
})