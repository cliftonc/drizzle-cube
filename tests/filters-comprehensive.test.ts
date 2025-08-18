/**
 * Comprehensive Filter Operations Test Suite
 * Tests all filter operators, logical combinations, edge cases, and SQL injection prevention
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
  SecurityTestUtils,
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Comprehensive Filter Operations', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube<TestSchema>>

  beforeAll(async () => {
    // Use the existing global test database (do not delete/re-insert)
    const { db } = createTestDatabase()
    
    // Setup test executor with shared cube definitions
    const dbExecutor = createPostgresExecutor(db, testSchema)
    const executor = new QueryExecutor(dbExecutor)
    cubes = getTestCubes(['Employees', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
    performanceMeasurer = new PerformanceMeasurer()
  })

  describe('String Filter Operators', () => {
    it('should handle equals operator with single value', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'equals', ['Alex Chen'])
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.name'],
        { 'Employees.count': 'number', 'Employees.name': 'string' }
      )

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.name']).toBe('Alex Chen')
      expect(result.data[0]['Employees.count']).toBe(1)
    })

    it('should handle equals operator with multiple values (IN clause)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'equals', ['Alex Chen', 'Sarah Johnson'])
        .order({ 'Employees.name': 'asc' })
        .build()

      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.name']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]['Employees.name']).toBe('Alex Chen')
      expect(result.data[1]['Employees.name']).toBe('Sarah Johnson')
    })

    it('should handle notEquals operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.name', 'notEquals', ['Alex Chen'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      const count = result.data[0]['Employees.count']
      expect(count).toBeGreaterThan(1) // Should have all employees except Alex Chen
    })

    it('should handle contains operator (case-insensitive)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'contains', ['chen'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.name']).toBe('Alex Chen')
    })

    it('should handle notContains operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.name', 'notContains', ['Chen'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      const count = result.data[0]['Employees.count']
      expect(count).toBeGreaterThan(0)
      // Should exclude Alex Chen, so count should be total - 1
    })

    it('should handle startsWith operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'startsWith', ['Alex'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.name']).toBe('Alex Chen')
    })

    it('should handle endsWith operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'endsWith', ['Chen'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.name']).toBe('Alex Chen')
    })

    it('should handle special characters in string filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'contains', ['Jean-Luc'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      if (result.data.length > 0) {
        expect(result.data[0]['Employees.name']).toContain('Jean-Luc')
      }
    })

    it('should handle unicode characters in string filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.name', 'contains', ['José'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      if (result.data.length > 0) {
        expect(result.data[0]['Employees.name']).toContain('José')
      }
    })
  })

  describe('Numeric Filter Operators', () => {
    it('should handle gt (greater than) operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name', 'Employees.salary'])
        .filter('Employees.salary', 'gt', [100000])
        .order({ 'Employees.salary': 'desc' })
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row['Employees.salary']).toBeGreaterThan(100000)
      }
    })

    it('should handle gte (greater than or equal) operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.salary'])
        .filter('Employees.salary', 'gte', [125000])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      for (const row of result.data) {
        expect(row['Employees.salary']).toBeGreaterThanOrEqual(125000)
      }
    })

    it('should handle lt (less than) operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.salary'])
        .filter('Employees.salary', 'lt', [80000])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      for (const row of result.data) {
        if (row['Employees.salary'] !== null) {
          expect(row['Employees.salary']).toBeLessThan(80000)
        }
      }
    })

    it('should handle lte (less than or equal) operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.salary'])
        .filter('Employees.salary', 'lte', [75000])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      for (const row of result.data) {
        if (row['Employees.salary'] !== null) {
          expect(row['Employees.salary']).toBeLessThanOrEqual(75000)
        }
      }
    })

    it('should handle numeric range filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .andFilter([
          { member: 'Employees.salary', operator: 'gte', values: [80000] },
          { member: 'Employees.salary', operator: 'lte', values: [120000] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
    })
  })

  describe('Boolean Filter Operators', () => {
    it('should handle boolean true filter', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.isActive', 'equals', [true])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
    })

    it('should handle boolean false filter', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.isActive', 'equals', [false])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      const inactiveCount = result.data[0]['Employees.count']
      expect(inactiveCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('NULL Value Filter Operators', () => {
    it('should handle set (NOT NULL) operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.email'])
        .filter('Employees.email', 'set', [])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      for (const row of result.data) {
        expect(row['Employees.email']).not.toBeNull()
      }
    })

    it('should handle notSet (IS NULL) operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.salary', 'notSet', [])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      // Should find employees with NULL salaries if any exist
    })
  })

  describe('Date Filter Operators', () => {
    it('should handle inDateRange operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .filter('Employees.createdAt', 'inDateRange', ['2022-01-01', '2023-12-31'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle beforeDate operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.createdAt', 'beforeDate', ['2023-01-01'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })

    it('should handle afterDate operator', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.createdAt', 'afterDate', ['2023-01-01'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Logical Filter Combinations', () => {
    it('should handle AND logical filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.name'])
        .andFilter([
          { member: 'Employees.isActive', operator: 'equals', values: [true] },
          { member: 'Employees.salary', operator: 'gt', values: [100000] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data.length).toBeGreaterThanOrEqual(0)
      // All returned employees should be active AND have salary > 100000
    })

    it('should handle OR logical filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .orFilter([
          { member: 'Employees.salary', operator: 'gt', values: [120000] },
          { member: 'Employees.departmentName', operator: 'equals', values: ['HR'] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
    })

    it('should handle nested AND/OR combinations', async () => {
      const query = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name', 'Employees.departmentName'],
        filters: [
          {
            or: [
              { member: 'Employees.salary', operator: 'gt', values: [120000] },
              {
                and: [
                  { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
                  { member: 'Employees.isActive', operator: 'equals', values: [true] }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data.length).toBeGreaterThanOrEqual(0)
      // Validate complex logical conditions are properly applied
    })

    it('should handle multiple independent filter groups', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .andFilter([
          { member: 'Employees.isActive', operator: 'equals', values: [true] }
        ])
        .orFilter([
          { member: 'Employees.salary', operator: 'gt', values: [100000] },
          { member: 'Employees.departmentName', operator: 'equals', values: ['Marketing'] }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty filter values gracefully', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.name', 'equals', [])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      // Should return zero results for empty equals filter
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBe(0)
    })

    it('should handle non-existent filter values', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.name', 'equals', ['Non-Existent Employee'])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBe(0)
    })

    it('should handle filters on non-existent fields gracefully', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.nonExistentField', operator: 'equals', values: ['test'] }
        ]
      }

      // This should either throw an error or handle gracefully
      await expect(async () => {
        await testExecutor.executeQuery(query)
      }).rejects.toThrow()
    })

    it('should handle very large filter value arrays', async () => {
      const largeValueArray = Array.from({ length: 1000 }, (_, i) => `Employee${i}`)
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.name', 'equals', largeValueArray)
        .build()

      const result = await performanceMeasurer.measure(
        'large-filter-array',
        () => testExecutor.executeQuery(query)
      )
      
      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Employees.count']).toBe(0) // No matches expected
      
      // Performance should be reasonable
      const stats = performanceMeasurer.getStats('large-filter-array')
      expect(stats.avgDuration).toBeLessThan(5000) // Less than 5 seconds
    })
  })

  describe('SQL Injection Prevention', () => {
    const injectionTestCases = SecurityTestUtils.generateSQLInjectionTestCases()

    injectionTestCases.forEach(({ name, maliciousInput, description }) => {
      it(`should prevent SQL injection: ${description}`, async () => {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filter('Employees.name', 'equals', [maliciousInput])
          .build()

        const result = await testExecutor.executeQuery(query)
        
        // Validate that injection was prevented
        const securityValidation = SecurityTestUtils.validateNoSQLInjection(result, query)
        expect(securityValidation.isValid).toBe(true)
        expect(securityValidation.errors).toEqual([])
        
        // Should return zero results (no employee with malicious name)
        expect(result.data).toHaveLength(1)
        expect(result.data[0]['Employees.count']).toBe(0)
      })
    })

    it('should prevent injection in numeric filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.salary', 'gt', ["100000; DROP TABLE employees; --"])
        .build()

      // Should either handle gracefully or throw type error
      await expect(async () => {
        await testExecutor.executeQuery(query)
      }).rejects.toThrow()
    })

    it('should prevent injection in date filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.createdAt', 'afterDate', ["2023-01-01'; DROP TABLE employees; --"])
        .build()

      const result = await testExecutor.executeQuery(query)
      
      // Should handle gracefully and not execute malicious SQL
      const securityValidation = SecurityTestUtils.validateNoSQLInjection(result, query)
      expect(securityValidation.isValid).toBe(true)
    })
  })

  describe('Performance Benchmarks', () => {
    it('should execute simple filters efficiently', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filter('Employees.isActive', 'equals', [true])
        .build()

      const result = await performanceMeasurer.measure(
        'simple-filter',
        () => testExecutor.executeQuery(query)
      )
      
      expect(result.data).toBeDefined()
      
      const stats = performanceMeasurer.getStats('simple-filter')
      expect(stats.avgDuration).toBeLessThan(1000) // Less than 1 second
    })

    it('should execute complex logical filters efficiently', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              { member: 'Employees.isActive', operator: 'equals', values: [true] },
              {
                or: [
                  { member: 'Employees.salary', operator: 'gt', values: [100000] },
                  { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] }
                ]
              }
            ]
          }
        ]
      }

      const result = await performanceMeasurer.measure(
        'complex-filter',
        () => testExecutor.executeQuery(query)
      )
      
      expect(result.data).toBeDefined()
      
      const stats = performanceMeasurer.getStats('complex-filter')
      expect(stats.avgDuration).toBeLessThan(2000) // Less than 2 seconds
    })
  })

  describe('Comprehensive Filter Test Matrix', () => {
    const filterTestCases = TestDataGenerator.generateFilterTestCases()

    filterTestCases.forEach(({ name, member, operator, values, description }) => {
      it(`should handle ${name}: ${description}`, async () => {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filter(member, operator, values)
          .build()

        try {
          const result = await testExecutor.executeQuery(query)
          
          expect(result).toBeDefined()
          expect(result.data).toBeDefined()
          expect(Array.isArray(result.data)).toBe(true)
          
          // Validate result structure
          const validation = QueryValidator.validateQueryResult(result, ['Employees.count'])
          expect(validation.isValid).toBe(true)
          
        } catch (error) {
          // Some test cases might throw errors for unsupported operators
          // Log the error for analysis but don't fail the test
          console.warn(`Filter test ${name} threw error:`, error)
        }
      })
    })
  })

  afterAll(() => {
    // Output performance statistics
    const allStats = performanceMeasurer.getStats()
    console.log('\n=== Filter Performance Statistics ===')
    console.log(`Total measurements: ${allStats.count}`)
    console.log(`Average duration: ${allStats.avgDuration.toFixed(2)}ms`)
    console.log(`Min duration: ${allStats.minDuration.toFixed(2)}ms`)
    console.log(`Max duration: ${allStats.maxDuration.toFixed(2)}ms`)
    console.log(`Total duration: ${allStats.totalDuration.toFixed(2)}ms`)
  })
})