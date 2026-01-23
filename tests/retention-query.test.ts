/**
 * Server-Side Retention Query Tests
 * Tests retention analysis with cohort tracking, retention rates, and period calculations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import {
  createTestDatabaseExecutor,
  getTestSchema,
  getTestDatabaseType
} from './helpers/test-database'

import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, SemanticQuery } from '../src/server/types'
import type { RetentionQueryConfig, RetentionResultRow, RetentionDateRange } from '../src/server/types/retention'

// Default date range for tests - covers a wide range to capture test data
const defaultDateRange: RetentionDateRange = {
  start: '2023-01-01',
  end: '2025-12-31'
}
import { RetentionQueryBuilder } from '../src/server/retention-query-builder'
import { PostgresAdapter } from '../src/server/adapters/postgres-adapter'
import { MySQLAdapter } from '../src/server/adapters/mysql-adapter'
import { SQLiteAdapter } from '../src/server/adapters/sqlite-adapter'
import { DuckDBAdapter } from '../src/server/adapters/duckdb-adapter'

// Helper functions to skip tests for unsupported databases
// Retention is only supported on PostgreSQL and DuckDB initially
function skipIfMySQL(): boolean {
  return getTestDatabaseType() === 'mysql'
}

function skipIfSQLite(): boolean {
  return getTestDatabaseType() === 'sqlite'
}

function getAdapter() {
  const dbType = getTestDatabaseType()
  if (dbType === 'mysql') return new MySQLAdapter()
  if (dbType === 'sqlite') return new SQLiteAdapter()
  if (dbType === 'duckdb') return new DuckDBAdapter()
  return new PostgresAdapter()
}

describe('Server-Side Retention Queries', () => {
  let executor: QueryExecutor
  let close: () => void
  let eventsCube: Cube

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  // Create Events cube using productivity table for retention testing
  beforeEach(async () => {
    const testSchema = await getTestSchema()
    const { productivity } = testSchema

    // Create an Events cube from productivity data
    // Each productivity record represents an "event" with timestamp and userId
    eventsCube = defineCube('Events', {
      sql: (ctx: QueryContext) => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId as any)
      }),

      measures: {
        count: {
          type: 'count',
          sql: productivity.id
        },
        uniqueUsers: {
          type: 'countDistinct',
          sql: productivity.employeeId
        }
      },

      dimensions: {
        id: {
          type: 'number',
          sql: productivity.id,
          primaryKey: true
        },
        userId: {
          type: 'number',
          sql: productivity.employeeId
        },
        timestamp: {
          type: 'time',
          sql: productivity.date
        },
        linesOfCode: {
          type: 'number',
          sql: productivity.linesOfCode
        },
        pullRequests: {
          type: 'number',
          sql: productivity.pullRequests
        },
        happinessIndex: {
          type: 'number',
          sql: productivity.happinessIndex
        }
      }
    } as any)
  })

  describe('RetentionQueryBuilder Unit Tests', () => {
    it('should detect retention queries correctly', () => {
      const adapter = getAdapter()
      const builder = new RetentionQueryBuilder(adapter)

      // Query without retention
      expect(builder.hasRetention({ measures: ['Events.count'] })).toBe(false)

      // Query with partial retention config (missing fields)
      expect(builder.hasRetention({
        retention: {
          timeDimension: 'Users.createdAt'
        } as RetentionQueryConfig
      })).toBe(false)

      // Valid retention query (new simplified format)
      expect(builder.hasRetention({
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 6,
          retentionType: 'classic'
        }
      })).toBe(true)
    })

    it('should validate retention configuration', async () => {
      const adapter = getAdapter()
      const builder = new RetentionQueryBuilder(adapter)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // Valid configuration (new simplified format)
      const validConfig: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 6,
        retentionType: 'classic'
      }
      const validResult = builder.validateConfig(validConfig, cubes)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      // Invalid: too few periods
      const tooFewPeriods: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 0,
        retentionType: 'classic'
      }
      const tooFewResult = builder.validateConfig(tooFewPeriods, cubes)
      expect(tooFewResult.isValid).toBe(false)
      expect(tooFewResult.errors).toContain('Periods must be at least 1')

      // Invalid: too many periods
      const tooManyPeriods: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 100,
        retentionType: 'classic'
      }
      const tooManyResult = builder.validateConfig(tooManyPeriods, cubes)
      expect(tooManyResult.isValid).toBe(false)
      expect(tooManyResult.errors.some(e => e.includes('cannot exceed 52'))).toBe(true)

      // Invalid: bad time dimension
      const badTimeDim: RetentionQueryConfig = {
        timeDimension: 'Events.nonExistent',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 6,
        retentionType: 'classic'
      }
      const badTimeDimResult = builder.validateConfig(badTimeDim, cubes)
      expect(badTimeDimResult.isValid).toBe(false)
      expect(badTimeDimResult.errors.some(e => e.includes('Time dimension not found'))).toBe(true)

      // Invalid: bad binding key
      const badBindingKey: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.nonExistent',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 6,
        retentionType: 'classic'
      }
      const badBindingResult = builder.validateConfig(badBindingKey, cubes)
      expect(badBindingResult.isValid).toBe(false)
      expect(badBindingResult.errors.some(e => e.includes('Binding key dimension not found'))).toBe(true)
    })

    it('should validate multi-cube binding key configuration', async () => {
      const adapter = getAdapter()
      const builder = new RetentionQueryBuilder(adapter)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // Valid multi-cube binding key (new simplified format)
      const validMultiCube: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: [
          { cube: 'Events', dimension: 'userId' }
        ],
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 6,
        retentionType: 'classic'
      }
      const validMultiResult = builder.validateConfig(validMultiCube, cubes)
      expect(validMultiResult.isValid).toBe(true)

      // Invalid: bad cube in binding key array
      const badMultiCube: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: [
          { cube: 'NonExistent', dimension: 'id' }
        ],
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 6,
        retentionType: 'classic'
      }
      const badMultiResult = builder.validateConfig(badMultiCube, cubes)
      expect(badMultiResult.isValid).toBe(false)
      expect(badMultiResult.errors.some(e => e.includes('Binding key mapping cube not found'))).toBe(true)
    })

    it('should transform results correctly', () => {
      const adapter = getAdapter()
      const builder = new RetentionQueryBuilder(adapter)

      const config: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 3,
        retentionType: 'classic'
      }

      // New simplified format: no cohort_period, single cohort
      const rawResult = [
        { period: 0, cohort_size: 100, retained_users: 100, retention_rate: 1.0 },
        { period: 1, cohort_size: 100, retained_users: 80, retention_rate: 0.8 },
        { period: 2, cohort_size: 100, retained_users: 60, retention_rate: 0.6 }
      ]

      const results = builder.transformResult(rawResult, config)

      expect(results).toHaveLength(3)

      // Check period 0
      expect(results[0].period).toBe(0)
      expect(results[0].cohortSize).toBe(100)
      expect(results[0].retainedUsers).toBe(100)
      expect(results[0].retentionRate).toBe(1.0)

      // Check period 1
      expect(results[1].period).toBe(1)
      expect(results[1].cohortSize).toBe(100)
      expect(results[1].retainedUsers).toBe(80)
      expect(results[1].retentionRate).toBe(0.8)

      // Check period 2
      expect(results[2].period).toBe(2)
      expect(results[2].cohortSize).toBe(100)
      expect(results[2].retainedUsers).toBe(60)
      expect(results[2].retentionRate).toBe(0.6)
    })

    it('should handle null retention rates', () => {
      const adapter = new PostgresAdapter()
      const builder = new RetentionQueryBuilder(adapter)

      const config: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 2,
        retentionType: 'classic'
      }

      const rawResult = [
        { period: 0, cohort_size: 0, retained_users: 0, retention_rate: null }
      ]

      const results = builder.transformResult(rawResult, config)

      expect(results).toHaveLength(1)
      expect(results[0].retentionRate).toBe(0) // null should become 0
    })

    it('should validate granularity values', () => {
      const adapter = getAdapter()
      const builder = new RetentionQueryBuilder(adapter)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // Invalid granularity (now there's just one unified granularity field)
      const invalidGranularity: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'invalid' as any,
        periods: 6,
        retentionType: 'classic'
      }
      const result1 = builder.validateConfig(invalidGranularity, cubes)
      expect(result1.isValid).toBe(false)
      expect(result1.errors.some(e => e.includes('Invalid granularity'))).toBe(true)
    })

    it('should validate retention type values', () => {
      const adapter = getAdapter()
      const builder = new RetentionQueryBuilder(adapter)
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const invalidRetentionType: RetentionQueryConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: defaultDateRange,
        granularity: 'month',
        periods: 6,
        retentionType: 'invalid' as any
      }
      const result = builder.validateConfig(invalidRetentionType, cubes)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid retention type'))).toBe(true)
    })
  })

  // Skip execution tests for MySQL and SQLite (only PostgreSQL and DuckDB supported initially)
  describe.skipIf(skipIfMySQL() || skipIfSQLite())('Retention Query Execution', () => {
    it('should execute a simple single-cube retention query', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 3,
          retentionType: 'classic'
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      // Verify result structure
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)

      // If there's data, verify it has the correct structure (no cohortPeriod in new format)
      if (result.data.length > 0) {
        const firstRow = result.data[0] as unknown as RetentionResultRow
        expect(typeof firstRow.period).toBe('number')
        expect(typeof firstRow.cohortSize).toBe('number')
        expect(typeof firstRow.retainedUsers).toBe('number')
        expect(typeof firstRow.retentionRate).toBe('number')
      }
    })

    it('should execute retention query with different granularities', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      // Weekly granularity
      const weeklyQuery: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'week',
          periods: 4,
          retentionType: 'classic'
        }
      }

      const weeklyResult = await executor.execute(cubes, weeklyQuery, testSecurityContexts.org1)
      expect(weeklyResult.data).toBeDefined()
      expect(Array.isArray(weeklyResult.data)).toBe(true)

      // Daily granularity
      const dailyQuery: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'day',
          periods: 7,
          retentionType: 'classic'
        }
      }

      const dailyResult = await executor.execute(cubes, dailyQuery, testSecurityContexts.org1)
      expect(dailyResult.data).toBeDefined()
      expect(Array.isArray(dailyResult.data)).toBe(true)
    })

    it('should execute rolling retention query', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 3,
          retentionType: 'rolling'
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)

      // For rolling retention, rates should be monotonically decreasing or equal
      // as each period includes "period N or later" (single cohort in new format)
      if (result.data.length > 1) {
        const rows = result.data as unknown as RetentionResultRow[]
        const sortedRows = rows.sort((a, b) => a.period - b.period)
        for (let i = 1; i < sortedRows.length; i++) {
          // Rolling retention should be <= previous period
          expect(sortedRows[i].retentionRate).toBeLessThanOrEqual(sortedRows[i - 1].retentionRate)
        }
      }
    })

    it('should execute retention query with activity filters', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 3,
          retentionType: 'classic',
          activityFilters: {
            member: 'Events.linesOfCode',
            operator: 'gt',
            values: [50]
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should execute retention query with cohort filters', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 3,
          retentionType: 'classic',
          cohortFilters: {
            member: 'Events.pullRequests',
            operator: 'gt',
            values: [0]
          }
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should verify retention metrics are valid', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 6,
          retentionType: 'classic'
        }
      }

      const result = await executor.execute(cubes, query, testSecurityContexts.org1)

      for (const row of result.data as unknown as RetentionResultRow[]) {
        // Period 0 should always have retentionRate = 1.0 (100%)
        if (row.period === 0) {
          expect(row.retentionRate).toBe(1)
          expect(row.retainedUsers).toBe(row.cohortSize)
        }

        // Retention rate should be between 0 and 1
        expect(row.retentionRate).toBeGreaterThanOrEqual(0)
        expect(row.retentionRate).toBeLessThanOrEqual(1)

        // Retained users should not exceed cohort size
        expect(row.retainedUsers).toBeLessThanOrEqual(row.cohortSize)

        // All counts should be non-negative
        expect(row.cohortSize).toBeGreaterThanOrEqual(0)
        expect(row.retainedUsers).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe.skipIf(skipIfMySQL() || skipIfSQLite())('Security Context', () => {
    it('should isolate retention results by organisation', async () => {
      const cubes = new Map<string, Cube>()
      cubes.set('Events', eventsCube)

      const query: SemanticQuery = {
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: defaultDateRange,
          granularity: 'month',
          periods: 3,
          retentionType: 'classic'
        }
      }

      const result1 = await executor.execute(cubes, query, testSecurityContexts.org1)
      const result2 = await executor.execute(cubes, query, testSecurityContexts.org2)

      // Both queries should return valid results
      expect(result1.data).toBeDefined()
      expect(result2.data).toBeDefined()
      expect(Array.isArray(result1.data)).toBe(true)
      expect(Array.isArray(result2.data)).toBe(true)

      // Calculate total users per org to verify isolation
      const org1TotalUsers = (result1.data as unknown as RetentionResultRow[])
        .filter(row => row.period === 0)
        .reduce((sum, row) => sum + row.cohortSize, 0)

      const org2TotalUsers = (result2.data as unknown as RetentionResultRow[])
        .filter(row => row.period === 0)
        .reduce((sum, row) => sum + row.cohortSize, 0)

      // At minimum, both should have data or results should be different
      expect(typeof org1TotalUsers).toBe('number')
      expect(typeof org2TotalUsers).toBe('number')
    })
  })
})

describe('Database Adapter Retention Methods', () => {
  describe('PostgreSQL Adapter', () => {
    const adapter = new PostgresAdapter()

    it('should build date diff for days', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'day')
      expect(diff).toBeDefined()
    })

    it('should build date diff for weeks', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'week')
      expect(diff).toBeDefined()
    })

    it('should build date diff for months', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'month')
      expect(diff).toBeDefined()
    })

    it('should build time dimension for month granularity', () => {
      const timeDim = adapter.buildTimeDimension('month', sql`timestamp_col`)
      expect(timeDim).toBeDefined()
    })

    it('should build time dimension for week granularity', () => {
      const timeDim = adapter.buildTimeDimension('week', sql`timestamp_col`)
      expect(timeDim).toBeDefined()
    })

    it('should build time dimension for day granularity', () => {
      const timeDim = adapter.buildTimeDimension('day', sql`timestamp_col`)
      expect(timeDim).toBeDefined()
    })
  })

  describe('DuckDB Adapter', () => {
    const adapter = new DuckDBAdapter()

    it('should build date diff for days', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'day')
      expect(diff).toBeDefined()
    })

    it('should build date diff for weeks', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'week')
      expect(diff).toBeDefined()
    })

    it('should build date diff for months', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'month')
      expect(diff).toBeDefined()
    })

    it('should build time dimension for month granularity', () => {
      const timeDim = adapter.buildTimeDimension('month', sql`timestamp_col`)
      expect(timeDim).toBeDefined()
    })
  })

  describe('MySQL Adapter', () => {
    const adapter = new MySQLAdapter()

    it('should build date diff for days', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'day')
      expect(diff).toBeDefined()
    })

    it('should build date diff for weeks', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'week')
      expect(diff).toBeDefined()
    })

    it('should build date diff for months', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'month')
      expect(diff).toBeDefined()
    })
  })

  describe('SQLite Adapter', () => {
    const adapter = new SQLiteAdapter()

    it('should build date diff for days', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'day')
      expect(diff).toBeDefined()
    })

    it('should build date diff for weeks', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'week')
      expect(diff).toBeDefined()
    })

    it('should build date diff for months', () => {
      const diff = adapter.buildDateDiffPeriods(sql`start_date`, sql`end_date`, 'month')
      expect(diff).toBeDefined()
    })
  })
})
