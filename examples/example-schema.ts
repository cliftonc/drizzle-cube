/**
 * Example schema for demonstrating Drizzle cube definitions
 * This shows how to define cubes using actual Drizzle schema
 */

import { 
  pgTable, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  decimal
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Organizations table
export const organisations = pgTable('organisations', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Departments table
export const departments = pgTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organisation: integer('organisation').notNull().references(() => organisations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Suppliers table
export const suppliers = pgTable('suppliers', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  internal: boolean('internal').default(false),
  organisation: integer('organisation').notNull().references(() => organisations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Employees table
export const employees = pgTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  active: boolean('active').default(true),
  fteBasis: decimal('fte_basis', { precision: 3, scale: 2 }).default('1.00'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  department: integer('department').references(() => departments.id),
  supplier: integer('supplier').references(() => suppliers.id),
  organisation: integer('organisation').notNull().references(() => organisations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Relations
export const organisationsRelations = relations(organisations, ({ many }) => ({
  departments: many(departments),
  suppliers: many(suppliers),
  employees: many(employees)
}))

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [departments.organisation],
    references: [organisations.id]
  }),
  employees: many(employees)
}))

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [suppliers.organisation],
    references: [organisations.id]
  }),
  employees: many(employees)
}))

export const employeesRelations = relations(employees, ({ one }) => ({
  organisation: one(organisations, {
    fields: [employees.organisation],
    references: [organisations.id]
  }),
  department: one(departments, {
    fields: [employees.department],
    references: [departments.id]
  }),
  supplier: one(suppliers, {
    fields: [employees.supplier],
    references: [suppliers.id]
  })
}))

// Export schema for type inference
export const exampleSchema = {
  organisations,
  departments,
  suppliers,
  employees,
  organisationsRelations,
  departmentsRelations,
  suppliersRelations,
  employeesRelations
}

export type ExampleSchema = typeof exampleSchema