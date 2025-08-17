/**
 * Test database setup with PostgreSQL and Drizzle ORM
 * Provides a real database instance for testing with proper migrations
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { sql, eq } from 'drizzle-orm'
import { SemanticLayerCompiler, defineCube, createPostgresExecutor } from '../../src/server'
import type { DatabaseExecutor } from '../../src/server'

// Import schema from dedicated schema file
import { testSchema, employees, departments } from './schema'
import type { TestSchema } from './schema'

// Re-export for backward compatibility
export { testSchema, employees, departments }
export type { TestSchema }

// Test data
export const sampleEmployees = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 75000,
    createdAt: new Date('2023-01-15')
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    active: true,
    departmentId: 2,
    organisationId: 1,
    salary: 82000,
    createdAt: new Date('2023-02-20')
  },
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    active: false,
    departmentId: 1,
    organisationId: 2,
    salary: 68000,
    createdAt: new Date('2023-03-10')
  }
]

export const sampleDepartments = [
  { name: 'Engineering', organisationId: 1, budget: 500000 },
  { name: 'Marketing', organisationId: 1, budget: 250000 },
  { name: 'Sales', organisationId: 2, budget: 300000 }
]

/**
 * Create a PostgreSQL database connection for testing
 */
export function createTestDatabase(): {
  db: ReturnType<typeof drizzle>
  close: () => void
} {
  const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/drizzle_cube_test'
  const client = postgres(connectionString)
  const db = drizzle(client, { schema: testSchema })

  return {
    db,
    close: () => client.end()
  }
}

/**
 * Setup database using Drizzle migrations and insert sample data
 */
export async function setupTestDatabase(db: ReturnType<typeof drizzle>) {
  // Safety check: ensure we're using test database
  const dbUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/drizzle_cube_test'
  if (!dbUrl.includes('test')) {
    throw new Error('Safety check failed: TEST_DATABASE_URL must contain "test" to prevent accidental production usage')
  }

  // Drop existing tables to ensure clean state
  await db.execute(sql`TRUNCATE TABLE employees`)
  await db.execute(sql`TRUNCATE TABLE departments`)  

  // Run Drizzle migrations to create fresh tables
  await migrate(db, { 
    migrationsFolder: './tests/helpers/migrations' 
  })

  // Insert sample data
  await db.insert(departments).values(sampleDepartments)
  await db.insert(employees).values(sampleEmployees)
}

/**
 * Create a test database with sample data
 */
export async function createTestDatabaseWithData(): Promise<{
  db: ReturnType<typeof drizzle>
  close: () => void
}> {
  const { db, close } = createTestDatabase()
  
  await setupTestDatabase(db)

  return { db, close }
}

/**
 * Create a database executor for testing
 */
export async function createTestDatabaseExecutor(): Promise<{
  executor: DatabaseExecutor<TestSchema>
  close: () => void
}> {
  const { db, close } = await createTestDatabaseWithData()
  
  // Use the new PostgresExecutor class
  const executor = createPostgresExecutor(db, testSchema)

  return { executor, close }
}

/**
 * Create a semantic layer compiler with test database
 */
export async function createTestSemanticLayer(): Promise<{
  semanticLayer: SemanticLayerCompiler<TestSchema>
  db: ReturnType<typeof drizzle>
  close: () => void
}> {
  const { db, close } = await createTestDatabase() // Has data via setup
  
  // Use the new PostgresExecutor via the compiler constructor
  const semanticLayer = new SemanticLayerCompiler<TestSchema>({
    drizzle: db,
    schema: testSchema,
    engineType: 'postgres'
  })

  return { semanticLayer, db, close }
}

/**
 * Test cube definitions using the test schema
 */
export const testEmployeesCube = defineCube(testSchema, {
  name: 'Employees',
  title: 'Employee Analytics',
  
  sql: `
    SELECT 
      e.id,
      e.name,
      e.email,
      e.active,
      e.department_id,
      e.organisation_id,
      e.salary,
      e.created_at,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.organisation_id = \${SECURITY_CONTEXT.organisationId}
  `,
  
  dimensions: {
    id: { 
      name: 'id',
      sql: 'id', 
      type: 'number', 
      primaryKey: true 
    },
    name: { 
      name: 'name',
      sql: 'name', 
      type: 'string',
      title: 'Employee Name'
    },
    email: { 
      name: 'email',
      sql: 'email', 
      type: 'string' 
    },
    departmentName: { 
      name: 'departmentName',
      sql: 'department_name', 
      type: 'string',
      title: 'Department'
    },
    isActive: { 
      name: 'isActive',
      sql: 'active', 
      type: 'boolean',
      title: 'Active Status'
    },
    createdAt: { 
      name: 'createdAt',
      sql: 'created_at', 
      type: 'time',
      title: 'Hire Date'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      sql: 'id',
      type: 'count',
      title: 'Total Employees'
    },
    activeCount: {
      name: 'activeCount',
      sql: 'id',
      type: 'count',
      title: 'Active Employees',
      filters: [{ sql: 'active = true' }]
    },
    totalSalary: {
      name: 'totalSalary',
      sql: 'salary',
      type: 'sum',
      title: 'Total Salary',
      format: 'currency'
    },
    avgSalary: {
      name: 'avgSalary',
      sql: 'salary',
      type: 'avg',
      title: 'Average Salary',
      format: 'currency'
    }
  }
})

export const testDepartmentsCube = defineCube(testSchema, {
  name: 'Departments',
  title: 'Department Analytics',
  
  sql: ({ db, securityContext }) => 
    db.select()
      .from(testSchema.departments)
      .where(eq(testSchema.departments.organisationId, securityContext.organisationId)),
  
  dimensions: {
    id: { 
      name: 'id',
      sql: testSchema.departments.id, 
      type: 'number', 
      primaryKey: true 
    },
    name: { 
      name: 'name',
      sql: testSchema.departments.name, 
      type: 'string',
      title: 'Department Name'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      sql: testSchema.departments.id,
      type: 'count',
      title: 'Department Count'
    },
    totalBudget: {
      name: 'totalBudget',
      sql: testSchema.departments.budget,
      type: 'sum',
      title: 'Total Budget',
      format: 'currency'
    }
  }
})

/**
 * Mock security context for testing
 */
export const testSecurityContext = {
  organisationId: 1,
  userId: 1
}

/**
 * Alternative security context for multi-tenant testing
 */
export const altSecurityContext = {
  organisationId: 2,
  userId: 2
}