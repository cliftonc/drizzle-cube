/**
 * Database seeding script with sample data
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { employees, departments, productivity, analyticsPages, schema } from '../schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54923/drizzle_cube_db'

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
  // Engineering Team
  {
    name: 'Alex Chen',
    email: 'alex.chen@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 125000,
    createdAt: new Date('2022-03-15')
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 95000,
    createdAt: new Date('2023-01-20')
  },
  // Marketing Team
  {
    name: 'Lisa Martinez',
    email: 'lisa.martinez@company.com',
    active: true,
    departmentId: 2,
    organisationId: 1,
    salary: 85000,
    createdAt: new Date('2022-11-20')
  },
  {
    name: 'David Kim',
    email: 'david.kim@company.com',
    active: true,
    departmentId: 2,
    organisationId: 1,
    salary: 72000,
    createdAt: new Date('2023-06-12')
  },
  // Sales Team
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@company.com',
    active: true,
    departmentId: 3,
    organisationId: 1,
    salary: 90000,
    createdAt: new Date('2022-05-18')
  },
  // HR Team
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    active: true,
    departmentId: 4,
    organisationId: 1,
    salary: 95000,
    createdAt: new Date('2021-12-01')
  }
]

// Generate simple productivity data for the last 30 days
function generateProductivityData(insertedEmployees: any[]): any[] {
  const productivityData: any[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30) // Last 30 days
  
  for (let date = new Date(startDate); date <= new Date(); date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    insertedEmployees.forEach((employee, index) => {
      if (!isWeekend && employee.active) {
        // Only add data for work days and active employees
        const baseLinesOfCode = employee.departmentId === 1 ? 200 : 0 // Only engineering writes code
        const baseHappiness = 7 + Math.floor(Math.random() * 4) // 7-10
        
        productivityData.push({
          employeeId: employee.id,
          departmentId: employee.departmentId,
          date: new Date(date),
          linesOfCode: baseLinesOfCode + Math.floor(Math.random() * 100),
          pullRequests: Math.floor(Math.random() * 5),
          liveDeployments: Math.floor(Math.random() * 2),
          daysOff: false,
          happinessIndex: baseHappiness,
          organisationId: 1
        })
      }
    })
  }
  
  return productivityData
}

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...')
  
  let client: any = null
  let db: any = null
  
  if (isNeonUrl(connectionString)) {
    console.log('🚀 Connecting to Neon serverless database')
    const sql = neon(connectionString)
    db = drizzleNeon(sql, { schema })
  } else {
    console.log('🐘 Connecting to local PostgreSQL database')
    client = postgres(connectionString)
    db = drizzle(client, { schema })
  }
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await db.delete(productivity)
    await db.delete(employees)
    await db.delete(departments)
    await db.delete(analyticsPages)
    
    // Insert departments
    console.log('🏢 Inserting departments...')
    const insertedDepartments = await db.insert(departments)
      .values(sampleDepartments)
      .returning()
    
    // Update employee department IDs
    const updatedEmployees = sampleEmployees.map(emp => ({
      ...emp,
      departmentId: insertedDepartments[emp.departmentId - 1]?.id || null
    }))
    
    // Insert employees
    console.log('👥 Inserting employees...')
    const insertedEmployees = await db.insert(employees)
      .values(updatedEmployees)
      .returning()
    
    // Generate and insert productivity data
    console.log('📊 Generating productivity data...')
    const productivityData = generateProductivityData(insertedEmployees)
    
    if (productivityData.length > 0) {
      await db.insert(productivity).values(productivityData)
      console.log(`✅ Inserted ${productivityData.length} productivity records`)
    }
    
    console.log('🎉 Database seeded successfully!')
    console.log('\nYou can now:')
    console.log('- Start the server with: npm run dev')
    console.log('- Visit the dashboard at: http://localhost:4010')
    console.log('- View the API at: http://localhost:4011/cubejs-api/v1/meta')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.end()
    }
    process.exit(0)
  }
}

seedDatabase()