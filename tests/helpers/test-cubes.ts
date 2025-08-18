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
import type { TestSchema } from './schema'
import { employees, departments, productivity, analyticsPages } from './schema'

/**
 * Comprehensive Employees Cube
 * Used for testing all employee-related queries, filters, and aggregations
 */
export const testEmployeesCube: Cube<TestSchema> = defineCube('Employees', {
  title: 'Employees Analytics',
  description: 'Comprehensive employee data with department information and all field types',
  
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
  
  joins: {
    'Productivity': {
      relationship: 'hasMany',
      condition: (ctx) => and(
        eq(productivity.employeeId, employees.id),
        eq(productivity.organisationId, ctx.securityContext.organisationId)
      )
    },
    'Departments': {
      relationship: 'belongsTo',
      condition: (ctx) => and(
        eq(employees.departmentId, departments.id),
        eq(departments.organisationId, ctx.securityContext.organisationId)
      )
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
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: departments.name
    },
    isActive: {
      name: 'isActive',
      title: 'Active Status',
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
    inactiveCount: {
      name: 'inactiveCount',
      title: 'Inactive Employees',
      type: 'count',
      sql: employees.id,
      filters: [
        (ctx) => eq(employees.active, false)
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

/**
 * Comprehensive Departments Cube
 * Used for testing department-level analytics and budget calculations
 */
export const testDepartmentsCube: Cube<TestSchema> = defineCube('Departments', {
  title: 'Department Analytics',
  description: 'Department-level metrics and budget analysis',
  
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

/**
 * Comprehensive Productivity Cube
 * Used for testing time dimensions, complex aggregations, and productivity metrics
 */
export const testProductivityCube: Cube<TestSchema> = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Daily productivity metrics including code output, deployments, and happiness tracking',
  
  sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
    from: productivity,
    joins: [
      {
        table: employees,
        on: and(
          eq(productivity.employeeId, employees.id),
          eq(employees.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      },
      {
        table: departments,
        on: and(
          eq(employees.departmentId, departments.id),
          eq(departments.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      }
    ],
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
    employeeName: {
      name: 'employeeName',
      title: 'Employee Name',
      type: 'string',
      sql: employees.name
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: departments.name
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
        (ctx) => eq(productivity.daysOff, false)
      ]
    },
    daysOffCount: {
      name: 'daysOffCount',
      title: 'Days Off',
      type: 'count',
      sql: productivity.id,
      filters: [
        (ctx) => eq(productivity.daysOff, true)
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
    countDistinctDepartments: {
      name: 'countDistinctDepartments',
      title: 'Unique Departments',
      type: 'countDistinct',
      sql: employees.departmentId
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
          eq(productivity.daysOff, false),
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

/**
 * Analytics Pages Cube
 * Used for testing JSON fields and complex nested data
 */
export const testAnalyticsPagesCube: Cube<TestSchema> = defineCube('AnalyticsPages', {
  title: 'Analytics Pages',
  description: 'Dashboard and analytics page configurations',
  
  sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
    from: analyticsPages,
    where: eq(analyticsPages.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Page ID',
      type: 'number',
      sql: analyticsPages.id,
      primaryKey: true
    },
    name: {
      name: 'name',
      title: 'Page Name',
      type: 'string',
      sql: analyticsPages.name
    },
    description: {
      name: 'description',
      title: 'Description',
      type: 'string',
      sql: analyticsPages.description
    },
    isActive: {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      sql: analyticsPages.isActive
    },
    createdAt: {
      name: 'createdAt',
      title: 'Created At',
      type: 'time',
      sql: analyticsPages.createdAt
    },
    order: {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      sql: analyticsPages.order
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Page Count',
      type: 'count',
      sql: analyticsPages.id
    },
    activeCount: {
      name: 'activeCount',
      title: 'Active Pages',
      type: 'count',
      sql: analyticsPages.id,
      filters: [
        (ctx) => eq(analyticsPages.isActive, true)
      ]
    },
    avgOrder: {
      name: 'avgOrder',
      title: 'Average Order',
      type: 'avg',
      sql: analyticsPages.order
    }
  }
})

/**
 * Standard cube map for all tests
 */
export const allTestCubes = new Map([
  ['Employees', testEmployeesCube],
  ['Departments', testDepartmentsCube],
  ['Productivity', testProductivityCube],
  ['AnalyticsPages', testAnalyticsPagesCube]
])

/**
 * Get cube map for specific test scenarios
 */
export function getTestCubes(cubeNames?: string[]): Map<string, Cube<TestSchema>> {
  if (!cubeNames) {
    return allTestCubes
  }
  
  const filteredCubes = new Map<string, Cube<TestSchema>>()
  for (const name of cubeNames) {
    const cube = allTestCubes.get(name)
    if (cube) {
      filteredCubes.set(name, cube)
    }
  }
  return filteredCubes
}