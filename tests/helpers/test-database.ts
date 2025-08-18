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
import type { DatabaseExecutor } from '../../src/server'

// Import schema from dedicated schema file
import { testSchema, employees, departments, productivity, analyticsPages } from './schema'
import type { TestSchema } from './schema'
import { enhancedDepartments, enhancedEmployees, generateComprehensiveProductivityData } from './enhanced-test-data'

// Re-export for backward compatibility
export { testSchema, employees, departments, productivity, analyticsPages }
export type { TestSchema }

// Import cube utilities
import { defineCube } from '../../src/server/types-drizzle'
import type { Cube, QueryContext, BaseQueryDefinition } from '../../src/server/types-drizzle'

// Sample data - realistic company structure
export const sampleDepartments = [
  { name: 'Engineering', organisationId: 1, budget: 500000 },
  { name: 'Marketing', organisationId: 1, budget: 250000 },
  { name: 'Sales', organisationId: 1, budget: 300000 },
  { name: 'HR', organisationId: 1, budget: 150000 }
]

export const sampleEmployees = [
  // Engineering Team - Senior developers and DevOps
  {
    name: 'Alex Chen',
    email: 'alex.chen@company.com',
    active: true,
    departmentId: 1, // Engineering
    organisationId: 1,
    salary: 125000,
    createdAt: new Date('2022-03-15') // Senior, longer tenure
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    active: true,
    departmentId: 1, // Engineering
    organisationId: 1,
    salary: 95000,
    createdAt: new Date('2023-01-20')
  },
  {
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@company.com',
    active: true,
    departmentId: 1, // Engineering - DevOps specialist
    organisationId: 1,
    salary: 110000,
    createdAt: new Date('2022-08-10')
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    active: true,
    departmentId: 1, // Engineering - QA/Testing
    organisationId: 1,
    salary: 85000,
    createdAt: new Date('2023-03-05')
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    active: true,
    departmentId: 1, // Engineering - Junior developer
    organisationId: 1,
    salary: 75000,
    createdAt: new Date('2024-01-15')
  },
  
  // Marketing Team - Content and campaigns
  {
    name: 'Lisa Martinez',
    email: 'lisa.martinez@company.com',
    active: true,
    departmentId: 2, // Marketing - Team lead
    organisationId: 1,
    salary: 85000,
    createdAt: new Date('2022-11-20')
  },
  {
    name: 'David Kim',
    email: 'david.kim@company.com',
    active: true,
    departmentId: 2, // Marketing - Digital specialist
    organisationId: 1,
    salary: 72000,
    createdAt: new Date('2023-06-12')
  },
  {
    name: 'Rachel Green',
    email: 'rachel.green@company.com',
    active: false, // On leave
    departmentId: 2, // Marketing
    organisationId: 1,
    salary: 68000,
    createdAt: new Date('2023-02-28')
  },
  
  // Sales Team - Customer facing roles
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@company.com',
    active: true,
    departmentId: 3, // Sales - Senior closer
    organisationId: 1,
    salary: 90000,
    createdAt: new Date('2022-05-18')
  },
  {
    name: 'Nina Patel',
    email: 'nina.patel@company.com',
    active: true,
    departmentId: 3, // Sales - Account manager
    organisationId: 1,
    salary: 78000,
    createdAt: new Date('2023-08-22')
  },
  
  // HR Team - People operations
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    active: true,
    departmentId: 4, // HR - Director
    organisationId: 1,
    salary: 95000,
    createdAt: new Date('2021-12-01') // Most senior
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    active: true,
    departmentId: 4, // HR - Recruiter
    organisationId: 1,
    salary: 65000,
    createdAt: new Date('2023-10-15')
  }
]

