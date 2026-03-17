/**
 * Databend-specific setup utilities for testing
 * Uses databend-driver (NAPI-RS bindings to BendSQL) and drizzle-databend
 */

import { sql } from 'drizzle-orm'
import { databendTestSchema, employees, departments, productivity, timeEntries, analyticsPages, teams, employeeTeams, products, sales, inventory } from './schema'
import { enhancedDepartments, enhancedEmployees, enhancedTeams, enhancedEmployeeTeams, generateComprehensiveProductivityData, generateComprehensiveTimeEntriesData, enhancedProducts, enhancedSales, enhancedInventory } from '../../enhanced-test-data'

// Dynamic imports for Databend since it's an optional peer dependency
let drizzleFn: any

async function loadDatabendDependencies() {
  if (!drizzleFn) {
    try {
      const drizzleModule = await import('drizzle-databend')
      drizzleFn = drizzleModule.drizzle
    } catch {
      throw new Error('Databend dependencies not installed. Install databend-driver and drizzle-databend')
    }
  }
}

/**
 * Get the Databend DSN for testing
 */
function getDatabendDSN(): string {
  return process.env.DATABEND_DSN || 'databend://databend:databend@localhost:18000/default?sslmode=disable'
}

/**
 * Wait for Databend to be healthy
 */
async function waitForDatabend(maxRetries = 10, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:18000/health')
      if (response.ok) {
        return
      }
    } catch {
      // Not ready yet
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error(`Databend health check failed after ${maxRetries} retries`)
}

/**
 * Create Databend connection for testing
 */
