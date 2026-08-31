/**
 * Database Adapter Unit Tests
 * Tests MySQL, SQLite, and PostgreSQL adapters for SQL generation
 */
import { describe, it, expect, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import { MySQLAdapter } from '../src/server/adapters/mysql-adapter'
import { SQLiteAdapter } from '../src/server/adapters/sqlite-adapter'
import { PostgresAdapter } from '../src/server/adapters/postgres-adapter'
import { SingleStoreAdapter } from '../src/server/adapters/singlestore-adapter'
import { DuckDBAdapter } from '../src/server/adapters/duckdb-adapter'
import { DatabendAdapter } from '../src/server/adapters/databend-adapter'
import { SnowflakeAdapter } from '../src/server/adapters/snowflake-adapter'

// Helper to get SQL string from SQL object.
// Recurses into nested SQL objects (e.g. COALESCE(AVG(x), 0) where AVG(x) is its
// own SQL fragment) so the rendered text reflects the full expression.
function getSqlString(sqlObj: any): string {
  if (sqlObj == null) return ''
  if (typeof sqlObj === 'string') return sqlObj
  if (sqlObj.queryChunks) {
    return sqlObj.queryChunks.map((c: any) => {
      if (typeof c === 'string') return c
      if (c?.queryChunks) return getSqlString(c) // nested SQL fragment
      return c?.value?.toString() || ''
    }).join('')
  }
  if (sqlObj.value !== undefined) return sqlObj.value.toString()
  return String(sqlObj)
}

// tryCastToType's regex-guarded engines (Postgres `~`, MySQL/SingleStore REGEXP) embed the
// guard pattern as literal text in the rendered SQL (e.g. "CASE WHEN value ~ <pattern> THEN
// ..."). Extracting it lets tests prove the pattern actually discriminates valid from
// unparseable input, using a real RegExp, rather than only asserting the SQL's shape.
function extractGuardPattern(sqlStr: string, marker: string): string {
  const afterMarker = sqlStr.slice(sqlStr.indexOf(marker) + marker.length)
  const end = afterMarker.indexOf(' THEN ')
  if (end === -1) throw new Error(`Could not find ' THEN ' after marker ${JSON.stringify(marker)} in: ${sqlStr}`)
  return afterMarker.slice(0, end)
}

describe('Database Adapters', () => {
  describe('MySQLAdapter', () => {
    const adapter = new MySQLAdapter()

    describe('getEngineType', () => {
      it('should return mysql', () => {
        expect(adapter.getEngineType()).toBe('mysql')
      })
    })

    describe('buildTimeDimension', () => {
      const mockField = sql`created_at`

      it('should handle year granularity', () => {
        const result = adapter.buildTimeDimension('year', mockField)
        expect(result).toBeDefined()
        expect(result.queryChunks).toBeDefined()
      })

      it('should handle quarter granularity with QUARTER() function', () => {
        const result = adapter.buildTimeDimension('quarter', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('QUARTER')
      })

      it('should handle month granularity', () => {
        const result = adapter.buildTimeDimension('month', mockField)
        expect(result).toBeDefined()
      })

      it('should handle week granularity with WEEKDAY', () => {
        const result = adapter.buildTimeDimension('week', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('WEEKDAY')
      })

      it('should zero the time-of-day for week granularity (issue #849)', () => {
        // Retaining the time component breaks GROUP BY (one row per distinct
        // timestamp) and prevents gap filling from matching real rows to the
        // generated Monday-00:00 week buckets.
        const result = adapter.buildTimeDimension('week', mockField)
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('00:00:00')
        expect(sqlStr).toContain('STR_TO_DATE')
      })

      it('should handle day granularity', () => {
        const result = adapter.buildTimeDimension('day', mockField)
        expect(result).toBeDefined()
      })

      it('should handle hour granularity', () => {
        const result = adapter.buildTimeDimension('hour', mockField)
        expect(result).toBeDefined()
      })

      it('should handle minute granularity', () => {
        const result = adapter.buildTimeDimension('minute', mockField)
        expect(result).toBeDefined()
      })

      it('should handle second granularity', () => {
        const result = adapter.buildTimeDimension('second', mockField)
        expect(result).toBeDefined()
      })
    })

    describe('buildStringCondition', () => {
      const mockField = sql`name`

      it('should build contains with LOWER+LIKE', () => {
        const result = adapter.buildStringCondition(mockField, 'contains', 'test')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('LOWER')
        expect(sqlStr).toContain('LIKE')
      })

      it('should build notContains with NOT LIKE', () => {
        const result = adapter.buildStringCondition(mockField, 'notContains', 'test')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('NOT LIKE')
      })

      it('should build startsWith', () => {
        const result = adapter.buildStringCondition(mockField, 'startsWith', 'test')
        expect(result).toBeDefined()
      })

      it('should build endsWith', () => {
        const result = adapter.buildStringCondition(mockField, 'endsWith', 'test')
        expect(result).toBeDefined()
      })

      it('should build like', () => {
        const result = adapter.buildStringCondition(mockField, 'like', '%test%')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('LIKE')
      })

      it('should build notLike', () => {
        const result = adapter.buildStringCondition(mockField, 'notLike', '%test%')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('NOT LIKE')
      })

      it('should build ilike with LOWER', () => {
        const result = adapter.buildStringCondition(mockField, 'ilike', 'TEST')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('LOWER')
      })

      it('should build regex with REGEXP', () => {
        const result = adapter.buildStringCondition(mockField, 'regex', '^test')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('REGEXP')
      })

      it('should build notRegex with NOT REGEXP', () => {
        const result = adapter.buildStringCondition(mockField, 'notRegex', '^test')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('NOT REGEXP')
      })
    })

    describe('castToType', () => {
      const mockField = sql`value`

      it('should cast to DATETIME for timestamp', () => {
        const result = adapter.castToType(mockField, 'timestamp')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('CAST')
        expect(sqlStr).toContain('DATETIME')
      })

      it('should cast to DECIMAL for decimal', () => {
        const result = adapter.castToType(mockField, 'decimal')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('DECIMAL')
      })

      it('should cast to SIGNED INTEGER for integer', () => {
        const result = adapter.castToType(mockField, 'integer')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('SIGNED')
      })
    })

    describe('tryCastToType', () => {
      const mockField = sql`value`

      it('should guard the DATETIME cast with REGEXP and fall back to NULL', () => {
        const result = adapter.tryCastToType(mockField, 'timestamp')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('REGEXP')
        expect(sqlStr).toContain('CAST(value AS DATETIME)')
        expect(sqlStr).toContain('ELSE NULL END')

        const pattern = new RegExp(extractGuardPattern(sqlStr, ' REGEXP '))
        expect(pattern.test('2024-01-15')).toBe(true)
        expect(pattern.test('2024-01-15T10:30:00Z')).toBe(true)
        expect(pattern.test('not-a-date')).toBe(false)
      })

      it('should guard the DECIMAL cast with REGEXP, accepting a valid numeric string', () => {
        const result = adapter.tryCastToType(mockField, 'decimal')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('REGEXP')
        expect(sqlStr).toContain('CAST(value AS DECIMAL(10,2))')
        expect(sqlStr).toContain('ELSE NULL END')

        const pattern = new RegExp(extractGuardPattern(sqlStr, ' REGEXP '))
        expect(pattern.test('123.45')).toBe(true)
        expect(pattern.test('  -3.14  ')).toBe(true)
      })

      it('should guard the SIGNED INTEGER cast with REGEXP, accepting a valid integer', () => {
        const result = adapter.tryCastToType(mockField, 'integer')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('REGEXP')
        expect(sqlStr).toContain('CAST(value AS SIGNED INTEGER)')
        expect(sqlStr).toContain('ELSE NULL END')

        const pattern = new RegExp(extractGuardPattern(sqlStr, ' REGEXP '))
        expect(pattern.test('42')).toBe(true)
        expect(pattern.test('123.45')).toBe(false) // not an integer
      })

      it('should reject an unparseable string for every target type (NULL semantics)', () => {
        for (const targetType of ['timestamp', 'decimal', 'integer'] as const) {
          const sqlStr = getSqlString(adapter.tryCastToType(mockField, targetType))
          const pattern = new RegExp(extractGuardPattern(sqlStr, ' REGEXP '))
          expect(pattern.test('n/a')).toBe(false)
        }
      })

      it('should fall back to NULL for NULL input via CASE three-valued logic', () => {
        // NULL REGEXP <pattern> evaluates to NULL (not TRUE), so the CASE WHEN branch is
        // never taken and every target type falls through to the ELSE NULL clause — this is
        // guaranteed by REGEXP's/CASE's standard SQL null-handling, not by extra guard code.
        for (const targetType of ['timestamp', 'decimal', 'integer'] as const) {
          const sqlStr = getSqlString(adapter.tryCastToType(mockField, targetType))
          expect(sqlStr).toContain('ELSE NULL END')
        }
      })
    })

    describe('buildAvg', () => {
      it('should use IFNULL for null handling', () => {
        const mockField = sql`salary`
        const result = adapter.buildAvg(mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('IFNULL')
        expect(sqlStr).toContain('AVG')
      })
    })

    describe('buildCaseWhen', () => {
      it('should build CASE WHEN expression', () => {
        const conditions = [
          { when: sql`status = 'active'`, then: 1 },
          { when: sql`status = 'inactive'`, then: 0 }
        ]
        const result = adapter.buildCaseWhen(conditions)
        expect(result).toBeDefined()
        expect(result.queryChunks).toBeDefined()
        // Verify it returns a valid SQL object
        expect(result.queryChunks.length).toBeGreaterThan(0)
      })

      it('should include ELSE clause when provided', () => {
        const conditions = [
          { when: sql`status = 'active'`, then: 1 }
        ]
        const result = adapter.buildCaseWhen(conditions, -1)
        expect(result).toBeDefined()
        expect(result.queryChunks).toBeDefined()
        // Verify it returns a valid SQL object with ELSE
        expect(result.queryChunks.length).toBeGreaterThan(0)
      })
    })

    describe('buildBooleanLiteral', () => {
      it('should return TRUE for true', () => {
        const result = adapter.buildBooleanLiteral(true)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('TRUE')
      })

      it('should return FALSE for false', () => {
        const result = adapter.buildBooleanLiteral(false)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('FALSE')
      })
    })

    describe('convertFilterValue', () => {
      it('should pass through values unchanged', () => {
        expect(adapter.convertFilterValue('test')).toBe('test')
        expect(adapter.convertFilterValue(123)).toBe(123)
        expect(adapter.convertFilterValue(true)).toBe(true)
      })
    })

    describe('prepareDateValue', () => {
      it('should pass through Date unchanged', () => {
        const date = new Date('2024-01-15')
        expect(adapter.prepareDateValue(date)).toBe(date)
      })
    })

    describe('isTimestampInteger', () => {
      it('should return false', () => {
        expect(adapter.isTimestampInteger()).toBe(false)
      })
    })
  })

  describe('SQLiteAdapter', () => {
    const adapter = new SQLiteAdapter()

    describe('getEngineType', () => {
      it('should return sqlite', () => {
        expect(adapter.getEngineType()).toBe('sqlite')
      })
    })

    describe('buildTimeDimension', () => {
      const mockField = sql`created_at`

      it('should handle year granularity with start of year', () => {
        const result = adapter.buildTimeDimension('year', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('datetime')
        expect(sqlStr).toContain('start of year')
      })

      it('should handle quarter granularity with strftime', () => {
        const result = adapter.buildTimeDimension('quarter', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('strftime')
      })

      it('should handle month granularity with start of month', () => {
        const result = adapter.buildTimeDimension('month', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('start of month')
      })

      it('should handle week granularity with weekday modifier', () => {
        const result = adapter.buildTimeDimension('week', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('weekday')
      })

      it('should handle day granularity with start of day', () => {
        const result = adapter.buildTimeDimension('day', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('start of day')
      })

      it('should handle hour granularity', () => {
        const result = adapter.buildTimeDimension('hour', mockField)
        expect(result).toBeDefined()
      })

      it('should handle minute granularity', () => {
        const result = adapter.buildTimeDimension('minute', mockField)
        expect(result).toBeDefined()
      })

      it('should handle second granularity', () => {
        const result = adapter.buildTimeDimension('second', mockField)
        expect(result).toBeDefined()
      })
    })

    describe('buildStringCondition', () => {
      const mockField = sql`name`

      it('should build contains with LOWER+LIKE', () => {
        const result = adapter.buildStringCondition(mockField, 'contains', 'test')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('LOWER')
      })

      it('should build regex with GLOB', () => {
        const result = adapter.buildStringCondition(mockField, 'regex', '*test*')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('GLOB')
      })

      it('should build notRegex with NOT GLOB', () => {
        const result = adapter.buildStringCondition(mockField, 'notRegex', '*test*')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('NOT GLOB')
      })
    })

    describe('castToType', () => {
      const mockField = sql`value`

      it('should cast to datetime for timestamp with milliseconds', () => {
        const result = adapter.castToType(mockField, 'timestamp')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('datetime')
        expect(sqlStr).toContain('1000')
      })

      it('should cast to REAL for decimal', () => {
        const result = adapter.castToType(mockField, 'decimal')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('REAL')
      })

      it('should cast to INTEGER for integer', () => {
        const result = adapter.castToType(mockField, 'integer')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('INTEGER')
      })
    })

    describe('tryCastToType', () => {
      const mockField = sql`value`

      // SQLite has no REGEXP by default, so the guard uses GLOB's "NOT GLOB '*[^set]*'"
      // idiom (see sqlite-adapter.ts for the full rationale/limitations) instead of a regex.

      it('should guard the datetime conversion with GLOB and fall back to NULL', () => {
        const result = adapter.tryCastToType(mockField, 'timestamp')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('GLOB')
        expect(sqlStr).toContain('datetime')
        expect(sqlStr).toContain('1000')
        expect(sqlStr).toContain('THEN NULL')
      })

      it('should guard the REAL cast with GLOB and fall back to NULL', () => {
        const result = adapter.tryCastToType(mockField, 'decimal')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('GLOB')
        expect(sqlStr).toContain('CAST(value AS REAL)')
        expect(sqlStr).toContain('THEN NULL')
      })

      it('should guard the INTEGER cast with GLOB and fall back to NULL', () => {
        const result = adapter.tryCastToType(mockField, 'integer')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('GLOB')
        expect(sqlStr).toContain('CAST(value AS INTEGER)')
        expect(sqlStr).toContain('THEN NULL')
      })
    })

    // Real execution against an in-process SQLite database (better-sqlite3), so the NULL
    // semantics claimed above are proven against SQLite's actual dynamic-typing/CAST
    // behaviour rather than only asserted from the generated SQL's shape.
    describe('tryCastToType (live SQLite execution)', () => {
      const client = new Database(':memory:')
      const db = drizzle(client)
      client.exec('CREATE TABLE try_cast_probe (id INTEGER PRIMARY KEY, value TEXT)')
      const rows: Array<[number, string | null]> = [
        [1, '123.45'], // valid decimal
        [2, '42'], // valid integer
        [3, 'n/a'], // unparseable
        [4, null], // NULL input
        [5, '1735689600000'] // valid epoch-ms string (for timestamp)
      ]
      for (const [id, value] of rows) {
        client.prepare('INSERT INTO try_cast_probe (id, value) VALUES (?, ?)').run(id, value)
      }

      afterAll(() => {
        client.close()
      })

      function selectResult(targetType: 'timestamp' | 'decimal' | 'integer', id: number) {
        const expr = adapter.tryCastToType(sql`value`, targetType)
        const row = db.get<{ result: unknown }>(sql`SELECT ${expr} AS result FROM try_cast_probe WHERE id = ${id}`)
        return row?.result
      }

      it('decimal: parses a valid numeric string', () => {
        expect(selectResult('decimal', 1)).toBe(123.45)
      })

      it('integer: parses a valid integer string', () => {
        expect(selectResult('integer', 2)).toBe(42)
      })

      it('decimal: returns NULL for an unparseable string instead of 0', () => {
        expect(selectResult('decimal', 3)).toBeNull()
      })

      it('integer: returns NULL for an unparseable string instead of 0', () => {
        expect(selectResult('integer', 3)).toBeNull()
      })

      it('timestamp: returns NULL for an unparseable string', () => {
        expect(selectResult('timestamp', 3)).toBeNull()
      })

      it('decimal: returns NULL for NULL input', () => {
        expect(selectResult('decimal', 4)).toBeNull()
      })

      it('integer: returns NULL for NULL input', () => {
        expect(selectResult('integer', 4)).toBeNull()
      })

      it('timestamp: returns NULL for NULL input', () => {
        expect(selectResult('timestamp', 4)).toBeNull()
      })

      it('timestamp: converts a valid epoch-ms string', () => {
        expect(selectResult('timestamp', 5)).toBe('2025-01-01 00:00:00')
      })
    })

    describe('buildAvg', () => {
      it('should use IFNULL for null handling', () => {
        const mockField = sql`salary`
        const result = adapter.buildAvg(mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('IFNULL')
        expect(sqlStr).toContain('AVG')
      })
    })

    describe('buildBooleanLiteral', () => {
      it('should return 1 for true', () => {
        const result = adapter.buildBooleanLiteral(true)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('1')
      })

      it('should return 0 for false', () => {
        const result = adapter.buildBooleanLiteral(false)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('0')
      })
    })

    describe('convertFilterValue', () => {
      it('should convert boolean true to 1', () => {
        expect(adapter.convertFilterValue(true)).toBe(1)
      })

      it('should convert boolean false to 0', () => {
        expect(adapter.convertFilterValue(false)).toBe(0)
      })

      it('should convert Date to milliseconds', () => {
        const date = new Date('2024-01-15T00:00:00.000Z')
        const result = adapter.convertFilterValue(date)
        expect(result).toBe(date.getTime())
      })

      it('should handle arrays recursively', () => {
        const result = adapter.convertFilterValue([true, false, 123])
        expect(result).toEqual([1, 0, 123])
      })

      it('should pass through numbers unchanged', () => {
        expect(adapter.convertFilterValue(123)).toBe(123)
      })

      it('should pass through strings unchanged', () => {
        expect(adapter.convertFilterValue('test')).toBe('test')
      })
    })

    describe('prepareDateValue', () => {
      it('should convert Date to milliseconds', () => {
        const date = new Date('2024-01-15T00:00:00.000Z')
        const result = adapter.prepareDateValue(date)
        expect(result).toBe(date.getTime())
      })

      it('should pass through numbers unchanged', () => {
        const result = adapter.prepareDateValue(1705276800000 as any)
        expect(result).toBe(1705276800000)
      })

      it('should convert date strings to milliseconds', () => {
        const result = adapter.prepareDateValue('2024-01-15T00:00:00.000Z' as any)
        expect(typeof result).toBe('number')
      })
    })

    describe('isTimestampInteger', () => {
      it('should return true', () => {
        expect(adapter.isTimestampInteger()).toBe(true)
      })
    })

    describe('preprocessCalculatedTemplate', () => {
      it('should wrap division numerators with CAST AS REAL', () => {
        const template = '{Sales.total} / {Sales.count}'
        const result = adapter.preprocessCalculatedTemplate(template)
        expect(result).toContain('CAST')
        expect(result).toContain('REAL')
      })

      it('should handle NULLIF patterns', () => {
        const template = '{Sales.total} / NULLIF({Sales.count}, 0)'
        const result = adapter.preprocessCalculatedTemplate(template)
        expect(result).toContain('CAST')
      })

      it('should not modify templates without division', () => {
        const template = '{Sales.total} + {Sales.count}'
        const result = adapter.preprocessCalculatedTemplate(template)
        expect(result).toBe(template)
      })
    })
  })

  describe('PostgresAdapter', () => {
    const adapter = new PostgresAdapter()

    describe('getEngineType', () => {
      it('should return postgres', () => {
        expect(adapter.getEngineType()).toBe('postgres')
      })
    })

    describe('buildTimeDimension', () => {
      const mockField = sql`created_at`

      it('should use DATE_TRUNC for day', () => {
        const result = adapter.buildTimeDimension('day', mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('DATE_TRUNC')
      })

      it('should handle all granularities', () => {
        const granularities: Array<'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'> =
          ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']

        for (const granularity of granularities) {
          const result = adapter.buildTimeDimension(granularity, mockField)
          expect(result).toBeDefined()
        }
      })
    })

    describe('buildStringCondition', () => {
      const mockField = sql`name`

      it('should use ILIKE for case-insensitive matching', () => {
        const result = adapter.buildStringCondition(mockField, 'ilike', 'TEST')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('ILIKE')
      })

      it('should use ~* for regex', () => {
        const result = adapter.buildStringCondition(mockField, 'regex', '^test')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('~*')
      })
    })

    describe('castToType', () => {
      const mockField = sql`value`

      it('should use :: syntax for casting', () => {
        const result = adapter.castToType(mockField, 'timestamp')
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('::')
      })
    })

    describe('tryCastToType', () => {
      const mockField = sql`value`

      it('should guard the ::timestamp cast with ~ and fall back to NULL', () => {
        const result = adapter.tryCastToType(mockField, 'timestamp')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain(' ~ ')
        expect(sqlStr).toContain('value::timestamp')
        expect(sqlStr).toContain('ELSE NULL END')

        const pattern = new RegExp(extractGuardPattern(sqlStr, ' ~ '))
        expect(pattern.test('2024-01-15')).toBe(true)
        expect(pattern.test('2024-01-15T10:30:00Z')).toBe(true)
        expect(pattern.test('not-a-date')).toBe(false)
      })

      it('should guard the ::decimal cast with ~, accepting a valid numeric string', () => {
        const result = adapter.tryCastToType(mockField, 'decimal')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain(' ~ ')
        expect(sqlStr).toContain('value::decimal')
        expect(sqlStr).toContain('ELSE NULL END')

        const pattern = new RegExp(extractGuardPattern(sqlStr, ' ~ '))
        expect(pattern.test('123.45')).toBe(true)
        expect(pattern.test('  -3.14  ')).toBe(true)
      })

      it('should guard the ::integer cast with ~, accepting a valid integer', () => {
        const result = adapter.tryCastToType(mockField, 'integer')
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain(' ~ ')
        expect(sqlStr).toContain('value::integer')
        expect(sqlStr).toContain('ELSE NULL END')

        const pattern = new RegExp(extractGuardPattern(sqlStr, ' ~ '))
        expect(pattern.test('42')).toBe(true)
        expect(pattern.test('123.45')).toBe(false) // not an integer
      })

      it('should reject an unparseable string for every target type (NULL semantics)', () => {
        for (const targetType of ['timestamp', 'decimal', 'integer'] as const) {
          const sqlStr = getSqlString(adapter.tryCastToType(mockField, targetType))
          const pattern = new RegExp(extractGuardPattern(sqlStr, ' ~ '))
          expect(pattern.test('n/a')).toBe(false)
        }
      })

      it('should fall back to NULL for NULL input via CASE three-valued logic', () => {
        // NULL ~ <pattern> evaluates to NULL (not TRUE), so the CASE WHEN branch is never
        // taken and every target type falls through to the ELSE NULL clause — this is
        // guaranteed by PostgreSQL's/CASE's standard SQL null-handling, not extra guard code.
        for (const targetType of ['timestamp', 'decimal', 'integer'] as const) {
          const sqlStr = getSqlString(adapter.tryCastToType(mockField, targetType))
          expect(sqlStr).toContain('ELSE NULL END')
        }
      })
    })

    describe('buildAvg', () => {
      it('should use COALESCE for null handling', () => {
        const mockField = sql`salary`
        const result = adapter.buildAvg(mockField)
        expect(result).toBeDefined()
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('COALESCE')
        expect(sqlStr).toContain('AVG')
      })
    })

    describe('buildBooleanLiteral', () => {
      it('should return TRUE for true', () => {
        const result = adapter.buildBooleanLiteral(true)
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('TRUE')
      })

      it('should return FALSE for false', () => {
        const result = adapter.buildBooleanLiteral(false)
        const sqlStr = getSqlString(result)
        expect(sqlStr).toContain('FALSE')
      })
    })

    describe('isTimestampInteger', () => {
      it('should return false', () => {
        expect(adapter.isTimestampInteger()).toBe(false)
      })
    })
  })

  describe('SingleStoreAdapter', () => {
    const adapter = new SingleStoreAdapter()

    describe('getEngineType', () => {
      it('should return singlestore', () => {
        expect(adapter.getEngineType()).toBe('singlestore')
      })
    })

    describe('buildTimeDimension', () => {
      const mockField = sql`created_at`

      it('should handle all granularities', () => {
        const granularities: Array<'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'> =
          ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']

        for (const granularity of granularities) {
          const result = adapter.buildTimeDimension(granularity, mockField)
          expect(result).toBeDefined()
        }
      })
    })

    describe('tryCastToType', () => {
      // SingleStore has no override — it inherits MySQLAdapter's REGEXP-guarded
      // implementation as-is. This matters more than a typical inheritance check: SingleStore's
      // REGEXP is dialect-switchable via `regexp_format` ('extended' = POSIX ERE, no \d/\s;
      // 'advanced' = ICU/PCRE-style, with \d/\s), and SingleStore's own docs suggest 'extended'
      // is the default. The shared patterns in base-adapter.ts are deliberately written without
      // \d/\s for exactly this reason — verified below by asserting they contain none, plus
      // running them (as a plain RegExp, a reasonable proxy for POSIX ERE/ICU here since none
      // of the constructs used — [0-9], anchors, quantifiers, alternation — are JS-specific)
      // against the same valid/invalid inputs used for MySQL's tests.
      const mockField = sql`value`

      it('should inherit MySQL REGEXP-guarded decimal casting using a \\d/\\s-free pattern', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'decimal'))
        expect(sqlStr).toContain('REGEXP')
        expect(sqlStr).toContain('CAST(value AS DECIMAL(10,2))')
        expect(sqlStr).toContain('ELSE NULL END')

        const patternText = extractGuardPattern(sqlStr, ' REGEXP ')
        expect(patternText).not.toMatch(/\\[ds]/)
        const pattern = new RegExp(patternText)
        expect(pattern.test('123.45')).toBe(true)
        expect(pattern.test('n/a')).toBe(false)
      })

      it('should inherit MySQL REGEXP-guarded integer casting using a \\d/\\s-free pattern', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'integer'))
        expect(sqlStr).toContain('REGEXP')
        expect(sqlStr).toContain('CAST(value AS SIGNED INTEGER)')
        expect(sqlStr).toContain('ELSE NULL END')

        const patternText = extractGuardPattern(sqlStr, ' REGEXP ')
        expect(patternText).not.toMatch(/\\[ds]/)
        const pattern = new RegExp(patternText)
        expect(pattern.test('42')).toBe(true)
        expect(pattern.test('n/a')).toBe(false)
      })

      it('should inherit MySQL REGEXP-guarded timestamp casting using a \\d/\\s-free pattern', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'timestamp'))
        expect(sqlStr).toContain('REGEXP')
        expect(sqlStr).toContain('CAST(value AS DATETIME)')
        expect(sqlStr).toContain('ELSE NULL END')

        const patternText = extractGuardPattern(sqlStr, ' REGEXP ')
        expect(patternText).not.toMatch(/\\[ds]/)
        const pattern = new RegExp(patternText)
        expect(pattern.test('2024-01-15')).toBe(true)
        expect(pattern.test('not-a-date')).toBe(false)
      })
    })
  })

  // DuckDB, Databend and Snowflake all expose a native TRY_CAST(expr AS type) that returns
  // NULL on conversion failure, so tryCastToType is a thin pass-through with no guard logic
  // to unit test beyond shape — the NULL-on-failure semantics are the engine's own guarantee,
  // documented in each adapter and confirmed against each engine's official docs (see the
  // task's per-engine sourcing). None of these engines is reachable without Docker in this
  // environment, so — unlike SQLite above — there's no live execution test for these here;
  // engine-specific verification is left to CI, which runs these adapters against real
  // containers.
  describe('DuckDBAdapter', () => {
    const adapter = new DuckDBAdapter()
    const mockField = sql`value`

    describe('getEngineType', () => {
      it('should return duckdb', () => {
        expect(adapter.getEngineType()).toBe('duckdb')
      })
    })

    describe('tryCastToType', () => {
      it('should use TRY_CAST for timestamp', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'timestamp'))
        expect(sqlStr).toBe('TRY_CAST(value AS timestamp)')
      })

      it('should use TRY_CAST for decimal', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'decimal'))
        expect(sqlStr).toBe('TRY_CAST(value AS decimal)')
      })

      it('should use TRY_CAST for integer', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'integer'))
        expect(sqlStr).toBe('TRY_CAST(value AS integer)')
      })
    })
  })

  describe('DatabendAdapter', () => {
    const adapter = new DatabendAdapter()
    const mockField = sql`value`

    describe('getEngineType', () => {
      it('should return databend', () => {
        expect(adapter.getEngineType()).toBe('databend')
      })
    })

    describe('tryCastToType', () => {
      it('should use TRY_CAST for timestamp', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'timestamp'))
        expect(sqlStr).toBe('TRY_CAST(value AS TIMESTAMP)')
      })

      it('should use TRY_CAST for decimal', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'decimal'))
        expect(sqlStr).toBe('TRY_CAST(value AS DECIMAL)')
      })

      it('should use TRY_CAST for integer', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'integer'))
        expect(sqlStr).toBe('TRY_CAST(value AS INTEGER)')
      })
    })
  })

  describe('SnowflakeAdapter', () => {
    const adapter = new SnowflakeAdapter()
    const mockField = sql`value`

    describe('getEngineType', () => {
      it('should return snowflake', () => {
        expect(adapter.getEngineType()).toBe('snowflake')
      })
    })

    describe('tryCastToType', () => {
      it('should use TRY_CAST for timestamp', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'timestamp'))
        expect(sqlStr).toBe('TRY_CAST(value AS TIMESTAMP)')
      })

      it('should use TRY_CAST for decimal', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'decimal'))
        expect(sqlStr).toBe('TRY_CAST(value AS DECIMAL)')
      })

      it('should use TRY_CAST for integer', () => {
        const sqlStr = getSqlString(adapter.tryCastToType(mockField, 'integer'))
        expect(sqlStr).toBe('TRY_CAST(value AS INTEGER)')
      })
    })
  })
})
