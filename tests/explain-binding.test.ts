/**
 * EXPLAIN parameter-binding tests (issue #849, item 1)
 *
 * EXPLAIN previously re-inlined bound parameter values into a raw SQL string
 * using quote-doubling only. On backslash-escape dialects (MySQL/MariaDB/
 * SingleStore/Snowflake) that is insufficient and allows SQL injection through
 * filter values. The fix rebuilds the parameterized SQL into a Drizzle SQL
 * object whose values are passed to the driver as real bind parameters.
 *
 * These tests assert the user value never reaches the SQL text — it stays a
 * bound parameter — so injected SQL cannot execute regardless of dialect.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { MySqlDialect } from 'drizzle-orm/mysql-core'
import { buildBoundSql } from '../src/server/executors/explain-utils'
import { createTestDatabaseExecutor, skipIfDatabend, skipIfSnowflake } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import type { Cube, SemanticQuery } from '../src/server/types'

// A classic backslash-escape breakout: `\'` is consumed as a literal quote on
// backslash-escape dialects, the following `'` closes the string, and the rest
// executes as SQL. Quote-doubling alone does not neutralise this.
const INJECTION = String.raw`\' OR 1=1-- `

describe('buildBoundSql - EXPLAIN parameter binding', () => {
  describe('question-mark placeholders (mysql/sqlite/singlestore/snowflake)', () => {
    it('binds values as parameters instead of inlining them', () => {
      const bound = buildBoundSql(
        'SELECT * FROM t WHERE a = ? AND b = ?',
        ['safe', INJECTION],
        'question'
      )
      const { sql, params } = new MySqlDialect().sqlToQuery(bound)

      // Structure is preserved; values stay as placeholders
      expect(sql).toBe('SELECT * FROM t WHERE a = ? AND b = ?')
      // The injection payload is carried as a bound parameter, never inlined
      expect(params).toEqual(['safe', INJECTION])
      // The dangerous SQL fragment must not appear in the statement text
      expect(sql).not.toContain('1=1')
      expect(sql).not.toContain('OR')
    })

    it('preserves parameter order across multiple placeholders', () => {
      const bound = buildBoundSql(
        'SELECT ? , ? , ?',
        [1, 'two', true],
        'question'
      )
      const { params } = new MySqlDialect().sqlToQuery(bound)
      expect(params).toEqual([1, 'two', true])
    })

    it('handles a query with no parameters', () => {
      const bound = buildBoundSql('SELECT 1', [], 'question')
      const { sql, params } = new MySqlDialect().sqlToQuery(bound)
      expect(sql).toBe('SELECT 1')
      expect(params).toEqual([])
    })
  })

  describe('dollar placeholders (postgres/duckdb/databend)', () => {
    it('binds values as parameters instead of inlining them', () => {
      const bound = buildBoundSql(
        'SELECT * FROM t WHERE a = $1 AND b = $2',
        ['safe', INJECTION],
        'dollar'
      )
      const { sql, params } = new PgDialect().sqlToQuery(bound)

      expect(sql).toBe('SELECT * FROM t WHERE a = $1 AND b = $2')
      expect(params).toEqual(['safe', INJECTION])
      expect(sql).not.toContain('1=1')
    })

    it('maps placeholders back to params by their $n index', () => {
      // $2 referenced before $1 in the text
      const bound = buildBoundSql(
        'SELECT * FROM t WHERE b = $2 AND a = $1',
        ['first', 'second'],
        'dollar'
      )
      const { params } = new PgDialect().sqlToQuery(bound)
      // First emitted placeholder is $2 → 'second', then $1 → 'first'
      expect(params).toEqual(['second', 'first'])
    })

    it('carries a literal backslash through as data, not SQL', () => {
      const value = String.raw`C:\path\to\file`
      const bound = buildBoundSql('SELECT * FROM t WHERE p = $1', [value], 'dollar')
      const { sql, params } = new PgDialect().sqlToQuery(bound)
      expect(params).toEqual([value])
      expect(sql).not.toContain('\\')
    })
  })
})

// Skipped on Databend/Snowflake: their Drizzle drivers (drizzle-databend /
// databend-driver) string-substitute parameters into the SQL with quote-doubling
// at the driver layer rather than binding them, so the end-to-end bound-param
// guarantee this test asserts cannot hold there (a backslash payload is rejected
// as a parse error). That is a separate driver-level limitation; the executor
// layer is still covered by the buildBoundSql unit tests above, which run on
// every engine.
describe.skipIf(skipIfDatabend() || skipIfSnowflake())('EXPLAIN with injection-style filter values (live, current engine)', () => {
  let executor: QueryExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees'])
  })

  afterAll(() => {
    if (close) close()
  })

  // A value combining a backslash-escape breakout with a quote-doubling breakout.
  const INJECTION_FILTER = String.raw`\' OR 1=1-- `

  it('runs EXPLAIN with a backslash/quote injection value without error or injection', async () => {
    const query: SemanticQuery = {
      measures: ['Employees.count'],
      filters: [
        { member: 'Employees.name', operator: 'contains', values: [INJECTION_FILTER] }
      ]
    }

    // Must resolve (the value is bound, not inlined) — no DB syntax error and no
    // injected statement executing.
    const result = await executor.explainQuery(cubes, query, testSecurityContexts.org1)
    expect(result).toBeDefined()
    // The injected value is carried as a bound parameter on the explained SQL,
    // never spliced into the SQL text. (Some engines lower-case LIKE params, so
    // compare case-insensitively.)
    const params = (result.sql.params ?? []).map(p => String(p).toLowerCase())
    expect(params.some(p => p.includes(INJECTION_FILTER.toLowerCase()))).toBe(true)
    expect(result.sql.sql).not.toContain('1=1')
  })
})
