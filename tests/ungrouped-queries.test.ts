/**
 * Tests for ungrouped query support (issue #398)
 * Validates raw/detail-level data retrieval without GROUP BY or aggregation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createTestDatabaseExecutor
} from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { SemanticLayerCompiler } from '../src/server'
import type { Cube, SemanticQuery } from '../src/server/types'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'

describe('Ungrouped Queries', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let executor: QueryExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes()
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) close()
  })

  describe('Basic ungrouped queries', () => {
    it('should return raw rows with dimensions only', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name', 'Employees.email'])
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(1)
      // Each row should have dimension values
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.name')
        expect(row).toHaveProperty('Employees.email')
      }
    })

    it('should return raw rows with dimensions and compatible measures', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .measures(['Employees.totalSalary']) // sum type — renders as raw salary column
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(1)
      // Each row should have a salary value (raw, not aggregated)
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.name')
        expect(row).toHaveProperty('Employees.totalSalary')
      }
    })

    it('should return more rows than grouped equivalent', async () => {
      // Grouped query
      const groupedQuery = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .measures(['Employees.totalSalary'])
        .build()
      const groupedResult = await testExecutor.executeQuery(groupedQuery)

      // Ungrouped query — should return at least as many rows
      const ungroupedQuery = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .measures(['Employees.totalSalary'])
        .ungrouped()
        .build()
      const ungroupedResult = await testExecutor.executeQuery(ungroupedQuery)

      expect(ungroupedResult.data.length).toBeGreaterThanOrEqual(groupedResult.data.length)
    })

    it('should work with number type measures (raw expressions)', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .measures(['Employees.avgSalary']) // avg type — renders as raw salary column
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('Ungrouped with filters', () => {
    it('should apply WHERE filters normally', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name', 'Employees.salary'])
        .filter('Employees.salary', 'gt', [80000])
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      // All returned rows should have salary > 80000
      for (const row of result.data) {
        expect(Number(row['Employees.salary'])).toBeGreaterThan(80000)
      }
    })

    it('should apply security context isolation', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .ungrouped()
        .build()

      // Org 1 results
      const org1Executor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
      const org1Result = await org1Executor.executeQuery(query)

      // Org 2 results
      const org2Executor = new TestExecutor(executor, cubes, testSecurityContexts.org2)
      const org2Result = await org2Executor.executeQuery(query)

      // Results should be isolated by organization
      expect(org1Result.data.length).toBeGreaterThan(0)
      expect(org2Result.data.length).toBeGreaterThan(0)

      // Names should not overlap between orgs
      const org1Names = new Set(org1Result.data.map(r => r['Employees.name']))
      const org2Names = new Set(org2Result.data.map(r => r['Employees.name']))
      for (const name of org2Names) {
        expect(org1Names.has(name)).toBe(false)
      }
    })
  })

  describe('Ungrouped with time dimensions', () => {
    it('should return raw timestamps without granularity', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .timeDimensions([{ dimension: 'Employees.createdAt' }])
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      // Each row should have the time dimension
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.createdAt')
      }
    })

    it('should apply granularity truncation when specified', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .timeDimensions([{ dimension: 'Employees.createdAt', granularity: 'month' }])
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should apply time dimension date range filter', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .timeDimensions([{
          dimension: 'Employees.createdAt',
          dateRange: ['2020-01-01', '2025-12-31']
        }])
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Ungrouped with joins', () => {
    it('should work with belongsTo joins', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name', 'Departments.name'])
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.name')
        expect(row).toHaveProperty('Departments.name')
      }
    })
  })

  describe('Ungrouped with ORDER BY and LIMIT', () => {
    it('should support ORDER BY', async () => {
      const query = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .ungrouped()
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(1)

      // Verify ascending alphabetical order
      for (let i = 1; i < result.data.length; i++) {
        const prev = String(result.data[i - 1]['Employees.name'])
        const curr = String(result.data[i]['Employees.name'])
        expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0)
      }
    })

    it('should support LIMIT and OFFSET for pagination', async () => {
      const fullQuery = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .ungrouped()
        .build()

      const fullResult = await testExecutor.executeQuery(fullQuery)

      const limitedQuery = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .limit(2)
        .ungrouped()
        .build()

      const limitedResult = await testExecutor.executeQuery(limitedQuery)
      expect(limitedResult.data).toHaveLength(2)

      // Offset query should return different rows
      const offsetQuery = TestQueryBuilder.create()
        .dimensions(['Employees.name'])
        .order({ 'Employees.name': 'asc' })
        .limit(2)
        .offset(2)
        .ungrouped()
        .build()

      const offsetResult = await testExecutor.executeQuery(offsetQuery)
      expect(offsetResult.data).toHaveLength(2)
      // Offset rows should be different from first page
      if (fullResult.data.length > 2) {
        expect(offsetResult.data[0]['Employees.name'])
          .not.toBe(limitedResult.data[0]['Employees.name'])
      }
    })
  })

  describe('Dry-run SQL', () => {
    it('should generate SQL without GROUP BY for ungrouped queries', async () => {
      const { executor: dbExecutor } = await createTestDatabaseExecutor()
      const { testEmployeesCube, testDepartmentsCube } = await createTestCubesForCurrentDatabase()

      const compiler = new SemanticLayerCompiler({ databaseExecutor: dbExecutor })
      compiler.registerCube(testEmployeesCube)
      compiler.registerCube(testDepartmentsCube)

      const query: SemanticQuery = {
        dimensions: ['Employees.name', 'Employees.salary'],
        measures: ['Employees.totalSalary'],
        ungrouped: true
      }

      const dryRun = await compiler.dryRun(query, testSecurityContexts.org1)
      const sqlLower = dryRun.sql.toLowerCase()

      // Should NOT contain GROUP BY
      expect(sqlLower).not.toContain('group by')
      // Should NOT contain aggregation functions
      expect(sqlLower).not.toMatch(/\bsum\s*\(/)
      expect(sqlLower).not.toMatch(/\bcount\s*\(/)
      expect(sqlLower).not.toMatch(/\bavg\s*\(/)
    })
  })
})

describe('Ungrouped Query Validation', () => {
  let compiler: SemanticLayerCompiler

  beforeAll(async () => {
    const { executor } = await createTestDatabaseExecutor()
    const cubes = await createTestCubesForCurrentDatabase()

    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    compiler.registerCube(cubes.testEmployeesCube)
    compiler.registerCube(cubes.testDepartmentsCube)
    compiler.registerCube(cubes.testProductivityCube)
  })

  it('should reject ungrouped queries without dimensions', () => {
    const query: SemanticQuery = {
      measures: ['Employees.totalSalary'],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('at least one dimension'))).toBe(true)
  })

  it('should reject count measures in ungrouped queries', () => {
    // Employees.count is defined as type 'countDistinct' in test cubes
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      measures: ['Employees.count'],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('incompatible with ungrouped'))).toBe(true)
  })

  it('should reject countDistinct measures in ungrouped queries', () => {
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      measures: ['Employees.countDistinctDepartments'],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('incompatible'))).toBe(true)
  })

  it('should allow sum, avg, min, max measures in ungrouped queries', () => {
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      measures: ['Employees.totalSalary', 'Employees.avgSalary', 'Employees.minSalary', 'Employees.maxSalary'],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(true)
  })

  it('should allow queries with only dimensions (no measures)', () => {
    const query: SemanticQuery = {
      dimensions: ['Employees.name', 'Employees.email'],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(true)
  })

  it('should reject ungrouped queries with compareDateRange', () => {
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      timeDimensions: [{
        dimension: 'Employees.createdAt',
        granularity: 'month',
        compareDateRange: ['last month', 'this month']
      }],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('compareDateRange'))).toBe(true)
  })

  it('should reject ungrouped queries with fillMissingDates', () => {
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      timeDimensions: [{
        dimension: 'Employees.createdAt',
        granularity: 'month',
        fillMissingDates: true
      }],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('fillMissingDates'))).toBe(true)
  })

  it('should reject ungrouped queries with funnel config', () => {
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      ungrouped: true,
      funnel: {
        bindingKey: 'Employees.id',
        timeDimension: 'Employees.createdAt',
        steps: []
      }
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('funnel'))).toBe(true)
  })

  it('should reject ungrouped queries with hasMany relationships', () => {
    // Employees has a hasMany relationship to Productivity
    const query: SemanticQuery = {
      dimensions: ['Employees.name'],
      measures: ['Productivity.totalLinesOfCode'],
      ungrouped: true
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('hasMany'))).toBe(true)
  })

  it('should pass validation for normal (non-ungrouped) queries with count', () => {
    // Ensure we didn't break normal queries
    const query: SemanticQuery = {
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    }
    const result = compiler.validateQuery(query)
    expect(result.isValid).toBe(true)
  })
})