// Employee role-based productivity profiles
const employeeProfiles: Record<number, { role: string; linesOfCodeBase: number; pullRequestsBase: number; deploymentsBase: number }> = {
  1: { role: 'Senior Engineer', linesOfCodeBase: 300, pullRequestsBase: 8, deploymentsBase: 2 },    // Alex Chen
  2: { role: 'Engineer', linesOfCodeBase: 250, pullRequestsBase: 6, deploymentsBase: 1 },           // Sarah Johnson  
  3: { role: 'DevOps Engineer', linesOfCodeBase: 150, pullRequestsBase: 4, deploymentsBase: 5 },    // Mike Rodriguez
  4: { role: 'QA Engineer', linesOfCodeBase: 100, pullRequestsBase: 12, deploymentsBase: 0 },       // Emily Davis
  5: { role: 'Junior Engineer', linesOfCodeBase: 180, pullRequestsBase: 4, deploymentsBase: 0 },    // James Wilson
  6: { role: 'Marketing Lead', linesOfCodeBase: 0, pullRequestsBase: 2, deploymentsBase: 0 },       // Lisa Martinez
  7: { role: 'Marketing Specialist', linesOfCodeBase: 0, pullRequestsBase: 1, deploymentsBase: 0 }, // David Kim
  8: { role: 'Marketing Content', linesOfCodeBase: 0, pullRequestsBase: 1, deploymentsBase: 0 },    // Rachel Green
  9: { role: 'Senior Sales', linesOfCodeBase: 0, pullRequestsBase: 0, deploymentsBase: 0 },         // Tom Anderson
  10: { role: 'Sales Account Mgr', linesOfCodeBase: 0, pullRequestsBase: 0, deploymentsBase: 0 },   // Nina Patel
  11: { role: 'HR Director', linesOfCodeBase: 0, pullRequestsBase: 1, deploymentsBase: 0 },         // Robert Taylor
  12: { role: 'HR Recruiter', linesOfCodeBase: 0, pullRequestsBase: 0, deploymentsBase: 0 }         // Jennifer Lee
}

// Generate comprehensive productivity data for testing
function generateProductivityData(insertedEmployees: any[]): any[] {
  const productivityData: any[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-03-31') // Limit to Q1 for faster test setup
  
  // Iterate through each day of the quarter
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    const month = date.getMonth() + 1
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = isHolidayDate(date)
    
    // Seasonal productivity modifier
    let seasonalModifier = 1.0
    if (month === 1) seasonalModifier = 1.2 // January sprint
    
    // Day of week productivity modifier
    let dayModifier = 1.0
    if (dayOfWeek === 1) dayModifier = 0.8 // Monday ramp-up
    else if (dayOfWeek === 5) dayModifier = 0.7 // Friday wind-down
    else if (dayOfWeek === 2 || dayOfWeek === 3) dayModifier = 1.1 // Tuesday/Wednesday peak
    
    insertedEmployees.forEach((employee, index) => {
      const employeeId = index + 1
      const profile = employeeProfiles[employeeId] || employeeProfiles[1]
      
      // Skip weekends and holidays for most employees
      const isWorkDay = !isWeekend && !isHoliday
      
      // Some employees might work occasionally on weekends (DevOps, Senior roles)
      const weekendWork = (profile.role.includes('Senior') || profile.role.includes('DevOps')) && 
                         Math.random() < 0.15 && isWeekend
      
      let daysOff = false
      let linesOfCode = 0
      let pullRequests = 0
      let liveDeployments = 0
      let happinessIndex = 7 // Base happiness
      
      if (!employee.active) {
        // Inactive employees have no productivity
        daysOff = true
        happinessIndex = 5
      } else if (!isWorkDay && !weekendWork) {
        // Regular days off
        daysOff = true
        happinessIndex = 8 // Higher happiness on days off
      } else {
        // Working day - generate realistic productivity
        const overallModifier = seasonalModifier * dayModifier * (0.7 + Math.random() * 0.6) // Random variation
        
        // Vacation days (random 5-10 days per quarter)
        const vacationProbability = 0.02 + Math.random() * 0.01 // 2-3% chance per day
        if (Math.random() < vacationProbability / 90 * 7) { // Spread 7 vacation days per quarter
          daysOff = true
          happinessIndex = 9 // Very happy on vacation
        } else {
          // Regular work day
          linesOfCode = Math.max(0, Math.round(profile.linesOfCodeBase * overallModifier * (0.5 + Math.random())))
          pullRequests = Math.max(0, Math.round(profile.pullRequestsBase * overallModifier * (0.3 + Math.random() * 0.8)))
          liveDeployments = Math.max(0, Math.round(profile.deploymentsBase * overallModifier * (0.2 + Math.random() * 0.9)))
          
          // Happiness correlates with productivity but has randomness
          const productivityScore = (linesOfCode + pullRequests * 50 + liveDeployments * 100) / 400
          happinessIndex = Math.max(1, Math.min(10, Math.round(6 + productivityScore * 2 + (Math.random() - 0.5) * 3)))
        }
      }
      
      productivityData.push({
        employeeId: employee.id,
        date: new Date(date),
        linesOfCode,
        pullRequests,
        liveDeployments,
        daysOff,
        happinessIndex,
        organisationId: 1
      })
    })
  }
  
  return productivityData
}

