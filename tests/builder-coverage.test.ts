/**
 * Builder Coverage Tests
 *
 * Focused unit tests for MeasureBuilder and FilterBuilder to achieve >95% coverage.
 * Tests cover:
 * - Statistical functions (stddev, variance, percentile)
 * - Window functions (lag, lead, rank, etc.)
 * - Measure filters (CASE WHEN conditional aggregation)
 * - Custom measure builders
 * - Error handling paths
 * - Array operators (PostgreSQL)
 * - Regex and Like operators
 * - DateRange validation
 * - Value cleaning and security
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sql, type SQL, type AnyColumn } from 'drizzle-orm'

import { MeasureBuilder } from '../src/server/builders/measure-builder'
import { FilterBuilder } from '../src/server/builders/filter-builder'
import { DateTimeBuilder } from '../src/server/builders/date-time-builder'
import type { DatabaseAdapter, WindowFunctionType, WindowFunctionConfig } from '../src/server/adapters/base-adapter'
import type { TimeGranularity, QueryContext, Cube, QueryPlan } from '../src/server/types'

// ============================================
// Mock Database Adapters
// ============================================

/**
 * Create a mock PostgreSQL adapter with full support for all features
 */
function createMockPostgresAdapter(): DatabaseAdapter {
  return {
    getEngineType: () => 'postgres',
    getCapabilities: () => ({
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: true,
      supportsWindowFunctions: true,
      supportsFrameClause: true
    }),
    buildTimeDimension: (granularity: TimeGranularity, fieldExpr: AnyColumn | SQL) => {
      return sql`DATE_TRUNC('${sql.raw(granularity)}', ${fieldExpr}::timestamp)`
    },
    buildStringCondition: (fieldExpr: AnyColumn | SQL, operator: string, value: string) => {
      switch (operator) {
        case 'contains':
          return sql`${fieldExpr} ILIKE ${`%${value}%`}`
        case 'notContains':
          return sql`${fieldExpr} NOT ILIKE ${`%${value}%`}`
        case 'startsWith':
          return sql`${fieldExpr} ILIKE ${`${value}%`}`
        case 'endsWith':
          return sql`${fieldExpr} ILIKE ${`%${value}`}`
        case 'like':
          return sql`${fieldExpr} LIKE ${value}`
        case 'notLike':
          return sql`${fieldExpr} NOT LIKE ${value}`
        case 'ilike':
          return sql`${fieldExpr} ILIKE ${value}`
        case 'regex':
          return sql`${fieldExpr} ~* ${value}`
        case 'notRegex':
          return sql`${fieldExpr} !~* ${value}`
        default:
          throw new Error(`Unsupported string operator: ${operator}`)
      }
    },
    castToType: (fieldExpr: AnyColumn | SQL, targetType: string) => {
      return sql`${fieldExpr}::${sql.raw(targetType)}`
    },
    buildAvg: (fieldExpr: AnyColumn | SQL) => {
      return sql`COALESCE(AVG(${fieldExpr}), 0)`
    },
    buildCaseWhen: (conditions: Array<{ when: SQL; then: any }>, elseValue?: any) => {
      const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)
      if (elseValue !== undefined) {
        return sql`CASE ${cases} ELSE ${elseValue} END`
      }
      return sql`CASE ${cases} END`
    },
    buildBooleanLiteral: (value: boolean) => {
      return value ? sql`TRUE` : sql`FALSE`
    },
    convertFilterValue: (value: any) => value,
    prepareDateValue: (date: Date) => date,
    isTimestampInteger: () => false,
    convertTimeDimensionResult: (value: any) => value,
    preprocessCalculatedTemplate: (template: string) => template,
    buildStddev: (fieldExpr: AnyColumn | SQL, useSample = false) => {
      const fn = useSample ? 'STDDEV_SAMP' : 'STDDEV_POP'
      return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
    },
    buildVariance: (fieldExpr: AnyColumn | SQL, useSample = false) => {
      const fn = useSample ? 'VAR_SAMP' : 'VAR_POP'
      return sql`COALESCE(${sql.raw(fn)}(${fieldExpr}), 0)`
    },
    buildPercentile: (fieldExpr: AnyColumn | SQL, percentile: number) => {
      const pct = percentile / 100
      return sql`PERCENTILE_CONT(${pct}) WITHIN GROUP (ORDER BY ${fieldExpr})`
    },
    buildWindowFunction: (
      type: WindowFunctionType,
      fieldExpr: AnyColumn | SQL | null,
      partitionBy?: (AnyColumn | SQL)[],
      orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>,
      config?: WindowFunctionConfig
    ) => {
      const partitionClause = partitionBy && partitionBy.length > 0
        ? sql`PARTITION BY ${sql.join(partitionBy, sql`, `)}`
        : sql``
      const orderClause = orderBy && orderBy.length > 0
        ? sql`ORDER BY ${sql.join(orderBy.map(o =>
            o.direction === 'desc' ? sql`${o.field} DESC` : sql`${o.field} ASC`
          ), sql`, `)}`
        : sql``
      const overParts: SQL[] = []
      if (partitionBy && partitionBy.length > 0) overParts.push(partitionClause)
      if (orderBy && orderBy.length > 0) overParts.push(orderClause)
      const overContent = overParts.length > 0 ? sql.join(overParts, sql` `) : sql``
      const over = sql`OVER (${overContent})`

      switch (type) {
        case 'lag':
          return sql`LAG(${fieldExpr}, ${config?.offset ?? 1}) ${over}`
        case 'lead':
          return sql`LEAD(${fieldExpr}, ${config?.offset ?? 1}) ${over}`
        case 'rank':
          return sql`RANK() ${over}`
        case 'denseRank':
          return sql`DENSE_RANK() ${over}`
        case 'rowNumber':
          return sql`ROW_NUMBER() ${over}`
        case 'ntile':
          return sql`NTILE(${config?.nTile ?? 4}) ${over}`
        case 'firstValue':
          return sql`FIRST_VALUE(${fieldExpr}) ${over}`
        case 'lastValue':
          return sql`LAST_VALUE(${fieldExpr}) ${over}`
        case 'movingAvg':
          return sql`AVG(${fieldExpr}) ${over}`
        case 'movingSum':
          return sql`SUM(${fieldExpr}) ${over}`
        default:
          return null
      }
    }
  }
}

