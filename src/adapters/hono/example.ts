/**
 * Example usage of the Hono adapter with Drizzle ORM
 * This shows how to integrate Drizzle Cube with a Hono application using real Drizzle schemas
 */

import { Hono, type Context } from 'hono'
import { drizzle } from 'drizzle-orm/postgres-js'
import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { sql, eq, and } from 'drizzle-orm'
// @ts-ignore - postgres is an optional example dependency
import postgres from 'postgres'

import { createCubeApp, mountCubeRoutes } from './index'
import { SemanticLayerCompiler, defineCube } from '../../server'

// Example database schema using Drizzle
export const employees = pgTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  active: boolean('active').default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  salary: integer('salary'),
  createdAt: timestamp('created_at').defaultNow()
})

export const departments = pgTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull(),
  budget: integer('budget')
})

// Define schema for type inference
export const schema = { employees, departments }
export type Schema = typeof schema

// Example 1: Create a standalone Cube.js API app with Drizzle
export function createStandaloneCubeApp() {
  // Setup Drizzle with PostgreSQL
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/testdb'
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  // Create semantic layer with Drizzle
  const semanticLayer = new SemanticLayerCompiler<Schema>({
    drizzle: db,
    schema
  })

  // Define type-safe cubes using actual Drizzle schema
  const employeesCube = defineCube(schema, {
    name: 'Employees',
    title: 'Employee Analytics',
    
    // Use Drizzle query builder for base SQL
    sql: ({ db, securityContext }) => 
      db.select()
        .from(schema.employees)
        .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
        .where(eq(schema.employees.organisationId, securityContext.organisationId)),
    
    dimensions: {
      id: { 
        name: 'id',
        sql: schema.employees.id, 
        type: 'number', 
        primaryKey: true 
      },
      name: { 
        name: 'name',
        sql: schema.employees.name, 
        type: 'string',
        title: 'Employee Name'
      },
      email: { 
        name: 'email',
        sql: schema.employees.email, 
        type: 'string' 
      },
      departmentName: { 
        name: 'departmentName',
        sql: schema.departments.name, 
        type: 'string',
        title: 'Department'
      },
      isActive: { 
        name: 'isActive',
        sql: schema.employees.active, 
        type: 'boolean',
        title: 'Active Status'
      },
      createdAt: { 
        name: 'createdAt',
        sql: schema.employees.createdAt, 
        type: 'time',
        title: 'Hire Date'
      }
    },
    
    measures: {
      count: {
        name: 'count',
        sql: schema.employees.id,
        type: 'count',
        title: 'Total Employees'
      },
      activeCount: {
        name: 'activeCount',
        sql: schema.employees.id,
        type: 'count',
        title: 'Active Employees',
        filters: [{ sql: eq(schema.employees.active, true) }]
      },
      totalSalary: {
        name: 'totalSalary',
        sql: schema.employees.salary,
        type: 'sum',
        title: 'Total Salary',
        format: 'currency'
      },
      avgSalary: {
        name: 'avgSalary',
        sql: schema.employees.salary,
        type: 'avg',
        title: 'Average Salary',
        format: 'currency'
      }
    }
  })

  const departmentsCube = defineCube(schema, {
    name: 'Departments',
    title: 'Department Analytics',
    
    sql: ({ db, securityContext }) => 
      db.select()
        .from(schema.departments)
        .where(eq(schema.departments.organisationId, securityContext.organisationId)),
    
    dimensions: {
      id: { 
        name: 'id',
        sql: schema.departments.id, 
        type: 'number', 
        primaryKey: true 
      },
      name: { 
        name: 'name',
        sql: schema.departments.name, 
        type: 'string',
        title: 'Department Name'
      }
    },
    
    measures: {
      count: {
        name: 'count',
        sql: schema.departments.id,
        type: 'count',
        title: 'Department Count'
      },
      totalBudget: {
        name: 'totalBudget',
        sql: schema.departments.budget,
        type: 'sum',
        title: 'Total Budget',
        format: 'currency'
      }
    }
  })

  // Register cubes
  semanticLayer.registerCube(employeesCube)
  semanticLayer.registerCube(departmentsCube)

  // Create Cube.js API app
  const app = createCubeApp({
    semanticLayer,
    drizzle: db,
    schema,
    getSecurityContext: async (c) => ({
      // Extract from your authentication system
      organisationId: c.get('session')?.organisation?.id || 1,
      userId: c.get('session')?.user?.id,
    }),
    cors: {
      origin: ['http://localhost:3000', 'https://yourdomain.com'],
      credentials: true
    }
  })

  return app
}

