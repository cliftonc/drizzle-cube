/**
 * Enhanced test data for comprehensive testing scenarios
 * Covers edge cases, diverse data types, NULL values, and performance testing
 */

import { sql } from 'drizzle-orm'

// Enhanced departments with edge cases
export const enhancedDepartments = [
  // Standard departments (Organization 1)
  { name: 'Engineering', organisationId: 1, budget: 500000 },
  { name: 'Marketing', organisationId: 1, budget: 250000 },
  { name: 'Sales', organisationId: 1, budget: 300000 },
  { name: 'HR', organisationId: 1, budget: 150000 },
  { name: 'Finance', organisationId: 1, budget: 200000 },
  { name: 'Operations', organisationId: 1, budget: 180000 },
  
  // Edge case departments
  { name: 'R&D', organisationId: 1, budget: 400000 }, // Special characters
  { name: 'Quality Assurance', organisationId: 1, budget: 120000 }, // Spaces
  { name: 'Customer Success', organisationId: 1, budget: 90000 },
  { name: 'Legal & Compliance', organisationId: 1, budget: 100000 }, // Ampersand
  
  // Departments with NULL budgets (edge case)
  { name: 'Consulting', organisationId: 1, budget: null },
  { name: 'Temporary Projects', organisationId: 1, budget: null },
  
  // Organization 2 departments (for multi-tenant testing)
  { name: 'Development', organisationId: 2, budget: 600000 },
  { name: 'Product Management', organisationId: 2, budget: 300000 },
  { name: 'Support', organisationId: 2, budget: 150000 },
  
  // Organization 3 departments (for additional isolation testing)
  { name: 'Research', organisationId: 3, budget: 400000 },
  { name: 'Analytics', organisationId: 3, budget: 250000 }
]

// Enhanced employees with comprehensive edge cases
export const enhancedEmployees = [
  // Engineering Team (Org 1) - Mix of seniority levels
  {
    name: 'Alex Chen',
    email: 'alex.chen@company.com',
    active: true,
    departmentId: 1, // Engineering
    organisationId: 1,
    salary: 125000,
    createdAt: new Date('2020-03-15') // Senior, longer tenure
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 95000,
    createdAt: new Date('2022-01-20')
  },
  {
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 110000,
    createdAt: new Date('2021-08-10')
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 85000,
    createdAt: new Date('2023-03-05')
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 75000,
    createdAt: new Date('2024-01-15')
  },
  
  // Marketing Team (Org 1)
  {
    name: 'Lisa Martinez',
    email: 'lisa.martinez@company.com',
    active: true,
    departmentId: 2,
    organisationId: 1,
    salary: 85000,
    createdAt: new Date('2021-11-20')
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
  {
    name: 'Rachel Green',
    email: 'rachel.green@company.com',
    active: false, // Inactive employee
    departmentId: 2,
    organisationId: 1,
    salary: 68000,
    createdAt: new Date('2022-02-28')
  },
  
  // Sales Team (Org 1)
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@company.com',
    active: true,
    departmentId: 3,
    organisationId: 1,
    salary: 90000,
    createdAt: new Date('2021-05-18')
  },
  {
    name: 'Nina Patel',
    email: 'nina.patel@company.com',
    active: true,
    departmentId: 3,
    organisationId: 1,
    salary: 78000,
    createdAt: new Date('2023-08-22')
  },
  
  // HR Team (Org 1)
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    active: true,
    departmentId: 4,
    organisationId: 1,
    salary: 95000,
    createdAt: new Date('2020-12-01') // Most senior
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    active: true,
    departmentId: 4,
    organisationId: 1,
    salary: 65000,
    createdAt: new Date('2023-10-15')
  },
  
  // Finance Team (Org 1)
  {
    name: 'Michael Brown',
    email: 'michael.brown@company.com',
    active: true,
    departmentId: 5,
    organisationId: 1,
    salary: 105000,
    createdAt: new Date('2021-03-10')
  },
  {
    name: 'Amanda White',
    email: 'amanda.white@company.com',
    active: true,
    departmentId: 5,
    organisationId: 1,
    salary: 88000,
    createdAt: new Date('2022-07-20')
  },
  
  // Operations Team (Org 1)
  {
    name: 'Carlos Garcia',
    email: 'carlos.garcia@company.com',
    active: true,
    departmentId: 6,
    organisationId: 1,
    salary: 82000,
    createdAt: new Date('2022-09-15')
  },
  
  // Edge case employees
  {
    name: 'Jean-Luc Picard', // Special characters
    email: 'jean-luc.picard@company.com',
    active: true,
    departmentId: 7, // R&D
    organisationId: 1,
    salary: 140000,
    createdAt: new Date('2019-01-01')
  },
  {
    name: 'José María González', // Unicode characters
    email: 'jose.gonzalez@company.com',
    active: true,
    departmentId: 7,
    organisationId: 1,
    salary: 92000,
    createdAt: new Date('2023-04-15')
  },
  {
    name: 'Employee With NULL Salary', // NULL salary edge case
    email: 'null.salary@company.com',
    active: true,
    departmentId: 8, // QA
    organisationId: 1,
    salary: null,
    createdAt: new Date('2023-12-01')
  },
  {
    name: 'No Department Employee', // NULL department edge case
    email: 'no.dept@company.com',
    active: true,
    departmentId: null,
    organisationId: 1,
    salary: 50000,
    createdAt: new Date('2024-01-01')
  },
  
  // Organization 2 employees (for multi-tenant testing)
  {
    name: 'John Doe Org2',
    email: 'john.doe@org2.com',
    active: true,
    departmentId: 13, // Development (Org 2)
    organisationId: 2,
    salary: 120000,
    createdAt: new Date('2022-06-01')
  },
  {
    name: 'Jane Smith Org2',
    email: 'jane.smith@org2.com',
    active: true,
    departmentId: 14, // Product Management (Org 2)
    organisationId: 2,
    salary: 110000,
    createdAt: new Date('2023-02-15')
  },
  {
    name: 'Bob Wilson Org2',
    email: 'bob.wilson@org2.com',
    active: false, // Inactive in Org 2
    departmentId: 15, // Support (Org 2)
    organisationId: 2,
    salary: 75000,
    createdAt: new Date('2021-09-10')
  },
  
  // Organization 3 employees (for additional isolation testing)
  {
    name: 'Alice Research',
    email: 'alice@org3.com',
    active: true,
    departmentId: 16, // Research (Org 3)
    organisationId: 3,
    salary: 130000,
    createdAt: new Date('2020-05-20')
  },
  {
    name: 'Dr. Analytics Expert',
    email: 'doctor@org3.com',
    active: true,
    departmentId: 17, // Analytics (Org 3)
    organisationId: 3,
    salary: 145000,
    createdAt: new Date('2019-08-30')
  }
]

