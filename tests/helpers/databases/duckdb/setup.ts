/**
 * DuckDB-specific setup utilities for testing
 * Uses @duckdb/node-api and drizzle-orm for DuckDB compatibility
 */

import { sql } from 'drizzle-orm'
import { duckdbTestSchema, employees, departments, productivity, timeEntries, analyticsPages, teams, employeeTeams, products, sales, inventory } from './schema'
import { enhancedDepartments, enhancedEmployees, enhancedTeams, enhancedEmployeeTeams, generateComprehensiveProductivityData, generateComprehensiveTimeEntriesData, enhancedProducts, enhancedSales, enhancedInventory } from '../../enhanced-test-data'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Dynamic imports for DuckDB since it's an optional peer dependency
let DuckDBInstance: any
let drizzle: any

async function loadDuckDBDependencies() {
  if (!DuckDBInstance) {
    try {
      const duckdbModule = await import('@duckdb/node-api')
      DuckDBInstance = duckdbModule.DuckDBInstance
    } catch (error) {
      throw new Error('DuckDB dependencies not installed. Install @duckdb/node-api and @leonardovida-md/drizzle-neo-duckdb')
    }
  }
  if (!drizzle) {
    try {
      // Try the neo-duckdb drizzle adapter
      const drizzleModule = await import('@leonardovida-md/drizzle-neo-duckdb')
      drizzle = drizzleModule.drizzle
    } catch (error) {
      throw new Error('Drizzle DuckDB adapter not installed. Install @leonardovida-md/drizzle-neo-duckdb')
    }
  }
}

// Shared database path for all DuckDB tests
const DUCKDB_TEST_DB_PATH = path.join(os.tmpdir(), 'drizzle-cube-test', 'test.duckdb')

/**
 * Create DuckDB connection for testing
 * Uses in-memory database for test isolation (each test gets its own DB)
 * Note: DuckDB doesn't support concurrent file access, so in-memory is required for parallel tests
 */
export async function createDuckDBConnection() {
  await loadDuckDBDependencies()

  // Use in-memory database for test isolation
  // DuckDB file-based databases have locking issues with concurrent access
  const instance = await DuckDBInstance.create(':memory:')
  const connection = await instance.connect()
  const db = drizzle(connection, { schema: duckdbTestSchema })

  return {
    db,
    instance,
    connection,
    dbPath: ':memory:',
    close: async () => {
      connection.disconnectSync()
      // Instance cleanup is automatic via GC
    }
  }
}

/**
 * Create in-memory DuckDB connection for isolated testing
 */
export async function createInMemoryDuckDBConnection() {
  await loadDuckDBDependencies()

  const instance = await DuckDBInstance.create(':memory:')
  const connection = await instance.connect()
  const db = drizzle(connection, { schema: duckdbTestSchema })

  return {
    db,
    instance,
    connection,
    close: async () => {
      connection.disconnectSync()
      // Instance cleanup is automatic via GC
    }
  }
}

/**
 * Clean up the shared DuckDB test database
 * Called during global teardown
 */