// Example 2: Mount Cube.js routes on existing Hono app
export function mountOnExistingApp() {
  const app = new Hono()

  // Your existing routes
  app.get('/health', (c) => c.text('OK'))
  app.get('/api/users', (c) => c.json({ users: [] }))

  // Setup Drizzle and semantic layer
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/testdb'
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  const semanticLayer = new SemanticLayerCompiler<Schema>({
    drizzle: db,
    schema
  })

  // Register a simple cube
  const simpleEmployeesCube = defineCube(schema, {
    name: 'Employees',
    sql: ({ db, securityContext }) => 
      db.select().from(schema.employees).where(eq(schema.employees.organisationId, securityContext.organisationId)),
    dimensions: {
      name: { name: 'name', sql: schema.employees.name, type: 'string' }
    },
    measures: {
      count: { name: 'count', sql: schema.employees.id, type: 'count' }
    }
  })

  semanticLayer.registerCube(simpleEmployeesCube)

  // Mount Cube.js routes
  mountCubeRoutes(app, {
    semanticLayer,
    drizzle: db,
    schema,
    getSecurityContext: async (c) => ({
      organisationId: c.get('organisationId') || 1,
    })
  })

  return app
}

// Example 3: Custom security context extraction with JWT
export function createAppWithCustomAuth() {
  // Setup Drizzle
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/testdb'
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  const semanticLayer = new SemanticLayerCompiler<Schema>({
    drizzle: db,
    schema
  })

  // Register cube with advanced security
  const secureEmployeesCube = defineCube(schema, {
    name: 'Employees',
    sql: ({ db, securityContext }) => 
      db.select()
        .from(schema.employees)
        .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
        .where(
          and(
            eq(schema.employees.organisationId, securityContext.organisationId),
            // Additional security: only show employees user has permission to see
            securityContext.permissions?.includes('read_all_employees') 
              ? sql`true` 
              : eq(schema.employees.id, securityContext.userId)
          )
        ),
    dimensions: {
      name: { name: 'name', sql: schema.employees.name, type: 'string' },
      departmentName: { name: 'departmentName', sql: schema.departments.name, type: 'string' }
    },
    measures: {
      count: { name: 'count', sql: schema.employees.id, type: 'count' }
    }
  })

  semanticLayer.registerCube(secureEmployeesCube)

  const app = createCubeApp({
    semanticLayer,
    drizzle: db,
    schema,
    getSecurityContext: async (c) => {
      // Example: Extract from JWT token
      const authHeader = c.req.header('Authorization')
      if (!authHeader) {
        throw new Error('No authorization header')
      }

      // const token = authHeader.replace('Bearer ', '')
      // Verify and decode JWT (use your JWT library)
      // const payload = jwt.verify(token, secret)
      
      // Return security context based on token
      return {
        organisationId: 1, // Extract from token
        userId: 123, // Extract from token
        permissions: ['read', 'write'] // Extract from token
      }
    },
    basePath: '/api/analytics/v1' // Custom API path
  })

  return app
}

// Example 4: Integration with session-based auth
export function createAppWithSessionAuth() {
  // Setup Drizzle
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/testdb'
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  const semanticLayer = new SemanticLayerCompiler<Schema>({
    drizzle: db,
    schema
  })

  // Define session-aware cube
  const sessionEmployeesCube = defineCube(schema, {
    name: 'Employees',
    sql: ({ db, securityContext }) => 
      db.select()
        .from(schema.employees)
        .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
        .where(eq(schema.employees.organisationId, securityContext.organisationId)),
    dimensions: {
      name: { name: 'name', sql: schema.employees.name, type: 'string' },
      email: { name: 'email', sql: schema.employees.email, type: 'string' },
      departmentName: { name: 'departmentName', sql: schema.departments.name, type: 'string' }
    },
    measures: {
      count: { name: 'count', sql: schema.employees.id, type: 'count' },
      activeCount: {
        name: 'activeCount',
        sql: schema.employees.id,
        type: 'count',
        filters: [{ sql: eq(schema.employees.active, true) }]
      }
    }
  })

  semanticLayer.registerCube(sessionEmployeesCube)

  const app = new Hono()

  // Add session middleware (example)
  app.use('*', async (c: Context<{ Variables: { session?: any } }>, next) => {
    // Your session logic here
    const sessionId = c.req.header('X-Session-ID')
    if (sessionId) {
      // Load session from your store
      const session = { organisation: { id: 1 }, user: { id: 456 } }
      c.set('session', session)
    }
    await next()
  })

  mountCubeRoutes(app, {
    semanticLayer,
    drizzle: db,
    schema,
    getSecurityContext: async (c) => {
      const session = c.get('session')
      if (!session) {
        throw new Error('No session found')
      }

      return {
        organisationId: session.organisation.id,
        userId: session.user.id
      }
    }
  })

  return app
}