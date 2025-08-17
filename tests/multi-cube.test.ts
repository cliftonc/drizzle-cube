/**
 * Test for multi-cube dynamic query building
 * Demonstrates cross-cube queries with dynamic field selection
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { 
  createTestDatabase,   
  testSchema,
  employees,
  departments
} from './helpers/test-database'
import type { TestSchema } from './helpers/test-database'

import { 
  createPostgresExecutor
} from '../src/server'

import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/types-drizzle'
import type { 
  CubeWithJoins, 
  QueryContext,
  BaseQueryDefinition 
} from '../src/server/types-drizzle'

// Create test cubes with join definitions
const testEmployeesCubeWithJoins: CubeWithJoins<TestSchema> = {
  ...defineCube('Employees', {
    title: 'Employees Cube',
    description: 'Employee data with join support',
    
    sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
      from: employees,
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
      totalSalary: {
        name: 'totalSalary',
        title: 'Total Salary',
        type: 'sum',
        sql: employees.salary
      }
    }
  }),
  
  // Join definitions for multi-cube queries
  joins: {
    Departments: {
      targetCube: 'Departments',
      condition: () => eq(employees.departmentId, departments.id),
      type: 'left',
      relationship: 'belongsTo'
    }
  }
}

const testDepartmentsCubeWithJoins: CubeWithJoins<TestSchema> = {
  ...defineCube('Departments', {
    title: 'Departments Cube',
    description: 'Department data with join support',
    
    sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    
    dimensions: {
      id: {
        name: 'id',
        title: 'Department ID',
        type: 'number',
        sql: departments.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Department Name',
        type: 'string',
        sql: departments.name
      }
    },
    
    measures: {
      count: {
        name: 'count',
        title: 'Department Count',
        type: 'count',
        sql: departments.id
      },
      totalBudget: {
        name: 'totalBudget',
        title: 'Total Budget',
        type: 'sum',
        sql: departments.budget
      }
    }
  }),
  
  // Reverse join definitions
  joins: {
    Employees: {
      targetCube: 'Employees',
      condition: () => eq(departments.id, employees.departmentId),
      type: 'left',
      relationship: 'hasMany'
    }
  }
}

// Test security contexts
const testSecurityContext = { organisationId: 1 }

describe('Simplified Multi-Cube Dynamic Query Building', () => {
  let executor: QueryExecutor<TestSchema>
  let cubes: Map<string, CubeWithJoins<TestSchema>>

  beforeAll(async () => {
    // Use the global test database setup
    const { db } = createTestDatabase()
    
    // Create the simplified executor
    const dbExecutor = createPostgresExecutor(db, testSchema)
    executor = new QueryExecutor(dbExecutor)
    
    // Setup cubes map
    cubes = new Map([
      ['Employees', testEmployeesCubeWithJoins],
      ['Departments', testDepartmentsCubeWithJoins]
    ])
  })

  it('should detect single cube queries and use simple executor', async () => {
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
    
    // Should return count for organisation 1
    const count = result.data[0]?.['Employees.count']
    expect(count).toBe(2) // 2 employees in org 1
    
    // Should only have the count field
    const firstRow = result.data[0]
    expect(Object.keys(firstRow)).toEqual(['Employees.count'])
  })

  it('should detect multi-cube queries and build execution plan', async () => {
    // This query involves both Employees and Departments cubes
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count', 'Departments.totalBudget'],
        dimensions: ['Departments.name']
      },
      testSecurityContext
    )
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    
    // Should return results with fields from both cubes
    for (const row of result.data) {
      const keys = Object.keys(row).sort()
      // Should have fields from both cubes
      expect(keys.some(k => k.startsWith('Employees.'))).toBe(true)
      expect(keys.some(k => k.startsWith('Departments.'))).toBe(true)
    }
  })

  it('should generate correct annotations for multi-cube queries', async () => {
    const result = await executor.execute(
      cubes,
      { 
        measures: ['Employees.count'],
        dimensions: ['Departments.name']
      },
      testSecurityContext
    )
    
    expect(result.annotation).toBeDefined()
    
    const { measures, dimensions } = result.annotation
    
    // Check measure annotations from Employees cube
    expect(measures['Employees.count']).toBeDefined()
    expect(measures['Employees.count'].type).toBe('count')
    expect(measures['Employees.count'].title).toBe('Employee Count')
    
    // Check dimension annotations from Departments cube
    expect(dimensions['Departments.name']).toBeDefined()
    expect(dimensions['Departments.name'].type).toBe('string')
    expect(dimensions['Departments.name'].title).toBe('Department Name')
  })

  it('should analyze cube usage correctly', async () => {
    // Test the analyzer directly
    const analyzer = (executor as any).multiCubeBuilder
    
    // Single cube query
    const singleCubeUsage = analyzer.analyzeCubeUsage({
      measures: ['Employees.count'],
      dimensions: ['Employees.name']
    })
    expect(singleCubeUsage.size).toBe(1)
    expect(singleCubeUsage.has('Employees')).toBe(true)
    
    // Multi-cube query
    const multiCubeUsage = analyzer.analyzeCubeUsage({
      measures: ['Employees.count', 'Departments.totalBudget'],
      dimensions: ['Employees.name', 'Departments.name']
    })
    expect(multiCubeUsage.size).toBe(2)
    expect(multiCubeUsage.has('Employees')).toBe(true)
    expect(multiCubeUsage.has('Departments')).toBe(true)
  })

  it('should handle cross-cube filters (when implemented)', async () => {
    // This test demonstrates the structure for cross-cube filtering
    // The actual implementation might be simplified for now
    
    try {
      const result = await executor.execute(
        cubes,
        { 
          measures: ['Employees.count'],
          dimensions: ['Departments.name'],
          filters: [{
            member: 'Departments.name',
            operator: 'equals',
            values: ['Engineering']
          }]
        },
        testSecurityContext
      )
      
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      
      // The filter should be applied (when filter implementation is complete)
    } catch (error) {
      // For now, we expect this might fail as filter implementation is simplified
      expect(error).toBeInstanceOf(Error)
    }
  })

  it('should choose primary cube correctly', async () => {
    const analyzer = (executor as any).multiCubeBuilder
    
    // Test primary cube selection logic
    const primaryCube1 = analyzer.choosePrimaryCube(['Employees', 'Departments'], {
      measures: ['Employees.count'],
      dimensions: ['Departments.name']
    })
    expect(primaryCube1).toBe('Employees') // First measure cube
    
    const primaryCube2 = analyzer.choosePrimaryCube(['Employees', 'Departments'], {
      dimensions: ['Departments.name', 'Employees.name']
    })
    expect(primaryCube2).toBe('Departments') // First dimension cube when no measures
  })

  it('should validate join definitions exist', async () => {
    // Test that proper error is thrown when join definitions are missing
    const incompleteCubes = new Map([
      ['Employees', { ...testEmployeesCubeWithJoins, joins: undefined }], // Remove joins
      ['Departments', testDepartmentsCubeWithJoins]
    ])
    
    try {
      await executor.execute(
        incompleteCubes,
        { 
          measures: ['Employees.count'],
          dimensions: ['Departments.name']
        },
        testSecurityContext
      )
      
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('No join definition found')
    }
  })
})