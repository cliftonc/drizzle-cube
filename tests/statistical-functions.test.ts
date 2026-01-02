/**
 * Statistical Functions Test Suite
 * Tests statistical measure types (stddev, variance, percentile) across databases
 * Validates graceful degradation for unsupported functions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import {
  createTestDatabaseExecutor,
  getTestDatabaseType,
  getTestSchema
} from './helpers/test-database'

import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'

import {
  TestQueryBuilder,
  TestExecutor
} from './helpers/test-utilities'

describe('Statistical Functions', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void
  let dbType: string

  beforeAll(async () => {
    dbType = getTestDatabaseType()

    // Use the new test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup

    // Get test schema for cube definitions
    const { employees, productivity } = await getTestSchema()

    // Create statistical test cube with new measure types
    const statisticalCube = defineCube('Statistics', {
      title: 'Statistical Analytics',
      description: 'Cube with statistical measure types for testing',

      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId)
      }),

      measures: {
        count: {
          name: 'count',
          type: 'count',
          sql: () => employees.id
        },
        avgSalary: {
          name: 'avgSalary',
          type: 'avg',
          sql: () => employees.salary
        },
        // Standard deviation (population)
        stddevSalary: {
          name: 'stddevSalary',
          type: 'stddev',
          sql: () => employees.salary
        },
        // Standard deviation (sample)
        stddevSampSalary: {
          name: 'stddevSampSalary',
          type: 'stddevSamp',
          sql: () => employees.salary
        },
        // Variance (population)
        varianceSalary: {
          name: 'varianceSalary',
          type: 'variance',
          sql: () => employees.salary
        },
        // Variance (sample)
        varianceSampSalary: {
          name: 'varianceSampSalary',
          type: 'varianceSamp',
          sql: () => employees.salary
        },
        // Median (P50)
        medianSalary: {
          name: 'medianSalary',
          type: 'median',
          sql: () => employees.salary
        },
        // 95th percentile
        p95Salary: {
          name: 'p95Salary',
          type: 'p95',
          sql: () => employees.salary
        },
        // 99th percentile
        p99Salary: {
          name: 'p99Salary',
          type: 'p99',
          sql: () => employees.salary
        },
        // Custom percentile (75th)
        customPercentileSalary: {
          name: 'customPercentileSalary',
          type: 'percentile',
          sql: () => employees.salary,
          statisticalConfig: {
            percentile: 75
          }
        }
      },

      dimensions: {
        name: {
          name: 'name',
          type: 'string',
          sql: () => employees.name
        }
      }
    })

    cubes = new Map([['Statistics', statisticalCube]])

    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Standard Deviation (STDDEV)', () => {
    it('should calculate STDDEV_POP on PostgreSQL and MySQL', async function () {
      // SQLite doesn't support STDDEV - test graceful degradation separately
      if (dbType === 'sqlite') {
        return // Handled in graceful degradation tests
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.stddevSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.stddevSalary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.stddevSalary']).toBe('number')
      // STDDEV should be >= 0
      expect(result.data[0]['Statistics.stddevSalary']).toBeGreaterThanOrEqual(0)
    })

    it('should calculate STDDEV_SAMP on PostgreSQL and MySQL', async function () {
      if (dbType === 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.stddevSampSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.stddevSampSalary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.stddevSampSalary']).toBe('number')
      expect(result.data[0]['Statistics.stddevSampSalary']).toBeGreaterThanOrEqual(0)
    })

    it('should return different values for population vs sample stddev', async function () {
      if (dbType === 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.stddevSalary', 'Statistics.stddevSampSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // Sample stddev is typically slightly larger than population stddev
      // (due to Bessel's correction: dividing by n-1 instead of n)
      const popStddev = result.data[0]['Statistics.stddevSalary']
      const sampStddev = result.data[0]['Statistics.stddevSampSalary']

      expect(popStddev).toBeDefined()
      expect(sampStddev).toBeDefined()
      // For n > 1, sample stddev >= population stddev
      expect(sampStddev).toBeGreaterThanOrEqual(popStddev)
    })
  })

  describe('Variance', () => {
    it('should calculate VAR_POP on PostgreSQL and MySQL', async function () {
      if (dbType === 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.varianceSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.varianceSalary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.varianceSalary']).toBe('number')
      expect(result.data[0]['Statistics.varianceSalary']).toBeGreaterThanOrEqual(0)
    })

    it('should calculate VAR_SAMP on PostgreSQL and MySQL', async function () {
      if (dbType === 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.varianceSampSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.varianceSampSalary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.varianceSampSalary']).toBe('number')
      expect(result.data[0]['Statistics.varianceSampSalary']).toBeGreaterThanOrEqual(0)
    })

    it('should have variance equal to stddev squared', async function () {
      if (dbType === 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.stddevSalary', 'Statistics.varianceSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      const stddev = result.data[0]['Statistics.stddevSalary']
      const variance = result.data[0]['Statistics.varianceSalary']

      // Variance = stddev^2 (with some floating point tolerance)
      expect(variance).toBeCloseTo(stddev * stddev, 2)
    })
  })

  describe('Percentile', () => {
    it('should calculate median (P50) on PostgreSQL', async function () {
      // Only PostgreSQL supports PERCENTILE_CONT
      if (dbType !== 'postgres') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.medianSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.medianSalary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.medianSalary']).toBe('number')
    })

    it('should calculate P95 on PostgreSQL', async function () {
      if (dbType !== 'postgres') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.p95Salary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.p95Salary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.p95Salary']).toBe('number')
    })

    it('should calculate P99 on PostgreSQL', async function () {
      if (dbType !== 'postgres') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.p99Salary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.p99Salary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.p99Salary']).toBe('number')
    })

    it('should calculate custom percentile (75th) on PostgreSQL', async function () {
      if (dbType !== 'postgres') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.customPercentileSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.customPercentileSalary']).toBeDefined()
      expect(typeof result.data[0]['Statistics.customPercentileSalary']).toBe('number')
    })

    it('should have median <= P95 <= P99 on PostgreSQL', async function () {
      if (dbType !== 'postgres') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.medianSalary', 'Statistics.p95Salary', 'Statistics.p99Salary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      const median = result.data[0]['Statistics.medianSalary']
      const p95 = result.data[0]['Statistics.p95Salary']
      const p99 = result.data[0]['Statistics.p99Salary']

      // Percentiles should be ordered
      expect(p95).toBeGreaterThanOrEqual(median)
      expect(p99).toBeGreaterThanOrEqual(p95)
    })
  })

  describe('Combined Statistical Measures', () => {
    it('should return multiple statistical measures together', async function () {
      if (dbType === 'sqlite') {
        return // SQLite doesn't support these functions
      }

      const query = TestQueryBuilder.create()
        .measures([
          'Statistics.count',
          'Statistics.avgSalary',
          'Statistics.stddevSalary',
          'Statistics.varianceSalary'
        ])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.count']).toBeGreaterThan(0)
      expect(result.data[0]['Statistics.avgSalary']).toBeGreaterThan(0)
      expect(result.data[0]['Statistics.stddevSalary']).toBeGreaterThanOrEqual(0)
      expect(result.data[0]['Statistics.varianceSalary']).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Graceful Degradation', () => {
    it('should return NULL for STDDEV on SQLite', async function () {
      if (dbType !== 'sqlite') {
        return // Only test graceful degradation on SQLite
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.stddevSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // SQLite should return NULL for unsupported statistical functions
      expect(result.data[0]['Statistics.stddevSalary']).toBeNull()
    })

    it('should return NULL for VARIANCE on SQLite', async function () {
      if (dbType !== 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.varianceSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.varianceSalary']).toBeNull()
    })

    it('should return NULL for PERCENTILE on SQLite', async function () {
      if (dbType !== 'sqlite') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.medianSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      expect(result.data[0]['Statistics.medianSalary']).toBeNull()
    })

    it('should return NULL for PERCENTILE on MySQL', async function () {
      if (dbType !== 'mysql') {
        return
      }

      const query = TestQueryBuilder.create()
        .measures(['Statistics.medianSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // MySQL doesn't support PERCENTILE_CONT - should return NULL
      expect(result.data[0]['Statistics.medianSalary']).toBeNull()
    })

    it('should still return supported measures alongside NULL unsupported ones', async function () {
      // This test verifies that queries with mixed supported/unsupported functions work
      const query = TestQueryBuilder.create()
        .measures(['Statistics.count', 'Statistics.stddevSalary'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toHaveLength(1)
      // Count should always work
      expect(result.data[0]['Statistics.count']).toBeGreaterThan(0)

      // STDDEV depends on database
      if (dbType === 'sqlite') {
        expect(result.data[0]['Statistics.stddevSalary']).toBeNull()
      } else {
        expect(result.data[0]['Statistics.stddevSalary']).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Database Capabilities', () => {
    it('should correctly report database capabilities', async function () {
      const { executor: dbExecutor } = await createTestDatabaseExecutor()
      const capabilities = dbExecutor.databaseAdapter.getCapabilities()

      if (dbType === 'postgres') {
        expect(capabilities.supportsStddev).toBe(true)
        expect(capabilities.supportsVariance).toBe(true)
        expect(capabilities.supportsPercentile).toBe(true)
        expect(capabilities.supportsWindowFunctions).toBe(true)
      } else if (dbType === 'mysql') {
        expect(capabilities.supportsStddev).toBe(true)
        expect(capabilities.supportsVariance).toBe(true)
        expect(capabilities.supportsPercentile).toBe(false)
        expect(capabilities.supportsWindowFunctions).toBe(true)
      } else if (dbType === 'sqlite') {
        expect(capabilities.supportsStddev).toBe(false)
        expect(capabilities.supportsVariance).toBe(false)
        expect(capabilities.supportsPercentile).toBe(false)
        expect(capabilities.supportsWindowFunctions).toBe(true) // SQLite 3.25+
      }
    })
  })
})
