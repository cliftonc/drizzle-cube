/**
 * SQLite-specific setup utilities for testing
 */

import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { sql } from 'drizzle-orm'
import Database from 'better-sqlite3'
import { sqliteTestSchema, employees, departments, productivity, timeEntries, analyticsPages, teams, employeeTeams, products, sales, inventory } from './schema'
import { enhancedDepartments, enhancedEmployees, enhancedTeams, enhancedEmployeeTeams, generateComprehensiveProductivityData, generateComprehensiveTimeEntriesData, enhancedProducts, enhancedSales, enhancedInventory } from '../../enhanced-test-data'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Shared database path for all SQLite tests
const SQLITE_TEST_DB_PATH = path.join(os.tmpdir(), 'drizzle-cube-test', 'test.db')

/**
 * Create SQLite connection for testing
 * Uses a shared database file that persists across tests
 */
export function createSQLiteConnection() {
  // Ensure the test directory exists
  const tempDir = path.dirname(SQLITE_TEST_DB_PATH)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  
  const client = new Database(SQLITE_TEST_DB_PATH)
  const db = drizzle(client, { schema: sqliteTestSchema })
  
  return {
    db,
    client,
    dbPath: SQLITE_TEST_DB_PATH,
    close: () => {
      client.close()
    }
  }
}

/**
 * Clean up the shared SQLite test database
 * Called during global teardown
 */
export function cleanupSQLiteTestDatabase() {
  try {
    if (fs.existsSync(SQLITE_TEST_DB_PATH)) {
      fs.unlinkSync(SQLITE_TEST_DB_PATH)
      console.log('SQLite test database cleaned up')
    }
  } catch (error) {
    console.warn('Failed to clean up SQLite test database:', error)
  }
}

/**
 * Run SQLite migrations using Drizzle
 */
export async function runSQLiteMigrations(db: ReturnType<typeof drizzle>, client: Database) {
  console.log('Running SQLite migrations...')
  
  try {
    // Use Drizzle's migration system - try to run migrations, but don't fail if none exist    
    await migrate(db, { 
      migrationsFolder: './tests/helpers/databases/sqlite/migrations' 
    })
    console.log('SQLite migrations completed successfully')
    
  } catch (error) {
    console.log('SQLite migrations error:', (error as Error).message)
    throw error
  }
}

/**
 * Setup SQLite test data
 */
export async function setupSQLiteTestData(db: ReturnType<typeof drizzle>) {
  console.log('Setting up SQLite test data...')
  
  // Clear existing data to ensure clean test state
  await db.delete(productivity)
  await db.delete(employeeTeams)
  await db.delete(employees)
  await db.delete(teams)
  await db.delete(departments)
  await db.delete(analyticsPages)

  // Clear star schema tables
  await db.delete(sales)
  await db.delete(inventory)
  await db.delete(products)
 
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
  
  // Insert time entries in smaller batches (large dataset)
  const timeEntriesBatchSize = 200
  for (let i = 0; i < timeEntriesData.length; i += timeEntriesBatchSize) {
    const batch = timeEntriesData.slice(i, i + timeEntriesBatchSize)
    await db.insert(timeEntries).values(batch)
  }

  // Insert teams data
  const insertedTeams = await db.insert(teams)
    .values(enhancedTeams)
    .returning({ id: teams.id, name: teams.name, organisationId: teams.organisationId })

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
      config: {
        layout: [
          { i: 'employees-count', x: 0, y: 0, w: 6, h: 3 },
          { i: 'avg-salary', x: 6, y: 0, w: 6, h: 3 },
        ],
        portlets: [
          { id: 'employees-count', type: 'metric', title: 'Total Employees' },
          { id: 'avg-salary', type: 'metric', title: 'Average Salary' }
        ]
      }
    },
    { 
      name: 'Productivity Analytics', 
      organisationId: 1,
      createdAt: new Date('2024-01-15'),
      config: {
        layout: [
          { i: 'productivity-chart', x: 0, y: 0, w: 12, h: 6 },
        ],
        portlets: [
          { id: 'productivity-chart', type: 'chart', title: 'Lines of Code Over Time' }
        ]
      }
    }
  ]

  await db.insert(analyticsPages).values(analyticsData)

  // Insert star schema test data
  console.log('Inserting star schema test data...')

  // Insert products (dimension) first
  const insertedProducts = await db.insert(products)
    .values(enhancedProducts)
    .returning({ id: products.id, name: products.name, organisationId: products.organisationId })

  // Update sales with actual product IDs
  const updatedSales = enhancedSales.map(sale => ({
    ...sale,
    productId: insertedProducts[sale.productId - 1]?.id || sale.productId
  }))

  // Insert sales (fact table #1)
  await db.insert(sales).values(updatedSales)

  // Update inventory with actual product IDs
  const updatedInventory = enhancedInventory.map(inv => ({
    ...inv,
    productId: insertedProducts[inv.productId - 1]?.id || inv.productId
  }))

  // Insert inventory (fact table #2)
  await db.insert(inventory).values(updatedInventory)

  console.log('Star schema test data inserted successfully')
}

/**
 * Full SQLite setup: migrations + test data
 */
export async function setupSQLiteDatabase() {
  const { db, client, close } = createSQLiteConnection()
  
  try {
    await runSQLiteMigrations(db, client)
    await setupSQLiteTestData(db)
    return { 
      db, 
      close: () => {
        close()
        cleanupSQLiteTestDatabase()
      }
    }
  } catch (error) {
    close()
    throw error
  }
}