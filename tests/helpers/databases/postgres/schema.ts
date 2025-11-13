/**
 * Test database schema using Drizzle ORM
 * This schema is used for testing the drizzle-cube package
 * Extended with productivity metrics and analytics pages for comprehensive testing
 */

import { pgTable, integer, text, real, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Employee table
export const employees = pgTable('employees', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  email: text('email'),
  active: boolean('active').default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  salary: real('salary'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Department table
export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull(),
  budget: real('budget')
})

// Productivity metrics table - daily productivity data per employee
export const productivity = pgTable('productivity', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer('employee_id').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  linesOfCode: integer('lines_of_code').default(0),
  pullRequests: integer('pull_requests').default(0),
  liveDeployments: integer('live_deployments').default(0),
  daysOff: boolean('days_off').default(false),
  happinessIndex: integer('happiness_index'), // 1-10 scale
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Time Entries table - for tracking employee time allocation with fan-out scenarios
export const timeEntries = pgTable('time_entries', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer('employee_id').notNull(),
  departmentId: integer('department_id').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  allocationType: text('allocation_type').notNull(), // 'development', 'maintenance', 'meetings', 'research'
  hours: real('hours').notNull(),
  description: text('description'),
  billableHours: real('billable_hours').default(0),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Analytics Pages table - for storing dashboard configurations
export const analyticsPages = pgTable('analytics_pages', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  organisationId: integer('organisation_id').notNull(),
  config: jsonb('config').notNull().$type<{
    portlets: Array<{
      id: string
      title: string
      query: string
      chartType: 'line' | 'bar' | 'pie' | 'table' | 'area' | 'treemap'
      chartConfig: {
        x?: string
        y?: string[]
        series?: string
      }
      displayConfig?: {
        showLegend?: boolean
        stacked?: boolean
      }
      w: number
      h: number
      x: number
      y: number
    }>
  }>(),
  order: integer('order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
})

// Teams table - for testing belongsToMany relationships with employees
export const teams = pgTable('teams', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// EmployeeTeams junction table - many-to-many relationship between employees and teams
export const employeeTeams = pgTable('employee_teams', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer('employee_id').notNull(),
  teamId: integer('team_id').notNull(),
  role: text('role'), // e.g., 'member', 'lead', 'contributor'
  joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Define relations for better type inference
export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id]
  }),
  productivityMetrics: many(productivity),
  timeEntries: many(timeEntries)
}))

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  timeEntries: many(timeEntries)
}))

export const productivityRelations = relations(productivity, ({ one }) => ({
  employee: one(employees, {
    fields: [productivity.employeeId],
    references: [employees.id]
  })
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employeeId],
    references: [employees.id]
  }),
  department: one(departments, {
    fields: [timeEntries.departmentId],
    references: [departments.id]
  })
}))

// Export schema for use with Drizzle
export const testSchema = { 
  employees, 
  departments,
  productivity,
  timeEntries,
  analyticsPages,
  employeesRelations,
  departmentsRelations,
  productivityRelations,
  timeEntriesRelations
}
export type TestSchema = typeof testSchema