// Helper function to identify holidays
function isHolidayDate(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Major US holidays
  const holidays = [
    [1, 1],   // New Year's Day
  ]
  
  return holidays.some(([m, d]) => month === m && day === d)
}

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

  // Run Drizzle migrations first to ensure tables exist
  try {
    await migrate(db, { 
      migrationsFolder: './tests/helpers/migrations' 
    })
  } catch (error) {
    console.log('Migration error (may be normal):', error)
  }

  // Clean existing data to ensure clean state (with error handling for missing tables)
  try {
    await db.execute(sql`DELETE FROM productivity`)
  } catch (error) {
    // Table might not exist yet
  }
  try {
    await db.execute(sql`DELETE FROM analytics_pages`)
  } catch (error) {
    // Table might not exist yet
  }
  try {
    await db.execute(sql`DELETE FROM employees`)
  } catch (error) {
    // Table might not exist yet
  }
  try {
    await db.execute(sql`DELETE FROM departments`)
  } catch (error) {
    // Table might not exist yet
  }
  
  // Reset identity sequences (with error handling for missing sequences)
  try {
    await db.execute(sql`ALTER SEQUENCE employees_id_seq RESTART WITH 1`)
  } catch (error) {
    // Sequence might not exist yet
  }
  try {
    await db.execute(sql`ALTER SEQUENCE departments_id_seq RESTART WITH 1`)
  } catch (error) {
    // Sequence might not exist yet
  }
  try {
    await db.execute(sql`ALTER SEQUENCE productivity_id_seq RESTART WITH 1`)
  } catch (error) {
    // Sequence might not exist yet
  }
  try {
    await db.execute(sql`ALTER SEQUENCE analytics_pages_id_seq RESTART WITH 1`)
  } catch (error) {
    // Sequence might not exist yet
  }

  // Insert enhanced sample data - this should remain static throughout all tests
  const insertedDepartments = await db.insert(departments).values(enhancedDepartments).returning()
  
  // Update employee department IDs to match actual inserted IDs
  const updatedEmployees = enhancedEmployees.map(emp => ({
    ...emp,
    departmentId: emp.departmentId ? insertedDepartments.find(d => d.name === enhancedDepartments[emp.departmentId - 1]?.name)?.id || null : null
  }))
  
  const insertedEmployees = await db.insert(employees).values(updatedEmployees).returning()
  
  // Generate and insert comprehensive productivity data for testing
  const productivityData = generateComprehensiveProductivityData(insertedEmployees)
  
  // Insert productivity data in smaller batches for test database
  const batchSize = 500
  for (let i = 0; i < productivityData.length; i += batchSize) {
    const batch = productivityData.slice(i, i + batchSize)
    await db.insert(productivity).values(batch)
  }
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
 * Comprehensive test cube definitions using the test schema
 * These mirror the examples/hono cubes for realistic testing
 */

/**
 * Employees cube - comprehensive employee analytics
 */
export const testEmployeesCube: Cube<TestSchema> = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Comprehensive employee data with department information',
  
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
    },
    salary: {
      name: 'salary',
      title: 'Salary',
      type: 'number',
      sql: employees.salary
    },
    createdAt: {
      name: 'createdAt',
      title: 'Hire Date',
      type: 'time',
      sql: employees.createdAt
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
      sql: employees.salary,
      format: 'currency'
    },
    avgSalary: {
      name: 'avgSalary',
      title: 'Average Salary',
      type: 'avg',
      sql: employees.salary,
      format: 'currency'
    }
  },
  
  // Define joins to other cubes for multi-cube queries
  joins: {
    Productivity: {
      condition: (ctx) => eq(employees.id, productivity.employeeId)
    }
  }
})

/**
 * Departments cube - department-level analytics
 */
