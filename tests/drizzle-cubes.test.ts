/**
 * Test for simplified Drizzle-based dynamic query building
 * This demonstrates the new approach of starting with a minimal base query
 * and dynamically adding only requested fields
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import type { TestSchema } from './helpers/databases/types'

import type { 
  DatabaseExecutor
} from '../src/server'

import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/types-drizzle'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition 
} from '../src/server/types-drizzle'

// We'll dynamically get the schema and create the cube after database setup
let testEmployeesCube: Cube<TestSchema>
let employees: any
let departments: any

const createCubeDefinition = (schema: any) => {
  employees = schema.employees
  departments = schema.departments
  
  return defineCube('Employees', {
    title: 'Employees Cube',
    description: 'Test cube using dynamic query building',
    
    // This returns just the base query setup, NOT a complete SELECT
    sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
      from: employees,
      joins: [
        {
          table: departments,
          on: and(
            eq(employees.departmentId, departments.id),
            eq(departments.organisationId, ctx.securityContext.organisationId)
          ),
          type: 'left'
        }
      ],
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),

    dimensions: {
      id: {
        name: 'id',
        title: 'Employee ID',
        type: 'number',
        sql: employees.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Employee Name',
        type: 'string',
        sql: employees.name
      },
      email: {
        name: 'email',
        title: 'Email Address',
        type: 'string',
        sql: employees.email
      },
      departmentId: {
        name: 'departmentId',
        title: 'Department',
        type: 'string',
        sql: departments.name
      },
      active: {
        name: 'active',
        title: 'Active Status',
        type: 'boolean',
        sql: employees.active
      }
    },
    
    measures: {
      count: {
        name: 'count',
        title: 'Employee Count',
        type: 'count',
        sql: employees.id
      },
      activeCount: {
        name: 'activeCount',
        title: 'Active Employees',
        type: 'count',
        sql: employees.id,
        filters: [
          (ctx) => eq(employees.active, true)
        ]
      },
      totalSalary: {
        name: 'totalSalary',
        title: 'Total Salary',
        type: 'sum',
        sql: employees.salary
      },
      avgSalary: {
        name: 'avgSalary',
        title: 'Average Salary',
        type: 'avg',
        sql: employees.salary
      }
    }
  })
}

// Test security contexts
const testSecurityContext = { organisationId: 1 }
const altSecurityContext = { organisationId: 2 }

describe('Simplified Drizzle Dynamic Query Building', () => {
  let executor: QueryExecutor<TestSchema>
  let close: () => void

  beforeAll(async () => {
    // Use the new test database setup
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    // Get the schema from the executor to create the cube
    testEmployeesCube = createCubeDefinition(dbExecutor.schema)
    
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
  })
  
  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('should execute basic count query with minimal selection', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    
    // Should return total count for organisation 1
    const count = result.data[0]?.['Employees.count']
    expect(count).toBe(19) // 19 employees in org 1 (enhanced test data)
    
    // Should only have the count field, not all fields
    const firstRow = result.data[0]
    expect(Object.keys(firstRow)).toEqual(['Employees.count'])
  })

  it('should execute query with specific dimension only', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        dimensions: ['Employees.name']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    
    // Should return one row per employee
    expect(result.data.length).toBe(19) // 19 employees in org 1
    
    // Should only have the name field
    for (const row of result.data) {
      expect(Object.keys(row)).toEqual(['Employees.name'])
      expect(typeof row['Employees.name']).toBe('string')
    }
  })

  it('should execute query with measure and dimension (requires GROUP BY)', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentId']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    
    // Should return results grouped by department
    expect(result.data.length).toBeGreaterThan(0)
    
    // Should only have the requested fields
    for (const row of result.data) {
      const keys = Object.keys(row).sort()
      expect(keys).toEqual(['Employees.count', 'Employees.departmentId'])
      
      // LEFT JOIN can result in null department names (this is expected behavior)
      expect(row['Employees.departmentId'] === null || typeof row['Employees.departmentId'] === 'string').toBe(true)
      expect(typeof row['Employees.count']).toBe('number')
    }
  })

  it('should respect security context filtering', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    // Query with organisation 1 context
    const result1 = await executor.execute(
      cubes,
      { measures: ['Employees.count'] },
      testSecurityContext // organisationId: 1
    )
    
    // Query with organisation 2 context
    const result2 = await executor.execute(
      cubes,
      { measures: ['Employees.count'] },
      altSecurityContext // organisationId: 2
    )
    
    expect(result1.data).toBeDefined()
    expect(result2.data).toBeDefined()
    
    // Results should be different due to security filtering
    const org1Count = result1.data[0]?.['Employees.count']
    const org2Count = result2.data[0]?.['Employees.count']
    
    expect(org1Count).toBe(19) // 19 employees in org 1 (enhanced test data)
    expect(org2Count).toBe(3) // 3 employees in org 2 (enhanced test data)
  })

  it('should handle measure filters correctly', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.activeCount'] // Filtered measure
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    
    // Should return count of only active employees in org 1
    const activeCount = result.data[0]?.['Employees.activeCount']
    expect(activeCount).toBe(18) // 18 active employees in org 1 (Rachel Green is inactive)
  })

  it('should handle aggregation measures', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.totalSalary', 'Employees.avgSalary']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    
    const totalSalary = result.data[0]?.['Employees.totalSalary']
    const avgSalary = result.data[0]?.['Employees.avgSalary']
    
    expect(totalSalary).toBe(1600000) // Sum of all 19 employees in org 1
    expect(Math.round(avgSalary)).toBe(88889) // 1600000 / 18 = 88888.89 (excluding NULL salary)
    
    // Should only have the requested measures
    const firstRow = result.data[0]
    const keys = Object.keys(firstRow).sort()
    expect(keys).toEqual(['Employees.avgSalary', 'Employees.totalSalary'])
  })

  it('should handle query filters correctly', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        filters: [{
          member: 'Employees.name',
          operator: 'contains',
          values: ['John']
        }]
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(result.data.length).toBe(2) // Enhanced data may have multiple John entries due to joins
    expect(result.data.every(row => row['Employees.name'].includes('John'))).toBe(true)
  })

  it('should generate correct annotations', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      },
      testSecurityContext
    )
    
    expect(result.annotation).toBeDefined()
    
    const { measures, dimensions } = result.annotation
    
    // Check measure annotations
    expect(measures['Employees.count']).toBeDefined()
    expect(measures['Employees.count'].type).toBe('count')
    expect(measures['Employees.count'].title).toBe('Employee Count')
    
    // Check dimension annotations
    expect(dimensions['Employees.name']).toBeDefined()
    expect(dimensions['Employees.name'].type).toBe('string')
    expect(dimensions['Employees.name'].title).toBe('Employee Name')
  })

  it('should only select requested fields (not all cube fields)', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    
    // Verify that ONLY the requested fields are present
    for (const row of result.data) {
      const keys = Object.keys(row).sort()
      expect(keys).toEqual(['Employees.count', 'Employees.name'])
      
      // Should NOT have email, departmentId, active, etc.
      expect(row).not.toHaveProperty('Employees.email')
      expect(row).not.toHaveProperty('Employees.departmentId')
      expect(row).not.toHaveProperty('Employees.active')
      expect(row).not.toHaveProperty('Employees.id')
    }
  })

  it('should handle multiple aggregations with dimensions correctly', async () => {
    const cubes = new Map([['Employees', testEmployeesCube]])
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count', 'Employees.totalSalary'],
        dimensions: ['Employees.departmentId']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)
    
    // Should be grouped by department with aggregated values
    for (const row of result.data) {
      // Accept null values for department names (LEFT JOIN can result in nulls)
      expect(row['Employees.departmentId'] === null || typeof row['Employees.departmentId'] === 'string').toBe(true)
      expect(typeof row['Employees.count']).toBe('number')
      expect(row['Employees.totalSalary'] === null || typeof row['Employees.totalSalary'] === 'number').toBe(true)
      
      // Should only have these 3 fields
      const keys = Object.keys(row).sort()
      expect(keys).toEqual(['Employees.count', 'Employees.departmentId', 'Employees.totalSalary'])
    }
  })
})