/**
 * Example database schema for Hono drizzle-cube demo
 * This demonstrates a typical business analytics schema with employees and departments
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
  createdAt: timestamp('created_at').defaultNow()
})

// Department table
export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull(),
  budget: real('budget')
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Define relations for better type inference
export const employeesRelations = relations(employees, ({ one }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id]
  })
}))

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees)
}))

// Export schema for use with Drizzle
export const schema = { 
  employees, 
  departments,
  analyticsPages,
  employeesRelations,
  departmentsRelations
}

export type Schema = typeof schema