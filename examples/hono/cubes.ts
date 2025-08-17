/**
 * Example cube definitions for Hono drizzle-cube demo
 * This demonstrates how to define type-safe analytics cubes using Drizzle ORM
 */

import { eq, and } from 'drizzle-orm'
import { defineCube } from '../../src/server/types-drizzle'
import type { Cube, QueryContext, BaseQueryDefinition } from '../../src/server/types-drizzle'
import { employees, departments, schema } from './schema'
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

// Export all cubes for easy registration
export const allCubes = [
  employeesCube,
  departmentsCube
]