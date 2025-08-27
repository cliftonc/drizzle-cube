/**
 * Test database schema for SQLite using Drizzle ORM
 * This schema mirrors the PostgreSQL test schema for SQLite compatibility
 * Extended with productivity metrics and analytics pages for comprehensive testing
 */

import { sqliteTable, integer, text, real, blob } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Employee table - SQLite version
export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  active: integer('active', { mode: 'boolean' }).default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  salary: real('salary'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Department table - SQLite version
export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull(),
  budget: real('budget')
})

// Productivity metrics table - daily productivity data per employee
export const productivity = sqliteTable('productivity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  linesOfCode: integer('lines_of_code').default(0),
  pullRequests: integer('pull_requests').default(0),
  liveDeployments: integer('live_deployments').default(0),
  daysOff: integer('days_off', { mode: 'boolean' }).default(false),
  happinessIndex: integer('happiness_index'), // 1-10 scale
  organisationId: integer('organisation_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Time Entries table - for tracking employee time allocation with fan-out scenarios
export const timeEntries = sqliteTable('time_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull(),
  departmentId: integer('department_id').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  allocationType: text('allocation_type').notNull(), // 'development', 'maintenance', 'meetings', 'research'
  hours: real('hours').notNull(),
  description: text('description'),
  billableHours: real('billable_hours').default(0),
  organisationId: integer('organisation_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Analytics Pages table - for storing dashboard configurations
// SQLite doesn't have native JSON, so we use TEXT and parse it in application
export const analyticsPages = sqliteTable('analytics_pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  organisationId: integer('organisation_id').notNull(),
  config: text('config', { mode: 'json' }).notNull().$type<{
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
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
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
export const sqliteTestSchema = { 
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
export type SQLiteTestSchema = typeof sqliteTestSchema