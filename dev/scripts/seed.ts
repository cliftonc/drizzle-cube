/**
 * Database seeding script with sample data
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { employees, departments, productivity, prEvents, analyticsPages, settings, schema } from '../server/schema'
import { productivityDashboardConfig } from '../server/dashboard-config'

// Default connection string for CLI usage
const defaultConnectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54821/drizzle_cube_db'

// Auto-detect Neon vs local PostgreSQL based on connection string
function isNeonUrl(url: string): boolean {
  return url.includes('.neon.tech') || url.includes('neon.database')
}

// Create database connection factory
function createDatabase(databaseUrl: string) {
  if (isNeonUrl(databaseUrl)) {
    console.log('🚀 Connecting to Neon serverless database')
    const sql = neon(databaseUrl)
    return drizzleNeon(sql, { schema })
  } else {
    console.log('🐘 Connecting to local PostgreSQL database')
    const client = postgres(databaseUrl)
    return drizzle(client, { schema })
  }
}

// Sample data
const sampleDepartments = [
  { name: 'Engineering', organisationId: 1, budget: 500000 },
  { name: 'Marketing', organisationId: 1, budget: 250000 },
  { name: 'Sales', organisationId: 1, budget: 300000 },
  { name: 'HR', organisationId: 1, budget: 150000 }
]

const sampleEmployees = [
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

// PR Event types for funnel analysis
const PR_EVENT_TYPES = [
  'created',
  'review_requested',
  'reviewed',
  'changes_requested',
  'approved',
  'merged',
  'closed'
] as const

type PREventType = typeof PR_EVENT_TYPES[number]

// Employee PR activity profiles (PRs per month)
const employeePRProfiles: Record<number, { prActivityBase: number; canReview: boolean }> = {
  1: { prActivityBase: 12, canReview: true },   // Alex Chen - Senior, high PR volume
  2: { prActivityBase: 8, canReview: true },    // Sarah Johnson - Mid-level
  3: { prActivityBase: 5, canReview: true },    // Mike Rodriguez - DevOps (config PRs)
  4: { prActivityBase: 3, canReview: true },    // Emily Davis - QA (test PRs)
  5: { prActivityBase: 6, canReview: false },   // James Wilson - Junior (no review auth)
  6: { prActivityBase: 0, canReview: false },   // Lisa Martinez - Marketing (no PRs)
  7: { prActivityBase: 0, canReview: false },   // David Kim - Marketing
  8: { prActivityBase: 0, canReview: false },   // Rachel Green - Marketing
  9: { prActivityBase: 0, canReview: false },   // Tom Anderson - Sales
  10: { prActivityBase: 0, canReview: false },  // Nina Patel - Sales
  11: { prActivityBase: 0, canReview: false },  // Robert Taylor - HR
  12: { prActivityBase: 0, canReview: false }   // Jennifer Lee - HR
}

// Generate comprehensive productivity data from 2024 to current date
function generateProductivityData(insertedEmployees: any[]): any[] {
  const productivityData: any[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date() // Current date
  
  // Iterate through each day of the year
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    const month = date.getMonth() + 1
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = isHolidayDate(date)
    
    // Seasonal productivity modifier (Q4 holiday slowdown, Q1 sprint)
    let seasonalModifier = 1.0
    if (month === 12) seasonalModifier = 0.7 // December slowdown
    else if (month === 1) seasonalModifier = 1.2 // January sprint
    else if (month === 7 || month === 8) seasonalModifier = 0.85 // Summer slower
    
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
        
        // Vacation days (random 15-25 days per year)
        const vacationProbability = 0.04 + Math.random() * 0.03 // 4-7% chance per day
        if (Math.random() < vacationProbability / 365 * 20) { // Spread 20 vacation days
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
        departmentId: employee.departmentId,
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
    [7, 4],   // Independence Day
    [11, 11], // Veterans Day
    [12, 25], // Christmas
  ]

  return holidays.some(([m, d]) => month === m && day === d)
}

// Helper functions for PR event generation
function randomDateInRange(start: Date, end: Date): Date {
  const startTime = start.getTime()
  const endTime = end.getTime()
  return new Date(startTime + Math.random() * (endTime - startTime))
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

interface PREventData {
  prNumber: number
  eventType: PREventType
  employeeId: number
  organisationId: number
  timestamp: Date
}

// Generate PR event sequence for a single PR
function generatePREventSequence(
  prNumber: number,
  authorId: number,
  reviewers: { id: number }[],
  createdDate: Date
): PREventData[] {
  const events: PREventData[] = []
  let currentTime = new Date(createdDate)

  // 1. CREATED (100% - always happens)
  events.push({
    prNumber,
    eventType: 'created',
    employeeId: authorId,
    organisationId: 1,
    timestamp: new Date(currentTime)
  })

  // 2. REVIEW_REQUESTED (95% of PRs request review)
  if (Math.random() < 0.95 && reviewers.length > 0) {
    currentTime = addMinutes(currentTime, randomInt(5, 60))
    const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)]
    events.push({
      prNumber,
      eventType: 'review_requested',
      employeeId: reviewer.id,
      organisationId: 1,
      timestamp: new Date(currentTime)
    })

    // 3. REVIEWED / CHANGES_REQUESTED / APPROVED (85% get some review)
    if (Math.random() < 0.85) {
      currentTime = addMinutes(currentTime, randomInt(30, 480)) // 30 min to 8 hours

      // Determine review outcome
      const outcomeRoll = Math.random()
      if (outcomeRoll < 0.2) {
        // 20% - Just comments (reviewed)
        events.push({
          prNumber,
          eventType: 'reviewed',
          employeeId: reviewer.id,
          organisationId: 1,
          timestamp: new Date(currentTime)
        })
        // May get approved later (70% chance)
        if (Math.random() < 0.7) {
          currentTime = addMinutes(currentTime, randomInt(60, 1440))
          events.push({
            prNumber,
            eventType: 'approved',
            employeeId: reviewer.id,
            organisationId: 1,
            timestamp: new Date(currentTime)
          })
        }
      } else if (outcomeRoll < 0.4) {
        // 20% - Changes requested
        events.push({
          prNumber,
          eventType: 'changes_requested',
          employeeId: reviewer.id,
          organisationId: 1,
          timestamp: new Date(currentTime)
        })
        // 60% eventually get approved after changes
        if (Math.random() < 0.6) {
          currentTime = addMinutes(currentTime, randomInt(120, 2880)) // 2 hours to 2 days
          events.push({
            prNumber,
            eventType: 'approved',
            employeeId: reviewer.id,
            organisationId: 1,
            timestamp: new Date(currentTime)
          })
        }
      } else {
        // 60% - Direct approval
        events.push({
          prNumber,
          eventType: 'approved',
          employeeId: reviewer.id,
          organisationId: 1,
          timestamp: new Date(currentTime)
        })
      }
    }
  }

  // 4. MERGED or CLOSED (final state)
  const hasApproval = events.some(e => e.eventType === 'approved')
  if (hasApproval && Math.random() < 0.9) {
    // 90% of approved PRs get merged
    currentTime = addMinutes(currentTime, randomInt(10, 120))
    events.push({
      prNumber,
      eventType: 'merged',
      employeeId: authorId,
      organisationId: 1,
      timestamp: new Date(currentTime)
    })
  } else if (Math.random() < 0.3) {
    // 30% of unapproved PRs get closed
    currentTime = addMinutes(currentTime, randomInt(1440, 10080)) // 1-7 days
    events.push({
      prNumber,
      eventType: 'closed',
      employeeId: authorId,
      organisationId: 1,
      timestamp: new Date(currentTime)
    })
  }
  // Else: PR remains open (realistic - some PRs go stale)

  return events
}

// Generate PR events data for all employees
function generatePREventsData(insertedEmployees: { id: number; active: boolean }[]): PREventData[] {
  const allPREvents: PREventData[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date()

  let globalPRCounter = 1

  // Get employees with PR activity
  const prActiveEmployees = insertedEmployees.filter((emp, index) => {
    const profile = employeePRProfiles[index + 1]
    return profile && profile.prActivityBase > 0 && emp.active
  })

  // Get reviewers (employees who can review)
  const reviewerEmployees = insertedEmployees.filter((emp, index) => {
    const profile = employeePRProfiles[index + 1]
    return profile && profile.canReview && emp.active
  })

  // Generate PRs month by month
  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const monthStart = new Date(date)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    // Ensure we don't go past current date
    const effectiveMonthEnd = monthEnd > endDate ? endDate : monthEnd

    // Each active engineer creates PRs this month
    for (const employee of prActiveEmployees) {
      const employeeIndex = insertedEmployees.indexOf(employee) + 1
      const profile = employeePRProfiles[employeeIndex]

      if (!profile) continue

      // Monthly variation in PR count (70% to 130% of base)
      const monthlyPRCount = Math.round(
        profile.prActivityBase * (0.7 + Math.random() * 0.6)
      )

      for (let i = 0; i < monthlyPRCount; i++) {
        const prNumber = globalPRCounter++
        const prCreatedDate = randomDateInRange(monthStart, effectiveMonthEnd)

        // Get reviewers excluding the author
        const availableReviewers = reviewerEmployees.filter(r => r.id !== employee.id)

        // Generate event sequence for this PR
        const prEventSequence = generatePREventSequence(
          prNumber,
          employee.id,
          availableReviewers,
          prCreatedDate
        )

        allPREvents.push(...prEventSequence)
      }
    }
  }

  // Sort all events by timestamp for realistic ordering
  allPREvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  return allPREvents
}

// Use shared dashboard configuration
const sampleAnalyticsPage = {
  ...productivityDashboardConfig,
  organisationId: 1
}

export async function executeSeed(db?: any, connectionString?: string) {
  console.log('🌱 Seeding database with sample data...')
  
  // Use provided db or create one from connection string
  const finalConnectionString = connectionString || defaultConnectionString
  const database = db || createDatabase(finalConnectionString)
  let client: any = null
  
  // For cleanup, we need to handle both connection types (only when creating our own connection)
  if (!db && !isNeonUrl(finalConnectionString)) {
    client = postgres(finalConnectionString)
  }
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await database.delete(prEvents)
    await database.delete(productivity)
    await database.delete(employees)
    await database.delete(departments)
    await database.delete(analyticsPages)
    await database.delete(settings)
    
    // Insert departments first (referenced by employees)
    console.log('🏢 Inserting departments...')
    const insertedDepartments = await database.insert(departments)
      .values(sampleDepartments)
      .returning()
    
    console.log(`✅ Inserted ${insertedDepartments.length} departments`)
    
    // Update employee department IDs to match actual inserted IDs
    const updatedEmployees = sampleEmployees.map(emp => ({
      ...emp,
      departmentId: insertedDepartments[emp.departmentId - 1]?.id || null
    }))
    
    // Insert employees
    console.log('👥 Inserting employees...')
    const insertedEmployees = await database.insert(employees)
      .values(updatedEmployees)
      .returning()
    
    console.log(`✅ Inserted ${insertedEmployees.length} employees`)
    
    // Generate and insert productivity data
    console.log('📊 Generating productivity data from 2024 to current date...')
    const productivityData = generateProductivityData(insertedEmployees)
    console.log(`📊 Generated ${productivityData.length} productivity records`)
    
    // Insert productivity data in batches to avoid memory issues
    const batchSize = 1000
    let insertedProductivityCount = 0
    
    for (let i = 0; i < productivityData.length; i += batchSize) {
      const batch = productivityData.slice(i, i + batchSize)
      await database.insert(productivity).values(batch)
      insertedProductivityCount += batch.length
      console.log(`📊 Inserted productivity batch: ${insertedProductivityCount}/${productivityData.length}`)
    }
    
    console.log(`✅ Inserted ${insertedProductivityCount} productivity records`)

    // Generate and insert PR events data
    console.log('🔀 Generating PR events data...')
    const prEventsData = generatePREventsData(insertedEmployees)
    console.log(`🔀 Generated ${prEventsData.length} PR event records`)

    // Insert PR events in batches
    const prEventsBatchSize = 1000
    let insertedPREventsCount = 0

    for (let i = 0; i < prEventsData.length; i += prEventsBatchSize) {
      const batch = prEventsData.slice(i, i + prEventsBatchSize)
      await database.insert(prEvents).values(batch)
      insertedPREventsCount += batch.length
      console.log(`🔀 Inserted PR events batch: ${insertedPREventsCount}/${prEventsData.length}`)
    }

    console.log(`✅ Inserted ${insertedPREventsCount} PR event records`)

    // Insert sample analytics page
    console.log('📊 Inserting sample analytics page...')
    const insertedPage = await database.insert(analyticsPages)
      .values(sampleAnalyticsPage)
      .returning()
    
    console.log(`✅ Inserted analytics page: ${insertedPage[0].name}`)
    
    // Insert initial settings (including Gemini AI call counter)
    console.log('⚙️ Inserting initial settings...')
    const initialSettings = [
      {
        key: 'gemini-ai-calls',
        value: '0',
        organisationId: 1
      }
    ]
    
    const insertedSettings = await database.insert(settings)
      .values(initialSettings)
      .returning()
    
    console.log(`✅ Inserted ${insertedSettings.length} settings`)
    
    console.log('🎉 Database seeded successfully!')
    console.log('\n📊 What you can do now:')
    console.log('- Visit http://localhost:3000 to see the React dashboard')
    console.log('- View the sample "Executive Dashboard" with employee analytics')
    console.log('- Create new dashboards with custom charts')
    console.log('- Query the API at http://localhost:3001/cubejs-api/v1/meta')
    console.log('\n🔍 Sample queries you can try (using cube joins):')
    console.log('- Employee count by department: measures: ["Employees.count"], dimensions: ["Departments.name"], cubes: ["Employees", "Departments"]')
    console.log('- Salary analytics: measures: ["Employees.avgSalary", "Employees.totalSalary"], dimensions: ["Departments.name"], cubes: ["Employees", "Departments"]')
    console.log('- Active employees: measures: ["Employees.activeCount"], dimensions: ["Departments.name"], cubes: ["Employees", "Departments"]')
    
    return { success: true, message: 'Database seeded successfully' }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  } finally {
    // Only close client for non-Neon connections and when we created the connection
    if (client) {
      await client.end()
    }
  }
}

async function seedDatabase() {
  const result = await executeSeed()
  
  if (result.success) {
    process.exit(0)
  } else {
    console.error('❌ Seeding failed:', result.error)
    process.exit(1)
  }
}

seedDatabase()