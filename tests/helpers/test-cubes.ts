/**
 * Shared cube definitions for comprehensive testing
 * These cubes are used across all test suites to ensure consistency
 */

import { eq, and, sql } from 'drizzle-orm'
import { defineCube } from '../../src/server/types-drizzle'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition 
} from '../../src/server/types-drizzle'
import { getTestSchema } from './test-database'

// Dynamic cube creation only - remove static imports
// All tests should use createTestCubesForCurrentDatabase() function

/**
 * DEPRECATED: Static cube definitions removed for database isolation
 * Use createTestCubesForCurrentDatabase() instead to get database-specific cubes
 * 
 * This ensures tests use the correct schema (PostgreSQL/MySQL/SQLite) tables
 */


/**
 * Compatibility layer - creates static-like cube map using dynamic cubes
 * This allows existing tests to work while we transition to fully dynamic approach
 */
export async function getTestCubes(cubeNames?: string[]): Promise<Map<string, Cube<any>>> {
  const { testEmployeesCube, testDepartmentsCube, testProductivityCube } = await createTestCubesForCurrentDatabase()
  
  const allCubes = new Map([
    ['Employees', testEmployeesCube],
    ['Departments', testDepartmentsCube], 
    ['Productivity', testProductivityCube]
  ])

  if (!cubeNames) {
    return allCubes
  }
  
  const filteredCubes = new Map<string, Cube<any>>()
  for (const name of cubeNames) {
    const cube = allCubes.get(name)
    if (cube) {
      filteredCubes.set(name, cube)
    }
  }
  return filteredCubes
}

/**
 * Create cubes dynamically for the current database type
 * This ensures that cubes use the correct schema tables (MySQL vs PostgreSQL vs SQLite)
 */
