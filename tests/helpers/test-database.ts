/**
 * Test database setup with PostgreSQL and Drizzle ORM
 * Provides a real database instance for testing with proper migrations
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { sql, eq, and } from 'drizzle-orm'
import { SemanticLayerCompiler, createPostgresExecutor } from '../../src/server'
import { defineCube } from '../../src/server/types-drizzle'
import type { Cube, QueryContext, BaseQueryDefinition } from '../../src/server/types-drizzle'
import type { DatabaseExecutor } from '../../src/server'

// Import schema from dedicated schema file
import { testSchema, employees, departments } from './schema'
import type { TestSchema } from './schema'

// Re-export for backward compatibility
export { testSchema, employees, departments }
export type { TestSchema }

// Import cube utilities
import { defineCube } from '../../src/server/types-drizzle'
import type { CubeWithJoins, QueryContext, BaseQueryDefinition } from '../../src/server/types-drizzle'

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
    departmentId: 3, // Changed to 3 to match Sales department in org 2
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
  const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/drizzle_cube_test'
  
  // Configure postgres client to suppress NOTICE messages during tests
  const client = postgres(connectionString, {
    onnotice: () => {}, // Suppress NOTICE messages
  })
  
  const db = drizzle(client, { schema: testSchema })

  return {
    db,
    close: () => client.end()
  }
}

/**
 * Setup database using Drizzle migrations and insert sample data
 * This should only be called once during global setup
 */
export async function setupTestDatabase(db: ReturnType<typeof drizzle>) {
  // Safety check: ensure we're using test database
  const dbUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/drizzle_cube_test'
  if (!dbUrl.includes('test')) {
    throw new Error('Safety check failed: TEST_DATABASE_URL must contain "test" to prevent accidental production usage')
  }

  // Clean existing data to ensure clean state
  await db.execute(sql`DELETE FROM employees`)
  await db.execute(sql`DELETE FROM departments`)
  
  // Reset identity sequences
  await db.execute(sql`ALTER SEQUENCE employees_id_seq RESTART WITH 1`)
  await db.execute(sql`ALTER SEQUENCE departments_id_seq RESTART WITH 1`)

  // Run Drizzle migrations to create fresh tables (in case they don't exist)
  try {
    await migrate(db, { 
      migrationsFolder: './tests/helpers/migrations' 
    })
  } catch (error) {
    // Ignore errors if tables already exist
  }

  // Insert sample data - this should remain static throughout all tests
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
export const testBasicEmployeesCube: Cube<TestSchema> = defineCube('Employees', {
  title: 'Employee Analytics',
  
  sql: (ctx) => ({
    from: employees,
    joins: [
      {
        table: departments,
        on: eq(employees.departmentId, departments.id),
        type: 'left'
      }
    ],
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: { 
      name: 'id',
      sql: employees.id, 
      type: 'number', 
      primaryKey: true 
    },
    name: { 
      name: 'name',
      sql: employees.name, 
      type: 'string',
      title: 'Employee Name'
    },
    email: { 
      name: 'email',
      sql: employees.email, 
      type: 'string' 
    },
    departmentName: { 
      name: 'departmentName',
      sql: departments.name, 
      type: 'string',
      title: 'Department'
    },
    isActive: { 
      name: 'isActive',
      sql: employees.active, 
      type: 'boolean',
      title: 'Active Status'
    },
    createdAt: { 
      name: 'createdAt',
      sql: employees.createdAt, 
      type: 'time',
      title: 'Hire Date'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      sql: employees.id,
      type: 'count',
      title: 'Total Employees'
    },
    activeCount: {
      name: 'activeCount',
      sql: employees.id,
      type: 'count',
      title: 'Active Employees',
      filters: [() => eq(employees.active, true)]
    },
    totalSalary: {
      name: 'totalSalary',
      sql: employees.salary,
      type: 'sum',
      title: 'Total Salary',
      format: 'currency'
    },
    avgSalary: {
      name: 'avgSalary',
      sql: employees.salary,
      type: 'avg',
      title: 'Average Salary',
      format: 'currency'
    }
  }
})

export const testDepartmentsCube: Cube<TestSchema> = defineCube('Departments', {
  title: 'Department Analytics',
  
  sql: (ctx) => ({
    from: departments,
    where: eq(departments.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: { 
      name: 'id',
      sql: departments.id, 
      type: 'number', 
      primaryKey: true 
    },
    name: { 
      name: 'name',
      sql: departments.name, 
      type: 'string',
      title: 'Department Name'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      sql: departments.id,
      type: 'count',
      title: 'Department Count'
    },
    totalBudget: {
      name: 'totalBudget',
      sql: departments.budget,
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

/**
 * Simplified cube definition for testing new approach
 */
export const testEmployeesCube: CubeWithJoins<TestSchema> = {
  ...defineCube('Employees', {
    title: 'Employee Analytics',
    description: 'Employee data with department joins',
    
    sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
      from: employees,
      joins: [
        {
          table: departments,
          on: and(
            eq(employees.departmentId, departments.id),
            eq(departments.organisationId, ctx.securityContext.organisationId)
          ),
          type: 'left'
        }
      ],
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    
    dimensions: {
      id: {
        name: 'id',
        title: 'Employee ID',
        type: 'number',
        sql: employees.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Employee Name',
        type: 'string',
        sql: employees.name
      },
      email: {
        name: 'email',
        title: 'Email Address', 
        type: 'string',
        sql: employees.email
      },
      departmentName: {
        name: 'departmentName',
        title: 'Department',
        type: 'string',
        sql: departments.name
      },
      isActive: {
        name: 'isActive',
        title: 'Active Status',
        type: 'boolean',
        sql: employees.active
      }
    },
    
    measures: {
      count: {
        name: 'count',
        title: 'Total Employees',
        type: 'count',
        sql: employees.id
      },
      activeCount: {
        name: 'activeCount',
        title: 'Active Employees', 
        type: 'count',
        sql: employees.id,
        filters: [
          (ctx) => eq(employees.active, true)
        ]
      },
      totalSalary: {
        name: 'totalSalary',
        title: 'Total Salary',
        type: 'sum',
        sql: employees.salary
      },
      avgSalary: {
        name: 'avgSalary',
        title: 'Average Salary',
        type: 'avg',
        sql: employees.salary
      }
    }
  })
}