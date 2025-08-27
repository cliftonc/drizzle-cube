/**
 * MySQL-specific test database schema
 * Converted from PostgreSQL schema to MySQL equivalents
 */

import { mysqlTable, int, varchar, decimal, boolean, timestamp, json, text } from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

// Employee table - MySQL version
export const employees = mysqlTable('employees', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  active: boolean('active').default(true),
  departmentId: int('department_id'),
  organisationId: int('organisation_id').notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow()
})

// Department table - MySQL version
export const departments = mysqlTable('departments', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  organisationId: int('organisation_id').notNull(),
  budget: decimal('budget', { precision: 12, scale: 2 })
})

// Productivity metrics table - MySQL version
export const productivity = mysqlTable('productivity', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  date: timestamp('date').notNull(),
  linesOfCode: int('lines_of_code').default(0),
  pullRequests: int('pull_requests').default(0),
  liveDeployments: int('live_deployments').default(0),
  daysOff: boolean('days_off').default(false),
  happinessIndex: int('happiness_index'),
  organisationId: int('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

// Time Entries table - MySQL version with fan-out scenarios
export const timeEntries = mysqlTable('time_entries', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  departmentId: int('department_id').notNull(),
  date: timestamp('date').notNull(),
  allocationType: varchar('allocation_type', { length: 50 }).notNull(), // 'development', 'maintenance', 'meetings', 'research'
  hours: decimal('hours', { precision: 4, scale: 2 }).notNull(),
  description: text('description'),
  billableHours: decimal('billable_hours', { precision: 4, scale: 2 }).default('0.00'),
  organisationId: int('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

// Analytics pages table - MySQL version
export const analyticsPages = mysqlTable('analytics_pages', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  organisationId: int('organisation_id').notNull(),
  config: json('config').notNull(),
  order: int('order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Relations (same as PostgreSQL schema)
export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  productivity: many(productivity),
  timeEntries: many(timeEntries)
}))

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  timeEntries: many(timeEntries)
}))

export const productivityRelations = relations(productivity, ({ one }) => ({
  employee: one(employees, {
    fields: [productivity.employeeId],
    references: [employees.id],
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

// Create combined schema object for MySQL
export const mysqlTestSchema = {
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

// Type export
export type MySQLTestSchema = typeof mysqlTestSchema