export async function createDatabendConnection() {
  await loadDatabendDependencies()

  const dsn = getDatabendDSN()
  // drizzle() with a DSN string is async - returns a Promise
  const db = await drizzleFn(dsn, { schema: databendTestSchema })

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
 * Create Databend tables
 * Databend doesn't support sequences or auto-increment in the traditional sense
 * We use explicit integer IDs with COALESCE(MAX(id), 0) + 1 pattern
 */
export async function createDatabendTables(db: any) {
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

  // Create tables using Databend-compatible SQL
  // Databend doesn't support sequences - use explicit integer IDs
  await db.execute(sql`
    CREATE TABLE departments (
      id INT NOT NULL,
      name VARCHAR NOT NULL,
      organisation_id INT NOT NULL,
      budget FLOAT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE employees (
      id INT NOT NULL,
      name VARCHAR NOT NULL,
      email VARCHAR NULL,
      active BOOLEAN DEFAULT TRUE,
      department_id INT NULL,
      organisation_id INT NOT NULL,
      salary FLOAT NULL,
      tags VARCHAR NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE productivity (
      id INT NOT NULL,
      employee_id INT NOT NULL,
      date TIMESTAMP NOT NULL,
      lines_of_code INT DEFAULT 0,
      pull_requests INT DEFAULT 0,
      live_deployments INT DEFAULT 0,
      days_off BOOLEAN DEFAULT FALSE,
      happiness_index INT NULL,
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE time_entries (
      id INT NOT NULL,
      employee_id INT NOT NULL,
      department_id INT NOT NULL,
      date TIMESTAMP NOT NULL,
      allocation_type VARCHAR NOT NULL,
      hours FLOAT NOT NULL,
      description VARCHAR NULL,
      billable_hours FLOAT DEFAULT 0,
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE analytics_pages (
      id INT NOT NULL,
      name VARCHAR NOT NULL,
      description VARCHAR NULL,
      organisation_id INT NOT NULL,
      config VARCHAR NOT NULL,
      "order" INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE teams (
      id INT NOT NULL,
      name VARCHAR NOT NULL,
      description VARCHAR NULL,
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE employee_teams (
      id INT NOT NULL,
      employee_id INT NOT NULL,
      team_id INT NOT NULL,
      role VARCHAR NULL,
      joined_at TIMESTAMP DEFAULT NOW(),
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  // Star schema tables
  await db.execute(sql`
    CREATE TABLE products (
      id INT NOT NULL,
      name VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      sku VARCHAR NOT NULL,
      price FLOAT NOT NULL,
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE sales (
      id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      revenue FLOAT NOT NULL,
      sale_date TIMESTAMP NOT NULL,
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE inventory (
      id INT NOT NULL,
      product_id INT NOT NULL,
      warehouse VARCHAR NOT NULL,
      stock_level INT NOT NULL,
      organisation_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

/**
 * Setup Databend test data
 */
export async function setupDatabendTestData(db: any) {
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
  // Databend doesn't support RETURNING, so we use explicit IDs
  const deptValues = enhancedDepartments.map((dept, i) => ({
    ...dept,
    id: i + 1
  }))
  await db.insert(departments).values(deptValues)

  // Map department IDs for employees
  const updatedEmployees = enhancedEmployees.map((emp, i) => {
    // Convert tags array to comma-separated string for Databend
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

  // Insert comprehensive productivity data
  // Databend doesn't support 'default' keyword in INSERT VALUES, so we must provide explicit createdAt
  const now = new Date()
  const productivityData = generateComprehensiveProductivityData(insertedEmployees)
  const productivityWithIds = productivityData.map((p, i) => ({ ...p, id: i + 1, createdAt: now }))

  // Insert in batches (large batches to minimize round-trips)
  const batchSize = 1000
  for (let i = 0; i < productivityWithIds.length; i += batchSize) {
    const batch = productivityWithIds.slice(i, i + batchSize)
    await db.insert(productivity).values(batch)
  }

  // Insert comprehensive time entries data
  const insertedDepartments = deptValues.map(d => ({
    id: d.id,
    name: d.name,
    organisationId: d.organisationId
  }))
  const timeEntriesData = generateComprehensiveTimeEntriesData(insertedEmployees, insertedDepartments)
  const timeEntriesWithIds = timeEntriesData.map((t, i) => ({ ...t, id: i + 1, createdAt: now }))

  const timeEntriesBatchSize = 2000
  for (let i = 0; i < timeEntriesWithIds.length; i += timeEntriesBatchSize) {
    const batch = timeEntriesWithIds.slice(i, i + timeEntriesBatchSize)
    await db.insert(timeEntries).values(batch)
  }

  // Insert teams data
  const teamValues = enhancedTeams.map((team, i) => ({ ...team, id: i + 1 }))
  await db.insert(teams).values(teamValues)

  // Insert employee-team relationships
  // Add explicit createdAt since Databend doesn't support 'default' in INSERT VALUES
  const updatedEmployeeTeams = enhancedEmployeeTeams.map((et, i) => ({
    ...et,
    id: i + 1,
    createdAt: now
  }))
  await db.insert(employeeTeams).values(updatedEmployeeTeams)

  // Insert analytics pages data
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

  await db.insert(analyticsPages).values(analyticsData)

  // Insert star schema test data
  // Add explicit createdAt for all star schema tables
  const productValues = enhancedProducts.map((p, i) => ({ ...p, id: i + 1, createdAt: now }))
  await db.insert(products).values(productValues)

  const updatedSales = enhancedSales.map((sale, i) => ({
    ...sale,
    id: i + 1,
    createdAt: now
  }))
  await db.insert(sales).values(updatedSales)

  const updatedInventory = enhancedInventory.map((inv, i) => ({
    ...inv,
    id: i + 1,
    createdAt: now
  }))
  await db.insert(inventory).values(updatedInventory)
}

/**
 * Full Databend setup: create tables + test data
 */
export async function setupDatabendDatabase() {
  // Wait for Databend to be healthy
  await waitForDatabend()

  const { db, close } = await createDatabendConnection()

  try {
    await createDatabendTables(db)
    await setupDatabendTestData(db)

    return {
      db,
      close
    }
  } catch (error) {
    close()
    throw error
  }
}
