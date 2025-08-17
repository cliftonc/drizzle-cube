/**
 * Test database schema using Drizzle ORM
 * This schema is used for testing the drizzle-cube package
 */

import { pgTable, integer, text, real, boolean, timestamp } from 'drizzle-orm/pg-core'

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

// Export schema for use with Drizzle
export const testSchema = { employees, departments }
export type TestSchema = typeof testSchema