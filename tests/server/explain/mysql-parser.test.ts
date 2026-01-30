/**
 * Comprehensive tests for MySQL EXPLAIN output parser
 * Tests parsing of MySQL EXPLAIN output and normalization to common structure
 */

import { describe, it, expect } from 'vitest'
import { parseMySQLExplain } from '../../../src/server/explain/mysql-parser'

describe('MySQL Explain Parser', () => {
  const defaultSqlQuery = { sql: 'SELECT * FROM employees', params: [] }

  // Helper to create a standard MySQL EXPLAIN row
  function createExplainRow(overrides: Partial<{
    id: number
    select_type: string
    table: string | null
    partitions: string | null
    type: string
    possible_keys: string | null
    key: string | null
    key_len: string | null
    ref: string | null
    rows: number
    filtered: number
    Extra: string | null
  }> = {}) {
    return {
      id: 1,
      select_type: 'SIMPLE',
      table: 'employees',
      partitions: null,
      type: 'ALL',
      possible_keys: null,
      key: null,
      key_len: null,
      ref: null,
      rows: 100,
      filtered: 100,
      Extra: null,
      ...overrides
    }
  }

  describe('Basic Operation Parsing', () => {
    it('should parse a full table scan (ALL)', () => {
      const rows = [createExplainRow({ type: 'ALL', table: 'employees', rows: 100 })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].type).toBe('Seq Scan')
      expect(result.operations[0].table).toBe('employees')
      expect(result.operations[0].estimatedRows).toBe(100)
    })

    it('should parse an index scan', () => {
      const rows = [createExplainRow({
        type: 'index',
        key: 'idx_employees_name',
        rows: 50
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Scan')
      expect(result.operations[0].index).toBe('idx_employees_name')
    })

    it('should parse an index range scan', () => {
      const rows = [createExplainRow({
        type: 'range',
        key: 'idx_salary',
        rows: 25
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Range Scan')
      expect(result.operations[0].index).toBe('idx_salary')
    })

    it('should parse ref access type', () => {
      const rows = [createExplainRow({
        type: 'ref',
        key: 'idx_department',
        ref: 'const',
        rows: 10
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Lookup')
    })

    it('should parse eq_ref access type', () => {
      const rows = [createExplainRow({
        type: 'eq_ref',
        key: 'PRIMARY',
        ref: 'db.employees.department_id',
        rows: 1
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Lookup')
    })

    it('should parse const access type', () => {
      const rows = [createExplainRow({
        type: 'const',
        key: 'PRIMARY',
        rows: 1
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Const Lookup')
    })

    it('should parse system access type', () => {
      const rows = [createExplainRow({
        type: 'system',
        rows: 1
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Const Lookup')
    })

    it('should parse NULL access type (no table)', () => {
      const rows = [createExplainRow({
        type: 'NULL',
        table: null,
        rows: 0
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('No Table')
    })

    it('should handle unknown access types', () => {
      const rows = [createExplainRow({
        type: 'fulltext',
        rows: 10
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('MySQL fulltext')
    })
  })

  describe('Index Only Scan Detection', () => {
    it('should detect Index Only Scan when Extra contains "Using index"', () => {
      const rows = [createExplainRow({
        type: 'index',
        key: 'idx_covering',
        Extra: 'Using index'
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Only Scan')
    })

    it('should detect Index Only Scan with mixed case', () => {
      const rows = [createExplainRow({
        type: 'index',
        key: 'idx_covering',
        Extra: 'Using Index; Using where'
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Only Scan')
    })
  })

  describe('Cost Extraction', () => {
    it('should use rows as estimated cost', () => {
      const rows = [createExplainRow({ rows: 500 })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].estimatedCost).toBe(500)
      expect(result.operations[0].estimatedRows).toBe(500)
    })

    it('should sum total cost from all operations', () => {
      const rows = [
        createExplainRow({ id: 1, table: 't1', rows: 100 }),
        createExplainRow({ id: 1, table: 't2', rows: 200 }),
        createExplainRow({ id: 1, table: 't3', rows: 50 })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.totalCost).toBe(350)
    })

    it('should handle zero rows', () => {
      const rows = [createExplainRow({ rows: 0 })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].estimatedCost).toBe(0)
      expect(result.operations[0].estimatedRows).toBe(0)
    })
  })

  describe('Time Parsing', () => {
    it('should not have timing information in standard EXPLAIN', () => {
      const rows = [createExplainRow()]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.planningTime).toBeUndefined()
      expect(result.summary.executionTime).toBeUndefined()
    })
  })

  describe('Index Detection', () => {
    it('should detect used index', () => {
      const rows = [createExplainRow({
        key: 'idx_org_id',
        type: 'ref'
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toContain('idx_org_id')
    })

    it('should detect multiple indexes from multiple tables', () => {
      const rows = [
        createExplainRow({ id: 1, table: 'employees', key: 'idx_emp_org', type: 'ref' }),
        createExplainRow({ id: 1, table: 'departments', key: 'idx_dept_id', type: 'eq_ref' })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toContain('idx_emp_org')
      expect(result.summary.usedIndexes).toContain('idx_dept_id')
    })

    it('should deduplicate repeated indexes', () => {
      const rows = [
        createExplainRow({ id: 1, table: 't1', key: 'idx_same', type: 'ref' }),
        createExplainRow({ id: 2, table: 't2', key: 'idx_same', type: 'ref' })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toHaveLength(1)
    })

    it('should handle null key (no index used)', () => {
      const rows = [createExplainRow({ key: null })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toHaveLength(0)
      expect(result.operations[0].index).toBeUndefined()
    })
  })

  describe('Sequential Scan Detection', () => {
    it('should detect full table scan (ALL)', () => {
      const rows = [createExplainRow({ type: 'ALL' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(true)
    })

    it('should detect full table scan with mixed case', () => {
      const rows = [createExplainRow({ type: 'all' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(true)
    })

    it('should not detect sequential scan for index access', () => {
      const rows = [createExplainRow({ type: 'ref', key: 'idx_test' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(false)
    })

    it('should detect sequential scan among multiple operations', () => {
      const rows = [
        createExplainRow({ id: 1, table: 't1', type: 'ref', key: 'idx1' }),
        createExplainRow({ id: 1, table: 't2', type: 'ALL' })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(true)
    })
  })

  describe('Extra Column Parsing', () => {
    it('should detect Using where filter', () => {
      const rows = [createExplainRow({ Extra: 'Using where' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toContain('WHERE filter applied')
      expect(result.operations[0].filter).toBe('Using where')
    })

    it('should detect Using filesort', () => {
      const rows = [createExplainRow({ Extra: 'Using filesort' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toContain('Filesort required')
    })

    it('should detect Using temporary', () => {
      const rows = [createExplainRow({ Extra: 'Using temporary' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toContain('Temporary table required')
    })

    it('should detect Using join buffer', () => {
      const rows = [createExplainRow({ Extra: 'Using join buffer (Block Nested Loop)' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toContain('Join buffer used')
    })

    it('should combine multiple Extra conditions', () => {
      const rows = [createExplainRow({ Extra: 'Using where; Using temporary; Using filesort' })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toContain('WHERE filter applied')
      expect(result.operations[0].details).toContain('Temporary table required')
      expect(result.operations[0].details).toContain('Filesort required')
    })

    it('should handle null Extra column', () => {
      const rows = [createExplainRow({ Extra: null })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toBeUndefined()
      expect(result.operations[0].filter).toBeUndefined()
    })
  })

  describe('Multi-Table Queries', () => {
    it('should parse multiple table operations', () => {
      const rows = [
        createExplainRow({ id: 1, table: 'employees', type: 'ALL', rows: 100 }),
        createExplainRow({ id: 1, table: 'departments', type: 'eq_ref', key: 'PRIMARY', rows: 1 })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(2)
      expect(result.operations[0].table).toBe('employees')
      expect(result.operations[1].table).toBe('departments')
    })

    it('should handle subqueries with different IDs', () => {
      const rows = [
        createExplainRow({ id: 1, select_type: 'PRIMARY', table: 'employees', type: 'ALL' }),
        createExplainRow({ id: 2, select_type: 'SUBQUERY', table: 'departments', type: 'index' })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(2)
    })

    it('should handle UNION queries', () => {
      const rows = [
        createExplainRow({ id: 1, select_type: 'PRIMARY', table: 't1', type: 'ALL' }),
        createExplainRow({ id: 2, select_type: 'UNION', table: 't2', type: 'ALL' }),
        createExplainRow({ id: null as any, select_type: 'UNION RESULT', table: '<union1,2>' as any, type: 'ALL' })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const rows: any[] = []

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(0)
      expect(result.summary.hasSequentialScans).toBe(false)
      expect(result.summary.usedIndexes).toHaveLength(0)
      expect(result.summary.totalCost).toBe(0)
    })

    it('should handle null table name', () => {
      const rows = [createExplainRow({ table: null })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].table).toBeUndefined()
    })

    it('should handle very large row counts', () => {
      const rows = [createExplainRow({ rows: 10000000 })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations[0].estimatedRows).toBe(10000000)
    })

    it('should handle filtered percentage', () => {
      const rows = [createExplainRow({ rows: 100, filtered: 50.00 })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      // Filtered is captured but not specifically stored in the normalized output
      expect(result.operations[0].estimatedRows).toBe(100)
    })
  })

  describe('Summary Generation', () => {
    it('should generate complete summary', () => {
      const rows = [
        createExplainRow({ table: 'employees', type: 'ALL', rows: 100 }),
        createExplainRow({ table: 'departments', type: 'ref', key: 'idx_dept', rows: 10 })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.summary.database).toBe('mysql')
      expect(result.summary.planningTime).toBeUndefined()
      expect(result.summary.executionTime).toBeUndefined()
      expect(result.summary.totalCost).toBe(110)
      expect(result.summary.hasSequentialScans).toBe(true)
      expect(result.summary.usedIndexes).toContain('idx_dept')
    })

    it('should format raw output as table', () => {
      const rows = [createExplainRow({
        id: 1,
        select_type: 'SIMPLE',
        table: 'employees',
        type: 'ALL',
        possible_keys: null,
        key: null,
        rows: 100,
        Extra: 'Using where'
      })]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.raw).toContain('id\tselect_type\ttable\ttype')
      expect(result.raw).toContain('1\tSIMPLE\temployees\tALL')
    })

    it('should include SQL query in result', () => {
      const sqlQuery = { sql: 'SELECT * FROM employees WHERE status = ?', params: ['active'] }
      const rows = [createExplainRow()]

      const result = parseMySQLExplain(rows, sqlQuery)

      expect(result.sql.sql).toBe(sqlQuery.sql)
      expect(result.sql.params).toEqual(sqlQuery.params)
    })
  })

  describe('Complex Query Plans', () => {
    it('should parse a JOIN query with multiple access types', () => {
      const rows = [
        createExplainRow({
          id: 1,
          table: 'employees',
          type: 'ref',
          key: 'idx_org',
          rows: 50,
          Extra: 'Using where'
        }),
        createExplainRow({
          id: 1,
          table: 'departments',
          type: 'eq_ref',
          key: 'PRIMARY',
          rows: 1,
          Extra: null
        }),
        createExplainRow({
          id: 1,
          table: 'locations',
          type: 'ALL',
          key: null,
          rows: 10,
          Extra: 'Using where; Using join buffer (hash join)'
        })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(3)
      expect(result.summary.hasSequentialScans).toBe(true)
      expect(result.summary.usedIndexes).toContain('idx_org')
      expect(result.summary.usedIndexes).toContain('PRIMARY')
    })

    it('should parse a derived table query', () => {
      const rows = [
        createExplainRow({
          id: 1,
          select_type: 'PRIMARY',
          table: '<derived2>' as any,
          type: 'ALL',
          rows: 10
        }),
        createExplainRow({
          id: 2,
          select_type: 'DERIVED',
          table: 'employees',
          type: 'index',
          key: 'idx_name',
          rows: 100
        })
      ]

      const result = parseMySQLExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(2)
    })
  })
})
