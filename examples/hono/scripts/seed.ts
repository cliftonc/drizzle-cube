/**
 * Database seeding script with sample data
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { employees, departments, productivity, analyticsPages, schema } from '../schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54921/drizzle_cube_db'

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

// Generate comprehensive productivity data for a full year
function generateProductivityData(insertedEmployees: any[]): any[] {
  const productivityData: any[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-12-31')
  
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

// Sample analytics page configuration - Advanced Productivity Dashboard
const sampleAnalyticsPage = {
  name: 'Productivity Analytics Dashboard',
  description: 'Comprehensive productivity analytics including code output, deployments, happiness tracking, and team performance insights',
  organisationId: 1,
  order: 0,
  config: {
    portlets: [
      // Top Row - Executive Overview
      {
        id: 'productivity-trends',
        title: 'Team Productivity Trends (Last 90 Days)',
        query: JSON.stringify({
          measures: ['Productivity.avgLinesOfCode'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'week'
          }],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }),
        chartType: 'line' as const,
        chartConfig: {
          x: 'Productivity.date.week',
          y: ['Productivity.avgLinesOfCode']
        },
        displayConfig: {
          showLegend: false
        },
        w: 8,
        h: 6,
        x: 0,
        y: 0
      },
      {
        id: 'happiness-by-level',
        title: 'Team Happiness Distribution',
        query: JSON.stringify({
          measures: ['Productivity.recordCount'],
          dimensions: ['Productivity.happinessLevel'],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }),
        chartType: 'pie' as const,
        chartConfig: {
          x: 'Productivity.happinessLevel',
          y: ['Productivity.recordCount']
        },
        displayConfig: {
          showLegend: true
        },
        w: 4,
        h: 6,
        x: 8,
        y: 0
      },
      
      // Second Row - Department Comparison
      {
        id: 'department-productivity',
        title: 'Productivity by Department',
        query: JSON.stringify({
          measures: ['Productivity.totalLinesOfCode', 'Productivity.totalPullRequests', 'Productivity.totalDeployments'],
          dimensions: ['Productivity.departmentName']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Productivity.departmentName',
          y: ['Productivity.totalLinesOfCode', 'Productivity.totalPullRequests', 'Productivity.totalDeployments']
        },
        displayConfig: {
          showLegend: true,
          stacked: false
        },
        w: 6,
        h: 6,
        x: 0,
        y: 6
      },
      {
        id: 'happiness-by-department',
        title: 'Happiness by Department',
        query: JSON.stringify({
          measures: ['Productivity.avgHappinessIndex'],
          dimensions: ['Productivity.departmentName']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Productivity.departmentName',
          y: ['Productivity.avgHappinessIndex']
        },
        displayConfig: {
          showLegend: false
        },
        w: 6,
        h: 6,
        x: 6,
        y: 6
      },
      
      // Third Row - Individual Performance
      {
        id: 'top-performers',
        title: 'Top Performers (Last 30 Days)',
        query: JSON.stringify({
          measures: ['Productivity.recordCount', 'Productivity.avgHappinessIndex'],
          dimensions: ['Productivity.employeeName', 'Productivity.departmentName'],
          order: {
            'Productivity.avgHappinessIndex': 'desc'
          },
          limit: 10
        }),
        chartType: 'table' as const,
        chartConfig: {},
        displayConfig: {},
        w: 6,
        h: 8,
        x: 0,
        y: 12
      },
      {
        id: 'work-life-balance',
        title: 'Work-Life Balance Metrics',
        query: JSON.stringify({
          measures: ['Productivity.workingDaysCount', 'Productivity.daysOffCount'],
          dimensions: ['Productivity.employeeName']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Productivity.employeeName',
          y: ['Productivity.workingDaysCount', 'Productivity.daysOffCount']
        },
        displayConfig: {
          showLegend: true,
          stacked: true
        },
        w: 6,
        h: 8,
        x: 6,
        y: 12
      },
      
      // Fourth Row - Detailed Analytics
      {
        id: 'code-output-trends',
        title: 'Code Output Trends by Month',
        query: JSON.stringify({
          measures: ['Productivity.totalLinesOfCode'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'month'
          }],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }),
        chartType: 'area' as const,
        chartConfig: {
          x: 'Productivity.date.month',
          y: ['Productivity.totalLinesOfCode']
        },
        displayConfig: {
          showLegend: false
        },
        w: 6,
        h: 6,
        x: 0,
        y: 20
      },
      {
        id: 'deployment-frequency',
        title: 'Deployment Frequency by Department',
        query: JSON.stringify({
          measures: ['Productivity.totalDeployments'],
          dimensions: ['Productivity.departmentName'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'month'
          }],
          filters: [{
            member: 'Productivity.totalDeployments',
            operator: 'gt',
            values: [0]
          }]
        }),
        chartType: 'line' as const,
        chartConfig: {
          x: 'Productivity.date.month',
          y: ['Productivity.totalDeployments'],
          series: 'Productivity.departmentName'
        },
        displayConfig: {
          showLegend: true
        },
        w: 6,
        h: 6,
        x: 6,
        y: 20
      },
      
      // Fifth Row - Summary Table
      {
        id: 'productivity-summary',
        title: 'Comprehensive Productivity Summary',
        query: JSON.stringify({
          dimensions: ['Productivity.employeeName', 'Productivity.departmentName'],
          measures: [
            'Productivity.recordCount', 
            'Productivity.avgHappinessIndex',
            'Productivity.workingDaysCount',
            'Productivity.daysOffCount'
          ],
          order: {
            'Productivity.avgHappinessIndex': 'desc'
          },
          limit: 50
        }),
        chartType: 'table' as const,
        chartConfig: {},
        displayConfig: {},
        w: 12,
        h: 10,
        x: 0,
        y: 26
      }
    ]
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...')
  
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await db.delete(productivity)
    await db.delete(employees)
    await db.delete(departments)
    await db.delete(analyticsPages)
    
    // Insert departments first (referenced by employees)
    console.log('🏢 Inserting departments...')
    const insertedDepartments = await db.insert(departments)
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
    const insertedEmployees = await db.insert(employees)
      .values(updatedEmployees)
      .returning()
    
    console.log(`✅ Inserted ${insertedEmployees.length} employees`)
    
    // Generate and insert productivity data
    console.log('📊 Generating productivity data for full year...')
    const productivityData = generateProductivityData(insertedEmployees)
    console.log(`📊 Generated ${productivityData.length} productivity records`)
    
    // Insert productivity data in batches to avoid memory issues
    const batchSize = 1000
    let insertedProductivityCount = 0
    
    for (let i = 0; i < productivityData.length; i += batchSize) {
      const batch = productivityData.slice(i, i + batchSize)
      await db.insert(productivity).values(batch)
      insertedProductivityCount += batch.length
      console.log(`📊 Inserted productivity batch: ${insertedProductivityCount}/${productivityData.length}`)
    }
    
    console.log(`✅ Inserted ${insertedProductivityCount} productivity records`)
    
    // Insert sample analytics page
    console.log('📊 Inserting sample analytics page...')
    const insertedPage = await db.insert(analyticsPages)
      .values(sampleAnalyticsPage)
      .returning()
    
    console.log(`✅ Inserted analytics page: ${insertedPage[0].name}`)
    
    console.log('🎉 Database seeded successfully!')
    console.log('\n📊 What you can do now:')
    console.log('- Visit http://localhost:3000 to see the React dashboard')
    console.log('- View the sample "Executive Dashboard" with employee analytics')
    console.log('- Create new dashboards with custom charts')
    console.log('- Query the API at http://localhost:3001/cubejs-api/v1/meta')
    console.log('\n🔍 Sample queries you can try:')
    console.log('- Employee count by department: measures: ["Employees.count"], dimensions: ["Employees.departmentName"]')
    console.log('- Salary analytics: measures: ["Employees.avgSalary", "Employees.totalSalary"], dimensions: ["Employees.departmentName"]')
    console.log('- Active employees: measures: ["Employees.activeCount"], dimensions: ["Employees.departmentName"]')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedDatabase()