import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import type { TestSchema } from './helpers/databases/types'
import { testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import { 
  TestQueryBuilder, 
  TestExecutor
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Measure Aggregation Filters', () => {
  let testExecutor: TestExecutor
  let executor: QueryExecutor
  let cubes: Map<string, any>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Productivity', 'Departments'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('should correctly reference CTE alias in HAVING clause for cross-cube measure filters', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Employees.totalSalary', 'Productivity.totalLinesOfCode'])
      .dimensions(['Employees.name'])
      .filters([
        {
          member: 'Productivity.totalLinesOfCode',
          operator: 'lt',
          values: [10000]
        }
      ])
      .order({ 'Employees.name': 'asc' })
      .build()

    // This should not throw an error about unknown column in HAVING clause
    const result = await testExecutor.executeQuery(query)
    
    // Verify the query structure is correct
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    
    // Test with various operators
    const operators = ['lt', 'lte', 'gt', 'gte', 'equals', 'notEquals'] as const
    
    for (const operator of operators) {
      const testQuery = TestQueryBuilder.create()
        .measures(['Employees.totalSalary', 'Productivity.totalLinesOfCode'])
        .dimensions(['Employees.name'])
        .filters([
          {
            member: 'Productivity.totalLinesOfCode',
            operator,
            values: [5000]
          }
        ])
        .build()

      // Should execute without SQL errors
      const testResult = await testExecutor.executeQuery(testQuery)
      expect(testResult).toBeDefined()
    }
  })

  it('should handle multiple cross-cube measure filters in HAVING clause', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Employees.totalSalary', 'Productivity.totalLinesOfCode', 'Productivity.avgLinesOfCode'])
      .dimensions(['Employees.name'])
      .filters([
        {
          member: 'Productivity.totalLinesOfCode',
          operator: 'gt',
          values: [1000]
        },
        {
          member: 'Employees.totalSalary',
          operator: 'lt',
          values: [100000]
        }
      ])
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
  })

  it('should handle measure filters with complex aggregations', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Employees.count', 'Productivity.totalLinesOfCode'])
      .dimensions(['Departments.name'])
      .filters([
        {
          member: 'Productivity.totalLinesOfCode',
          operator: 'between',
          values: [1000, 50000]
        }
      ])
      .build()

    const result = await testExecutor.executeQuery(query)
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
  })

  it('should reproduce the HAVING clause CTE reference bug', async () => {
    // This is the exact query that fails with the bug:
    // HAVING clause incorrectly references "productivity"."lines_of_code" 
    // instead of CTE alias "productivity_agg"."totalLinesOfCode"
    const query = {
      measures: [
        "Employees.totalSalary",
        "Productivity.avgLinesOfCode"
      ],
      dimensions: [
        "Employees.name"
      ],
      filters: [
        {
          member: "Productivity.totalLinesOfCode",
          operator: "gt",
          values: [50000]
        }
      ],
      order: {
        "Employees.name": "asc"
      }
    }

    // This should NOT throw a SQL error about unknown column in HAVING clause
    // The HAVING clause should reference the CTE alias, not the original table
    const result = await testExecutor.executeQuery(query)
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    
    // The query should execute successfully and return results
    expect(Array.isArray(result.data)).toBe(true)
  })
})