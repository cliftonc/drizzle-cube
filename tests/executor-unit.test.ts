/**
 * Executor Unit Tests
 * Tests all database executors with mocked database instances
 * These tests cover database-specific code paths that require mocking
 */
import { describe, it, expect, vi } from 'vitest'
import {
  PostgresExecutor,
  MySQLExecutor,
  SQLiteExecutor,
  SingleStoreExecutor,
  createPostgresExecutor,
  createMySQLExecutor,
  createSQLiteExecutor,
  createSingleStoreExecutor
} from '../src/server/executors'

describe('PostgresExecutor Unit Tests', () => {
  describe('execute', () => {
    it('should handle Drizzle query objects with execute method', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)

      const mockQuery = {
        execute: vi.fn().mockResolvedValue([{ id: 1, count: '5' }])
      }

      const result = await executor.execute(mockQuery, ['count'])

      expect(mockQuery.execute).toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, count: 5 }])
    })

    it('should throw when db.execute not available for raw SQL', async () => {
      const mockDb = {} // No execute method
      const executor = createPostgresExecutor(mockDb as any, undefined)

      // Raw SQL object (not a Drizzle query)
      const rawSql = { queryChunks: ['SELECT 1'] }

      await expect(executor.execute(rawSql)).rejects.toThrow(
        'PostgreSQL database instance must have an execute method'
      )
    })

    it('should use db.execute for raw SQL queries', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ count: '10' }])
      }
      const executor = createPostgresExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT COUNT(*) as count'] }
      const result = await executor.execute(rawSql, ['count'])

      expect(mockDb.execute).toHaveBeenCalledWith(rawSql)
      expect(result).toEqual([{ count: 10 }])
    })

    it('should handle non-array results', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ affectedRows: 1 })
      }
      const executor = createPostgresExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['UPDATE table SET col = 1'] }
      const result = await executor.execute(rawSql)

      expect(result).toEqual({ affectedRows: 1 })
    })
  })

  describe('coerceToNumber (via execute)', () => {
    // Access private method via casting to any
    const getCoerceMethod = (executor: PostgresExecutor) => {
      return (executor as any).coerceToNumber.bind(executor)
    }

    it('should preserve null values', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(null)).toBeNull()
      expect(coerceToNumber(undefined)).toBeUndefined()
    })

    it('should return numbers unchanged', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(42)).toBe(42)
      expect(coerceToNumber(3.14)).toBe(3.14)
      expect(coerceToNumber(-10)).toBe(-10)
    })

    it('should convert BigInt to number', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(BigInt(100))).toBe(100)
      expect(coerceToNumber(BigInt(9007199254740991))).toBe(9007199254740991)
    })

    // Lines 74-79: Object with toString() returning numeric string
    it('should handle objects with numeric toString()', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const numericObject = { toString: () => '123.45' }
      expect(coerceToNumber(numericObject)).toBe(123.45)
    })

    it('should detect integers from toString() (no decimal)', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const intObject = { toString: () => '42' }
      expect(coerceToNumber(intObject)).toBe(42)
      expect(Number.isInteger(coerceToNumber(intObject))).toBe(true)
    })

    it('should handle negative numbers from toString()', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const negativeObject = { toString: () => '-99.5' }
      expect(coerceToNumber(negativeObject)).toBe(-99.5)
    })

    // Lines 82-88: constructor.name check for Numeric/Decimal
    it('should handle objects with constructor.name === Numeric', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      // Create a mock Numeric class
      class Numeric {
        constructor(private value: string) {}
        toString() { return this.value }
      }

      const numericInstance = new Numeric('999.99')
      expect(coerceToNumber(numericInstance)).toBe(999.99)
    })

    it('should handle objects with constructor.name === Decimal', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      // Create a mock Decimal class
      class Decimal {
        constructor(private value: string) {}
        toString() { return this.value }
      }

      const decimalInstance = new Decimal('1234.5678')
      expect(coerceToNumber(decimalInstance)).toBe(1234.5678)
    })

    // Lines 84-85: digits/sign property check
    it('should handle objects with digits and sign properties', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      // Mock object like PostgreSQL numeric type representation
      const pgNumericObject = {
        digits: [1, 2, 3],
        sign: 1,
        toString: () => '123.0'
      }

      expect(coerceToNumber(pgNumericObject)).toBe(123.0)
    })

    it('should handle objects with sign property only', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const signOnlyObject = {
        sign: -1,
        toString: () => '-50.25'
      }

      expect(coerceToNumber(signOnlyObject)).toBe(-50.25)
    })

    // Lines 90-91: Non-numeric objects pass through
    it('should return non-numeric objects unchanged', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const nonNumericObject = { foo: 'bar', baz: 123 }
      expect(coerceToNumber(nonNumericObject)).toBe(nonNumericObject)
    })

    it('should return objects with non-numeric toString() unchanged', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      const stringObject = { toString: () => 'hello world' }
      expect(coerceToNumber(stringObject)).toBe(stringObject)
    })

    // Lines 94-99: String numeric conversion
    it('should convert numeric strings to numbers', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('42')).toBe(42)
      expect(coerceToNumber('3.14159')).toBe(3.14159)
      expect(coerceToNumber('-100')).toBe(-100)
    })

    // Lines 102-104: Scientific notation handling
    it('should handle scientific notation strings', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('1e5')).toBe(100000)
      expect(coerceToNumber('1.5e10')).toBe(15000000000)
      expect(coerceToNumber('2.5E3')).toBe(2500)
    })

    it('should handle negative scientific notation', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('-2.3e-5')).toBeCloseTo(-0.000023, 10)
      expect(coerceToNumber('1e-10')).toBe(1e-10)
    })

    // Line 108: Non-numeric strings pass through
    it('should return non-numeric strings unchanged', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('hello')).toBe('hello')
      expect(coerceToNumber('')).toBe('')
    })

    it('should handle strings that start with numbers (parseFloat behavior)', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)
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
      const executor = createPostgresExecutor(mockDb as any, undefined)

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
      const executor = createPostgresExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }
      const result = await executor.execute(rawSql)

      // Without numericFields, values stay as strings
      expect(result).toEqual([
        { count: '5', name: 'Test' }
      ])
    })
  })

  describe('getEngineType', () => {
    it('should return postgres', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)

      expect(executor.getEngineType()).toBe('postgres')
    })
  })
})

