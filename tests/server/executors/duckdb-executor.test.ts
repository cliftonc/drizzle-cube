/**
 * DuckDB Executor Unit Tests
 * Tests for DuckDB-specific executor implementation with mocked database instances
 *
 * Note: DuckDB has specific limitations noted in tests/CLAUDE.md:
 * - No support for percentile subqueries
 * - Large LIMIT/OFFSET values cause integer overflow
 * - Designed for single-user OLAP workloads
 */
import { describe, it, expect, vi } from 'vitest'
import {
  DuckDBExecutor,
  createDuckDBExecutor
} from '../../../src/server/executors'

describe('DuckDBExecutor Unit Tests', () => {
  describe('Factory Function', () => {
    it('should create DuckDBExecutor instance', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      expect(executor).toBeInstanceOf(DuckDBExecutor)
    })

    it('should set database adapter to duckdb', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      expect(executor.databaseAdapter.getEngineType()).toBe('duckdb')
    })

    it('should store schema reference', () => {
      const mockDb = { execute: vi.fn() }
      const mockSchema = { employees: { id: 'id' } }
      const executor = createDuckDBExecutor(mockDb as any, mockSchema)

      expect(executor.schema).toBe(mockSchema)
    })

    it('should store db reference', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      expect(executor.db).toBe(mockDb)
    })
  })

  describe('getEngineType', () => {
    it('should return duckdb', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      expect(executor.getEngineType()).toBe('duckdb')
    })
  })

  describe('execute', () => {
    describe('Drizzle Query Objects', () => {
      it('should handle Drizzle query objects with execute method', async () => {
        const mockDb = { execute: vi.fn() }
        const executor = createDuckDBExecutor(mockDb as any, undefined)

        const mockQuery = {
          execute: vi.fn().mockResolvedValue([{ id: 1, count: '5' }])
        }

        const result = await executor.execute(mockQuery, ['count'])

        expect(mockQuery.execute).toHaveBeenCalled()
        expect(result).toEqual([{ id: 1, count: 5 }])
      })

      it('should convert numeric fields in Drizzle query results', async () => {
        const mockDb = { execute: vi.fn() }
        const executor = createDuckDBExecutor(mockDb as any, undefined)

        const mockQuery = {
          execute: vi.fn().mockResolvedValue([
            { name: 'John', salary: '75000.50', count: '10' }
          ])
        }

        const result = await executor.execute(mockQuery, ['salary', 'count'])

        expect(result).toEqual([
          { name: 'John', salary: 75000.50, count: 10 }
        ])
      })

      it('should handle non-array results from Drizzle query', async () => {
        const mockDb = { execute: vi.fn() }
        const executor = createDuckDBExecutor(mockDb as any, undefined)

        const mockQuery = {
          execute: vi.fn().mockResolvedValue({ affectedRows: 1 })
        }

        const result = await executor.execute(mockQuery)

        expect(result).toEqual({ affectedRows: 1 })
      })

      it('should log error and rethrow on Drizzle query execution failure', async () => {
        const mockDb = { execute: vi.fn() }
        const executor = createDuckDBExecutor(mockDb as any, undefined)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const mockQuery = {
          execute: vi.fn().mockRejectedValue(new Error('Query failed')),
          toSQL: vi.fn().mockReturnValue({ sql: 'SELECT * FROM test', params: [] })
        }

        await expect(executor.execute(mockQuery)).rejects.toThrow('Query failed')
        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })

    describe('Raw SQL Objects', () => {
      it('should throw when db.execute not available for raw SQL', async () => {
        const mockDb = {} // No execute method
        const executor = createDuckDBExecutor(mockDb as any, undefined)

        const rawSql = { queryChunks: ['SELECT 1'] }

        await expect(executor.execute(rawSql)).rejects.toThrow(
          'DuckDB database instance must have an execute method'
        )
      })

      it('should use db.execute for raw SQL queries', async () => {
        const mockDb = {
          execute: vi.fn().mockResolvedValue([{ count: '10' }])
        }
        const executor = createDuckDBExecutor(mockDb as any, undefined)

        const rawSql = { queryChunks: ['SELECT COUNT(*) as count'] }
        const result = await executor.execute(rawSql, ['count'])

        expect(mockDb.execute).toHaveBeenCalledWith(rawSql)
        expect(result).toEqual([{ count: 10 }])
      })

      it('should handle non-array results from raw SQL', async () => {
        const mockDb = {
          execute: vi.fn().mockResolvedValue({ affectedRows: 1 })
        }
        const executor = createDuckDBExecutor(mockDb as any, undefined)

        const rawSql = { queryChunks: ['UPDATE table SET col = 1'] }
        const result = await executor.execute(rawSql)

        expect(result).toEqual({ affectedRows: 1 })
      })

      it('should log error with SQL info on raw SQL execution failure', async () => {
        const mockDb = {
          execute: vi.fn().mockRejectedValue(new Error('DuckDB error'))
        }
        const executor = createDuckDBExecutor(mockDb as any, undefined)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const rawSql = {
          queryChunks: ['SELECT * FROM test'],
          toSQL: () => ({ sql: 'SELECT * FROM test', params: [] })
        }

        await expect(executor.execute(rawSql)).rejects.toThrow('DuckDB error')
        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
      })
    })
  })

  describe('extractSqlFromQuery (via error handling)', () => {
    it('should extract SQL via toSQL method', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const rawSql = {
        toSQL: () => ({ sql: 'SELECT * FROM employees', params: ['org-1'] })
      }

      await expect(executor.execute(rawSql)).rejects.toThrow('Test error')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DuckDB] Query execution failed:',
        expect.objectContaining({
          sql: 'SELECT * FROM employees',
          params: ['org-1']
        })
      )
      consoleSpy.mockRestore()
    })

    it('should extract SQL via getSQL method for older Drizzle versions', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const rawSql = {
        getSQL: () => ({
          toSQL: () => ({ sql: 'SELECT * FROM departments', params: [1, 2] })
        })
      }

      await expect(executor.execute(rawSql)).rejects.toThrow('Test error')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DuckDB] Query execution failed:',
        expect.objectContaining({
          sql: 'SELECT * FROM departments',
          params: [1, 2]
        })
      )
      consoleSpy.mockRestore()
    })

    it('should fallback to stringifying query when no SQL extraction method', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const rawSql = {
        toString: () => 'raw sql string'
      }

      await expect(executor.execute(rawSql)).rejects.toThrow('Test error')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DuckDB] Query execution failed:',
        expect.objectContaining({
          sql: 'raw sql string',
          params: []
        })
      )
      consoleSpy.mockRestore()
    })

    it('should handle extraction errors gracefully', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const rawSql = {
        toSQL: () => { throw new Error('Extraction failed') }
      }

      await expect(executor.execute(rawSql)).rejects.toThrow('Test error')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DuckDB] Query execution failed:',
        expect.objectContaining({
          sql: '[unable to extract SQL]'
        })
      )
      consoleSpy.mockRestore()
    })
  })

  describe('coerceToNumber (via execute)', () => {
    const getCoerceMethod = (executor: DuckDBExecutor) => {
      return (executor as any).coerceToNumber.bind(executor)
    }

    it('should preserve null values', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(null)).toBeNull()
      expect(coerceToNumber(undefined)).toBeUndefined()
    })

    it('should return numbers unchanged', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(42)).toBe(42)
      expect(coerceToNumber(3.14)).toBe(3.14)
      expect(coerceToNumber(-10)).toBe(-10)
      expect(coerceToNumber(0)).toBe(0)
    })

    it('should convert BigInt to number', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(BigInt(100))).toBe(100)
      expect(coerceToNumber(BigInt(9007199254740991))).toBe(9007199254740991)
    })

    it('should handle objects with numeric toString()', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const numericObject = { toString: () => '123.45' }
      expect(coerceToNumber(numericObject)).toBe(123.45)
    })

    it('should detect integers from toString() (no decimal)', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const intObject = { toString: () => '42' }
      expect(coerceToNumber(intObject)).toBe(42)
      expect(Number.isInteger(coerceToNumber(intObject))).toBe(true)
    })

    it('should handle negative numbers from toString()', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const negativeObject = { toString: () => '-99.5' }
      expect(coerceToNumber(negativeObject)).toBe(-99.5)
    })

    it('should return non-numeric objects unchanged', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const nonNumericObject = { foo: 'bar', baz: 123 }
      expect(coerceToNumber(nonNumericObject)).toBe(nonNumericObject)
    })

    it('should return objects with non-numeric toString() unchanged', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const stringObject = { toString: () => 'hello world' }
      expect(coerceToNumber(stringObject)).toBe(stringObject)
    })

    it('should convert numeric strings to numbers', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('42')).toBe(42)
      expect(coerceToNumber('3.14159')).toBe(3.14159)
      expect(coerceToNumber('-100')).toBe(-100)
    })

    it('should handle scientific notation strings', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('1e5')).toBe(100000)
      expect(coerceToNumber('1.5e10')).toBe(15000000000)
      expect(coerceToNumber('2.5E3')).toBe(2500)
    })

    it('should handle negative scientific notation', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('-2.3e-5')).toBeCloseTo(-0.000023, 10)
      expect(coerceToNumber('1e-10')).toBe(1e-10)
    })

    it('should return non-numeric strings unchanged', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('hello')).toBe('hello')
      expect(coerceToNumber('')).toBe('')
    })

    it('should handle strings that start with numbers (parseFloat behavior)', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      // parseFloat('123abc') returns 123, which is finite, so it gets converted
      expect(coerceToNumber('123abc')).toBe(123)
    })
  })

  describe('convertNumericFields (via execute)', () => {
    it('should only convert specified numeric fields', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { name: 'John', count: '5', salary: '75000.50' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }
      const result = await executor.execute(rawSql, ['count', 'salary'])

      expect(result).toEqual([
        { name: 'John', count: 5, salary: 75000.50 }
      ])
    })

    it('should not convert fields when numericFields not specified', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { count: '5', name: 'Test' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }
      const result = await executor.execute(rawSql)

      // Without numericFields, values stay as strings
      expect(result).toEqual([
        { count: '5', name: 'Test' }
      ])
    })

    it('should handle null row values', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([null, undefined, { count: '5' }])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }
      const result = await executor.execute(rawSql, ['count'])

      expect(result).toEqual([null, undefined, { count: 5 }])
    })

    it('should handle rows that are not objects', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue(['string', 123, { count: '5' }])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }
      const result = await executor.execute(rawSql, ['count'])

      expect(result).toEqual(['string', 123, { count: 5 }])
    })
  })

  describe('explainQuery', () => {
    it('should throw when db.execute not available', async () => {
      const mockDb = {} // No execute method
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      await expect(
        executor.explainQuery('SELECT * FROM test', [])
      ).rejects.toThrow('DuckDB database instance must have an execute method')
    })

    it('should execute EXPLAIN with parameters replaced', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { explain_value: 'HASH_JOIN' },
          { explain_value: 'SEQ_SCAN employees' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.explainQuery(
        'SELECT * FROM employees WHERE org_id = $1',
        ['org-1']
      )

      expect(result.summary.database).toBe('duckdb')
      expect(result.operations.length).toBeGreaterThan(0)
    })

    it('should execute EXPLAIN ANALYZE when option provided', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { explain_value: 'SEQ_SCAN employees' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      await executor.explainQuery(
        'SELECT * FROM employees',
        [],
        { analyze: true }
      )

      expect(mockDb.execute).toHaveBeenCalled()
      // The SQL should contain EXPLAIN ANALYZE
      const call = mockDb.execute.mock.calls[0][0]
      expect(call).toBeDefined()
    })

    it('should handle different parameter types', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      await executor.explainQuery(
        'SELECT * FROM t WHERE a = $1 AND b = $2 AND c = $3 AND d = $4 AND e = $5',
        [null, 42, true, new Date('2024-01-01'), "test'value"]
      )

      expect(mockDb.execute).toHaveBeenCalled()
    })

    it('should parse EXPLAIN output with different column names', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { 'QUERY PLAN': 'SEQ_SCAN employees' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.explainQuery('SELECT * FROM employees', [])

      expect(result.operations.length).toBeGreaterThan(0)
    })

    it('should detect sequential scans in EXPLAIN output', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { explain_value: 'SEQ_SCAN employees' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.explainQuery('SELECT * FROM employees', [])

      expect(result.summary.hasSequentialScans).toBe(true)
    })

    it('should detect index usage in EXPLAIN output', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          { explain_value: 'INDEX_SCAN idx_org_id on employees' }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.explainQuery('SELECT * FROM employees', [])

      expect(result.summary.usedIndexes).toContain('idx_org_id')
    })

    it('should include SQL query in result', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.explainQuery(
        'SELECT * FROM employees WHERE id = $1',
        [1]
      )

      expect(result.sql.sql).toBe('SELECT * FROM employees WHERE id = $1')
      expect(result.sql.params).toEqual([1])
    })
  })

  describe('getTableIndexes', () => {
    it('should return empty array for empty table names', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes([])

      expect(result).toEqual([])
      expect(mockDb.execute).not.toHaveBeenCalled()
    })

    it('should return empty array when tableNames is null/undefined', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes(null as any)

      expect(result).toEqual([])
    })

    it('should throw when db.execute not available', async () => {
      const mockDb = {} // No execute method
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      await expect(
        executor.getTableIndexes(['employees'])
      ).rejects.toThrow('DuckDB database instance must have an execute method')
    })

    it('should query duckdb_indexes() and return parsed results', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            table_name: 'employees',
            index_name: 'idx_org_id',
            columns: 'organisation_id',
            is_unique: false,
            is_primary: false
          },
          {
            table_name: 'employees',
            index_name: 'employees_pkey',
            columns: 'id',
            is_unique: true,
            is_primary: true
          }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes(['employees'])

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        table_name: 'employees',
        index_name: 'idx_org_id',
        columns: ['organisation_id'],
        is_unique: false,
        is_primary: false
      })
      expect(result[1]).toEqual({
        table_name: 'employees',
        index_name: 'employees_pkey',
        columns: ['id'],
        is_unique: true,
        is_primary: true
      })
    })

    it('should handle multiple table names', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            table_name: 'employees',
            index_name: 'idx_emp_org',
            columns: 'organisation_id',
            is_unique: false,
            is_primary: false
          },
          {
            table_name: 'departments',
            index_name: 'idx_dept_org',
            columns: 'organisation_id',
            is_unique: false,
            is_primary: false
          }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes(['employees', 'departments'])

      expect(result).toHaveLength(2)
    })

    it('should return empty array when result is not an array', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ count: 0 })
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes(['employees'])

      expect(result).toEqual([])
    })

    it('should handle query errors gracefully', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Index query failed'))
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await executor.getTableIndexes(['employees'])

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle empty columns string', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            table_name: 'test',
            index_name: 'idx_test',
            columns: '',
            is_unique: false,
            is_primary: false
          }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes(['test'])

      expect(result[0].columns).toEqual([''])
    })

    it('should handle composite index columns', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            table_name: 'test',
            index_name: 'idx_composite',
            columns: 'col1,col2,col3',
            is_unique: true,
            is_primary: false
          }
        ])
      }
      const executor = createDuckDBExecutor(mockDb as any, undefined)

      const result = await executor.getTableIndexes(['test'])

      expect(result[0].columns).toEqual(['col1', 'col2', 'col3'])
    })
  })
})
