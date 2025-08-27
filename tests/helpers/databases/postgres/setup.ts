/**
 * PostgreSQL-specific setup utilities with proper migration handling
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { testSchema, employees, departments, productivity, timeEntries, analyticsPages } from './schema'
import { enhancedDepartments, enhancedEmployees, generateComprehensiveProductivityData, generateComprehensiveTimeEntriesData } from '../../enhanced-test-data'

/**
 * Create PostgreSQL connection for testing
 */
export function createPostgresConnection() {
  const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/drizzle_cube_test'
  
  // Configure postgres client to suppress NOTICE messages during tests
  const client = postgres(connectionString, {
    onnotice: () => {}, // Suppress NOTICE messages
  })
  
  const db = drizzle(client, { schema: testSchema })
  
  return {
    db,
    client,
    close: () => client.end()
  }
}

/**
 * Run PostgreSQL migrations
 */
export async function runPostgresMigrations(db: ReturnType<typeof drizzle>) {
  console.log('Running PostgreSQL migrations...')
  
  try {
    await migrate(db, { 
      migrationsFolder: './tests/helpers/databases/postgres/migrations' 
    })
    console.log('PostgreSQL migrations completed successfully')
  } catch (error) {
    console.log('PostgreSQL migrations completed or not needed:', (error as Error).message)
  }
}

/**
 * Setup PostgreSQL test data
 */
export async function setupPostgresTestData(db: ReturnType<typeof drizzle>) {
  console.log('Setting up PostgreSQL test data...')
  
  // Safety check: ensure we're using test database
  const dbUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/drizzle_cube_test'
  if (!dbUrl.includes('test')) {
    throw new Error('Safety check failed: TEST_DATABASE_URL must contain "test" to prevent accidental production usage')
  }

  // Clear existing data to ensure clean test state
  await db.delete(productivity)
  await db.delete(employees)
  await db.delete(departments)
  await db.delete(analyticsPages)
    
  // Insert departments first (dependencies)
  const insertedDepartments = await db.insert(departments)
    .values(enhancedDepartments)
    .returning({ id: departments.id, name: departments.name, organisationId: departments.organisationId })

  // Update employee department IDs to match actual inserted department IDs
  const updatedEmployees = enhancedEmployees.map(emp => ({
    ...emp,
    departmentId: emp.departmentId ? insertedDepartments[emp.departmentId - 1]?.id || null : null
  }))
  
  // Insert employees
  const insertedEmployees = await db.insert(employees)
    .values(updatedEmployees)
    .returning({ id: employees.id, name: employees.name, organisationId: employees.organisationId, active: employees.active, departmentId: employees.departmentId })

  // Insert comprehensive productivity data
  const productivityData = generateComprehensiveProductivityData(insertedEmployees)
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 100
  for (let i = 0; i < productivityData.length; i += batchSize) {
    const batch = productivityData.slice(i, i + batchSize)
    await db.insert(productivity).values(batch)
  }
  
  // Insert comprehensive time entries data for fan-out testing
  const timeEntriesData = generateComprehensiveTimeEntriesData(insertedEmployees, insertedDepartments)
  
  // Insert time entries in batches (large dataset)
  const timeEntriesBatchSize = 200
  for (let i = 0; i < timeEntriesData.length; i += timeEntriesBatchSize) {
    const batch = timeEntriesData.slice(i, i + timeEntriesBatchSize)
    await db.insert(timeEntries).values(batch)
  }
  
  // Insert analytics pages data
  const analyticsData = [
    { 
      name: 'Employee Dashboard', 
      organisationId: 1,
      createdAt: new Date('2024-01-01'),
      config: JSON.stringify({
        layout: [
          { i: 'employees-count', x: 0, y: 0, w: 6, h: 3 },
          { i: 'avg-salary', x: 6, y: 0, w: 6, h: 3 },
        ],
        portlets: [
          { id: 'employees-count', type: 'metric', title: 'Total Employees' },
          { id: 'avg-salary', type: 'metric', title: 'Average Salary' }
        ]
      })
    },
    { 
      name: 'Productivity Analytics', 
      organisationId: 1,
      createdAt: new Date('2024-01-15'),
      config: JSON.stringify({
        layout: [
          { i: 'productivity-chart', x: 0, y: 0, w: 12, h: 6 },
        ],
        portlets: [
          { id: 'productivity-chart', type: 'chart', title: 'Lines of Code Over Time' }
        ]
      })
    }
  ]
  
  await db.insert(analyticsPages).values(analyticsData)  
}

/**
 * Full PostgreSQL setup: migrations + test data
 */
export async function setupPostgresDatabase() {
  const { db, close } = createPostgresConnection()
  
  try {
    await runPostgresMigrations(db)
    await setupPostgresTestData(db)
    return { db, close }
  } catch (error) {
    await close()
    throw error
  }
}