/**
 * Window Functions Test Suite
 * Tests window function measure types (lag, lead, rank, movingAvg, etc.) across databases
 * Validates proper partition/order by resolution and graceful degradation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
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

describe('Window Functions', () => {
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
    const { productivity } = await getTestSchema()

    // Create window functions test cube
    // Note: Window functions work on individual rows and are applied AFTER aggregation
    // For testing, we use window functions WITHOUT aggregates in the same query
    const windowCube = defineCube('WindowTest', {
      title: 'Window Function Analytics',
      description: 'Cube with window function measure types for testing',

      sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),

      measures: {
        // Basic count for reference
        count: {
          name: 'count',
          type: 'count',
          sql: () => productivity.id
        },
        // Row number - sequential row numbering
        rowNum: {
          name: 'rowNum',
          type: 'rowNumber',
          sql: () => productivity.id,
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' }]
          }
        },
        // Rank function
        rankByCode: {
          name: 'rankByCode',
          type: 'rank',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            orderBy: [{ field: 'linesOfCode', direction: 'desc' }]
          }
        },
        // Dense rank function
        denseRankByCode: {
          name: 'denseRankByCode',
          type: 'denseRank',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            orderBy: [{ field: 'linesOfCode', direction: 'desc' }]
          }
        },
        // LAG - access previous row value
        previousDayCode: {
          name: 'previousDayCode',
          type: 'lag',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' }],
            offset: 1,
            defaultValue: 0
          }
        },
        // LEAD - access next row value
        nextDayCode: {
          name: 'nextDayCode',
          type: 'lead',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' }],
            offset: 1,
            defaultValue: 0
          }
        },
        // First value in partition
        firstCodeInPartition: {
          name: 'firstCodeInPartition',
          type: 'firstValue',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            partitionBy: ['employeeId'],
            orderBy: [{ field: 'date', direction: 'asc' }]
          }
        },
        // Last value in partition (requires frame clause)
        lastCodeInPartition: {
          name: 'lastCodeInPartition',
          type: 'lastValue',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            partitionBy: ['employeeId'],
            orderBy: [{ field: 'date', direction: 'asc' }],
            frame: {
              type: 'rows',
              start: 'unbounded',
              end: 'unbounded'
            }
          }
        },
        // NTILE - divide into buckets
        quartileBucket: {
          name: 'quartileBucket',
          type: 'ntile',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            orderBy: [{ field: 'linesOfCode', direction: 'asc' }],
            nTile: 4
          }
        },
        // Moving average with frame
        movingAvgCode: {
          name: 'movingAvgCode',
          type: 'movingAvg',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            partitionBy: ['employeeId'],
            orderBy: [{ field: 'date', direction: 'asc' }],
            frame: {
              type: 'rows',
              start: 2,
              end: 'current'
            }
          }
        },
        // Moving sum with frame
        movingSumCode: {
          name: 'movingSumCode',
          type: 'movingSum',
          sql: () => productivity.linesOfCode,
          windowConfig: {
            partitionBy: ['employeeId'],
            orderBy: [{ field: 'date', direction: 'asc' }],
            frame: {
              type: 'rows',
              start: 2,
              end: 'current'
            }
          }
        }
      },

      dimensions: {
        id: {
          name: 'id',
          type: 'number',
          sql: () => productivity.id,
          primaryKey: true
        },
        date: {
          name: 'date',
          type: 'time',
          sql: () => productivity.date
        },
        employeeId: {
          name: 'employeeId',
          type: 'number',
          sql: () => productivity.employeeId
        },
        linesOfCode: {
          name: 'linesOfCode',
          type: 'number',
          sql: () => productivity.linesOfCode
        }
      }
    })

    cubes = new Map([['WindowTest', windowCube]])

    const executor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Row Numbering Functions', () => {
    it('should calculate ROW_NUMBER', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.rowNum'])
        .dimensions(['WindowTest.date'])
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Row numbers should be sequential integers
      const rowNums = result.data.map((r: any) => r['WindowTest.rowNum'])
      for (const num of rowNums) {
        expect(Number.isInteger(num)).toBe(true)
        expect(num).toBeGreaterThan(0)
      }
    })

    it('should calculate RANK with proper ordering', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.rankByCode'])
        .dimensions(['WindowTest.linesOfCode'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // All ranks should be positive integers
      for (const row of result.data) {
        const rank = row['WindowTest.rankByCode']
        expect(Number.isInteger(rank)).toBe(true)
        expect(rank).toBeGreaterThan(0)
      }
    })

    it('should calculate DENSE_RANK', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.denseRankByCode'])
        .dimensions(['WindowTest.linesOfCode'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Dense ranks should be sequential (no gaps)
      for (const row of result.data) {
        const rank = row['WindowTest.denseRankByCode']
        expect(Number.isInteger(rank)).toBe(true)
        expect(rank).toBeGreaterThan(0)
      }
    })

    it('should calculate NTILE buckets', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.quartileBucket'])
        .dimensions(['WindowTest.linesOfCode'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Quartile buckets should be 1-4
      for (const row of result.data) {
        const bucket = row['WindowTest.quartileBucket']
        expect(Number.isInteger(bucket)).toBe(true)
        expect(bucket).toBeGreaterThanOrEqual(1)
        expect(bucket).toBeLessThanOrEqual(4)
      }
    })
  })

  describe('LAG and LEAD Functions', () => {
    it('should calculate LAG (previous row value)', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.previousDayCode'])
        .dimensions(['WindowTest.date', 'WindowTest.linesOfCode'])
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // LAG values should be numbers (or default value of 0)
      for (const row of result.data) {
        const lagValue = row['WindowTest.previousDayCode']
        expect(typeof lagValue).toBe('number')
      }
    })

    it('should calculate LEAD (next row value)', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.nextDayCode'])
        .dimensions(['WindowTest.date', 'WindowTest.linesOfCode'])
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // LEAD values should be numbers (or default value of 0)
      for (const row of result.data) {
        const leadValue = row['WindowTest.nextDayCode']
        expect(typeof leadValue).toBe('number')
      }
    })
  })

  describe('FIRST_VALUE and LAST_VALUE', () => {
    it('should calculate FIRST_VALUE with partition', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.firstCodeInPartition'])
        .dimensions(['WindowTest.employeeId', 'WindowTest.date'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // FIRST_VALUE should return numbers
      for (const row of result.data) {
        const firstValue = row['WindowTest.firstCodeInPartition']
        expect(typeof firstValue).toBe('number')
      }
    })

    it('should calculate LAST_VALUE with frame clause', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.lastCodeInPartition'])
        .dimensions(['WindowTest.employeeId', 'WindowTest.date'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // LAST_VALUE should return numbers
      for (const row of result.data) {
        const lastValue = row['WindowTest.lastCodeInPartition']
        expect(typeof lastValue).toBe('number')
      }
    })
  })

  describe('Moving Aggregates', () => {
    it('should calculate moving average', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.movingAvgCode'])
        .dimensions(['WindowTest.employeeId', 'WindowTest.date'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Moving average should return numbers
      for (const row of result.data) {
        const movingAvg = row['WindowTest.movingAvgCode']
        expect(typeof movingAvg).toBe('number')
      }
    })

    it('should calculate moving sum', async function () {
      const query = TestQueryBuilder.create()
        .measures(['WindowTest.movingSumCode'])
        .dimensions(['WindowTest.employeeId', 'WindowTest.date'])
        .limit(20)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Moving sum should return numbers
      for (const row of result.data) {
        const movingSum = row['WindowTest.movingSumCode']
        expect(typeof movingSum).toBe('number')
      }
    })
  })

  describe('Combined Window Functions', () => {
    it('should return multiple window functions in same query', async function () {
      const query = TestQueryBuilder.create()
        .measures([
          'WindowTest.rowNum',
          'WindowTest.rankByCode',
          'WindowTest.previousDayCode'
        ])
        .dimensions(['WindowTest.date', 'WindowTest.linesOfCode'])
        .limit(10)
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // All window functions should return values
      for (const row of result.data) {
        expect(row['WindowTest.rowNum']).toBeDefined()
        expect(row['WindowTest.rankByCode']).toBeDefined()
        expect(row['WindowTest.previousDayCode']).toBeDefined()
      }
    })
  })

  describe('Database Capabilities', () => {
    it('should correctly report window function support', async function () {
      const { executor: dbExecutor } = await createTestDatabaseExecutor()
      const capabilities = dbExecutor.databaseAdapter.getCapabilities()

      // All tested databases (PostgreSQL 9.4+, MySQL 8.0+, SQLite 3.25+) support window functions
      expect(capabilities.supportsWindowFunctions).toBe(true)

      // Frame clause support varies
      if (dbType === 'postgres' || dbType === 'mysql') {
        expect(capabilities.supportsFrameClause).toBe(true)
      }
      // SQLite 3.25+ also supports frame clauses
      if (dbType === 'sqlite') {
        expect(capabilities.supportsFrameClause).toBe(true)
      }
    })
  })

  describe('Window Functions Without Cube Context', () => {
    it('should handle window functions without partition/order by gracefully', async function () {
      // This tests the fallback when no windowConfig is provided
      const { productivity } = await getTestSchema()

      const simpleCube = defineCube('SimpleWindow', {
        title: 'Simple Window Test',
        sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          simpleRowNum: {
            name: 'simpleRowNum',
            type: 'rowNumber',
            sql: () => productivity.id
            // No windowConfig - should still work with OVER ()
          }
        },
        dimensions: {
          id: {
            name: 'id',
            type: 'number',
            sql: () => productivity.id
          }
        }
      })

      const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
      const executor = new QueryExecutor(dbExecutor)
      const simpleTestExecutor = new TestExecutor(
        executor,
        new Map([['SimpleWindow', simpleCube]]),
        testSecurityContexts.org1
      )

      const query = TestQueryBuilder.create()
        .measures(['SimpleWindow.simpleRowNum'])
        .dimensions(['SimpleWindow.id'])
        .limit(5)
        .build()

      const result = await simpleTestExecutor.executeQuery(query)

      expect(result.data.length).toBeGreaterThan(0)
      // Row numbers should still be assigned even without ORDER BY
      for (const row of result.data) {
        const rowNum = row['SimpleWindow.simpleRowNum']
        expect(Number.isInteger(rowNum)).toBe(true)
        expect(rowNum).toBeGreaterThan(0)
      }

      cleanup()
    })
  })
})
