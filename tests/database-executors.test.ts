/**
 * Database Executor Integration Tests
 * Tests for executor query execution, numeric conversion, and factory functions
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql, count, sum, avg } from 'drizzle-orm'
import {
  createTestDatabaseExecutor,
  getTestDatabaseType,
  getTestSchema
} from './helpers/test-database'
import {
  createDatabaseExecutor,
  createPostgresExecutor,
  createMySQLExecutor,
  createSQLiteExecutor,
  PostgresExecutor,
  MySQLExecutor,
  SQLiteExecutor
} from '../src/server/executors'
import type { DatabaseExecutor } from '../src/server/types'

const dbType = getTestDatabaseType()

describe('Database Executors Integration', () => {
  let executor: DatabaseExecutor<any>
  let close: () => void
  let db: any
  let schema: any
  let employees: any

  beforeAll(async () => {
    const result = await createTestDatabaseExecutor()
    executor = result.executor
    close = result.close

    // Get schema for direct queries
    const testSchema = await getTestSchema()
    schema = testSchema.schema
    employees = testSchema.employees
    db = executor.db
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Factory Functions', () => {
    describe('createDatabaseExecutor with explicit engineType', () => {
      it('should create correct executor for current database type', () => {
        const testExecutor = createDatabaseExecutor(db, schema, dbType as any)
        expect(testExecutor.getEngineType()).toBe(dbType)
      })

      it('should create PostgresExecutor when engineType is postgres', () => {
        if (dbType !== 'postgres') return // Skip if not testing Postgres

        const testExecutor = createDatabaseExecutor(db, schema, 'postgres')
        expect(testExecutor).toBeInstanceOf(PostgresExecutor)
        expect(testExecutor.getEngineType()).toBe('postgres')
      })

      it('should create MySQLExecutor when engineType is mysql', () => {
        if (dbType !== 'mysql') return // Skip if not testing MySQL

        const testExecutor = createDatabaseExecutor(db, schema, 'mysql')
        expect(testExecutor).toBeInstanceOf(MySQLExecutor)
        expect(testExecutor.getEngineType()).toBe('mysql')
      })

      it('should create SQLiteExecutor when engineType is sqlite', () => {
        if (dbType !== 'sqlite') return // Skip if not testing SQLite

        const testExecutor = createDatabaseExecutor(db, schema, 'sqlite')
        expect(testExecutor).toBeInstanceOf(SQLiteExecutor)
        expect(testExecutor.getEngineType()).toBe('sqlite')
      })
    })

    describe('Database-specific factory functions', () => {
      it('should create executor using database-specific factory', () => {
        let testExecutor: DatabaseExecutor<any>

        if (dbType === 'postgres') {
          testExecutor = createPostgresExecutor(db, schema)
          expect(testExecutor).toBeInstanceOf(PostgresExecutor)
        } else if (dbType === 'mysql') {
          testExecutor = createMySQLExecutor(db, schema)
          expect(testExecutor).toBeInstanceOf(MySQLExecutor)
        } else if (dbType === 'sqlite') {
          testExecutor = createSQLiteExecutor(db, schema)
          expect(testExecutor).toBeInstanceOf(SQLiteExecutor)
        }
      })
    })
  })

  describe(`${dbType} Executor - Query Execution`, () => {
    it('should execute simple SELECT query and return array', async () => {
      const query = db.select().from(employees).limit(5)
      const result = await executor.execute(query)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should execute query with COUNT aggregation', async () => {
      const query = db.select({ count: count() }).from(employees)
      const result = await executor.execute(query, ['count'])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(typeof result[0].count).toBe('number')
      expect(result[0].count).toBeGreaterThan(0)
    })

    it('should execute query with SUM aggregation', async () => {
      const query = db.select({ total: sum(employees.salary) }).from(employees)
      const result = await executor.execute(query, ['total'])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      // SUM can be null if no rows, but with test data it should be a number
      if (result[0].total !== null) {
        expect(typeof result[0].total).toBe('number')
        expect(result[0].total).toBeGreaterThan(0)
      }
    })

    it('should execute query with AVG aggregation', async () => {
      const query = db.select({ average: avg(employees.salary) }).from(employees)
      const result = await executor.execute(query, ['average'])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      // AVG can be null if no rows, but with test data it should be a number
      if (result[0].average !== null) {
        expect(typeof result[0].average).toBe('number')
        expect(result[0].average).toBeGreaterThan(0)
      }
    })

    it('should handle empty result sets', async () => {
      // Query with impossible condition
      const query = db
        .select()
        .from(employees)
        .where(sql`1 = 0`)

      const result = await executor.execute(query)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('should handle query with multiple columns', async () => {
      const query = db
        .select({
          name: employees.name,
          salary: employees.salary,
          departmentId: employees.departmentId
        })
        .from(employees)
        .limit(1)

      const result = await executor.execute(query)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('salary')
      expect(result[0]).toHaveProperty('departmentId')
    })
  })

  describe(`${dbType} Executor - Numeric Field Conversion`, () => {
    it('should convert COUNT result to number', async () => {
      const query = db.select({ count: count() }).from(employees)
      const result = await executor.execute(query, ['count'])

      expect(typeof result[0].count).toBe('number')
      expect(Number.isInteger(result[0].count)).toBe(true)
    })

    it('should convert SUM result to number', async () => {
      const query = db.select({ total: sum(employees.salary) }).from(employees)
      const result = await executor.execute(query, ['total'])

      if (result[0].total !== null) {
        expect(typeof result[0].total).toBe('number')
      }
    })

    it('should preserve null values in numeric fields', async () => {
      // Query that might return NULL (e.g., SUM on empty set)
      const query = db
        .select({ total: sum(employees.salary) })
        .from(employees)
        .where(sql`1 = 0`)

      const result = await executor.execute(query, ['total'])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      // NULL should be preserved, not converted to 0
      expect(result[0].total).toBeNull()
    })

    it('should only convert specified numericFields, not dimensions', async () => {
      const query = db
        .select({
          name: employees.name,
          count: count()
        })
        .from(employees)
        .groupBy(employees.name)
        .limit(1)

      const result = await executor.execute(query, ['count'])

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      // count should be a number
      expect(typeof result[0].count).toBe('number')
      // name should remain a string (not converted)
      expect(typeof result[0].name).toBe('string')
    })

    it('should not convert fields when numericFields is not provided', async () => {
      const query = db
        .select({
          name: employees.name,
          salary: employees.salary
        })
        .from(employees)
        .limit(1)

      // Execute without numericFields parameter
      const result = await executor.execute(query)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      // Values should remain as returned by database
      expect(result[0].name).toBeDefined()
      expect(result[0].salary).toBeDefined()
    })
  })

  describe(`${dbType} Executor - Engine Type`, () => {
    it('should return correct engine type', () => {
      expect(executor.getEngineType()).toBe(dbType)
    })

    it('should have database adapter with matching engine type', () => {
      expect(executor.databaseAdapter).toBeDefined()
      expect(executor.databaseAdapter.getEngineType()).toBe(dbType)
    })
  })

  describe(`${dbType} Executor - Database Instance`, () => {
    it('should expose the database instance', () => {
      expect(executor.db).toBeDefined()
      expect(executor.db).toBe(db)
    })

    it('should expose the schema', () => {
      expect(executor.schema).toBeDefined()
    })
  })
})

describe('createDatabaseExecutor Auto-Detection', () => {
  it('should throw error when engine type cannot be determined', () => {
    // Create a mock db object without SQLite or Postgres/MySQL methods
    const mockDb = {}

    expect(() => {
      createDatabaseExecutor(mockDb as any, undefined)
    }).toThrow('Unable to determine database engine type')
  })

  it('should detect SQLite from db.all and db.run methods', () => {
    // Only run this if we're testing SQLite
    if (dbType !== 'sqlite') return

    const mockSqliteDb = {
      all: () => [],
      run: () => ({})
    }

    const testExecutor = createDatabaseExecutor(mockSqliteDb as any, undefined)
    expect(testExecutor).toBeInstanceOf(SQLiteExecutor)
  })

  it('should default to PostgreSQL when db.execute exists but no all/run', () => {
    // Create a mock with just execute method
    const mockDbWithExecute = {
      execute: async () => []
    }

    const testExecutor = createDatabaseExecutor(mockDbWithExecute as any, undefined)
    expect(testExecutor).toBeInstanceOf(PostgresExecutor)
  })
})
