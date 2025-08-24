/**
 * Example cube definitions for Hono drizzle-cube demo
 * This demonstrates how to define type-safe analytics cubes using Drizzle ORM
 */

import { eq, sql } from 'drizzle-orm'
import { defineCube } from 'drizzle-cube/server'
import type { QueryContext, BaseQueryDefinition, Cube } from 'drizzle-cube/server'
import { employees, departments, productivity } from './schema'
import type { Schema } from './schema'

// Forward declarations for circular dependency resolution
let employeesCube: Cube<Schema>
let departmentsCube: Cube<Schema>
let productivityCube: Cube<Schema>

/**
 * Employees cube - employee analytics (single table)
 */
employeesCube = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Employee data and metrics',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),

  // Cube-level joins for cross-cube queries
  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: employees.departmentId, target: departments.id }
      ]
    },
    Productivity: {
      targetCube: () => productivityCube,
      relationship: 'hasMany',
      on: [
        { source: employees.id, target: productivity.employeeId }
      ]
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
        () => eq(employees.active, true)
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
      sql: employees.salary,
      format: 'currency'
    }
  }
}) as Cube<Schema>

/**
 * Departments cube - department-level analytics (single table)
 */
departmentsCube = defineCube('Departments', {
  title: 'Department Analytics',
  description: 'Department-level metrics and budget analysis',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: departments,
    where: eq(departments.organisationId, ctx.securityContext.organisationId)
  }),

  // Cube-level joins for cross-cube queries
  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'hasMany',
      on: [
        { source: departments.id, target: employees.departmentId }
      ]
    }
  },
  
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
    }
  }
}) as Cube<Schema>

/**
 * Productivity cube - productivity metrics with time dimensions
 */
productivityCube = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Daily productivity metrics including code output and deployments',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: productivity,  
    where: eq(productivity.organisationId, ctx.securityContext.organisationId)
  }),

  // Cube-level joins for multi-cube queries
  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'belongsTo',
      on: [
        { source: productivity.employeeId, target: employees.id }
      ]
    },
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: productivity.departmentId, target: departments.id }
      ]
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
      sql: sql`
        CASE 
          WHEN ${productivity.happinessIndex} >= 8 THEN 'High'
          WHEN ${productivity.happinessIndex} >= 6 THEN 'Medium'
          ELSE 'Low'
        END
      `
    },
    departmentId: {
      name: 'departmentId',
      title: 'Department ID',
      type: 'number',
      sql: productivity.departmentId
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Total Records',
      type: 'count',
      sql: productivity.id
    },
    recordCount: {
      name: 'recordCount',
      title: 'Record Count',
      type: 'count',
      sql: productivity.id
    },
    workingDaysCount: {
      name: 'workingDaysCount',
      title: 'Working Days',
      type: 'count',
      sql: productivity.id,
      filters: [
        () => eq(productivity.daysOff, false)
      ]
    },
    daysOffCount: {
      name: 'daysOffCount',
      title: 'Days Off',
      type: 'count',
      sql: productivity.id,
      filters: [
        () => eq(productivity.daysOff, true)
      ]
    },
    avgLinesOfCode: {
      name: 'avgLinesOfCode',
      title: 'Average Lines of Code',
      type: 'avg',
      sql: productivity.linesOfCode
    },
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
      title: 'Average Happiness',
      type: 'avg',
      sql: productivity.happinessIndex
    },
    productivityScore: {
      name: 'productivityScore',
      title: 'Productivity Score',
      type: 'avg',
      sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
      description: 'Composite productivity score based on code output, reviews, and deployments'
    }
  }
}) as Cube<Schema>

/**
 * Export cubes for use in other modules
 */
export { employeesCube, departmentsCube, productivityCube }

/**
 * All cubes for registration
 */
export const allCubes = [
  employeesCube,
  departmentsCube,
  productivityCube
]