/**
 * Table Prefix Security Test
 * 
 * This test verifies that table names are properly prefixed in WHERE clauses,
 * particularly for security context filtering. Without proper table prefixes,
 * queries can become ambiguous in complex scenarios and potentially fail.
 * 
 * Issue: WHERE clauses were generating:
 *   WHERE ( "organisation_id" = $1 )
 * Instead of:
 *   WHERE ( "employees"."organisation_id" = $1 )
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { TestExecutor, TestQueryBuilder } from './helpers/test-utilities'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { QueryExecutor } from '../src/server/executor'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Table Prefix Security', () => {
  let testExecutor: TestExecutor
  let executor: QueryExecutor
  let cubes: Map<string, any>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  test('should include table prefixes in WHERE clauses for security filtering', async () => {
    // Simple query that should trigger security filtering
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .build()
    
    // Get the employees cube
    const employeesCube = cubes.get('Employees')
    expect(employeesCube).toBeDefined()
    
    // Generate SQL without executing to inspect the query structure
    const sqlResult = await executor.generateSQL(
      employeesCube!,
      query,
      testSecurityContexts.org1
    )
    
    console.log('Generated SQL:', sqlResult.sql)
    console.log('Parameters:', sqlResult.params)
    
    // The SQL should include table prefixes in WHERE clauses
    // Look for patterns like "employees"."organisation_id" rather than just "organisation_id"
    const hasTablePrefix = (
      sqlResult.sql.includes('"employees"."organisation_id"') ||
      sqlResult.sql.includes('employees.organisation_id') ||
      sqlResult.sql.includes('`employees`.`organisation_id`') || // MySQL style
      // Check for any table prefix pattern (more flexible regex)
      /["`]?employees["`]?\.["`]?organisation_id["`]?/.test(sqlResult.sql)
    )
    
    if (!hasTablePrefix) {
      console.warn('❌ Missing table prefix in WHERE clause:')
      console.warn('Generated SQL:', sqlResult.sql)
      console.warn('Expected patterns like: "employees"."organisation_id" or employees.organisation_id')
    }
    
    expect(hasTablePrefix).toBe(true)
    
    // Verify the security context parameter is properly bound
    expect(sqlResult.params).toContain(testSecurityContexts.org1.organisationId)
  })
  
  test('should include table prefixes in multi-cube queries', async () => {
    // Multi-cube query that requires proper table prefixing
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .dimensions(['Departments.name'])
      .build()
    
    const sqlResult = await executor.generateMultiCubeSQL(
      cubes,
      query,
      testSecurityContexts.org1
    )
    
    console.log('Multi-cube SQL:', sqlResult.sql)
    console.log('Parameters:', sqlResult.params)
    
    // Both tables should have properly prefixed security filters
    const hasEmployeesPrefix = (
      sqlResult.sql.includes('"employees"."organisation_id"') ||
      sqlResult.sql.includes('employees.organisation_id') ||
      sqlResult.sql.includes('`employees`.`organisation_id`') || // MySQL style
      /["`]?employees["`]?\.["`]?organisation_id["`]?/.test(sqlResult.sql)
    )
    
    const hasDepartmentsPrefix = (
      sqlResult.sql.includes('"departments"."organisation_id"') ||
      sqlResult.sql.includes('departments.organisation_id') ||
      sqlResult.sql.includes('`departments`.`organisation_id`') || // MySQL style
      /["`]?departments["`]?\.["`]?organisation_id["`]?/.test(sqlResult.sql)
    )
    
    if (!hasEmployeesPrefix) {
      console.warn('❌ Missing employees table prefix in WHERE clause')
    }
    if (!hasDepartmentsPrefix) {
      console.warn('❌ Missing departments table prefix in WHERE clause')
    }
    
    expect(hasEmployeesPrefix).toBe(true)
    expect(hasDepartmentsPrefix).toBe(true)
    
    // Verify security context parameters are properly bound
    expect(sqlResult.params).toContain(testSecurityContexts.org1.organisationId)
  })
  
  test('should maintain table prefixes with additional filters', async () => {
    // Get the employees cube
    const employeesCube = cubes.get('Employees')
    expect(employeesCube).toBeDefined()
    
    // Query with additional filters that might interfere with table prefixing
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .dimensions(['Employees.name'])
      .filters([
        { member: 'Employees.isActive', operator: 'equals', values: [true] }
      ])
      .build()
    
    const sqlResult = await executor.generateSQL(
      employeesCube!,
      query,
      testSecurityContexts.org1
    )
    
    console.log('Filtered query SQL:', sqlResult.sql)
    
    // Security filtering should still have proper table prefixes
    const hasSecurityPrefix = (
      sqlResult.sql.includes('"employees"."organisation_id"') ||
      sqlResult.sql.includes('employees.organisation_id') ||
      sqlResult.sql.includes('`employees`.`organisation_id`') || // MySQL style
      /["`]?employees["`]?\.["`]?organisation_id["`]?/.test(sqlResult.sql)
    )
    
    // Additional filters should also have proper table prefixes
    const hasFilterPrefix = (
      sqlResult.sql.includes('"employees"."active"') ||
      sqlResult.sql.includes('employees.active') ||
      sqlResult.sql.includes('`employees`.`active`') || // MySQL style
      /["`]?employees["`]?\.["`]?active["`]?/.test(sqlResult.sql)
    )
    
    expect(hasSecurityPrefix).toBe(true)
    expect(hasFilterPrefix).toBe(true)
  })
})