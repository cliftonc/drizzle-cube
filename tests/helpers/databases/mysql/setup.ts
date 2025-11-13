/**
 * MySQL-specific setup utilities with proper migration handling
 */

import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'
import { mysqlTestSchema as testSchema, employees, departments, productivity, timeEntries, analyticsPages, teams, employeeTeams } from './schema'
import { enhancedDepartments, enhancedEmployees, enhancedTeams, enhancedEmployeeTeams, generateComprehensiveProductivityData, generateComprehensiveTimeEntriesData } from '../../enhanced-test-data'

/**
 * Create MySQL connection for testing
 */
export async function createMySQLConnection() {
  const connectionString = process.env.MYSQL_TEST_DATABASE_URL || 'mysql://test:test@localhost:3307/drizzle_cube_test'
  
  // Create MySQL connection using promises
  const connection = await mysql.createConnection(connectionString)
  const db = drizzle(connection, { schema: testSchema, mode: 'default' })
  
  return {
    db,
    connection,
    close: async () => {
      await connection.end()
    }
  }
}

/**
 * Run MySQL migrations
 */
export async function runMySQLMigrations(db: ReturnType<typeof drizzle>) {
  console.log('Running MySQL migrations...')
  
  try {
    await migrate(db, { 
      migrationsFolder: './tests/helpers/databases/mysql/migrations' 
    })
    console.log('MySQL migrations completed successfully')
  } catch (error) {
    console.log('MySQL migrations completed or not needed:', (error as Error).message)
  }
}

/**
 * Setup MySQL test data
 */
export async function setupMySQLTestData(db: ReturnType<typeof drizzle>) {
  console.log('Setting up MySQL test data...')
  
  // Safety check: ensure we're using test database
  const dbUrl = process.env.MYSQL_TEST_DATABASE_URL || 'mysql://test:test@localhost:3307/drizzle_cube_test'
  if (!dbUrl.includes('test')) {
    throw new Error('Safety check failed: MYSQL_TEST_DATABASE_URL must contain "test" to prevent accidental production usage')
  }

  // Clear existing data to ensure clean test state
  // MySQL requires different order due to foreign key constraints
  await db.delete(productivity)
  await db.delete(employeeTeams)
  await db.delete(employees)
  await db.delete(teams)
  await db.delete(departments)
  await db.delete(analyticsPages)
  
  // Insert departments first (dependencies)
  await db.insert(departments).values(enhancedDepartments)
  
  // Fetch the inserted departments to get their actual IDs
  const insertedDepartments = await db.select({
    id: departments.id,
    name: departments.name,
    organisationId: departments.organisationId
  }).from(departments).orderBy(departments.id)

  // Update employee department IDs to match actual inserted department IDs
  const updatedEmployees = enhancedEmployees.map(emp => ({
    ...emp,
    departmentId: emp.departmentId ? insertedDepartments[emp.departmentId - 1]?.id || null : null
  }))
  
  // Insert employees
  await db.insert(employees).values(updatedEmployees)

  // For MySQL, we need to fetch the inserted employees to get their IDs
  const insertedEmployees = await db.select({ 
    id: employees.id, 
    name: employees.name,
    organisationId: employees.organisationId,
    active: employees.active,
    departmentId: employees.departmentId
  }).from(employees)
  // Insert comprehensive productivity data  
  const productivityData = generateComprehensiveProductivityData(insertedEmployees)
  
  // Insert in smaller batches for MySQL
  const batchSize = 50
  for (let i = 0; i < productivityData.length; i += batchSize) {
    const batch = productivityData.slice(i, i + batchSize)
    await db.insert(productivity).values(batch)
  }
  
  // Insert comprehensive time entries data for fan-out testing
  const timeEntriesData = generateComprehensiveTimeEntriesData(insertedEmployees, insertedDepartments)
  
  // Insert time entries in smaller batches for MySQL (large dataset)
  const timeEntriesBatchSize = 100
  for (let i = 0; i < timeEntriesData.length; i += timeEntriesBatchSize) {
    const batch = timeEntriesData.slice(i, i + timeEntriesBatchSize)
    await db.insert(timeEntries).values(batch)
  }

  // Insert teams data
  await db.insert(teams).values(enhancedTeams)

  // Fetch inserted teams
  const insertedTeams = await db.select({
    id: teams.id,
    name: teams.name,
    organisationId: teams.organisationId
  }).from(teams).orderBy(teams.id)

  // Update employeeTeams to use actual inserted IDs
  const updatedEmployeeTeams = enhancedEmployeeTeams.map(et => ({
    ...et,
    employeeId: insertedEmployees[et.employeeId - 1]?.id || et.employeeId,
    teamId: insertedTeams[et.teamId - 1]?.id || et.teamId
  }))

  // Insert employee-team relationships
  await db.insert(employeeTeams).values(updatedEmployeeTeams)

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
 * Full MySQL setup: migrations + test data
 */
export async function setupMySQLDatabase() {
  const { db, close } = await createMySQLConnection()
  
  try {
    await runMySQLMigrations(db)
    await setupMySQLTestData(db)
    return { db, close }
  } catch (error) {
    await close()
    throw error
  }
}