describe('MySQLExecutor Unit Tests', () => {
  describe('execute', () => {
    it('should handle Drizzle query objects with execute method', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)

      const mockQuery = {
        execute: vi.fn().mockResolvedValue([{ id: 1, count: '5' }])
      }

      const result = await executor.execute(mockQuery, ['count'])

      expect(mockQuery.execute).toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, count: 5 }])
    })

    it('should throw when db.execute not available for raw SQL', async () => {
      const mockDb = {} // No execute method
      const executor = createMySQLExecutor(mockDb as any, undefined)

      // Raw SQL object (not a Drizzle query)
      const rawSql = { queryChunks: ['SELECT 1'] }

      await expect(executor.execute(rawSql)).rejects.toThrow(
        'MySQL database instance must have an execute method'
      )
    })

    it('should use db.execute for raw SQL queries', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ count: '10' }])
      }
      const executor = createMySQLExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT COUNT(*) as count'] }
      const result = await executor.execute(rawSql, ['count'])

      expect(mockDb.execute).toHaveBeenCalledWith(rawSql)
      expect(result).toEqual([{ count: 10 }])
    })

    it('should handle non-array results', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ affectedRows: 1 })
      }
      const executor = createMySQLExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['UPDATE table SET col = 1'] }
      const result = await executor.execute(rawSql)

      expect(result).toEqual({ affectedRows: 1 })
    })
  })

  describe('coerceToNumber (via execute)', () => {
    const getCoerceMethod = (executor: MySQLExecutor) => {
      return (executor as any).coerceToNumber.bind(executor)
    }

    it('should preserve null values', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(null)).toBeNull()
      expect(coerceToNumber(undefined)).toBeUndefined()
    })

    it('should return numbers unchanged', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(42)).toBe(42)
      expect(coerceToNumber(3.14)).toBe(3.14)
    })

    it('should convert numeric strings', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('42')).toBe(42)
      expect(coerceToNumber('3.14')).toBe(3.14)
      expect(coerceToNumber('-100.5')).toBe(-100.5)
    })

    it('should handle scientific notation', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('1e5')).toBe(100000)
      expect(coerceToNumber('-2.3e-5')).toBeCloseTo(-0.000023, 10)
    })

    it('should return non-numeric strings unchanged', async () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('hello')).toBe('hello')
      expect(coerceToNumber('')).toBe('')
    })
  })

  describe('getEngineType', () => {
    it('should return mysql', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)

      expect(executor.getEngineType()).toBe('mysql')
    })
  })
})

