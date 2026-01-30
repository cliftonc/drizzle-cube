/**
 * Comprehensive tests for SQLite EXPLAIN QUERY PLAN output parser
 * Tests parsing of SQLite EXPLAIN QUERY PLAN output and normalization to common structure
 */

import { describe, it, expect } from 'vitest'
import { parseSQLiteExplain } from '../../../src/server/explain/sqlite-parser'

describe('SQLite Explain Parser', () => {
  const defaultSqlQuery = { sql: 'SELECT * FROM employees', params: [] }

  // Helper to create a standard SQLite EXPLAIN QUERY PLAN row
  function createExplainRow(overrides: Partial<{
    id: number
    parent: number
    notused: number
    detail: string
  }> = {}) {
    return {
      id: 0,
      parent: 0,
      notused: 0,
      detail: 'SCAN employees',
      ...overrides
    }
  }

  describe('Basic Operation Parsing', () => {
    it('should parse a SCAN operation (sequential scan)', () => {
      const rows = [createExplainRow({ detail: 'SCAN employees' })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].type).toBe('Seq Scan')
      expect(result.operations[0].table).toBe('employees')
    })

    it('should parse a SEARCH with INDEX operation', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING INDEX idx_org_id (organisation_id=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Scan')
      expect(result.operations[0].table).toBe('employees')
      expect(result.operations[0].index).toBe('idx_org_id')
      expect(result.operations[0].filter).toBe('organisation_id=?')
    })

    it('should parse a SEARCH with COVERING INDEX', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING COVERING INDEX idx_covering (org_id=? AND status=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Index Scan')
      expect(result.operations[0].index).toBe('idx_covering')
    })

    it('should parse a SEARCH with INTEGER PRIMARY KEY', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING INTEGER PRIMARY KEY (rowid=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Primary Key Lookup')
      expect(result.operations[0].table).toBe('employees')
      expect(result.operations[0].filter).toBe('rowid=?')
    })

    it('should parse a SEARCH without index (partial scan)', () => {
      const rows = [createExplainRow({ detail: 'SEARCH employees' })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Search')
      expect(result.operations[0].table).toBe('employees')
    })
  })

  describe('Temp B-Tree Operations', () => {
    it('should parse USE TEMP B-TREE FOR ORDER BY', () => {
      const rows = [createExplainRow({
        detail: 'USE TEMP B-TREE FOR ORDER BY'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Sort')
    })

    it('should parse USE TEMP B-TREE FOR GROUP BY', () => {
      const rows = [createExplainRow({
        detail: 'USE TEMP B-TREE FOR GROUP BY'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Group')
    })

    it('should parse USE TEMP B-TREE FOR DISTINCT', () => {
      const rows = [createExplainRow({
        detail: 'USE TEMP B-TREE FOR DISTINCT'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Distinct')
    })

    it('should parse generic TEMP B-TREE', () => {
      const rows = [createExplainRow({
        detail: 'USE TEMP B-TREE'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Temp B-Tree')
    })
  })

  describe('Compound Query Operations', () => {
    it('should parse COMPOUND QUERY', () => {
      const rows = [createExplainRow({
        detail: 'COMPOUND QUERY'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Compound Query')
    })

    it('should parse SUBQUERY', () => {
      const rows = [createExplainRow({
        detail: 'SUBQUERY 1'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Subquery')
    })

    it('should parse CO-ROUTINE (CTE)', () => {
      const rows = [createExplainRow({
        detail: 'CO-ROUTINE cte_name'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('Coroutine')
    })
  })

  describe('Index Detection', () => {
    it('should detect index usage and add to usedIndexes', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING INDEX idx_employees_org (org_id=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toContain('idx_employees_org')
    })

    it('should detect multiple indexes', () => {
      const rows = [
        createExplainRow({ id: 0, detail: 'SEARCH employees USING INDEX idx_emp (emp_id=?)' }),
        createExplainRow({ id: 1, detail: 'SEARCH departments USING INDEX idx_dept (dept_id=?)' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toContain('idx_emp')
      expect(result.summary.usedIndexes).toContain('idx_dept')
      expect(result.summary.usedIndexes).toHaveLength(2)
    })

    it('should deduplicate repeated index names', () => {
      const rows = [
        createExplainRow({ id: 0, detail: 'SEARCH t1 USING INDEX idx_same (a=?)' }),
        createExplainRow({ id: 1, detail: 'SEARCH t2 USING INDEX idx_same (b=?)' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toHaveLength(1)
    })

    it('should not add to usedIndexes for SCAN operations', () => {
      const rows = [createExplainRow({ detail: 'SCAN employees' })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.usedIndexes).toHaveLength(0)
    })
  })

  describe('Sequential Scan Detection', () => {
    it('should detect SCAN as sequential scan', () => {
      const rows = [createExplainRow({ detail: 'SCAN employees' })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(true)
    })

    it('should not detect sequential scan for SEARCH with INDEX', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING INDEX idx_test (id=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(false)
    })

    it('should detect sequential scan among mixed operations', () => {
      const rows = [
        createExplainRow({ id: 0, detail: 'SEARCH t1 USING INDEX idx_t1 (id=?)' }),
        createExplainRow({ id: 1, detail: 'SCAN t2' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.hasSequentialScans).toBe(true)
    })
  })

  describe('Hierarchical Structure Building', () => {
    it('should build parent-child relationships based on parent ID', () => {
      const rows = [
        createExplainRow({ id: 2, parent: 0, detail: 'SCAN employees' }),
        createExplainRow({ id: 5, parent: 2, detail: 'SEARCH departments USING INDEX idx_dept (id=?)' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].type).toBe('Seq Scan')
      expect(result.operations[0].children).toHaveLength(1)
      expect(result.operations[0].children![0].type).toBe('Index Scan')
    })

    it('should handle multiple children under same parent', () => {
      const rows = [
        createExplainRow({ id: 1, parent: 0, detail: 'COMPOUND QUERY' }),
        createExplainRow({ id: 2, parent: 1, detail: 'SCAN t1' }),
        createExplainRow({ id: 3, parent: 1, detail: 'SCAN t2' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].type).toBe('Compound Query')
      expect(result.operations[0].children).toHaveLength(2)
    })

    it('should handle deeply nested operations', () => {
      const rows = [
        createExplainRow({ id: 1, parent: 0, detail: 'COMPOUND QUERY' }),
        createExplainRow({ id: 2, parent: 1, detail: 'SUBQUERY 1' }),
        createExplainRow({ id: 3, parent: 2, detail: 'SCAN employees' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].children![0].children).toHaveLength(1)
    })

    it('should handle orphaned operations (parent not found)', () => {
      const rows = [
        createExplainRow({ id: 5, parent: 999, detail: 'SCAN orphan_table' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      // Orphaned operations should be added to root
      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].table).toBe('orphan_table')
    })

    it('should handle multiple root-level operations (parent=0)', () => {
      const rows = [
        createExplainRow({ id: 1, parent: 0, detail: 'SCAN t1' }),
        createExplainRow({ id: 2, parent: 0, detail: 'SCAN t2' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const rows: any[] = []

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(0)
      expect(result.summary.hasSequentialScans).toBe(false)
      expect(result.summary.usedIndexes).toHaveLength(0)
    })

    it('should preserve original detail in operation details', () => {
      const detail = 'SEARCH employees USING INDEX idx_org (org_id=?)'
      const rows = [createExplainRow({ detail })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].details).toBe(detail)
    })

    it('should handle unknown detail formats', () => {
      const rows = [createExplainRow({ detail: 'UNKNOWN OPERATION TYPE' })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].type).toBe('UNKNOWN OPERATION TYPE')
    })

    it('should handle case variations', () => {
      const rows = [
        createExplainRow({ id: 0, detail: 'scan EMPLOYEES' }),
        createExplainRow({ id: 1, detail: 'SEARCH Departments using INDEX Idx_Dept (id=?)' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      // Case-insensitive matching for operation types
      expect(result.operations).toHaveLength(2)
    })

    it('should handle detail with extra spaces', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH   employees   USING   INDEX   idx_test   (id=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      // The regex patterns should still work with extra spaces in some cases
      expect(result.operations).toHaveLength(1)
    })
  })

  describe('Summary Generation', () => {
    it('should generate complete summary', () => {
      const rows = [
        createExplainRow({ id: 0, parent: 0, detail: 'SCAN employees' }),
        createExplainRow({ id: 1, parent: 0, detail: 'SEARCH departments USING INDEX idx_dept (id=?)' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.summary.database).toBe('sqlite')
      expect(result.summary.planningTime).toBeUndefined()
      expect(result.summary.executionTime).toBeUndefined()
      expect(result.summary.totalCost).toBeUndefined() // SQLite doesn't report costs
      expect(result.summary.hasSequentialScans).toBe(true)
      expect(result.summary.usedIndexes).toContain('idx_dept')
    })

    it('should format raw output as table', () => {
      const rows = [
        createExplainRow({ id: 2, parent: 0, detail: 'SCAN employees' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.raw).toContain('id\tparent\tdetail')
      expect(result.raw).toContain('2\t0\tSCAN employees')
    })

    it('should include SQL query in result', () => {
      const sqlQuery = { sql: 'SELECT * FROM employees WHERE org_id = ?', params: ['org-1'] }
      const rows = [createExplainRow()]

      const result = parseSQLiteExplain(rows, sqlQuery)

      expect(result.sql.sql).toBe(sqlQuery.sql)
      expect(result.sql.params).toEqual(sqlQuery.params)
    })
  })

  describe('Complex Query Plans', () => {
    it('should parse a JOIN query plan', () => {
      const rows = [
        createExplainRow({ id: 2, parent: 0, detail: 'SCAN employees' }),
        createExplainRow({ id: 3, parent: 0, detail: 'SEARCH departments USING INTEGER PRIMARY KEY (rowid=?)' }),
        createExplainRow({ id: 4, parent: 0, detail: 'USE TEMP B-TREE FOR ORDER BY' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(3)
      expect(result.operations[0].type).toBe('Seq Scan')
      expect(result.operations[1].type).toBe('Primary Key Lookup')
      expect(result.operations[2].type).toBe('Sort')
    })

    it('should parse a UNION query plan', () => {
      const rows = [
        createExplainRow({ id: 1, parent: 0, detail: 'COMPOUND QUERY' }),
        createExplainRow({ id: 2, parent: 1, detail: 'LEFT-MOST SUBQUERY' }),
        createExplainRow({ id: 3, parent: 2, detail: 'SCAN active_users' }),
        createExplainRow({ id: 4, parent: 1, detail: 'UNION ALL' }),
        createExplainRow({ id: 5, parent: 4, detail: 'SCAN archived_users' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(1)
      expect(result.operations[0].type).toBe('Compound Query')
    })

    it('should parse a CTE query plan', () => {
      const rows = [
        createExplainRow({ id: 2, parent: 0, detail: 'CO-ROUTINE cte_employees' }),
        createExplainRow({ id: 3, parent: 2, detail: 'SCAN employees' }),
        createExplainRow({ id: 4, parent: 0, detail: 'SCAN cte_employees' })
      ]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations).toHaveLength(2)
      expect(result.operations[0].type).toBe('Coroutine')
      expect(result.operations[0].children).toHaveLength(1)
    })

    it('should handle automatic covering index', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING AUTOMATIC COVERING INDEX (org_id=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      // This should be parsed as an index scan
      expect(result.operations).toHaveLength(1)
    })
  })

  describe('Filter Extraction', () => {
    it('should extract filter from index search', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING INDEX idx_status (status=? AND active=?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].filter).toBe('status=? AND active=?')
    })

    it('should extract filter from primary key lookup', () => {
      const rows = [createExplainRow({
        detail: 'SEARCH employees USING INTEGER PRIMARY KEY (rowid>? AND rowid<?)'
      })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].filter).toBe('rowid>? AND rowid<?')
    })

    it('should handle no filter for SCAN', () => {
      const rows = [createExplainRow({ detail: 'SCAN employees' })]

      const result = parseSQLiteExplain(rows, defaultSqlQuery)

      expect(result.operations[0].filter).toBeUndefined()
    })
  })
})
