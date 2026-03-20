/**
 * Test database schema for Snowflake using Drizzle ORM
 * Uses snowflakeTable and column types from drizzle-snowflake
 * Extended with productivity metrics and analytics pages for comprehensive testing
 */

import { snowflakeTable, integer, text, real, boolean, timestamp, varchar } from 'drizzle-snowflake'
import { relations } from 'drizzle-orm'

// Employee table - Snowflake version
export const employees = snowflakeTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  active: boolean('active').default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  salary: real('salary'),
  tags: varchar('tags', { length: 100 }), // Snowflake doesn't support arrays in this context - store as comma-separated
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Department table - Snowflake version
export const departments = snowflakeTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull(),
  budget: real('budget')
})

// Productivity metrics table - daily productivity data per employee
export const productivity = snowflakeTable('productivity', {
  id: integer('id').primaryKey(),
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
export const timeEntries = snowflakeTable('time_entries', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  departmentId: integer('department_id').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  allocationType: text('allocation_type').notNull(),
  hours: real('hours').notNull(),
  description: text('description'),
  billableHours: real('billable_hours').default(0),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Analytics Pages table - for storing dashboard configurations
export const analyticsPages = snowflakeTable('analytics_pages', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organisationId: integer('organisation_id').notNull(),
  config: text('config').notNull(),
  order: integer('order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
})

// Teams table - for testing belongsToMany relationships with employees
export const teams = snowflakeTable('teams', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// EmployeeTeams junction table - many-to-many relationship between employees and teams
export const employeeTeams = snowflakeTable('employee_teams', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  teamId: integer('team_id').notNull(),
  role: text('role'),
  joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Star Schema Tables - for testing fact-dimension-fact join patterns

// Products table - dimension table shared by multiple fact tables
export const products = snowflakeTable('products', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  sku: text('sku').notNull(),
  price: real('price').notNull(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Sales table - fact table #1
export const sales = snowflakeTable('sales', {
  id: integer('id').primaryKey(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  revenue: real('revenue').notNull(),
  saleDate: timestamp('sale_date', { mode: 'date' }).notNull(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow()
})

// Inventory table - fact table #2
export const inventory = snowflakeTable('inventory', {
  id: integer('id').primaryKey(),
  productId: integer('product_id').notNull(),
  warehouse: text('warehouse').notNull(),
  stockLevel: integer('stock_level').notNull(),
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

// Star schema relations
export const productsRelations = relations(products, ({ many }) => ({
  sales: many(sales),
  inventory: many(inventory)
}))

export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id]
  })
}))

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id]
  })
}))

// Export schema for use with Drizzle
export const snowflakeTestSchema = {
  employees,
  departments,
  productivity,
  timeEntries,
  analyticsPages,
  teams,
  employeeTeams,
  products,
  sales,
  inventory,
  employeesRelations,
  departmentsRelations,
  productivityRelations,
  timeEntriesRelations,
  productsRelations,
  salesRelations,
  inventoryRelations
}
export type SnowflakeTestSchema = typeof snowflakeTestSchema
