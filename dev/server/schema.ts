/**
 * Database schema for dev server
 * Based on drizzle-cube-try-site example schema
 */

import { pgTable, integer, text, real, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
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
  // Location fields
  city: text('city'),
  region: text('region'),
  country: text('country'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  index('idx_employees_org').on(table.organisationId),
  index('idx_employees_org_country').on(table.organisationId, table.country),
  index('idx_employees_org_city').on(table.organisationId, table.city)
])

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
  departmentId: integer('department_id'),
  date: timestamp('date').notNull(),
  linesOfCode: integer('lines_of_code').default(0),
  pullRequests: integer('pull_requests').default(0),
  liveDeployments: integer('live_deployments').default(0),
  daysOff: boolean('days_off').default(false),
  happinessIndex: integer('happiness_index'), // 1-10 scale
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

// PR Events table - tracks PR lifecycle events for funnel analysis
// Event types: created, review_requested, reviewed, changes_requested, approved, merged, closed
export const prEvents = pgTable('pr_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  prNumber: integer('pr_number').notNull(),
  eventType: text('event_type').notNull(),
  employeeId: integer('employee_id').notNull(),
  organisationId: integer('organisation_id').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  index('idx_pr_events_org_event').on(table.organisationId, table.eventType),
  index('idx_pr_events_pr_ts_org').on(table.organisationId, table.prNumber, table.timestamp)
])

// Teams table
export const teams = pgTable('teams', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  index('idx_teams_org').on(table.organisationId),
  index('idx_teams_org_dept').on(table.organisationId, table.departmentId)
])

// Employee-Teams junction table for many-to-many relationship
export const employeeTeams = pgTable('employee_teams', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer('employee_id').notNull(),
  teamId: integer('team_id').notNull(),
  role: text('role'), // 'lead', 'member', 'contributor'
  joinedAt: timestamp('joined_at').defaultNow(),
  organisationId: integer('organisation_id').notNull()
}, (table) => [
  index('idx_employee_teams_org').on(table.organisationId),
  index('idx_employee_teams_employee').on(table.employeeId),
  index('idx_employee_teams_team').on(table.teamId)
])

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

// Settings table - for storing application configuration and counters
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Define relations for better type inference
export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id]
  }),
  productivityMetrics: many(productivity),
  prEvents: many(prEvents),
  employeeTeams: many(employeeTeams)
}))

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  teams: many(teams)
}))

export const productivityRelations = relations(productivity, ({ one }) => ({
  employee: one(employees, {
    fields: [productivity.employeeId],
    references: [employees.id]
  })
}))

export const prEventsRelations = relations(prEvents, ({ one }) => ({
  employee: one(employees, {
    fields: [prEvents.employeeId],
    references: [employees.id]
  })
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  department: one(departments, {
    fields: [teams.departmentId],
    references: [departments.id]
  }),
  employeeTeams: many(employeeTeams)
}))

export const employeeTeamsRelations = relations(employeeTeams, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeTeams.employeeId],
    references: [employees.id]
  }),
  team: one(teams, {
    fields: [employeeTeams.teamId],
    references: [teams.id]
  })
}))

// Export schema for use with Drizzle
export const schema = {
  employees,
  departments,
  productivity,
  prEvents,
  teams,
  employeeTeams,
  analyticsPages,
  settings,
  employeesRelations,
  departmentsRelations,
  productivityRelations,
  prEventsRelations,
  teamsRelations,
  employeeTeamsRelations
}

export type Schema = typeof schema