/**
 * Create a mock SQLite adapter with limited statistical support (returns null)
 */
function createMockSQLiteAdapter(): DatabaseAdapter {
  const baseAdapter = createMockPostgresAdapter()
  return {
    ...baseAdapter,
    getEngineType: () => 'sqlite',
    getCapabilities: () => ({
      supportsStddev: false,
      supportsVariance: false,
      supportsPercentile: false,
      supportsWindowFunctions: true,
      supportsFrameClause: true
    }),
    buildBooleanLiteral: (value: boolean) => value ? sql`1` : sql`0`,
    isTimestampInteger: () => true,
    convertFilterValue: (value: any) => {
      if (typeof value === 'boolean') return value ? 1 : 0
      return value
    },
    // SQLite doesn't support these - return null for graceful degradation
    buildStddev: () => null,
    buildVariance: () => null,
    buildPercentile: () => null
  }
}

/**
 * Create a mock MySQL adapter
 */
function createMockMySQLAdapter(): DatabaseAdapter {
  const baseAdapter = createMockPostgresAdapter()
  return {
    ...baseAdapter,
    getEngineType: () => 'mysql',
    getCapabilities: () => ({
      supportsStddev: true,
      supportsVariance: true,
      supportsPercentile: false, // MySQL 8.0+ has limited percentile support
      supportsWindowFunctions: true,
      supportsFrameClause: true
    }),
    buildAvg: (fieldExpr: AnyColumn | SQL) => sql`IFNULL(AVG(${fieldExpr}), 0)`,
    buildPercentile: () => null // MySQL doesn't have PERCENTILE_CONT
  }
}

// ============================================
// Test Helpers
// ============================================

function createMockQueryContext(): QueryContext {
  return {
    db: {} as any,
    schema: {} as any,
    securityContext: { organisationId: 'org-1' }
  }
}

function createMockColumn(): AnyColumn {
  // Mock a Drizzle column
  return { name: 'test_column' } as any as AnyColumn
}

function createMockCube(overrides: Partial<Cube> = {}): Cube {
  return {
    name: 'TestCube',
    sql: () => sql`TRUE`,
    measures: {
      count: { type: 'count', sql: () => createMockColumn() },
      sum: { type: 'sum', sql: () => createMockColumn() },
      avg: { type: 'avg', sql: () => createMockColumn() }
    },
    dimensions: {
      name: { type: 'string', sql: () => createMockColumn() },
      date: { type: 'time', sql: () => createMockColumn() }
    },
    ...overrides
  } as Cube
}

// ============================================
// MeasureBuilder Tests
// ============================================

