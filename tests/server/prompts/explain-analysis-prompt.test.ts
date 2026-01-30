/**
 * Tests for explain-analysis-prompt.ts
 *
 * These tests verify the EXPLAIN plan analysis prompt generation,
 * cube schema formatting, and index formatting functions.
 */

import { describe, it, expect } from 'vitest'
import {
  buildExplainAnalysisPrompt,
  formatCubeSchemaForExplain,
  formatExistingIndexes,
  EXPLAIN_ANALYSIS_PROMPT
} from '../../../src/server/prompts/explain-analysis-prompt.js'
import type { CubeMetadata } from '../../../src/server/types/metadata.js'

describe('EXPLAIN_ANALYSIS_PROMPT constant', () => {
  it('should contain all required placeholders', () => {
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{DATABASE_TYPE}')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{CUBE_SCHEMA}')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{SEMANTIC_QUERY}')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{SQL_QUERY}')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{NORMALIZED_PLAN}')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{RAW_EXPLAIN}')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('{EXISTING_INDEXES}')
  })

  it('should contain security context guidance', () => {
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('securityContext')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('organisationId')
  })

  it('should contain cube definition syntax examples', () => {
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('defineCube')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('measures')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('dimensions')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('joins')
  })

  it('should contain index syntax examples for all database types', () => {
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('PostgreSQL: CREATE INDEX')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('MySQL: CREATE INDEX')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('SQLite: CREATE INDEX')
  })

  it('should specify JSON response format', () => {
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('"summary"')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('"assessment"')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('"recommendations"')
    expect(EXPLAIN_ANALYSIS_PROMPT).toContain('"issues"')
  })
})

describe('buildExplainAnalysisPrompt', () => {
  const validParams = {
    databaseType: 'postgres' as const,
    cubeSchema: '{"cubes": {"Employees": {}}}',
    semanticQuery: '{"measures": ["Employees.count"]}',
    sqlQuery: 'SELECT COUNT(*) FROM employees',
    normalizedPlan: '[{"type": "Seq Scan", "table": "employees"}]',
    rawExplain: 'Seq Scan on employees (cost=0.00..10.00 rows=100)'
  }

  it('should replace DATABASE_TYPE placeholder', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain('DATABASE TYPE: postgres')
    expect(prompt).not.toContain('{DATABASE_TYPE}')
  })

  it('should replace all DATABASE_TYPE occurrences including syntax examples', () => {
    const prompt = buildExplainAnalysisPrompt(
      'mysql',
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    // Should replace all occurrences (replaceAll is used for DATABASE_TYPE)
    expect(prompt).not.toContain('{DATABASE_TYPE}')
    expect(prompt).toContain('mysql-specific syntax')
  })

  it('should replace CUBE_SCHEMA placeholder', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain(validParams.cubeSchema)
    expect(prompt).not.toContain('{CUBE_SCHEMA}')
  })

  it('should replace SEMANTIC_QUERY placeholder', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain(validParams.semanticQuery)
    expect(prompt).not.toContain('{SEMANTIC_QUERY}')
  })

  it('should replace SQL_QUERY placeholder', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain(validParams.sqlQuery)
    expect(prompt).not.toContain('{SQL_QUERY}')
  })

  it('should replace NORMALIZED_PLAN placeholder', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain(validParams.normalizedPlan)
    expect(prompt).not.toContain('{NORMALIZED_PLAN}')
  })

  it('should replace RAW_EXPLAIN placeholder', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain(validParams.rawExplain)
    expect(prompt).not.toContain('{RAW_EXPLAIN}')
  })

  it('should use default message when existingIndexes is not provided', () => {
    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain('No index information available')
    expect(prompt).not.toContain('{EXISTING_INDEXES}')
  })

  it('should replace EXISTING_INDEXES with provided value', () => {
    const existingIndexes = 'Table: employees\n  - idx_org: (organisation_id)'

    const prompt = buildExplainAnalysisPrompt(
      validParams.databaseType,
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain,
      existingIndexes
    )

    expect(prompt).toContain(existingIndexes)
    expect(prompt).not.toContain('{EXISTING_INDEXES}')
    expect(prompt).not.toContain('No index information available')
  })

  it('should handle sqlite database type', () => {
    const prompt = buildExplainAnalysisPrompt(
      'sqlite',
      validParams.cubeSchema,
      validParams.semanticQuery,
      validParams.sqlQuery,
      validParams.normalizedPlan,
      validParams.rawExplain
    )

    expect(prompt).toContain('DATABASE TYPE: sqlite')
  })
})

