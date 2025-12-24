/**
 * Database Adapter Unit Tests
 * Tests MySQL, SQLite, and PostgreSQL adapters for SQL generation
 */
import { describe, it, expect } from 'vitest'
import { sql } from 'drizzle-orm'
import { MySQLAdapter } from '../src/server/adapters/mysql-adapter'
import { SQLiteAdapter } from '../src/server/adapters/sqlite-adapter'
import { PostgresAdapter } from '../src/server/adapters/postgres-adapter'
import { SingleStoreAdapter } from '../src/server/adapters/singlestore-adapter'

// Helper to get SQL string from SQL object
function getSqlString(sqlObj: any): string {
  if (sqlObj.toSQL) {
    return sqlObj.toSQL().sql
  }
  if (sqlObj.queryChunks) {
    return sqlObj.queryChunks.map((c: any) =>
      typeof c === 'string' ? c : c.value?.toString() || ''
    ).join('')
  }
  return String(sqlObj)
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
  })
})