describe('SQLiteExecutor Unit Tests', () => {
  describe('execute', () => {
    // Line 13-20: Drizzle query object branch
    it('should handle Drizzle query objects with execute method', async () => {
      const mockDb = { all: vi.fn(), run: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const mockQuery = {
        execute: vi.fn().mockResolvedValue([{ id: 1, count: '5' }])
      }

      const result = await executor.execute(mockQuery, ['count'])

      expect(mockQuery.execute).toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, count: 5 }])
    })

    // Lines 26-31: db.all() branch
    it('should use db.all() when available', async () => {
      const mockDb = {
        all: vi.fn().mockReturnValue([{ id: 1, count: '5' }])
      }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT COUNT(*) as count'] }
      const result = await executor.execute(rawSql, ['count'])

      expect(mockDb.all).toHaveBeenCalledWith(rawSql)
      expect(result).toEqual([{ id: 1, count: 5 }])
    })

    it('should handle non-array result from db.all()', async () => {
      const mockDb = {
        all: vi.fn().mockReturnValue({ affectedRows: 1 })
      }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['UPDATE...'] }
      const result = await executor.execute(rawSql)

      expect(result).toEqual({ affectedRows: 1 })
    })

    // Lines 32-35: db.run() fallback
    it('should fall back to db.run() when all() not available', async () => {
      const mockDb = {
        run: vi.fn().mockReturnValue({ changes: 1 })
      }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['INSERT INTO...'] }
      const result = await executor.execute(rawSql)

      expect(mockDb.run).toHaveBeenCalledWith(rawSql)
      expect(result).toEqual({ changes: 1 })
    })

    // Lines 36-37: Error when neither method available
    it('should throw when neither all() nor run() available', async () => {
      const mockDb = {} // No all() or run() method
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT 1'] }

      await expect(executor.execute(rawSql)).rejects.toThrow(
        'SQLite database instance must have an all() or run() method'
      )
    })

    // Lines 39-40: Error wrapping
    it('should wrap SQLite execution errors', async () => {
      const mockDb = {
        all: vi.fn().mockImplementation(() => {
          throw new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed')
        })
      }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['INSERT...'] }

      await expect(executor.execute(rawSql)).rejects.toThrow(
        'SQLite execution failed: SQLITE_CONSTRAINT: UNIQUE constraint failed'
      )
    })

    it('should wrap unknown errors', async () => {
      const mockDb = {
        all: vi.fn().mockImplementation(() => {
          throw 'string error' // Non-Error object
        })
      }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }

      await expect(executor.execute(rawSql)).rejects.toThrow(
        'SQLite execution failed: Unknown error'
      )
    })
  })

  describe('coerceToNumber (via execute)', () => {
    const getCoerceMethod = (executor: SQLiteExecutor) => {
      return (executor as any).coerceToNumber.bind(executor)
    }

    it('should preserve null values', async () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(null)).toBeNull()
      expect(coerceToNumber(undefined)).toBeUndefined()
    })

    it('should return numbers unchanged', async () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber(42)).toBe(42)
    })

    it('should convert numeric strings', async () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('42')).toBe(42)
      expect(coerceToNumber('3.14')).toBe(3.14)
    })

    it('should handle scientific notation', async () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)
      const coerceToNumber = getCoerceMethod(executor)

      expect(coerceToNumber('1e5')).toBe(100000)
    })
  })

  describe('getEngineType', () => {
    it('should return sqlite', () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      expect(executor.getEngineType()).toBe('sqlite')
    })
  })
})

describe('SingleStoreExecutor Unit Tests', () => {
  describe('inheritance', () => {
    it('should be instanceof MySQLExecutor', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createSingleStoreExecutor(mockDb as any, undefined)

      expect(executor).toBeInstanceOf(MySQLExecutor)
      expect(executor).toBeInstanceOf(SingleStoreExecutor)
    })
  })

  describe('execute', () => {
    it('should inherit execute behavior from MySQLExecutor', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ count: '10' }])
      }
      const executor = createSingleStoreExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }
      const result = await executor.execute(rawSql, ['count'])

      expect(mockDb.execute).toHaveBeenCalledWith(rawSql)
      expect(result).toEqual([{ count: 10 }])
    })

    it('should throw when db.execute not available', async () => {
      const mockDb = {}
      const executor = createSingleStoreExecutor(mockDb as any, undefined)

      const rawSql = { queryChunks: ['SELECT...'] }

      await expect(executor.execute(rawSql)).rejects.toThrow(
        'MySQL database instance must have an execute method'
      )
    })
  })

  describe('getEngineType', () => {
    it('should return singlestore', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createSingleStoreExecutor(mockDb as any, undefined)

      expect(executor.getEngineType()).toBe('singlestore')
    })
  })
})

describe('Factory Functions', () => {
  describe('createPostgresExecutor', () => {
    it('should create PostgresExecutor instance', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)

      expect(executor).toBeInstanceOf(PostgresExecutor)
    })

    it('should set database adapter to postgres', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createPostgresExecutor(mockDb as any, undefined)

      expect(executor.databaseAdapter.getEngineType()).toBe('postgres')
    })
  })

  describe('createMySQLExecutor', () => {
    it('should create MySQLExecutor instance', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)

      expect(executor).toBeInstanceOf(MySQLExecutor)
    })

    it('should set database adapter to mysql', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createMySQLExecutor(mockDb as any, undefined)

      expect(executor.databaseAdapter.getEngineType()).toBe('mysql')
    })
  })

  describe('createSQLiteExecutor', () => {
    it('should create SQLiteExecutor instance', () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      expect(executor).toBeInstanceOf(SQLiteExecutor)
    })

    it('should set database adapter to sqlite', () => {
      const mockDb = { all: vi.fn() }
      const executor = createSQLiteExecutor(mockDb as any, undefined)

      expect(executor.databaseAdapter.getEngineType()).toBe('sqlite')
    })
  })

  describe('createSingleStoreExecutor', () => {
    it('should create SingleStoreExecutor instance', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createSingleStoreExecutor(mockDb as any, undefined)

      expect(executor).toBeInstanceOf(SingleStoreExecutor)
    })

    it('should set database adapter to singlestore', () => {
      const mockDb = { execute: vi.fn() }
      const executor = createSingleStoreExecutor(mockDb as any, undefined)

      expect(executor.databaseAdapter.getEngineType()).toBe('singlestore')
    })
  })
})
