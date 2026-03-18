/**
 * Snowflake-specific setup utilities for testing
 * Uses snowflake-sdk and drizzle-snowflake
 * Snowflake is cloud-only — requires SNOWFLAKE_ACCOUNT env vars
 */

import { sql } from 'drizzle-orm'
import { snowflakeTestSchema, employees, departments, productivity, timeEntries, analyticsPages, teams, employeeTeams, products, sales, inventory } from './schema'
import { enhancedDepartments, enhancedEmployees, enhancedTeams, enhancedEmployeeTeams, generateComprehensiveProductivityData, generateComprehensiveTimeEntriesData, enhancedProducts, enhancedSales, enhancedInventory } from '../../enhanced-test-data'

// Dynamic imports for Snowflake since it's an optional peer dependency
let drizzleFn: any
let snowflakeSdkConfigured = false

async function loadSnowflakeDependencies() {
  if (!drizzleFn) {
    try {
      const drizzleModule = await import('drizzle-snowflake')
      drizzleFn = drizzleModule.drizzle
    } catch {
      throw new Error('Snowflake dependencies not installed. Install snowflake-sdk and drizzle-snowflake')
    }
  }

  // Suppress verbose snowflake-sdk logging (only needs to happen once)
  if (!snowflakeSdkConfigured) {
    try {
      const snowflakeSdk = await import('snowflake-sdk')
      snowflakeSdk.default.configure({ logLevel: 'OFF' })
      snowflakeSdkConfigured = true
    } catch {
      // Non-critical — just means logging won't be suppressed
    }
  }
}

/**
 * Get Snowflake connection config from environment variables
 */
function getSnowflakeConfig() {
  const account = process.env.SNOWFLAKE_ACCOUNT
  const username = process.env.SNOWFLAKE_USER
  const password = process.env.SNOWFLAKE_PASSWORD
  const database = process.env.SNOWFLAKE_DATABASE || 'DRIZZLE_CUBE_TEST'
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH'
  const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC'

  if (!account || !username || !password) {
    throw new Error(
      'Snowflake credentials required. Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, and SNOWFLAKE_PASSWORD environment variables.'
    )
  }

  return { account, username, password, database, warehouse, schema }
}

/**
 * Wait for Snowflake to be reachable by trying a SELECT 1 query
 */
async function waitForSnowflake(db: any, maxRetries = 5, delayMs = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.execute(sql`SELECT 1`)
      return
    } catch {
      // Not ready yet
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error(`Snowflake connection check failed after ${maxRetries} retries`)
}

/**
 * Create Snowflake connection for testing
 */
export async function createSnowflakeConnection() {
  await loadSnowflakeDependencies()

  const config = getSnowflakeConfig()
  // initStatements runs on every new connection (including pooled ones),
  // ensuring QUOTED_IDENTIFIERS_IGNORE_CASE is set on all connections.
  // Without this, drizzle-snowflake's quoted "column_name" would not match
  // Snowflake's uppercase COLUMN_NAME in cross-CTE references.
  // For tests we disable pooling to keep things simple; in production,
  // initStatements works with the pool too (runs on each new pool member).
  const db = await drizzleFn({
    connection: {
      account: config.account,
      username: config.username,
      password: config.password,
      database: config.database,
      warehouse: config.warehouse,
      schema: config.schema,
    },
    schema: snowflakeTestSchema,
    pool: false,
    initStatements: [
      'ALTER SESSION SET QUOTED_IDENTIFIERS_IGNORE_CASE = TRUE',
    ],
  })

  return {
    db,
    close: async () => {
      if (db && typeof db.close === 'function') {
        await db.close()
      }
    }
  }
}

/**
 * Create Snowflake tables
 * Snowflake doesn't support sequences or auto-increment
 * We use explicit integer IDs
 */
