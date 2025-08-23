/**
 * SQLite-specific setup utilities for testing
 */

import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { sql } from 'drizzle-orm'
import Database from 'better-sqlite3'
import { sqliteTestSchema, employees, departments, productivity, analyticsPages } from './schema'
import { enhancedDepartments, enhancedEmployees, generateComprehensiveProductivityData } from '../../enhanced-test-data'
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
    try {
      await migrate(db, { 
        migrationsFolder: './tests/helpers/databases/sqlite/migrations' 
      })
      console.log('SQLite migrations completed successfully')
    } catch (migrationError) {
      // If no migrations folder exists, create tables from schema directly
      console.log('No SQLite migrations found, creating tables directly...')
      createTablesDirectly(client)
      console.log('SQLite tables created successfully')
    }
  } catch (error) {
    console.log('SQLite migrations error:', (error as Error).message)
    throw error
  }
}

/**
 * Create tables directly using better-sqlite3 client
 */
function createTablesDirectly(client: Database) {
  // Create departments table
  client.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      organisation_id INTEGER NOT NULL,
      budget REAL
    )
  `)

  // Create employees table  
  client.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      active INTEGER DEFAULT 1,
      department_id INTEGER,
      organisation_id INTEGER NOT NULL,
      salary REAL,
      created_at INTEGER
    )
  `)

  // Create productivity table
  client.exec(`
    CREATE TABLE IF NOT EXISTS productivity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date INTEGER NOT NULL,
      lines_of_code INTEGER DEFAULT 0,
      pull_requests INTEGER DEFAULT 0,
      live_deployments INTEGER DEFAULT 0,
      days_off INTEGER DEFAULT 0,
      happiness_index INTEGER,
      organisation_id INTEGER NOT NULL,
      created_at INTEGER
    )
  `)

  // Create analytics_pages table
  client.exec(`
    CREATE TABLE IF NOT EXISTS analytics_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      organisation_id INTEGER NOT NULL,
      config TEXT NOT NULL,
      'order' INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    )
  `)
}

/**
 * Setup SQLite test data
 */
export async function setupSQLiteTestData(db: ReturnType<typeof drizzle>) {
  console.log('Setting up SQLite test data...')
  
  // Clear existing data to ensure clean test state
  await db.delete(productivity)
  await db.delete(employees) 
  await db.delete(departments)
  await db.delete(analyticsPages)

  console.log('Inserting test departments into SQLite...')
  
  // Insert departments first (dependencies)
  const insertedDepartments = await db.insert(departments)
    .values(enhancedDepartments)
    .returning({ id: departments.id, name: departments.name })

  console.log(`Inserted ${insertedDepartments.length} departments`)

  console.log('Inserting test employees into SQLite...')
  
  // Update employee department IDs to match actual inserted department IDs
  const updatedEmployees = enhancedEmployees.map(emp => ({
    ...emp,
    departmentId: emp.departmentId ? insertedDepartments[emp.departmentId - 1]?.id || null : null
  }))
  
  // Insert employees
  const insertedEmployees = await db.insert(employees)
    .values(updatedEmployees)
    .returning({ id: employees.id, name: employees.name, organisationId: employees.organisationId, active: employees.active })

  console.log(`Inserted ${insertedEmployees.length} employees`)

  // Insert comprehensive productivity data
  console.log('Generating comprehensive productivity data for SQLite...')
  const productivityData = generateComprehensiveProductivityData(insertedEmployees)
  
  console.log('Inserting comprehensive productivity data into SQLite...')
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 100
  for (let i = 0; i < productivityData.length; i += batchSize) {
    const batch = productivityData.slice(i, i + batchSize)
    await db.insert(productivity).values(batch)
  }

  console.log(`Total productivity records inserted into SQLite: ${productivityData.length}`)
  
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
  console.log(`Inserted ${analyticsData.length} analytics pages into SQLite`)

  console.log('SQLite test database setup complete')
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