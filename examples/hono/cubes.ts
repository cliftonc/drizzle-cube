/**
 * Example cube definitions for Hono drizzle-cube demo
 * This demonstrates how to define type-safe analytics cubes using Drizzle ORM
 */

import { eq, and, sql } from 'drizzle-orm'
import { defineCube } from '../../src/server/types-drizzle'
import type { Cube, QueryContext, BaseQueryDefinition } from '../../src/server/types-drizzle'
import { employees, departments, productivity, schema } from './schema'
import type { Schema } from './schema'

/**
 * Employees cube - comprehensive employee analytics
 */
export const employeesCube: Cube<Schema> = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Comprehensive employee data with department information',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
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
    totalSalary: {
      name: 'totalSalary',
      title: 'Total Salary',
      type: 'sum',
      sql: employees.salary,
      format: 'currency'
    },
    avgSalary: {
      name: 'avgSalary',
      title: 'Average Salary',
      type: 'avg',
      sql: employees.salary,
      format: 'currency'
    }
  }
})

/**
 * Departments cube - department-level analytics
 */
export const departmentsCube: Cube<Schema> = defineCube('Departments', {
  title: 'Department Analytics',
  description: 'Department-level metrics and budget analysis',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
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
      sql: departments.budget,
      format: 'currency'
    },
    avgBudget: {
      name: 'avgBudget',
      title: 'Average Budget',
      type: 'avg',
      sql: departments.budget,
      format: 'currency'
    }
  }
})

/**
 * Productivity cube - comprehensive daily productivity metrics
 */
export const productivityCube: Cube<Schema> = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Daily productivity metrics including code output, deployments, and happiness tracking',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
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
    }
  },
  
  measures: {
    totalLinesOfCode: {
      name: 'totalLinesOfCode',
      title: 'Total Lines of Code',
      type: 'sum',
      sql: productivity.linesOfCode
    },
    avgLinesOfCode: {
      name: 'avgLinesOfCode',
      title: 'Average Lines of Code',
      type: 'avg',
      sql: productivity.linesOfCode
    },
    totalPullRequests: {
      name: 'totalPullRequests',
      title: 'Total Pull Requests',
      type: 'sum',
      sql: productivity.pullRequests
    },
    avgPullRequests: {
      name: 'avgPullRequests',
      title: 'Average Pull Requests',
      type: 'avg',
      sql: productivity.pullRequests
    },
    totalDeployments: {
      name: 'totalDeployments',
      title: 'Total Deployments',
      type: 'sum',
      sql: productivity.liveDeployments
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
    productivityScore: {
      name: 'productivityScore',
      title: 'Productivity Score',
      type: 'avg',
      sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
      description: 'Composite productivity score based on code output, reviews, and deployments'
    },
    recordCount: {
      name: 'recordCount',
      title: 'Total Records',
      type: 'count',
      sql: productivity.id
    }
  }
})

// Export all cubes for easy registration
export const allCubes = [
  employeesCube,
  departmentsCube,
  productivityCube
]