export async function createSnowflakeTables(db: any) {
  // Drop tables if they exist (in reverse order of dependencies)
  // Quoted lowercase names — drizzle-snowflake v0.1.9 quotes identifiers by default
  await db.execute(sql`DROP TABLE IF EXISTS "employee_teams"`)
  await db.execute(sql`DROP TABLE IF EXISTS "time_entries"`)
  await db.execute(sql`DROP TABLE IF EXISTS "productivity"`)
  await db.execute(sql`DROP TABLE IF EXISTS "employees"`)
  await db.execute(sql`DROP TABLE IF EXISTS "teams"`)
  await db.execute(sql`DROP TABLE IF EXISTS "departments"`)
  await db.execute(sql`DROP TABLE IF EXISTS "analytics_pages"`)
  await db.execute(sql`DROP TABLE IF EXISTS "sales"`)
  await db.execute(sql`DROP TABLE IF EXISTS "inventory"`)
  await db.execute(sql`DROP TABLE IF EXISTS "products"`)

  // Create tables with quoted lowercase identifiers
  // drizzle-snowflake v0.1.9 quotes identifiers by default (escapeName returns quoted names)
  // so DDL must match: quoted lowercase column/table names
  await db.execute(sql`
    CREATE TABLE "departments" (
      "id" INTEGER NOT NULL,
      "name" VARCHAR NOT NULL,
      "organisation_id" INTEGER NOT NULL,
      "budget" FLOAT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE "employees" (
      "id" INTEGER NOT NULL,
      "name" VARCHAR NOT NULL,
      "email" VARCHAR NULL,
      "active" BOOLEAN DEFAULT TRUE,
      "department_id" INTEGER NULL,
      "organisation_id" INTEGER NOT NULL,
      "salary" FLOAT NULL,
      "tags" VARCHAR NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "productivity" (
      "id" INTEGER NOT NULL,
      "employee_id" INTEGER NOT NULL,
      "date" TIMESTAMP NOT NULL,
      "lines_of_code" INTEGER DEFAULT 0,
      "pull_requests" INTEGER DEFAULT 0,
      "live_deployments" INTEGER DEFAULT 0,
      "days_off" BOOLEAN DEFAULT FALSE,
      "happiness_index" INTEGER NULL,
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "time_entries" (
      "id" INTEGER NOT NULL,
      "employee_id" INTEGER NOT NULL,
      "department_id" INTEGER NOT NULL,
      "date" TIMESTAMP NOT NULL,
      "allocation_type" VARCHAR NOT NULL,
      "hours" FLOAT NOT NULL,
      "description" VARCHAR NULL,
      "billable_hours" FLOAT DEFAULT 0,
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "analytics_pages" (
      "id" INTEGER NOT NULL,
      "name" VARCHAR NOT NULL,
      "description" VARCHAR NULL,
      "organisation_id" INTEGER NOT NULL,
      "config" VARCHAR NOT NULL,
      "order" INTEGER DEFAULT 0,
      "is_active" BOOLEAN DEFAULT TRUE,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "teams" (
      "id" INTEGER NOT NULL,
      "name" VARCHAR NOT NULL,
      "description" VARCHAR NULL,
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "employee_teams" (
      "id" INTEGER NOT NULL,
      "employee_id" INTEGER NOT NULL,
      "team_id" INTEGER NOT NULL,
      "role" VARCHAR NULL,
      "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  // Star schema tables
  await db.execute(sql`
    CREATE TABLE "products" (
      "id" INTEGER NOT NULL,
      "name" VARCHAR NOT NULL,
      "category" VARCHAR NOT NULL,
      "sku" VARCHAR NOT NULL,
      "price" FLOAT NOT NULL,
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "sales" (
      "id" INTEGER NOT NULL,
      "product_id" INTEGER NOT NULL,
      "quantity" INTEGER NOT NULL,
      "revenue" FLOAT NOT NULL,
      "sale_date" TIMESTAMP NOT NULL,
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)

  await db.execute(sql`
    CREATE TABLE "inventory" (
      "id" INTEGER NOT NULL,
      "product_id" INTEGER NOT NULL,
      "warehouse" VARCHAR NOT NULL,
      "stock_level" INTEGER NOT NULL,
      "organisation_id" INTEGER NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `)
}

/**
 * Setup Snowflake test data
 */
export async function setupSnowflakeTestData(db: any) {
  // Clear existing data
  await db.delete(productivity)
  await db.delete(employeeTeams)
  await db.delete(timeEntries)
  await db.delete(employees)
  await db.delete(teams)
  await db.delete(departments)
  await db.delete(analyticsPages)
  await db.delete(sales)
  await db.delete(inventory)
  await db.delete(products)

  // Insert departments first (dependencies)
  const deptValues = enhancedDepartments.map((dept, i) => ({
    ...dept,
    id: i + 1
  }))
  await db.insert(departments).values(deptValues)

  // Map department IDs for employees
  const updatedEmployees = enhancedEmployees.map((emp, i) => {
    // Convert tags array to comma-separated string for Snowflake
    const tagsStr = emp.tags && emp.tags.length > 0 ? emp.tags.join(',') : null

    return {
      ...emp,
      id: i + 1,
      tags: tagsStr,
      departmentId: emp.departmentId ? emp.departmentId : null
    }
  })

  await db.insert(employees).values(updatedEmployees)

  // Build inserted employees reference for productivity data
  const insertedEmployees = updatedEmployees.map(e => ({
    id: e.id,
    name: e.name,
    organisationId: e.organisationId,
    active: e.active,
    departmentId: e.departmentId
  }))

  // Prepare all data upfront
  const now = new Date()
  const insertedDepartments = deptValues.map(d => ({
    id: d.id,
    name: d.name,
    organisationId: d.organisationId
  }))

  const productivityData = generateComprehensiveProductivityData(insertedEmployees)
  const productivityWithIds = productivityData.map((p, i) => ({ ...p, id: i + 1, createdAt: now }))

  const timeEntriesData = generateComprehensiveTimeEntriesData(insertedEmployees, insertedDepartments)
  const timeEntriesWithIds = timeEntriesData.map((t, i) => ({ ...t, id: i + 1, createdAt: now }))

  const teamValues = enhancedTeams.map((team, i) => ({ ...team, id: i + 1 }))
  const updatedEmployeeTeams = enhancedEmployeeTeams.map((et, i) => ({
    ...et,
    id: i + 1,
    createdAt: now
  }))

  const analyticsData = [
    {
      id: 1,
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
      id: 2,
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

  const productValues = enhancedProducts.map((p, i) => ({ ...p, id: i + 1, createdAt: now }))
  const updatedSales = enhancedSales.map((sale, i) => ({
    ...sale,
    id: i + 1,
    createdAt: now
  }))
  const updatedInventory = enhancedInventory.map((inv, i) => ({
    ...inv,
    id: i + 1,
    createdAt: now
  }))

  // Helper to insert in batches
  async function insertBatched(table: any, data: any[], batchSize: number) {
    for (let i = 0; i < data.length; i += batchSize) {
      await db.insert(table).values(data.slice(i, i + batchSize))
    }
  }

  // Insert all independent tables in parallel (pool: false means single connection,
  // but Snowflake handles pipelined requests fine on a single connection)
  // Note: with pool: false we serialize to avoid connection contention.
  // The main speedup comes from suppressing logging and removing pool overhead.
  await insertBatched(productivity, productivityWithIds, 1000)
  await insertBatched(timeEntries, timeEntriesWithIds, 2000)
  await db.insert(teams).values(teamValues)
  await db.insert(employeeTeams).values(updatedEmployeeTeams)
  await db.insert(analyticsPages).values(analyticsData)
  await db.insert(products).values(productValues)
  await db.insert(sales).values(updatedSales)
  await db.insert(inventory).values(updatedInventory)
}

/**
 * Ensure the Snowflake database exists by connecting without a database
 * and running CREATE DATABASE IF NOT EXISTS
 */
async function ensureDatabaseExists() {
  const config = getSnowflakeConfig()
  const snowflakeSdk = await import('snowflake-sdk')

  // Suppress verbose logging for this temporary connection too
  snowflakeSdk.default.configure({ logLevel: 'OFF' })

  // Create a temporary connection without a database to create it
  const tempConn = snowflakeSdk.default.createConnection({
    account: config.account,
    username: config.username,
    password: config.password,
    warehouse: config.warehouse,
  })

  await new Promise<void>((resolve, reject) => {
    tempConn.connect((err: Error | undefined) => {
      if (err) reject(err)
      else resolve()
    })
  })

  await new Promise<void>((resolve, reject) => {
    tempConn.execute({
      sqlText: `CREATE DATABASE IF NOT EXISTS "${config.database}"`,
      complete: (err: Error | undefined) => {
        if (err) reject(err)
        else resolve()
      }
    })
  })

  await new Promise<void>((resolve) => {
    tempConn.destroy(() => resolve())
  })
}

/**
 * Full Snowflake setup: create database + tables + test data
 */
export async function setupSnowflakeDatabase() {
  await ensureDatabaseExists()

  const { db, close } = await createSnowflakeConnection()

  try {
    // Wait for Snowflake to be reachable
    await waitForSnowflake(db)

    await createSnowflakeTables(db)
    await setupSnowflakeTestData(db)

    return {
      db,
      close
    }
  } catch (error) {
    close()
    throw error
  }
}