// Comprehensive productivity data generator with edge cases
export function generateComprehensiveProductivityData(insertedEmployees: any[]): any[] {
  const productivityData: any[] = []
  
  // Generate data for a full year (2024) for comprehensive time dimension testing
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-12-31')
  
  // Create productivity profiles for different employee types
  const productivityProfiles: Record<string, { 
    role: string
    linesOfCodeBase: number
    pullRequestsBase: number
    deploymentsBase: number
    happinessVariability: number
  }> = {}
  
  // Initialize profiles based on employee data
  insertedEmployees.forEach((employee, index) => {
    const employeeId = employee.id
    let profile = { role: 'General', linesOfCodeBase: 50, pullRequestsBase: 2, deploymentsBase: 0, happinessVariability: 2 }
    
    // Assign profiles based on name patterns (for comprehensive testing)
    if (employee.name.includes('Alex') || employee.name.includes('Jean-Luc')) {
      profile = { role: 'Senior Engineer', linesOfCodeBase: 300, pullRequestsBase: 8, deploymentsBase: 2, happinessVariability: 1 }
    } else if (employee.name.includes('Sarah') || employee.name.includes('Emily') || employee.name.includes('José')) {
      profile = { role: 'Engineer', linesOfCodeBase: 250, pullRequestsBase: 6, deploymentsBase: 1, happinessVariability: 2 }
    } else if (employee.name.includes('Mike')) {
      profile = { role: 'DevOps Engineer', linesOfCodeBase: 150, pullRequestsBase: 4, deploymentsBase: 5, happinessVariability: 1 }
    } else if (employee.name.includes('James')) {
      profile = { role: 'Junior Engineer', linesOfCodeBase: 180, pullRequestsBase: 4, deploymentsBase: 0, happinessVariability: 3 }
    } else if (employee.name.includes('Lisa') || employee.name.includes('David') || employee.name.includes('Rachel')) {
      profile = { role: 'Marketing', linesOfCodeBase: 0, pullRequestsBase: 1, deploymentsBase: 0, happinessVariability: 2 }
    } else if (employee.name.includes('Tom') || employee.name.includes('Nina')) {
      profile = { role: 'Sales', linesOfCodeBase: 0, pullRequestsBase: 0, deploymentsBase: 0, happinessVariability: 3 }
    } else if (employee.name.includes('Robert') || employee.name.includes('Jennifer')) {
      profile = { role: 'HR', linesOfCodeBase: 0, pullRequestsBase: 1, deploymentsBase: 0, happinessVariability: 1 }
    } else if (employee.name.includes('Michael') || employee.name.includes('Amanda')) {
      profile = { role: 'Finance', linesOfCodeBase: 0, pullRequestsBase: 0, deploymentsBase: 0, happinessVariability: 1 }
    } else if (employee.name.includes('Carlos')) {
      profile = { role: 'Operations', linesOfCodeBase: 20, pullRequestsBase: 1, deploymentsBase: 1, happinessVariability: 2 }
    }
    
    productivityProfiles[employeeId] = profile
  })
  
  // Generate daily productivity data
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    const month = date.getMonth() + 1
    const dayOfMonth = date.getDate()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = isHolidayDate(date)
    
    // Seasonal productivity modifiers
    let seasonalModifier = 1.0
    if (month === 1) seasonalModifier = 1.2 // New Year productivity boost
    else if (month === 7 || month === 8) seasonalModifier = 0.8 // Summer vacation period
    else if (month === 12) seasonalModifier = 0.7 // Holiday season
    
    // Day of week productivity modifier
    let dayModifier = 1.0
    if (dayOfWeek === 1) dayModifier = 0.8 // Monday ramp-up
    else if (dayOfWeek === 5) dayModifier = 0.7 // Friday wind-down
    else if (dayOfWeek === 2 || dayOfWeek === 3) dayModifier = 1.1 // Tuesday/Wednesday peak
    else if (dayOfWeek === 4) dayModifier = 0.9 // Thursday decline
    
    insertedEmployees.forEach((employee) => {
      const employeeId = employee.id
      const profile = productivityProfiles[employeeId]
      
      // Skip weekends and holidays for most employees
      const isWorkDay = !isWeekend && !isHoliday
      
      // Some employees might work occasionally on weekends
      const weekendWork = (profile.role.includes('Senior') || profile.role.includes('DevOps')) && 
                         Math.random() < 0.10 && isWeekend
      
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
        happinessIndex = Math.round(Math.max(6, Math.min(10, 8 + Math.random() * 2 - 1))) // Higher happiness on days off
      } else {
        // Working day - generate realistic productivity
        const overallModifier = seasonalModifier * dayModifier * (0.5 + Math.random() * 0.8) // Random variation
        
        // Vacation days (random throughout the year)
        const vacationProbability = profile.role.includes('Senior') ? 0.015 : 0.012 // Senior staff take more vacation
        if (Math.random() < vacationProbability) {
          daysOff = true
          happinessIndex = Math.round(Math.max(8, Math.min(10, 9 + Math.random() * 1))) // Very happy on vacation
        } else {
          // Regular work day with edge cases
          
          // Occasional zero productivity days (sick days, bad days)
          if (Math.random() < 0.02) {
            linesOfCode = 0
            pullRequests = 0
            liveDeployments = 0
            happinessIndex = Math.round(Math.max(1, Math.min(4, 3 + Math.random() * 2 - 1)))
          } else {
            // Normal productivity with realistic variation
            linesOfCode = Math.max(0, Math.round(profile.linesOfCodeBase * overallModifier * (0.3 + Math.random() * 1.4)))
            pullRequests = Math.max(0, Math.round(profile.pullRequestsBase * overallModifier * (0.2 + Math.random() * 1.0)))
            liveDeployments = Math.max(0, Math.round(profile.deploymentsBase * overallModifier * (0.1 + Math.random() * 1.2)))
            
            // Happiness correlates with productivity but has individual variation
            const productivityScore = (linesOfCode + pullRequests * 30 + liveDeployments * 50) / 300
            const baseHappiness = 6 + productivityScore * 2
            const randomVariation = (Math.random() - 0.5) * profile.happinessVariability
            happinessIndex = Math.round(Math.max(1, Math.min(10, baseHappiness + randomVariation)))
          }
          
          // Occasional exceptional productivity days
          if (Math.random() < 0.05) {
            linesOfCode = Math.round(linesOfCode * 2.5)
            pullRequests = Math.round(pullRequests * 1.8)
            liveDeployments = Math.round(liveDeployments * 1.5)
            happinessIndex = Math.min(10, happinessIndex + 2)
          }
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
        organisationId: employee.organisationId
      })
    })
  }
  
  return productivityData
}