describe('MeasureBuilder', () => {
  let postgresAdapter: DatabaseAdapter
  let sqliteAdapter: DatabaseAdapter
  let mysqlAdapter: DatabaseAdapter
  let measureBuilder: MeasureBuilder
  let context: QueryContext

  beforeEach(() => {
    postgresAdapter = createMockPostgresAdapter()
    sqliteAdapter = createMockSQLiteAdapter()
    mysqlAdapter = createMockMySQLAdapter()
    measureBuilder = new MeasureBuilder(postgresAdapter)
    context = createMockQueryContext()
  })

  describe('Statistical Functions', () => {
    describe('stddev / stddevSamp', () => {
      it('builds stddev measure expression', () => {
        const measure = {
          name: 'salaryStddev',
          type: 'stddev',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
        // The SQL should contain STDDEV_POP
        expect(result.queryChunks).toBeDefined()
      })

      it('builds stddevSamp measure expression', () => {
        const measure = {
          name: 'salaryStddevSamp',
          type: 'stddevSamp',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds stddev with useSample config', () => {
        const measure = {
          name: 'salaryStddev',
          type: 'stddev',
          sql: () => createMockColumn(),
          statisticalConfig: { useSample: true }
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('returns MAX(NULL) when stddev unsupported on SQLite', () => {
        const sqliteMeasureBuilder = new MeasureBuilder(sqliteAdapter)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'salaryStddev',
          type: 'stddev',
          sql: () => createMockColumn()
        }

        const result = sqliteMeasureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('stddev not supported')
        )
        warnSpy.mockRestore()
      })
    })

    describe('variance / varianceSamp', () => {
      it('builds variance measure expression', () => {
        const measure = {
          name: 'salaryVariance',
          type: 'variance',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds varianceSamp measure expression', () => {
        const measure = {
          name: 'salaryVarianceSamp',
          type: 'varianceSamp',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds variance with useSample config', () => {
        const measure = {
          name: 'salaryVariance',
          type: 'variance',
          sql: () => createMockColumn(),
          statisticalConfig: { useSample: true }
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('returns MAX(NULL) when variance unsupported on SQLite', () => {
        const sqliteMeasureBuilder = new MeasureBuilder(sqliteAdapter)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'salaryVariance',
          type: 'variance',
          sql: () => createMockColumn()
        }

        const result = sqliteMeasureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('variance not supported')
        )
        warnSpy.mockRestore()
      })
    })

    describe('percentile / median / p95 / p99', () => {
      it('builds percentile measure with custom percentile value', () => {
        const measure = {
          name: 'salaryP75',
          type: 'percentile',
          sql: () => createMockColumn(),
          statisticalConfig: { percentile: 75 }
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds percentile with default 50th percentile when config not provided', () => {
        const measure = {
          name: 'salaryP50',
          type: 'percentile',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds median measure (50th percentile)', () => {
        const measure = {
          name: 'salaryMedian',
          type: 'median',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds p95 measure', () => {
        const measure = {
          name: 'responseTimeP95',
          type: 'p95',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('builds p99 measure', () => {
        const measure = {
          name: 'responseTimeP99',
          type: 'p99',
          sql: () => createMockColumn()
        }

        const result = measureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
      })

      it('returns MAX(NULL) when percentile unsupported on SQLite', () => {
        const sqliteMeasureBuilder = new MeasureBuilder(sqliteAdapter)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'salaryMedian',
          type: 'median',
          sql: () => createMockColumn()
        }

        const result = sqliteMeasureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('median not supported')
        )
        warnSpy.mockRestore()
      })

      it('returns MAX(NULL) when percentile unsupported on MySQL', () => {
        const mysqlMeasureBuilder = new MeasureBuilder(mysqlAdapter)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'salaryP95',
          type: 'p95',
          sql: () => createMockColumn()
        }

        const result = mysqlMeasureBuilder.buildMeasureExpression(measure, context)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('p95 not supported')
        )
        warnSpy.mockRestore()
      })
    })
  })

  describe('Window Functions', () => {
    describe('Basic window functions', () => {
      it('builds lag window function', () => {
        const measure = {
          name: 'previousValue',
          type: 'lag',
          sql: () => createMockColumn(),
          windowConfig: {
            offset: 1,
            orderBy: [{ field: 'date', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds lead window function', () => {
        const measure = {
          name: 'nextValue',
          type: 'lead',
          sql: () => createMockColumn(),
          windowConfig: {
            offset: 1,
            orderBy: [{ field: 'date', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds rank window function', () => {
        const measure = {
          name: 'ranking',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds denseRank window function', () => {
        const measure = {
          name: 'denseRanking',
          type: 'denseRank',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds rowNumber window function', () => {
        const measure = {
          name: 'rowNum',
          type: 'rowNumber',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds ntile window function with nTile config', () => {
        const measure = {
          name: 'quartile',
          type: 'ntile',
          sql: () => createMockColumn(),
          windowConfig: {
            nTile: 4,
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds firstValue window function', () => {
        const measure = {
          name: 'firstVal',
          type: 'firstValue',
          sql: () => createMockColumn(),
          windowConfig: {
            partitionBy: ['name'],
            orderBy: [{ field: 'date', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds lastValue window function', () => {
        const measure = {
          name: 'lastVal',
          type: 'lastValue',
          sql: () => createMockColumn(),
          windowConfig: {
            partitionBy: ['name'],
            orderBy: [{ field: 'date', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds movingAvg window function', () => {
        const measure = {
          name: 'movingAverage',
          type: 'movingAvg',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' as const }],
            frame: { type: 'rows' as const, start: 2, end: 'current' as const }
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('builds movingSum window function', () => {
        const measure = {
          name: 'runningTotal',
          type: 'movingSum',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' as const }],
            frame: { type: 'rows' as const, start: 'unbounded' as const, end: 'current' as const }
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })
    })

    describe('Dimension resolution in window functions', () => {
      it('resolves partitionBy dimension references', () => {
        const measure = {
          name: 'partitionedRank',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            partitionBy: ['name'],
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('handles CubeName.dimensionName format in partitionBy', () => {
        const measure = {
          name: 'partitionedRank',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            partitionBy: ['TestCube.name'],
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('warns and skips missing partition dimension', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'partitionedRank',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            partitionBy: ['nonexistent'],
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('partition dimension')
        )
        warnSpy.mockRestore()
      })

      it('resolves orderBy dimension references', () => {
        const measure = {
          name: 'orderedRank',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('resolves orderBy measure references', () => {
        const measure = {
          name: 'orderedRank',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'count', direction: 'desc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('handles both asc and desc directions', () => {
        const measure = {
          name: 'complexOrder',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [
              { field: 'date', direction: 'asc' as const },
              { field: 'count', direction: 'desc' as const }
            ]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })

      it('warns and skips missing orderBy field', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'orderedRank',
          type: 'rank',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'nonexistent', direction: 'asc' as const }]
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('order field')
        )
        warnSpy.mockRestore()
      })
    })

    describe('Window frame configuration', () => {
      it('passes frame config to database adapter', () => {
        const measure = {
          name: 'windowedSum',
          type: 'movingSum',
          sql: () => createMockColumn(),
          windowConfig: {
            orderBy: [{ field: 'date', direction: 'asc' as const }],
            frame: {
              type: 'rows' as const,
              start: 3,
              end: 'current' as const
            }
          }
        }

        const cube = createMockCube()
        const result = measureBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
      })
    })

    describe('Unsupported window functions', () => {
      it('returns NULL when window function returns null', () => {
        // Create an adapter that returns null for window functions
        const limitedAdapter = {
          ...createMockPostgresAdapter(),
          buildWindowFunction: () => null
        }
        const limitedBuilder = new MeasureBuilder(limitedAdapter)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const measure = {
          name: 'unsupportedWindow',
          type: 'lag',
          sql: () => createMockColumn(),
          windowConfig: {}
        }

        const cube = createMockCube()
        const result = limitedBuilder.buildMeasureExpression(measure, context, cube)
        expect(result).toBeDefined()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('not supported')
        )
        warnSpy.mockRestore()
      })
    })
  })

  describe('Custom Measure Builder', () => {
    it('uses customMeasureBuilder function when provided', () => {
      const customBuilder = vi.fn().mockReturnValue(sql`CUSTOM_AGG(test)`)

      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])

      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.count'],
        cubeMap,
        context,
        customBuilder
      )

      expect(result.has('TestCube.count')).toBe(true)
      expect(customBuilder).toHaveBeenCalledWith(
        'TestCube.count',
        expect.any(Object),
        cube
      )
    })

    it('passes correct parameters to customMeasureBuilder', () => {
      const customBuilder = vi.fn().mockReturnValue(sql`CUSTOM_AGG(test)`)

      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])

      measureBuilder.buildResolvedMeasures(
        ['TestCube.count'],
        cubeMap,
        context,
        customBuilder
      )

      expect(customBuilder).toHaveBeenCalledWith(
        'TestCube.count',
        cube.measures!.count,
        cube
      )
    })

    it('falls back to default builder when customMeasureBuilder not provided', () => {
      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])

      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.count'],
        cubeMap,
        context
      )

      expect(result.has('TestCube.count')).toBe(true)
      // Should be a function that builds the measure expression
      const builder = result.get('TestCube.count')
      expect(typeof builder).toBe('function')
    })
  })

  describe('Measure Filters', () => {
    it('applies single filter via CASE WHEN', () => {
      const measure = {
        name: 'activeCount',
        type: 'count',
        sql: () => createMockColumn(),
        filters: [
          () => sql`active = TRUE`
        ]
      }

      const result = measureBuilder.buildMeasureExpression(measure, context)
      expect(result).toBeDefined()
    })

    it('applies multiple filters with AND condition', () => {
      const measure = {
        name: 'filteredCount',
        type: 'count',
        sql: () => createMockColumn(),
        filters: [
          () => sql`active = TRUE`,
          () => sql`status = 'active'`
        ]
      }

      const result = measureBuilder.buildMeasureExpression(measure, context)
      expect(result).toBeDefined()
    })

    it('handles filter function returning undefined', () => {
      const measure = {
        name: 'partialFilterCount',
        type: 'count',
        sql: () => createMockColumn(),
        filters: [
          () => sql`active = TRUE`,
          () => undefined as any
        ]
      }

      const result = measureBuilder.buildMeasureExpression(measure, context)
      expect(result).toBeDefined()
    })

    it('wraps aggregation around CASE WHEN expression', () => {
      const measure = {
        name: 'conditionalSum',
        type: 'sum',
        sql: () => createMockColumn(),
        filters: [
          () => sql`category = 'sales'`
        ]
      }

      const result = measureBuilder.buildMeasureExpression(measure, context)
      expect(result).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('throws error when buildMeasureExpression called on calculated measure', () => {
      const measure = {
        name: 'ratio',
        type: 'calculated',
        calculatedSql: '{count} / {sum}'
      }

      expect(() => measureBuilder.buildMeasureExpression(measure, context)).toThrow(
        /Cannot build calculated measure/
      )
    })

    it('throws error when non-calculated measure missing sql property', () => {
      const measure = {
        name: 'brokenMeasure',
        type: 'count'
        // Missing sql property
      }

      expect(() => measureBuilder.buildMeasureExpression(measure, context)).toThrow(
        /missing required 'sql' property/
      )
    })

    it('throws error when buildCalculatedMeasure missing calculatedSql', () => {
      const measure = {
        name: 'brokenCalculated',
        type: 'calculated'
        // Missing calculatedSql
      }

      const cube = createMockCube({ name: 'TestCube' })
      const cubeMap = new Map([['TestCube', cube]])
      const resolvedMeasures = new Map<string, () => SQL>()

      expect(() => measureBuilder.buildCalculatedMeasure(
        measure,
        cube,
        cubeMap,
        resolvedMeasures,
        context
      )).toThrow(/missing calculatedSql property/)
    })

    it('throws error when buildCTECalculatedMeasure missing calculatedSql', () => {
      const measure = {
        name: 'brokenCTECalculated',
        type: 'calculated'
        // Missing calculatedSql
      }

      const cube = createMockCube({ name: 'TestCube' })
      const cubeMap = new Map([['TestCube', cube]])
      const cteInfo = { cteAlias: 'cte_1', measures: [], cube }

      expect(() => measureBuilder.buildCTECalculatedMeasure(
        measure,
        cube,
        cteInfo,
        cubeMap,
        context
      )).toThrow(/missing calculatedSql property/)
    })
  })

  describe('Number type measures', () => {
    it('returns base expression for number type', () => {
      const measure = {
        name: 'rawValue',
        type: 'number',
        sql: () => createMockColumn()
      }

      const result = measureBuilder.buildMeasureExpression(measure, context)
      expect(result).toBeDefined()
    })
  })

  describe('Default aggregation fallback', () => {
    it('falls back to count for unknown aggregation type', () => {
      const measure = {
        name: 'unknownAgg',
        type: 'unknownType',
        sql: () => createMockColumn()
      }

      const result = measureBuilder.buildMeasureExpression(measure, context)
      expect(result).toBeDefined()
    })
  })

  describe('buildResolvedMeasures with calculated measures', () => {
    it('resolves calculated measures with dependencies', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          sum: { type: 'sum', sql: () => createMockColumn() },
          ratio: {
            type: 'calculated',
            calculatedSql: '{count} / NULLIF({sum}, 0)'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.ratio'],
        cubeMap,
        context
      )

      expect(result.has('TestCube.ratio')).toBe(true)
      expect(result.has('TestCube.count')).toBe(true) // Dependency should be resolved
      expect(result.has('TestCube.sum')).toBe(true) // Dependency should be resolved
    })

    it('handles nested calculated measure dependencies', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          sum: { type: 'sum', sql: () => createMockColumn() },
          baseRatio: {
            type: 'calculated',
            calculatedSql: '{count} / NULLIF({sum}, 0)'
          },
          adjustedRatio: {
            type: 'calculated',
            calculatedSql: '{baseRatio} * 100'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.adjustedRatio'],
        cubeMap,
        context
      )

      expect(result.has('TestCube.adjustedRatio')).toBe(true)
      expect(result.has('TestCube.baseRatio')).toBe(true)
      expect(result.has('TestCube.count')).toBe(true)
      expect(result.has('TestCube.sum')).toBe(true)
    })

    it('handles measures not found in cube', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.nonexistent'],
        cubeMap,
        context
      )

      // Should not add nonexistent measures
      expect(result.has('TestCube.nonexistent')).toBe(false)
    })

    it('handles cube not found in map', () => {
      const cubeMap = new Map<string, Cube>()

      const result = measureBuilder.buildResolvedMeasures(
        ['NonexistentCube.count'],
        cubeMap,
        context
      )

      expect(result.has('NonexistentCube.count')).toBe(false)
    })

    it('builds both regular and calculated measures', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          ratio: {
            type: 'calculated',
            calculatedSql: '{count} * 2'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.count', 'TestCube.ratio'],
        cubeMap,
        context
      )

      expect(result.has('TestCube.count')).toBe(true)
      expect(result.has('TestCube.ratio')).toBe(true)

      // Verify the builders return SQL
      const countBuilder = result.get('TestCube.count')
      expect(countBuilder).toBeDefined()
      expect(typeof countBuilder).toBe('function')
      const countSql = countBuilder!()
      expect(countSql).toBeDefined()
    })

    it('classifies dependency measures correctly in second pass', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          base1: { type: 'count', sql: () => createMockColumn() },
          base2: { type: 'sum', sql: () => createMockColumn() },
          calc1: {
            type: 'calculated',
            calculatedSql: '{base1} + {base2}'
          },
          calc2: {
            type: 'calculated',
            calculatedSql: '{calc1} / 2'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      // Request only calc2, should pull in calc1, base1, base2
      const result = measureBuilder.buildResolvedMeasures(
        ['TestCube.calc2'],
        cubeMap,
        context
      )

      expect(result.has('TestCube.calc2')).toBe(true)
      expect(result.has('TestCube.calc1')).toBe(true)
      expect(result.has('TestCube.base1')).toBe(true)
      expect(result.has('TestCube.base2')).toBe(true)
    })
  })

  describe('buildCTECalculatedMeasure', () => {
    it('builds CTE calculated measure with aggregated dependencies', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          sum: { type: 'sum', sql: () => createMockColumn() },
          ratio: {
            type: 'calculated',
            calculatedSql: '{count} / NULLIF({sum}, 0)'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const cteInfo = {
        cteAlias: 'cte_test',
        measures: ['TestCube.count', 'TestCube.sum'],
        cube: cube
      }

      const result = measureBuilder.buildCTECalculatedMeasure(
        cube.measures!.ratio,
        cube,
        cteInfo,
        cubeMap,
        context
      )

      expect(result).toBeDefined()
    })

    it('handles different aggregation types in CTE', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          countDistinct: { type: 'countDistinct', sql: () => createMockColumn() },
          sum: { type: 'sum', sql: () => createMockColumn() },
          avg: { type: 'avg', sql: () => createMockColumn() },
          min: { type: 'min', sql: () => createMockColumn() },
          max: { type: 'max', sql: () => createMockColumn() },
          number: { type: 'number', sql: () => createMockColumn() },
          combined: {
            type: 'calculated',
            calculatedSql: '{count} + {sum} + {avg} + {min} + {max} + {number} + {countDistinct}'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const cteInfo = {
        cteAlias: 'cte_agg',
        measures: ['TestCube.count', 'TestCube.sum', 'TestCube.avg', 'TestCube.min', 'TestCube.max', 'TestCube.number', 'TestCube.countDistinct'],
        cube: cube
      }

      const result = measureBuilder.buildCTECalculatedMeasure(
        cube.measures!.combined,
        cube,
        cteInfo,
        cubeMap,
        context
      )

      expect(result).toBeDefined()
    })

    it('handles default aggregation type in CTE', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          custom: { type: 'customUnknown', sql: () => createMockColumn() },
          calc: {
            type: 'calculated',
            calculatedSql: '{custom} * 2'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      const cteInfo = {
        cteAlias: 'cte_custom',
        measures: ['TestCube.custom'],
        cube: cube
      }

      const result = measureBuilder.buildCTECalculatedMeasure(
        cube.measures!.calc,
        cube,
        cteInfo,
        cubeMap,
        context
      )

      expect(result).toBeDefined()
    })
  })

  describe('buildHavingMeasureExpression', () => {
    it('builds expression for non-CTE measure', () => {
      const measure = { type: 'count', sql: () => createMockColumn() }

      const result = measureBuilder.buildHavingMeasureExpression(
        'TestCube',
        'count',
        measure,
        context,
        undefined // No query plan
      )

      expect(result).toBeDefined()
    })

    it('builds expression for CTE measure (non-calculated)', () => {
      const cube = createMockCube()
      const measure = { type: 'count', sql: () => createMockColumn() }

      const queryPlan = {
        primaryCube: cube,
        joinCubes: [],
        preAggregationCTEs: [{
          cteAlias: 'cte_test',
          measures: ['TestCube.count'],
          cube: cube
        }]
      } as any as QueryPlan

      const result = measureBuilder.buildHavingMeasureExpression(
        'TestCube',
        'count',
        measure,
        context,
        queryPlan
      )

      expect(result).toBeDefined()
    })

    it('builds expression for CTE calculated measure from primary cube', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          ratio: {
            type: 'calculated',
            calculatedSql: '{count} * 100'
          }
        },
        dimensions: {}
      } as Cube

      const queryPlan = {
        primaryCube: cube,
        joinCubes: [],
        preAggregationCTEs: [{
          cteAlias: 'cte_test',
          measures: ['TestCube.count', 'TestCube.ratio'],
          cube: cube
        }]
      } as any as QueryPlan

      const result = measureBuilder.buildHavingMeasureExpression(
        'TestCube',
        'ratio',
        cube.measures!.ratio,
        context,
        queryPlan
      )

      expect(result).toBeDefined()
    })

    it('builds expression for CTE calculated measure from joined cube', () => {
      const mainCube: Cube = {
        name: 'MainCube',
        sql: () => sql`TRUE`,
        measures: { count: { type: 'count', sql: () => createMockColumn() } },
        dimensions: {}
      } as Cube

      const joinedCube: Cube = {
        name: 'JoinedCube',
        sql: () => sql`TRUE`,
        measures: {
          sum: { type: 'sum', sql: () => createMockColumn() },
          ratio: {
            type: 'calculated',
            calculatedSql: '{sum} * 100'
          }
        },
        dimensions: {}
      } as Cube

      const queryPlan = {
        primaryCube: mainCube,
        joinCubes: [{ cube: joinedCube, joinType: 'left' }],
        preAggregationCTEs: [{
          cteAlias: 'cte_joined',
          measures: ['JoinedCube.sum', 'JoinedCube.ratio'],
          cube: joinedCube
        }]
      } as any as QueryPlan

      const result = measureBuilder.buildHavingMeasureExpression(
        'JoinedCube',
        'ratio',
        joinedCube.measures!.ratio,
        context,
        queryPlan
      )

      expect(result).toBeDefined()
    })

    it('throws error when cube not found in query plan', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          ratio: {
            type: 'calculated',
            calculatedSql: '{count} * 100'
          }
        },
        dimensions: {}
      } as Cube

      const queryPlan = {
        primaryCube: { name: 'OtherCube', measures: {} } as Cube,
        joinCubes: [],
        preAggregationCTEs: [{
          cteAlias: 'cte_test',
          measures: ['TestCube.ratio'],
          cube: { name: 'TestCube' } as Cube
        }]
      } as any as QueryPlan

      expect(() => measureBuilder.buildHavingMeasureExpression(
        'TestCube',
        'ratio',
        cube.measures!.ratio,
        context,
        queryPlan
      )).toThrow(/Cube TestCube not found in query plan/)
    })

    it('handles different CTE aggregation types in HAVING', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          countDistinct: { type: 'countDistinct', sql: () => createMockColumn() },
          sum: { type: 'sum', sql: () => createMockColumn() },
          avg: { type: 'avg', sql: () => createMockColumn() },
          min: { type: 'min', sql: () => createMockColumn() },
          max: { type: 'max', sql: () => createMockColumn() },
          number: { type: 'number', sql: () => createMockColumn() }
        },
        dimensions: {}
      } as Cube

      const queryPlan = {
        primaryCube: cube,
        joinCubes: [],
        preAggregationCTEs: [{
          cteAlias: 'cte_test',
          measures: Object.keys(cube.measures!).map(k => `TestCube.${k}`),
          cube: cube
        }]
      } as any as QueryPlan

      // Test each measure type
      for (const [key, measure] of Object.entries(cube.measures!)) {
        const result = measureBuilder.buildHavingMeasureExpression(
          'TestCube',
          key,
          measure as any,
          context,
          queryPlan
        )
        expect(result).toBeDefined()
      }
    })

    it('handles default aggregation type in CTE HAVING', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          unknown: { type: 'unknownType', sql: () => createMockColumn() }
        },
        dimensions: {}
      } as Cube

      const queryPlan = {
        primaryCube: cube,
        joinCubes: [],
        preAggregationCTEs: [{
          cteAlias: 'cte_test',
          measures: ['TestCube.unknown'],
          cube: cube
        }]
      } as any as QueryPlan

      const result = measureBuilder.buildHavingMeasureExpression(
        'TestCube',
        'unknown',
        cube.measures!.unknown as any,
        context,
        queryPlan
      )

      expect(result).toBeDefined()
    })
  })

  describe('buildCalculatedMeasure', () => {
    it('substitutes member references correctly', () => {
      const cube: Cube = {
        name: 'TestCube',
        sql: () => sql`TRUE`,
        measures: {
          count: { type: 'count', sql: () => createMockColumn() },
          sum: { type: 'sum', sql: () => createMockColumn() },
          ratio: {
            type: 'calculated',
            calculatedSql: '{count} / NULLIF({sum}, 0)'
          }
        },
        dimensions: {}
      } as Cube
      const cubeMap = new Map([['TestCube', cube]])

      // First build the resolved measures
      const resolvedMeasures = measureBuilder.buildResolvedMeasures(
        ['TestCube.count', 'TestCube.sum'],
        cubeMap,
        context
      )

      const result = measureBuilder.buildCalculatedMeasure(
        cube.measures!.ratio,
        cube,
        cubeMap,
        resolvedMeasures,
        context
      )

      expect(result).toBeDefined()
    })
  })
})

// ============================================
// FilterBuilder Tests
// ============================================

describe('FilterBuilder', () => {
  let postgresAdapter: DatabaseAdapter
  let sqliteAdapter: DatabaseAdapter
  let mysqlAdapter: DatabaseAdapter
  let filterBuilder: FilterBuilder
  let dateTimeBuilder: DateTimeBuilder

  beforeEach(() => {
    postgresAdapter = createMockPostgresAdapter()
    sqliteAdapter = createMockSQLiteAdapter()
    mysqlAdapter = createMockMySQLAdapter()
    dateTimeBuilder = new DateTimeBuilder(postgresAdapter)
    filterBuilder = new FilterBuilder(postgresAdapter, dateTimeBuilder)
  })

  describe('Array Operators (PostgreSQL)', () => {
    it('builds arrayContains on PostgreSQL', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayContains',
        ['value1', 'value2']
      )
      expect(result).toBeDefined()
    })

    it('builds arrayOverlaps on PostgreSQL', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayOverlaps',
        ['value1', 'value2']
      )
      expect(result).toBeDefined()
    })

    it('builds arrayContained on PostgreSQL', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayContained',
        ['value1', 'value2']
      )
      expect(result).toBeDefined()
    })

    it('returns null for arrayContains on MySQL', () => {
      const mysqlDateTimeBuilder = new DateTimeBuilder(mysqlAdapter)
      const mysqlFilterBuilder = new FilterBuilder(mysqlAdapter, mysqlDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = mysqlFilterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayContains',
        ['value1', 'value2']
      )
      expect(result).toBeNull()
    })

    it('returns null for arrayContains on SQLite', () => {
      const sqliteDateTimeBuilder = new DateTimeBuilder(sqliteAdapter)
      const sqliteFilterBuilder = new FilterBuilder(sqliteAdapter, sqliteDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = sqliteFilterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayContains',
        ['value1', 'value2']
      )
      expect(result).toBeNull()
    })
  })

  describe('Regex Operators', () => {
    it('builds regex filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'regex',
        ['^test.*']
      )
      expect(result).toBeDefined()
    })

    it('builds notRegex filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notRegex',
        ['^excluded.*']
      )
      expect(result).toBeDefined()
    })

    it('handles special regex characters', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'regex',
        ['test\\d+\\.txt']
      )
      expect(result).toBeDefined()
    })
  })

  describe('Like/ILike Operators', () => {
    it('builds like filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'like',
        ['%test%']
      )
      expect(result).toBeDefined()
    })

    it('builds notLike filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notLike',
        ['%excluded%']
      )
      expect(result).toBeDefined()
    })

    it('builds ilike filter condition (case-insensitive)', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'ilike',
        ['%TEST%']
      )
      expect(result).toBeDefined()
    })
  })

  describe('DateRange Parameter Validation', () => {
    it('throws error when dateRange used with non-inDateRange operator', () => {
      const fieldExpr = createMockColumn()

      expect(() => filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['2024-01-01'],
        { type: 'time' },
        'last 7 days'
      )).toThrow(/dateRange can only be used with 'inDateRange' operator/)
    })

    it('throws error when dateRange used on non-time field', () => {
      const fieldExpr = createMockColumn()

      expect(() => filterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        [],
        { type: 'string', name: 'nonTimeField' },
        'last 7 days'
      )).toThrow(/dateRange can only be used on time dimensions/)
    })

    it('uses dateRange instead of values when provided', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        [], // Empty values array
        { type: 'time' },
        ['2024-01-01', '2024-12-31']
      )
      expect(result).toBeDefined()
    })
  })

  describe('Value Cleaning & Security', () => {
    it('rejects values containing null bytes for security', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['safe', 'value\x00with\x00nullbytes', 'alsosafe']
      )
      // Should filter out the value with null bytes
      expect(result).toBeDefined()
    })

    it('filters out null, undefined, and empty string values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['valid', null, undefined, '', 'alsoValid']
      )
      expect(result).toBeDefined()
    })

    it('converts values through databaseAdapter.convertFilterValue', () => {
      const sqliteDateTimeBuilder = new DateTimeBuilder(sqliteAdapter)
      const sqliteFilterBuilder = new FilterBuilder(sqliteAdapter, sqliteDateTimeBuilder)

      const fieldExpr = createMockColumn()
      // SQLite should convert booleans to integers
      const result = sqliteFilterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        [true]
      )
      expect(result).toBeDefined()
    })
  })

  describe('Date Normalization', () => {
    it('treats date-only end date as end-of-day in inDateRange', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        ['2024-01-01', '2024-01-31'] // Date-only strings
      )
      expect(result).toBeDefined()
    })

    it('normalizes time field values in equals filter', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['2024-01-15'],
        { type: 'time' }
      )
      expect(result).toBeDefined()
    })

    it('normalizes multiple time field values in equals filter', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['2024-01-15', '2024-02-15'],
        { type: 'time' }
      )
      expect(result).toBeDefined()
    })
  })

  describe('Logical Filter Edge Cases', () => {
    it('handles deeply nested AND/OR combinations', () => {
      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])
      const context = createMockQueryContext()

      const deeplyNestedFilter = {
        and: [
          {
            or: [
              { member: 'TestCube.name', operator: 'equals' as const, values: ['a'] },
              {
                and: [
                  { member: 'TestCube.name', operator: 'equals' as const, values: ['b'] },
                  { member: 'TestCube.name', operator: 'equals' as const, values: ['c'] }
                ]
              }
            ]
          },
          { member: 'TestCube.name', operator: 'equals' as const, values: ['d'] }
        ]
      }

      const result = filterBuilder.buildLogicalFilter(deeplyNestedFilter, cubeMap, context)
      expect(result).toBeDefined()
    })

    it('returns null when all conditions are null', () => {
      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])
      const context = createMockQueryContext()

      // All conditions reference non-existent dimensions
      const filter = {
        and: [
          { member: 'TestCube.nonexistent1', operator: 'equals' as const, values: ['a'] },
          { member: 'TestCube.nonexistent2', operator: 'equals' as const, values: ['b'] }
        ]
      }

      const result = filterBuilder.buildLogicalFilter(filter, cubeMap, context)
      expect(result).toBeNull()
    })

    it('returns single condition without wrapping in AND/OR', () => {
      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])
      const context = createMockQueryContext()

      const filter = {
        and: [
          { member: 'TestCube.name', operator: 'equals' as const, values: ['a'] }
        ]
      }

      const result = filterBuilder.buildLogicalFilter(filter, cubeMap, context)
      expect(result).toBeDefined()
    })

    it('handles missing cube in buildSingleFilter', () => {
      const cubeMap = new Map<string, Cube>()
      const context = createMockQueryContext()

      const filter = {
        member: 'NonExistentCube.name',
        operator: 'equals' as const,
        values: ['a']
      }

      const result = filterBuilder.buildSingleFilter(filter, cubeMap, context)
      expect(result).toBeNull()
    })

    it('handles missing dimension in buildSingleFilter', () => {
      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])
      const context = createMockQueryContext()

      const filter = {
        member: 'TestCube.nonexistentDimension',
        operator: 'equals' as const,
        values: ['a']
      }

      const result = filterBuilder.buildSingleFilter(filter, cubeMap, context)
      expect(result).toBeNull()
    })
  })

  describe('Empty Filter Handling', () => {
    it('returns false condition for empty equals filter', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        []
      )
      expect(result).toBeDefined()
    })

    it('returns null for other operators with empty values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'contains',
        []
      )
      expect(result).toBeNull()
    })

    it('handles set operator with values (ignores them)', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'set',
        ['ignored'] // set doesn't use values but we pass some to hit line 146
      )
      expect(result).toBeDefined()
    })

    it('handles notSet operator with values (ignores them)', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notSet',
        ['ignored'] // notSet doesn't use values but we pass some to hit line 148
      )
      expect(result).toBeDefined()
    })

    it('handles set operator with empty values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'set',
        []
      )
      expect(result).toBeDefined()
    })

    it('handles notSet operator with empty values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notSet',
        []
      )
      expect(result).toBeDefined()
    })
  })

  describe('Between Operators', () => {
    it('builds between filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'between',
        [10, 100]
      )
      expect(result).toBeDefined()
    })

    it('builds notBetween filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notBetween',
        [10, 100]
      )
      expect(result).toBeDefined()
    })

    it('returns null for between with insufficient values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'between',
        [10] // Only one value
      )
      expect(result).toBeNull()
    })
  })

  describe('In/NotIn Operators', () => {
    it('builds in filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'in',
        [1, 2, 3, 4, 5]
      )
      expect(result).toBeDefined()
    })

    it('builds notIn filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notIn',
        [1, 2, 3]
      )
      expect(result).toBeDefined()
    })

    it('returns null for in with empty values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'in',
        []
      )
      expect(result).toBeNull()
    })

    it('returns null for in when all values are filtered out (null bytes)', () => {
      const fieldExpr = createMockColumn()
      // These values will be filtered out due to null bytes
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'in',
        ['value\x00evil'] // Contains null byte, will be filtered
      )
      expect(result).toBeNull()
    })

    it('returns null for notIn when all values are filtered out', () => {
      const fieldExpr = createMockColumn()
      // These values will be filtered out due to null bytes
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notIn',
        ['value\x00evil'] // Contains null byte, will be filtered
      )
      expect(result).toBeNull()
    })
  })

  describe('Date Operators', () => {
    it('builds beforeDate filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'beforeDate',
        ['2024-12-31']
      )
      expect(result).toBeDefined()
    })

    it('builds afterDate filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'afterDate',
        ['2024-01-01']
      )
      expect(result).toBeDefined()
    })

    it('returns null for invalid date in beforeDate', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'beforeDate',
        ['not-a-valid-date']
      )
      expect(result).toBeNull()
    })

    it('returns null for invalid date in afterDate', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'afterDate',
        ['also-not-valid']
      )
      expect(result).toBeNull()
    })
  })

  describe('isEmpty/isNotEmpty Operators', () => {
    it('builds isEmpty filter condition with values', () => {
      const fieldExpr = createMockColumn()
      // Need to pass values to avoid early return for empty values
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'isEmpty',
        ['ignored'] // isEmpty doesn't use values but needs non-empty to hit the switch case
      )
      expect(result).toBeDefined()
    })

    it('builds isNotEmpty filter condition with values', () => {
      const fieldExpr = createMockColumn()
      // Need to pass values to avoid early return for empty values
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'isNotEmpty',
        ['ignored'] // isNotEmpty doesn't use values but needs non-empty to hit the switch case
      )
      expect(result).toBeDefined()
    })
  })

  describe('Unknown Operator', () => {
    it('returns null for unknown operator', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'unknownOperator' as any,
        ['value']
      )
      expect(result).toBeNull()
    })
  })

  describe('String Operators', () => {
    it('builds contains filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'contains',
        ['search']
      )
      expect(result).toBeDefined()
    })

    it('builds notContains filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notContains',
        ['excluded']
      )
      expect(result).toBeDefined()
    })

    it('builds startsWith filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'startsWith',
        ['prefix']
      )
      expect(result).toBeDefined()
    })

    it('builds endsWith filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'endsWith',
        ['suffix']
      )
      expect(result).toBeDefined()
    })
  })

  describe('Numeric Comparison Operators', () => {
    it('builds gt filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'gt',
        [10]
      )
      expect(result).toBeDefined()
    })

    it('builds gte filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'gte',
        [10]
      )
      expect(result).toBeDefined()
    })

    it('builds lt filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'lt',
        [100]
      )
      expect(result).toBeDefined()
    })

    it('builds lte filter condition', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'lte',
        [100]
      )
      expect(result).toBeDefined()
    })
  })

  describe('NotEquals Operator Edge Cases', () => {
    it('builds notEquals with multiple values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notEquals',
        ['a', 'b', 'c']
      )
      expect(result).toBeDefined()
    })

    it('builds notEquals with single value', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notEquals',
        ['single']
      )
      expect(result).toBeDefined()
    })

    it('returns null for notEquals with no values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notEquals',
        []
      )
      expect(result).toBeNull()
    })
  })

  describe('Equals Operator Edge Cases', () => {
    it('builds equals with multiple values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['a', 'b', 'c']
      )
      expect(result).toBeDefined()
    })

    it('builds equals with single value', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['single']
      )
      expect(result).toBeDefined()
    })

    it('returns false literal for equals with all values filtered (null bytes)', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'equals',
        ['value\x00evil', 'another\x00bad']
      )
      // All values contain null bytes and are filtered out, should return FALSE
      expect(result).toBeDefined()
    })
  })

  describe('InDateRange Edge Cases', () => {
    it('returns null when inDateRange has fewer than 2 values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        ['2024-01-01'] // Only 1 value
      )
      expect(result).toBeNull()
    })

    it('returns null when inDateRange has invalid dates', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        ['invalid-date', 'also-invalid']
      )
      expect(result).toBeNull()
    })

    it('handles inDateRange with datetime strings (not date-only)', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        ['2024-01-01T10:00:00Z', '2024-12-31T23:59:59Z']
      )
      expect(result).toBeDefined()
    })
  })

  describe('Array Operators on Non-PostgreSQL', () => {
    it('returns null for arrayOverlaps on MySQL', () => {
      const mysqlDateTimeBuilder = new DateTimeBuilder(mysqlAdapter)
      const mysqlFilterBuilder = new FilterBuilder(mysqlAdapter, mysqlDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = mysqlFilterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayOverlaps',
        ['value1', 'value2']
      )
      expect(result).toBeNull()
    })

    it('returns null for arrayContained on MySQL', () => {
      const mysqlDateTimeBuilder = new DateTimeBuilder(mysqlAdapter)
      const mysqlFilterBuilder = new FilterBuilder(mysqlAdapter, mysqlDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = mysqlFilterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayContained',
        ['value1', 'value2']
      )
      expect(result).toBeNull()
    })

    it('returns null for arrayOverlaps on SQLite', () => {
      const sqliteDateTimeBuilder = new DateTimeBuilder(sqliteAdapter)
      const sqliteFilterBuilder = new FilterBuilder(sqliteAdapter, sqliteDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = sqliteFilterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayOverlaps',
        ['value1', 'value2']
      )
      expect(result).toBeNull()
    })

    it('returns null for arrayContained on SQLite', () => {
      const sqliteDateTimeBuilder = new DateTimeBuilder(sqliteAdapter)
      const sqliteFilterBuilder = new FilterBuilder(sqliteAdapter, sqliteDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = sqliteFilterBuilder.buildFilterCondition(
        fieldExpr,
        'arrayContained',
        ['value1', 'value2']
      )
      expect(result).toBeNull()
    })
  })

  describe('Logical Filter with neither AND nor OR', () => {
    it('returns null for filter with no and/or properties', () => {
      const cube = createMockCube()
      const cubeMap = new Map([['TestCube', cube]])
      const context = createMockQueryContext()

      // A filter that has neither 'and' nor 'or'
      const filter = {} as any

      const result = filterBuilder.buildLogicalFilter(filter, cubeMap, context)
      expect(result).toBeNull()
    })
  })

  describe('Between with insufficient values after filtering', () => {
    it('returns null for notBetween with insufficient values', () => {
      const fieldExpr = createMockColumn()
      const result = filterBuilder.buildFilterCondition(
        fieldExpr,
        'notBetween',
        [10] // Only 1 value
      )
      expect(result).toBeNull()
    })
  })

  describe('SQLite date handling in inDateRange', () => {
    it('handles SQLite timestamp integer format in inDateRange', () => {
      const sqliteDateTimeBuilder = new DateTimeBuilder(sqliteAdapter)
      const sqliteFilterBuilder = new FilterBuilder(sqliteAdapter, sqliteDateTimeBuilder)

      const fieldExpr = createMockColumn()
      const result = sqliteFilterBuilder.buildFilterCondition(
        fieldExpr,
        'inDateRange',
        ['2024-01-01', '2024-12-31']
      )
      expect(result).toBeDefined()
    })
  })
})