export async function createTestCubesForCurrentDatabase(): Promise<{
  testEmployeesCube: Cube<any>
  testDepartmentsCube: Cube<any> 
  testProductivityCube: Cube<any>
}> {
  const { employees, departments, productivity, schema, dbTrue, dbFalse, dbDate } = await getTestSchema()
  
  // Create employees cube with correct schema
  const testEmployeesCube = defineCube('Employees', {
    title: 'Employees Analytics',
    description: 'Comprehensive employee data with department information and all field types',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: employees,    
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      'Productivity': {
        targetCube: 'Productivity',
        relationship: 'hasMany',
        condition: (ctx) => and(
          eq(productivity.employeeId, employees.id),
          eq(productivity.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      },
      'Departments': {
        targetCube: 'Departments',
        relationship: 'belongsTo',
        condition: (ctx) => and(
          eq(employees.departmentId, departments.id),
          eq(departments.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      }
    },
    
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
        title: 'Department ID',
        type: 'number',
        sql: employees.departmentId
      },
      isActive: {
        name: 'isActive',
        title: 'Active Status',
        type: 'boolean',
        sql: employees.active
      },
      active: {
        name: 'active',
        title: 'Active',
        type: 'boolean',
        sql: employees.active
      },
      createdAt: {
        name: 'createdAt',
        title: 'Hire Date',
        type: 'time',
        sql: employees.createdAt
      },
      salary: {
        name: 'salary',
        title: 'Salary',
        type: 'number',
        sql: employees.salary
      }
    },
    
    measures: {
      count: {
        name: 'count',
        title: 'Total Employees',
        type: 'countDistinct',
        sql: employees.id
      },
      activeCount: {
        name: 'activeCount',
        title: 'Active Employees',
        type: 'countDistinct',
        sql: employees.id,
        filters: [
          (ctx) => eq(employees.active, dbTrue)
        ]
      },
      inactiveCount: {
        name: 'inactiveCount',
        title: 'Inactive Employees',
        type: 'countDistinct',
        sql: employees.id,
        filters: [
          (ctx) => eq(employees.active, dbFalse)
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
      },
      minSalary: {
        name: 'minSalary',
        title: 'Minimum Salary',
        type: 'min',
        sql: employees.salary
      },
      maxSalary: {
        name: 'maxSalary',
        title: 'Maximum Salary',
        type: 'max',
        sql: employees.salary
      },
      countDistinctDepartments: {
        name: 'countDistinctDepartments',
        title: 'Unique Departments',
        type: 'countDistinct',
        sql: employees.departmentId
      }
    }
  })

  // Create departments cube with correct schema  
  const testDepartmentsCube = defineCube('Departments', {
    title: 'Departments Analytics',
    description: 'Department information and metrics',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
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
        title: 'Name',
        type: 'string',
        sql: departments.name
      }
    },
    
    measures: {
      count: {
        name: 'count',
        title: 'Department Count',
        type: 'countDistinct',
        sql: departments.id
      },
      totalBudget: {
        name: 'totalBudget',
        title: 'Total Budget',
        type: 'sum',
        sql: departments.budget
      },
      avgBudget: {
        name: 'avgBudget',
        title: 'Average Budget',
        type: 'avg',
        sql: departments.budget
      },
      minBudget: {
        name: 'minBudget',
        title: 'Minimum Budget',
        type: 'min',
        sql: departments.budget
      },
      maxBudget: {
        name: 'maxBudget',
        title: 'Maximum Budget',
        type: 'max',
        sql: departments.budget
      }
    }
  })

  // Create productivity cube with correct schema
  const testProductivityCube = defineCube('Productivity', {
    title: 'Productivity Analytics',
    description: 'Daily productivity metrics including code output, deployments, and happiness tracking',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),

    // Cube-level joins for multi-cube queries
    joins: {
      'Employees': {
        targetCube: 'Employees',
        condition: (ctx) => eq(productivity.employeeId, employees.id),
        type: 'left',
        relationship: 'belongsTo'
      },
      'Departments': {
        targetCube: 'Departments',
        condition: (ctx) => and(
          eq(productivity.employeeId, employees.id),
          eq(employees.departmentId, departments.id)
        ),
        type: 'left',
        relationship: 'belongsTo'
      }
    },
    
    dimensions: {
      id: {
        name: 'id',
        title: 'Record ID',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      },
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: productivity.employeeId
      },
      date: {
        name: 'date',
        title: 'Date',
        type: 'time',
        sql: productivity.date
      },
      createdAt: {
        name: 'createdAt',
        title: 'Created At',
        type: 'time',
        sql: productivity.createdAt
      },
      isWorkDay: {
        name: 'isWorkDay',
        title: 'Work Day',
        type: 'boolean',
        sql: sql`NOT ${productivity.daysOff}`
      },
      isDayOff: {
        name: 'isDayOff',
        title: 'Day Off',
        type: 'boolean',
        sql: productivity.daysOff
      },
      happinessIndex: {
        name: 'happinessIndex',
        title: 'Happiness Index',
        type: 'number',
        sql: productivity.happinessIndex
      },
      happinessLevel: {
        name: 'happinessLevel',
        title: 'Happiness Level',
        type: 'string',
        sql: sql`CASE 
          WHEN ${productivity.happinessIndex} <= 3 THEN 'Low'
          WHEN ${productivity.happinessIndex} <= 6 THEN 'Medium'
          WHEN ${productivity.happinessIndex} <= 8 THEN 'High'
          ELSE 'Very High'
        END`
      },
      linesOfCode: {
        name: 'linesOfCode',
        title: 'Lines of Code',
        type: 'number',
        sql: productivity.linesOfCode
      },
      pullRequests: {
        name: 'pullRequests',
        title: 'Pull Requests',
        type: 'number',
        sql: productivity.pullRequests
      },
      deployments: {
        name: 'deployments',
        title: 'Deployments',
        type: 'number',
        sql: productivity.liveDeployments
      }
    },
    
    measures: {
      // Count measures
      recordCount: {
        name: 'recordCount',
        title: 'Total Records',
        type: 'count',
        sql: productivity.id
      },
      workingDaysCount: {
        name: 'workingDaysCount',
        title: 'Working Days',
        type: 'count',
        sql: productivity.id,
        filters: [
          (ctx) => eq(productivity.daysOff, dbFalse)
        ]
      },
      daysOffCount: {
        name: 'daysOffCount',
        title: 'Days Off',
        type: 'count',
        sql: productivity.id,
        filters: [
          (ctx) => eq(productivity.daysOff, dbTrue)
        ]
      },
      
      // Sum measures
      totalLinesOfCode: {
        name: 'totalLinesOfCode',
        title: 'Total Lines of Code',
        type: 'sum',
        sql: productivity.linesOfCode
      },
      totalPullRequests: {
        name: 'totalPullRequests',
        title: 'Total Pull Requests',
        type: 'sum',
        sql: productivity.pullRequests
      },
      totalDeployments: {
        name: 'totalDeployments',
        title: 'Total Deployments',
        type: 'sum',
        sql: productivity.liveDeployments
      },
      
      // Average measures
      avgLinesOfCode: {
        name: 'avgLinesOfCode',
        title: 'Average Lines of Code',
        type: 'avg',
        sql: productivity.linesOfCode
      },
      avgPullRequests: {
        name: 'avgPullRequests',
        title: 'Average Pull Requests',
        type: 'avg',
        sql: productivity.pullRequests
      },
      avgDeployments: {
        name: 'avgDeployments',
        title: 'Average Deployments',
        type: 'avg',
        sql: productivity.liveDeployments
      },
      avgHappinessIndex: {
        name: 'avgHappinessIndex',
        title: 'Average Happiness Index',
        type: 'avg',
        sql: productivity.happinessIndex
      },
      
      // Min/Max measures
      minHappinessIndex: {
        name: 'minHappinessIndex',
        title: 'Minimum Happiness',
        type: 'min',
        sql: productivity.happinessIndex
      },
      maxHappinessIndex: {
        name: 'maxHappinessIndex',
        title: 'Maximum Happiness',
        type: 'max',
        sql: productivity.happinessIndex
      },
      minLinesOfCode: {
        name: 'minLinesOfCode',
        title: 'Minimum Lines of Code',
        type: 'min',
        sql: productivity.linesOfCode
      },
      maxLinesOfCode: {
        name: 'maxLinesOfCode',
        title: 'Maximum Lines of Code',
        type: 'max',
        sql: productivity.linesOfCode
      },
      
      // CountDistinct measures
      countDistinctEmployees: {
        name: 'countDistinctEmployees',
        title: 'Unique Employees',
        type: 'countDistinct',
        sql: productivity.employeeId
      },
      
      // Conditional measures for testing edge cases
      highProductivityDays: {
        name: 'highProductivityDays',
        title: 'High Productivity Days',
        type: 'count',
        sql: productivity.id,
        filters: [
          (ctx) => sql`${productivity.linesOfCode} > 200`
        ]
      },
      happyWorkDays: {
        name: 'happyWorkDays',
        title: 'Happy Work Days',
        type: 'count',
        sql: productivity.id,
        filters: [
          (ctx) => and(
            eq(productivity.daysOff, dbFalse),
            sql`${productivity.happinessIndex} >= 7`
          )
        ]
      },
      
      // Complex calculated measures
      productivityScore: {
        name: 'productivityScore',
        title: 'Productivity Score',
        type: 'avg',
        sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
        description: 'Composite productivity score based on code output, reviews, and deployments'
      }
    }
  })

  return {
    testEmployeesCube,
    testDepartmentsCube, 
    testProductivityCube
  }
}