describe('formatCubeSchemaForExplain', () => {
  it('should format empty metadata array', () => {
    const result = formatCubeSchemaForExplain([])
    const parsed = JSON.parse(result)

    expect(parsed).toEqual({ cubes: {} })
  })

  it('should format single cube with measures and dimensions', () => {
    const metadata: CubeMetadata[] = [
      {
        name: 'Employees',
        title: 'Employees Cube',
        description: 'Employee data',
        measures: [
          { name: 'count', title: 'Count', shortTitle: 'Count', type: 'count' },
          { name: 'avgSalary', title: 'Average Salary', shortTitle: 'Avg Salary', type: 'avg' }
        ],
        dimensions: [
          { name: 'name', title: 'Name', shortTitle: 'Name', type: 'string' },
          { name: 'departmentId', title: 'Department ID', shortTitle: 'Dept ID', type: 'number' }
        ],
        segments: []
      }
    ]

    const result = formatCubeSchemaForExplain(metadata)
    const parsed = JSON.parse(result)

    expect(parsed.cubes.Employees).toBeDefined()
    expect(parsed.cubes.Employees.title).toBe('Employees Cube')
    expect(parsed.cubes.Employees.description).toBe('Employee data')
    expect(parsed.cubes.Employees.measures.count).toEqual({ type: 'count', title: 'Count' })
    expect(parsed.cubes.Employees.measures.avgSalary).toEqual({ type: 'avg', title: 'Average Salary' })
    expect(parsed.cubes.Employees.dimensions.name).toEqual({ type: 'string', title: 'Name' })
  })

  it('should separate time dimensions from regular dimensions', () => {
    const metadata: CubeMetadata[] = [
      {
        name: 'Events',
        title: 'Events',
        measures: [
          { name: 'count', title: 'Count', shortTitle: 'Count', type: 'count' }
        ],
        dimensions: [
          { name: 'eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
          { name: 'createdAt', title: 'Created At', shortTitle: 'Created', type: 'time' },
          { name: 'updatedAt', title: 'Updated At', shortTitle: 'Updated', type: 'time' }
        ],
        segments: []
      }
    ]

    const result = formatCubeSchemaForExplain(metadata)
    const parsed = JSON.parse(result)

    // Regular dimensions should not include time dimensions
    expect(parsed.cubes.Events.dimensions.eventType).toBeDefined()
    expect(parsed.cubes.Events.dimensions.createdAt).toBeUndefined()
    expect(parsed.cubes.Events.dimensions.updatedAt).toBeUndefined()

    // Time dimensions should be in separate section
    expect(parsed.cubes.Events.timeDimensions).toBeDefined()
    expect(parsed.cubes.Events.timeDimensions.createdAt).toEqual({ type: 'time', title: 'Created At' })
    expect(parsed.cubes.Events.timeDimensions.updatedAt).toEqual({ type: 'time', title: 'Updated At' })
  })

  it('should include relationships when present', () => {
    const metadata: CubeMetadata[] = [
      {
        name: 'Employees',
        title: 'Employees',
        measures: [],
        dimensions: [],
        segments: [],
        relationships: [
          {
            targetCube: 'Departments',
            relationship: 'belongsTo',
            joinFields: [{ sourceField: 'departmentId', targetField: 'id' }]
          }
        ]
      }
    ]

    const result = formatCubeSchemaForExplain(metadata)
    const parsed = JSON.parse(result)

    expect(parsed.cubes.Employees.relationships).toHaveLength(1)
    expect(parsed.cubes.Employees.relationships[0]).toEqual({
      target: 'Departments',
      type: 'belongsTo',
      joinFields: [{ sourceField: 'departmentId', targetField: 'id' }]
    })
  })

  it('should handle cubes without relationships', () => {
    const metadata: CubeMetadata[] = [
      {
        name: 'StandaloneCube',
        title: 'Standalone',
        measures: [],
        dimensions: [],
        segments: []
      }
    ]

    const result = formatCubeSchemaForExplain(metadata)
    const parsed = JSON.parse(result)

    expect(parsed.cubes.StandaloneCube.relationships).toEqual([])
  })

  it('should format multiple cubes', () => {
    const metadata: CubeMetadata[] = [
      {
        name: 'Employees',
        title: 'Employees',
        measures: [{ name: 'count', title: 'Count', shortTitle: 'Count', type: 'count' }],
        dimensions: [],
        segments: []
      },
      {
        name: 'Departments',
        title: 'Departments',
        measures: [{ name: 'count', title: 'Count', shortTitle: 'Count', type: 'count' }],
        dimensions: [],
        segments: []
      }
    ]

    const result = formatCubeSchemaForExplain(metadata)
    const parsed = JSON.parse(result)

    expect(Object.keys(parsed.cubes)).toHaveLength(2)
    expect(parsed.cubes.Employees).toBeDefined()
    expect(parsed.cubes.Departments).toBeDefined()
  })

  it('should not add timeDimensions section when there are no time dimensions', () => {
    const metadata: CubeMetadata[] = [
      {
        name: 'Products',
        title: 'Products',
        measures: [],
        dimensions: [
          { name: 'name', title: 'Name', shortTitle: 'Name', type: 'string' },
          { name: 'price', title: 'Price', shortTitle: 'Price', type: 'number' }
        ],
        segments: []
      }
    ]

    const result = formatCubeSchemaForExplain(metadata)
    const parsed = JSON.parse(result)

    expect(parsed.cubes.Products.timeDimensions).toBeUndefined()
  })
})

describe('formatExistingIndexes', () => {
  it('should return message for empty array', () => {
    const result = formatExistingIndexes([])
    expect(result).toBe('No indexes found on the queried tables.')
  })

  it('should return message for null/undefined input', () => {
    const result = formatExistingIndexes(null as any)
    expect(result).toBe('No indexes found on the queried tables.')
  })

  it('should format single table with single index', () => {
    const indexes = [
      {
        table_name: 'employees',
        index_name: 'idx_org',
        columns: ['organisation_id']
      }
    ]

    const result = formatExistingIndexes(indexes)

    expect(result).toContain('Table: employees')
    expect(result).toContain('idx_org: (organisation_id)')
  })

  it('should format composite indexes correctly', () => {
    const indexes = [
      {
        table_name: 'employees',
        index_name: 'idx_org_dept',
        columns: ['organisation_id', 'department_id']
      }
    ]

    const result = formatExistingIndexes(indexes)

    expect(result).toContain('idx_org_dept: (organisation_id, department_id)')
  })

  it('should mark primary key indexes', () => {
    const indexes = [
      {
        table_name: 'employees',
        index_name: 'employees_pkey',
        columns: ['id'],
        is_primary: true
      }
    ]

    const result = formatExistingIndexes(indexes)

    expect(result).toContain('[PRIMARY KEY]')
  })

  it('should mark unique indexes', () => {
    const indexes = [
      {
        table_name: 'employees',
        index_name: 'idx_email_unique',
        columns: ['email'],
        is_unique: true
      }
    ]

    const result = formatExistingIndexes(indexes)

    expect(result).toContain('[UNIQUE]')
  })

  it('should not mark primary key as UNIQUE', () => {
    const indexes = [
      {
        table_name: 'employees',
        index_name: 'employees_pkey',
        columns: ['id'],
        is_primary: true,
        is_unique: true // Primary keys are inherently unique
      }
    ]

    const result = formatExistingIndexes(indexes)

    // Should only show PRIMARY KEY, not both
    expect(result).toContain('[PRIMARY KEY]')
    expect(result).not.toContain('[PRIMARY KEY, UNIQUE]')
  })

  it('should group indexes by table', () => {
    const indexes = [
      { table_name: 'employees', index_name: 'idx_emp_1', columns: ['id'] },
      { table_name: 'departments', index_name: 'idx_dept_1', columns: ['id'] },
      { table_name: 'employees', index_name: 'idx_emp_2', columns: ['name'] }
    ]

    const result = formatExistingIndexes(indexes)

    // Check that tables are grouped
    const employeeSection = result.indexOf('Table: employees')
    const departmentSection = result.indexOf('Table: departments')

    expect(employeeSection).toBeGreaterThanOrEqual(0)
    expect(departmentSection).toBeGreaterThanOrEqual(0)

    // Both employee indexes should be listed under employees section
    expect(result).toContain('idx_emp_1')
    expect(result).toContain('idx_emp_2')
    expect(result).toContain('idx_dept_1')
  })

  it('should handle indexes without flags', () => {
    const indexes = [
      {
        table_name: 'employees',
        index_name: 'idx_regular',
        columns: ['status']
      }
    ]

    const result = formatExistingIndexes(indexes)

    expect(result).toContain('idx_regular: (status)')
    expect(result).not.toContain('[')
  })

  it('should format multiple tables with multiple indexes', () => {
    const indexes = [
      { table_name: 'employees', index_name: 'emp_pkey', columns: ['id'], is_primary: true },
      { table_name: 'employees', index_name: 'idx_emp_org', columns: ['organisation_id'] },
      { table_name: 'departments', index_name: 'dept_pkey', columns: ['id'], is_primary: true },
      { table_name: 'departments', index_name: 'idx_dept_name', columns: ['name'], is_unique: true }
    ]

    const result = formatExistingIndexes(indexes)

    expect(result).toContain('Table: employees')
    expect(result).toContain('Table: departments')
    expect(result).toContain('emp_pkey')
    expect(result).toContain('idx_emp_org')
    expect(result).toContain('dept_pkey')
    expect(result).toContain('idx_dept_name')
  })
})