// Enhanced holiday detection for comprehensive time testing
function isHolidayDate(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Major holidays throughout the year
  const holidays = [
    [1, 1],   // New Year's Day
    [2, 14],  // Valentine's Day (company culture day)
    [3, 17],  // St. Patrick's Day
    [7, 4],   // Independence Day
    [10, 31], // Halloween (company party day)
    [11, 28], // Thanksgiving (4th Thursday - approximated)
    [12, 25], // Christmas Day
    [12, 31], // New Year's Eve
  ]
  
  return holidays.some(([m, d]) => month === m && day === d)
}

// Sample analytics pages configurations for testing
export const sampleAnalyticsPages = [
  {
    name: 'Executive Dashboard',
    description: 'High-level metrics for executives',
    organisationId: 1,
    config: {
      portlets: [
        {
          id: 'employee-count',
          title: 'Total Employees',
          query: JSON.stringify({
            measures: ['Employees.count'],
            dimensions: ['Employees.departmentName']
          }),
          chartType: 'bar' as const,
          chartConfig: { x: 'Employees.departmentName', y: ['Employees.count'] },
          w: 6, h: 4, x: 0, y: 0
        },
        {
          id: 'productivity-trend',
          title: 'Productivity Trends',
          query: JSON.stringify({
            measures: ['Productivity.totalLinesOfCode'],
            timeDimensions: [{ dimension: 'Productivity.date', granularity: 'month' }]
          }),
          chartType: 'line' as const,
          chartConfig: { x: 'Productivity.date', y: ['Productivity.totalLinesOfCode'] },
          w: 6, h: 4, x: 6, y: 0
        }
      ]
    },
    order: 1,
    isActive: true
  },
  {
    name: 'Engineering Metrics',
    description: 'Detailed engineering productivity and code quality metrics',
    organisationId: 1,
    config: {
      portlets: [
        {
          id: 'code-output',
          title: 'Code Output by Developer',
          query: JSON.stringify({
            measures: ['Productivity.totalLinesOfCode', 'Productivity.totalPullRequests'],
            dimensions: ['Productivity.employeeName'],
            filters: [
              { member: 'Productivity.employeeName', operator: 'contains', values: ['Alex', 'Sarah', 'Mike', 'Emily', 'James'] }
            ]
          }),
          chartType: 'table' as const,
          chartConfig: {},
          w: 12, h: 6, x: 0, y: 0
        }
      ]
    },
    order: 2,
    isActive: true
  },
  {
    name: 'HR Analytics',
    description: 'Human resources analytics and employee satisfaction',
    organisationId: 1,
    config: {
      portlets: [
        {
          id: 'happiness-trends',
          title: 'Employee Happiness Over Time',
          query: JSON.stringify({
            measures: ['Productivity.avgHappinessIndex'],
            dimensions: ['Productivity.departmentName'],
            timeDimensions: [{ dimension: 'Productivity.date', granularity: 'month' }]
          }),
          chartType: 'area' as const,
          chartConfig: { x: 'Productivity.date', y: ['Productivity.avgHappinessIndex'], series: 'Productivity.departmentName' },
          w: 12, h: 5, x: 0, y: 0
        }
      ]
    },
    order: 3,
    isActive: true
  }
]

// Test security contexts for comprehensive testing
export const testSecurityContexts = {
  org1: { organisationId: 1, userId: 1 },
  org2: { organisationId: 2, userId: 2 },
  org3: { organisationId: 3, userId: 3 },
  invalidOrg: { organisationId: 999, userId: 999 }
}

// Edge case data for testing filters and aggregations
export const edgeCaseTestData = {
  emptyStringName: '',
  nullEmail: null,
  veryLongName: 'A'.repeat(255), // Test long strings
  specialCharactersName: "O'Brien-Smith & Co. (测试)", // Special chars and unicode
  minSalary: 0.01,
  maxSalary: 999999.99,
  futureDateHire: new Date('2030-01-01'), // Future date
  veryOldDateHire: new Date('1900-01-01'), // Very old date
  maxHappiness: 10,
  minHappiness: 1,
  zeroProductivity: 0,
  extremeProductivity: 10000
}