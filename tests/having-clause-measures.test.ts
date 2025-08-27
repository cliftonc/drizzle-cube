/**
 * Test Suite for HAVING Clause with Measure Filters
 * Verifies that filters on measures use HAVING clause after aggregation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'

import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import { 
  TestQueryBuilder, 
  TestExecutor
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('HAVING Clause for Measure Filters', () => {
  let testExecutor: TestExecutor
  let executor: QueryExecutor
  let cubes: Map<string, any>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Single Cube Measure Filters', () => {
    it('should use HAVING clause for measure filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filter('Employees.avgSalary', 'gt', [75000])
        .build()

      // Generate SQL to verify HAVING clause
      const sqlResult = await executor.generateSQL(
        cubes.get('Employees')!, 
        query, 
        testSecurityContexts.org1
      )

      // Should contain HAVING clause with AVG aggregation
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      expect(sqlResult.sql.toLowerCase()).toContain('avg(')
      expect(sqlResult.sql.toLowerCase()).not.toContain('where.*avg(')
      
      // Verify query executes correctly
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should separate dimension filters (WHERE) and measure filters (HAVING)', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filter('Employees.active', 'equals', [true]) // Dimension -> WHERE
        .filter('Employees.avgSalary', 'gt', [75000]) // Measure -> HAVING
        .build()

      const sqlResult = await executor.generateSQL(
        cubes.get('Employees')!, 
        query, 
        testSecurityContexts.org1
      )

      // Should have both WHERE (for dimension) and HAVING (for measure)
      expect(sqlResult.sql.toLowerCase()).toContain('where')
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      expect(sqlResult.sql.toLowerCase()).toContain('active')
      expect(sqlResult.sql.toLowerCase()).toContain('avg(')
      
      // Verify query executes correctly
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
    })
  })

  describe('Multi-Cube Measure Filters', () => {
    it('should use HAVING for measure filters from non-joined cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filter('Productivity.avgLinesOfCode', 'gt', [100]) // Measure from different cube
        .build()

      const sqlResult = await executor.generateMultiCubeSQL(
        cubes, 
        query, 
        testSecurityContexts.org1
      )

      // Should join Productivity cube and use HAVING
      expect(sqlResult.sql.toLowerCase()).toContain('join')
      expect(sqlResult.sql.toLowerCase()).toContain('productivity')
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      expect(sqlResult.sql.toLowerCase()).toContain('avg(')
      expect(sqlResult.sql.toLowerCase()).toContain('lines_of_code')
      
      // Verify query executes correctly
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
    })

    it('should handle mixed dimension and measure filters across cubes', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filter('Employees.active', 'equals', [true]) // Dimension -> WHERE
        .filter('Productivity.avgLinesOfCode', 'gt', [100]) // Measure -> HAVING
        .build()

      const sqlResult = await executor.generateMultiCubeSQL(
        cubes, 
        query, 
        testSecurityContexts.org1
      )

      // Should have both WHERE and HAVING clauses
      expect(sqlResult.sql.toLowerCase()).toContain('where')
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      expect(sqlResult.sql.toLowerCase()).toContain('active')
      expect(sqlResult.sql.toLowerCase()).toContain('avg(')
      
      // Verify query executes correctly
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
    })
  })

  describe('Logical Filters with Mixed Types', () => {
    it('should properly separate dimension and measure filters in AND logic', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filters([
          {
            and: [
              { member: 'Employees.active', operator: 'equals', values: [true] }, // Dimension
              { member: 'Employees.avgSalary', operator: 'gt', values: [75000] } // Measure
            ]
          }
        ])
        .build()

      const sqlResult = await executor.generateSQL(
        cubes.get('Employees')!, 
        query, 
        testSecurityContexts.org1
      )

      // Dimension filter in WHERE, measure filter in HAVING
      expect(sqlResult.sql.toLowerCase()).toContain('where')
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      expect(sqlResult.sql.toLowerCase()).toContain('active')
      expect(sqlResult.sql.toLowerCase()).toContain('avg(')
      
      // Verify query executes correctly
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
    })

    it('should handle OR logic with mixed dimension and measure filters', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filters([
          {
            or: [
              { member: 'Employees.active', operator: 'equals', values: [false] }, // Dimension
              { member: 'Employees.avgSalary', operator: 'lt', values: [50000] } // Measure
            ]
          }
        ])
        .build()

      const sqlResult = await executor.generateSQL(
        cubes.get('Employees')!, 
        query, 
        testSecurityContexts.org1
      )

      // Should have both WHERE and HAVING clauses
      expect(sqlResult.sql.toLowerCase()).toContain('where')
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      
      // Verify query executes correctly  
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
    })
  })

  describe('Measure Filter Types', () => {
    it('should handle different aggregation types in HAVING', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId'])
        .filter('Employees.totalSalary', 'gt', [200000]) // SUM aggregation
        .build()

      const sqlResult = await executor.generateSQL(
        cubes.get('Employees')!, 
        query, 
        testSecurityContexts.org1
      )

      // Should use SUM in HAVING clause
      expect(sqlResult.sql.toLowerCase()).toContain('having')
      expect(sqlResult.sql.toLowerCase()).toContain('sum(')
      
      const { result, validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.departmentId']
      )

      expect(validation.isValid).toBe(true)
    })
  })
})