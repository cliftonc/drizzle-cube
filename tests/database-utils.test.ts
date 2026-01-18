/**
 * Database Utils Unit Tests
 * Tests for database adapter factory and utility functions
 */
import { describe, it, expect } from 'vitest'
import {
  createDatabaseAdapter,
  getSupportedEngines,
  isEngineSupported
} from '../src/server/database-utils'
import { PostgresAdapter } from '../src/server/adapters/postgres-adapter'
import { MySQLAdapter } from '../src/server/adapters/mysql-adapter'
import { SQLiteAdapter } from '../src/server/adapters/sqlite-adapter'
import { SingleStoreAdapter } from '../src/server/adapters/singlestore-adapter'

describe('Database Utils', () => {
  describe('createDatabaseAdapter', () => {
    it('should create PostgresAdapter for postgres', () => {
      const adapter = createDatabaseAdapter('postgres')
      expect(adapter).toBeInstanceOf(PostgresAdapter)
      expect(adapter.getEngineType()).toBe('postgres')
    })

    it('should create MySQLAdapter for mysql', () => {
      const adapter = createDatabaseAdapter('mysql')
      expect(adapter).toBeInstanceOf(MySQLAdapter)
      expect(adapter.getEngineType()).toBe('mysql')
    })

    it('should create SQLiteAdapter for sqlite', () => {
      const adapter = createDatabaseAdapter('sqlite')
      expect(adapter).toBeInstanceOf(SQLiteAdapter)
      expect(adapter.getEngineType()).toBe('sqlite')
    })

    it('should create SingleStoreAdapter for singlestore', () => {
      const adapter = createDatabaseAdapter('singlestore')
      expect(adapter).toBeInstanceOf(SingleStoreAdapter)
      expect(adapter.getEngineType()).toBe('singlestore')
    })

    it('should throw error for unsupported engine type', () => {
      expect(() => {
        createDatabaseAdapter('oracle' as any)
      }).toThrow('Unsupported database engine')
    })

    it('should throw error for undefined engine type', () => {
      expect(() => {
        createDatabaseAdapter(undefined as any)
      }).toThrow()
    })
  })

  describe('getSupportedEngines', () => {
    it('should return all 5 supported engine types', () => {
      const engines = getSupportedEngines()
      expect(engines).toHaveLength(5)
      expect(engines).toContain('postgres')
      expect(engines).toContain('mysql')
      expect(engines).toContain('sqlite')
      expect(engines).toContain('singlestore')
      expect(engines).toContain('duckdb')
    })

    it('should return an array', () => {
      const engines = getSupportedEngines()
      expect(Array.isArray(engines)).toBe(true)
    })
  })

  describe('isEngineSupported', () => {
    it('should return true for postgres', () => {
      expect(isEngineSupported('postgres')).toBe(true)
    })

    it('should return true for mysql', () => {
      expect(isEngineSupported('mysql')).toBe(true)
    })

    it('should return true for sqlite', () => {
      expect(isEngineSupported('sqlite')).toBe(true)
    })

    it('should return true for singlestore', () => {
      expect(isEngineSupported('singlestore')).toBe(true)
    })

    it('should return false for oracle', () => {
      expect(isEngineSupported('oracle')).toBe(false)
    })

    it('should return false for mongodb', () => {
      expect(isEngineSupported('mongodb')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isEngineSupported('')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isEngineSupported(undefined as any)).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(isEngineSupported('POSTGRES')).toBe(false)
      expect(isEngineSupported('MySQL')).toBe(false)
      expect(isEngineSupported('SQLite')).toBe(false)
    })
  })
})