export const testDepartmentsCube: Cube<TestSchema> = defineCube('Departments', {
  title: 'Department Analytics',
  description: 'Department-level metrics and budget analysis',
  
  sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
    from: departments,
    where: eq(departments.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Department ID',
      type: 'number',
      sql: departments.id,
      primaryKey: true
    },
    name: {
      name: 'name',
      title: 'Department Name',
      type: 'string',
      sql: departments.name
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Department Count',
      type: 'count',
      sql: departments.id
    },
    totalBudget: {
      name: 'totalBudget',
      title: 'Total Budget',
      type: 'sum',
      sql: departments.budget,
      format: 'currency'
    },
    avgBudget: {
      name: 'avgBudget',
      title: 'Average Budget',
      type: 'avg',
      sql: departments.budget,
      format: 'currency'
    }
  }
})

/**
 * Productivity cube - comprehensive daily productivity metrics
 */
export const testProductivityCube: Cube<TestSchema> = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Daily productivity metrics including code output, deployments, and happiness tracking',
  
  sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
    from: productivity,
    joins: [
      {
        table: employees,
        on: and(
          eq(productivity.employeeId, employees.id),
          eq(employees.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      },
      {
        table: departments,
        on: and(
          eq(employees.departmentId, departments.id),
          eq(departments.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      }
    ],
    where: eq(productivity.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Record ID',
      type: 'number',
      sql: productivity.id,
      primaryKey: true
    },
    employeeName: {
      name: 'employeeName',
      title: 'Employee Name',
      type: 'string',
      sql: employees.name
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: departments.name
    },
    date: {
      name: 'date',
      title: 'Date',
      type: 'time',
      sql: productivity.date
    },
    isWorkDay: {
      name: 'isWorkDay',
      title: 'Work Day',
      type: 'boolean',
      sql: sql`NOT ${productivity.daysOff}`
    },
    isDayOff: {
      name: 'isDayOff',
      title: 'Day Off',
      type: 'boolean',
      sql: productivity.daysOff
    },
    happinessLevel: {
      name: 'happinessLevel',
      title: 'Happiness Level',
      type: 'string',
      sql: sql`CASE 
        WHEN ${productivity.happinessIndex} <= 3 THEN 'Low'
        WHEN ${productivity.happinessIndex} <= 6 THEN 'Medium'
        WHEN ${productivity.happinessIndex} <= 8 THEN 'High'
        ELSE 'Very High'
      END`
    }
  },
  
  measures: {
    totalLinesOfCode: {
      name: 'totalLinesOfCode',
      title: 'Total Lines of Code',
      type: 'sum',
      sql: productivity.linesOfCode
    },
    avgLinesOfCode: {
      name: 'avgLinesOfCode',
      title: 'Average Lines of Code',
      type: 'avg',
      sql: productivity.linesOfCode
    },
    totalPullRequests: {
      name: 'totalPullRequests',
      title: 'Total Pull Requests',
      type: 'sum',
      sql: productivity.pullRequests
    },
    avgPullRequests: {
      name: 'avgPullRequests',
      title: 'Average Pull Requests',
      type: 'avg',
      sql: productivity.pullRequests
    },
    totalDeployments: {
      name: 'totalDeployments',
      title: 'Total Deployments',
      type: 'sum',
      sql: productivity.liveDeployments
    },
    avgDeployments: {
      name: 'avgDeployments',
      title: 'Average Deployments',
      type: 'avg',
      sql: productivity.liveDeployments
    },
    avgHappinessIndex: {
      name: 'avgHappinessIndex',
      title: 'Average Happiness Index',
      type: 'avg',
      sql: productivity.happinessIndex
    },
    workingDaysCount: {
      name: 'workingDaysCount',
      title: 'Working Days',
      type: 'count',
      sql: productivity.id,
      filters: [
        (ctx) => eq(productivity.daysOff, false)
      ]
    },
    daysOffCount: {
      name: 'daysOffCount',
      title: 'Days Off',
      type: 'count',
      sql: productivity.id,
      filters: [
        (ctx) => eq(productivity.daysOff, true)
      ]
    },
    productivityScore: {
      name: 'productivityScore',
      title: 'Productivity Score',
      type: 'avg',
      sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
      description: 'Composite productivity score based on code output, reviews, and deployments'
    },
    recordCount: {
      name: 'recordCount',
      title: 'Total Records',
      type: 'count',
      sql: productivity.id
    }
  },
  
  // Define joins to other cubes for multi-cube queries
  joins: {
    Employees: {
      condition: (ctx) => eq(productivity.employeeId, employees.id)
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

// Export all test cubes for easy registration
export const allTestCubes = [
  testEmployeesCube,
  testDepartmentsCube,
  testProductivityCube
]