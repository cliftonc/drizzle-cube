/**
 * Database seeding script with sample data
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { employees, departments, schema } from '../schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb'

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

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...')
  
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await db.delete(employees)
    await db.delete(departments)
    
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
    
    console.log('🎉 Database seeded successfully!')
    console.log('\n📊 Sample queries you can try:')
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