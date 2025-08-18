/**
 * Database seeding script with sample data
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { employees, departments, analyticsPages, schema } from '../schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://drizzle_user:drizzle_pass123@localhost:54921/drizzle_cube_db'

// Sample data
const sampleDepartments = [
  { name: 'Engineering', organisationId: 1, budget: 500000 },
  { name: 'Marketing', organisationId: 1, budget: 250000 },
  { name: 'Sales', organisationId: 1, budget: 300000 },
  { name: 'HR', organisationId: 1, budget: 150000 }
]

const sampleEmployees = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    active: true,
    departmentId: 1, // Engineering
    organisationId: 1,
    salary: 75000,
    createdAt: new Date('2023-01-15')
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    active: true,
    departmentId: 1, // Engineering
    organisationId: 1,
    salary: 82000,
    createdAt: new Date('2023-02-20')
  },
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    active: true,
    departmentId: 2, // Marketing
    organisationId: 1,
    salary: 68000,
    createdAt: new Date('2023-03-10')
  },
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    active: true,
    departmentId: 3, // Sales
    organisationId: 1,
    salary: 72000,
    createdAt: new Date('2023-04-05')
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    active: false,
    departmentId: 2, // Marketing
    organisationId: 1,
    salary: 65000,
    createdAt: new Date('2022-12-01')
  },
  {
    name: 'Diana Prince',
    email: 'diana@example.com',
    active: true,
    departmentId: 4, // HR
    organisationId: 1,
    salary: 70000,
    createdAt: new Date('2023-05-15')
  }
]

// Sample analytics page configuration
const sampleAnalyticsPage = {
  name: 'HR Analytics Dashboard',
  description: 'Comprehensive workforce analytics including headcount, compensation, trends, and detailed employee data',
  organisationId: 1,
  order: 0,
  config: {
    portlets: [
      {
        id: 'department-headcount',
        title: 'Workforce Distribution by Department',
        query: JSON.stringify({
          measures: ['Employees.count'],
          dimensions: ['Employees.departmentName']
        }),
        chartType: 'pie' as const,
        chartConfig: {
          x: 'Employees.departmentName',
          y: ['Employees.count']
        },
        displayConfig: {
          showLegend: true
        },
        w: 6,
        h: 6,
        x: 0,
        y: 0
      },
      {
        id: 'active-vs-inactive',
        title: 'Employee Status Overview',
        query: JSON.stringify({
          measures: ['Employees.count'],
          dimensions: ['Employees.isActive']
        }),
        chartType: 'pie' as const,
        labelField: 'Employees.isActive',
        chartConfig: {
          x: 'Employees.isActive',
          y: ['Employees.count']
        },
        displayConfig: {
          showLegend: true
        },
        w: 6,
        h: 6,
        x: 6,
        y: 0
      },
      {
        id: 'salary-by-department',
        title: 'Average Salary by Department',
        query: JSON.stringify({
          measures: ['Employees.avgSalary'],
          dimensions: ['Employees.departmentName']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Employees.departmentName',
          y: ['Employees.avgSalary']
        },
        displayConfig: {
          showLegend: false
        },
        w: 6,
        h: 6,
        x: 0,
        y: 6
      },
      {
        id: 'total-payroll',
        title: 'Total Payroll by Department',
        query: JSON.stringify({
          measures: ['Employees.totalSalary'],
          dimensions: ['Employees.departmentName']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Employees.departmentName',
          y: ['Employees.totalSalary']
        },
        displayConfig: {
          showLegend: false,
          orientation: 'horizontal'
        },
        w: 6,
        h: 6,
        x: 6,
        y: 6
      },
      {
        id: 'hiring-trends',
        title: 'Employee Growth Over Time',
        query: JSON.stringify({
          measures: ['Employees.count'],
          timeDimensions: [{
            dimension: 'Employees.createdAt',
            granularity: 'month'
          }]
        }),
        chartType: 'line' as const,
        chartConfig: {
          x: 'Employees.createdAt.month',
          y: ['Employees.count']
        },
        displayConfig: {
          showLegend: false
        },
        w: 12,
        h: 5,
        x: 0,
        y: 12
      },
      {
        id: 'employee-table',
        title: 'Employee Directory',
        query: JSON.stringify({
          dimensions: ['Employees.name', 'Employees.email', 'Employees.departmentName', 'Employees.isActive'],
          measures: [],
          limit: 25
        }),
        chartType: 'table' as const,
        chartConfig: {},
        displayConfig: {},
        w: 12,
        h: 8,
        x: 0,
        y: 17
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