export function cleanupDuckDBTestDatabase() {
  try {
    if (fs.existsSync(DUCKDB_TEST_DB_PATH)) {
      fs.unlinkSync(DUCKDB_TEST_DB_PATH)
      // Also clean up WAL files if they exist
      const walPath = DUCKDB_TEST_DB_PATH + '.wal'
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath)
      }
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Create DuckDB tables (DuckDB doesn't use traditional migrations like PostgreSQL)
 * We create tables directly using SQL
 */
export async function createDuckDBTables(db: any) {

  // Drop tables if they exist (in reverse order of dependencies)
  await db.execute(sql`DROP TABLE IF EXISTS employee_teams`)
  await db.execute(sql`DROP TABLE IF EXISTS time_entries`)
  await db.execute(sql`DROP TABLE IF EXISTS productivity`)
  await db.execute(sql`DROP TABLE IF EXISTS employees`)
  await db.execute(sql`DROP TABLE IF EXISTS teams`)
  await db.execute(sql`DROP TABLE IF EXISTS departments`)
  await db.execute(sql`DROP TABLE IF EXISTS analytics_pages`)
  await db.execute(sql`DROP TABLE IF EXISTS sales`)
  await db.execute(sql`DROP TABLE IF EXISTS inventory`)
  await db.execute(sql`DROP TABLE IF EXISTS products`)

  // Create tables using DuckDB-compatible SQL
  // DuckDB doesn't support GENERATED ALWAYS AS IDENTITY - use sequences instead

  // Drop sequences if they exist
  await db.execute(sql`DROP SEQUENCE IF EXISTS departments_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS employees_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS productivity_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS time_entries_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS analytics_pages_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS teams_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS employee_teams_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS products_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS sales_id_seq`)
  await db.execute(sql`DROP SEQUENCE IF EXISTS inventory_id_seq`)

  // Create sequences for auto-increment
  await db.execute(sql`CREATE SEQUENCE departments_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE employees_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE productivity_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE time_entries_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE analytics_pages_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE teams_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE employee_teams_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE products_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE sales_id_seq START 1`)
  await db.execute(sql`CREATE SEQUENCE inventory_id_seq START 1`)

  await db.execute(sql`
    CREATE TABLE departments (
      id INTEGER PRIMARY KEY DEFAULT nextval('departments_id_seq'),
      name TEXT NOT NULL,
      organisation_id INTEGER NOT NULL,
      budget REAL
    )
  `)

  await db.execute(sql`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY DEFAULT nextval('employees_id_seq'),
      name TEXT NOT NULL,
      email TEXT,
      active BOOLEAN DEFAULT TRUE,
      department_id INTEGER,
      organisation_id INTEGER NOT NULL,
      salary REAL,
      tags VARCHAR(100)[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE productivity (
      id INTEGER PRIMARY KEY DEFAULT nextval('productivity_id_seq'),
      employee_id INTEGER NOT NULL,
      date TIMESTAMP NOT NULL,
      lines_of_code INTEGER DEFAULT 0,
      pull_requests INTEGER DEFAULT 0,
      live_deployments INTEGER DEFAULT 0,
      days_off BOOLEAN DEFAULT FALSE,
      happiness_index INTEGER,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE time_entries (
      id INTEGER PRIMARY KEY DEFAULT nextval('time_entries_id_seq'),
      employee_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      date TIMESTAMP NOT NULL,
      allocation_type TEXT NOT NULL,
      hours REAL NOT NULL,
      description TEXT,
      billable_hours REAL DEFAULT 0,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE analytics_pages (
      id INTEGER PRIMARY KEY DEFAULT nextval('analytics_pages_id_seq'),
      name TEXT NOT NULL,
      description TEXT,
      organisation_id INTEGER NOT NULL,
      config TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE teams (
      id INTEGER PRIMARY KEY DEFAULT nextval('teams_id_seq'),
      name TEXT NOT NULL,
      description TEXT,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE employee_teams (
      id INTEGER PRIMARY KEY DEFAULT nextval('employee_teams_id_seq'),
      employee_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      role TEXT,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Star schema tables
  await db.execute(sql`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY DEFAULT nextval('products_id_seq'),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL,
      price REAL NOT NULL,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY DEFAULT nextval('sales_id_seq'),
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      revenue REAL NOT NULL,
      sale_date TIMESTAMP NOT NULL,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE inventory (
      id INTEGER PRIMARY KEY DEFAULT nextval('inventory_id_seq'),
      product_id INTEGER NOT NULL,
      warehouse TEXT NOT NULL,
      stock_level INTEGER NOT NULL,
      organisation_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

/**
 * Setup DuckDB test data
 */
export async function setupDuckDBTestData(db: any) {

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
  // Also sanitize tags for DuckDB - it can't handle null or empty arrays with type ANY
  const updatedEmployees = enhancedEmployees.map(emp => {
    // DuckDB requires non-empty arrays or exclude the field entirely
    // For null/empty tags, we need to use a placeholder or omit the field
    // Using a placeholder array with a marker value that we can filter in queries if needed
    const sanitizedTags = (!emp.tags || emp.tags.length === 0)
      ? ['__empty__']  // Placeholder for empty/null tags
      : emp.tags

    return {
      ...emp,
      tags: sanitizedTags,
      departmentId: emp.departmentId ? insertedDepartments[emp.departmentId - 1]?.id || null : null
    }
  })

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
  // DuckDB uses text for config column, so we need to stringify the JSON
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

  // Insert star schema test data
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
}

/**
 * Full DuckDB setup: create tables + test data
 */
export async function setupDuckDBDatabase() {
  const { db, close } = await createDuckDBConnection()

  try {
    await createDuckDBTables(db)
    await setupDuckDBTestData(db)
    return {
      db,
      close: async () => {
        await close()
        cleanupDuckDBTestDatabase()
      }
    }
  } catch (error) {
    await close()
    throw error
  }
}
