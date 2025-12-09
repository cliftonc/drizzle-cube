/**
 * Enhanced test data for comprehensive testing scenarios
 * Covers edge cases, diverse data types, NULL values, and performance testing
 */

// Enhanced test data for comprehensive testing scenarios

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
    tags: ['senior', 'backend', 'python', 'aws'], // Has all: senior, backend
    createdAt: new Date('2020-03-15T00:00:00Z') // Senior, longer tenure
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 95000,
    tags: ['frontend', 'react', 'typescript'], // Has frontend only
    createdAt: new Date('2022-01-20T00:00:00Z')
  },
  {
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 110000,
    tags: ['senior', 'fullstack', 'python', 'react'], // Has senior and fullstack
    createdAt: new Date('2021-08-10T00:00:00Z')
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 85000,
    tags: ['junior', 'frontend', 'react'], // Has junior
    createdAt: new Date('2023-03-05T00:00:00Z')
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    active: true,
    departmentId: 1,
    organisationId: 1,
    salary: 75000,
    tags: ['junior', 'backend', 'nodejs'], // Has junior and backend
    createdAt: new Date('2024-01-15T00:00:00Z')
  },

  // Marketing Team (Org 1)
  {
    name: 'Lisa Martinez',
    email: 'lisa.martinez@company.com',
    active: true,
    departmentId: 2,
    organisationId: 1,
    salary: 85000,
    tags: ['senior', 'marketing', 'seo'], // Marketing tags
    createdAt: new Date('2021-11-20T00:00:00Z')
  },
  {
    name: 'David Kim',
    email: 'david.kim@company.com',
    active: true,
    departmentId: 2,
    organisationId: 1,
    salary: 72000,
    tags: ['marketing', 'content', 'social'], // Marketing tags
    createdAt: new Date('2023-06-12T00:00:00Z')
  },
  {
    name: 'Rachel Green',
    email: 'rachel.green@company.com',
    active: false, // Inactive employee
    departmentId: 2,
    organisationId: 1,
    salary: 68000,
    tags: ['marketing', 'design'], // Marketing tags
    createdAt: new Date('2022-02-28T00:00:00Z')
  },

  // Sales Team (Org 1)
  {
    name: 'Tom Anderson',
    email: 'tom.anderson@company.com',
    active: true,
    departmentId: 3,
    organisationId: 1,
    salary: 90000,
    tags: ['senior', 'sales', 'enterprise'], // Sales tags
    createdAt: new Date('2021-05-18T00:00:00Z')
  },
  {
    name: 'Nina Patel',
    email: 'nina.patel@company.com',
    active: true,
    departmentId: 3,
    organisationId: 1,
    salary: 78000,
    tags: ['sales', 'smb'], // Sales tags
    createdAt: new Date('2023-08-22T00:00:00Z')
  },

  // HR Team (Org 1)
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    active: true,
    departmentId: 4,
    organisationId: 1,
    salary: 95000,
    tags: ['senior', 'hr', 'recruiting'], // HR tags
    createdAt: new Date('2020-12-01T00:00:00Z') // Most senior
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    active: true,
    departmentId: 4,
    organisationId: 1,
    salary: 65000,
    tags: ['hr', 'benefits'], // HR tags
    createdAt: new Date('2023-10-15T00:00:00Z')
  },

  // Finance Team (Org 1)
  {
    name: 'Michael Brown',
    email: 'michael.brown@company.com',
    active: true,
    departmentId: 5,
    organisationId: 1,
    salary: 105000,
    tags: ['senior', 'finance', 'accounting'], // Finance tags
    createdAt: new Date('2021-03-10T00:00:00Z')
  },
  {
    name: 'Amanda White',
    email: 'amanda.white@company.com',
    active: true,
    departmentId: 5,
    organisationId: 1,
    salary: 88000,
    tags: ['finance', 'payroll'], // Finance tags
    createdAt: new Date('2022-07-20T00:00:00Z')
  },

  // Operations Team (Org 1)
  {
    name: 'Carlos Garcia',
    email: 'carlos.garcia@company.com',
    active: true,
    departmentId: 6,
    organisationId: 1,
    salary: 82000,
    tags: ['operations', 'logistics'], // Operations tags
    createdAt: new Date('2022-09-15T00:00:00Z')
  },

  // Edge case employees
  {
    name: 'Jean-Luc Picard', // Special characters
    email: 'jean-luc.picard@company.com',
    active: true,
    departmentId: 7, // R&D
    organisationId: 1,
    salary: 140000,
    tags: ['senior', 'research', 'leadership'], // R&D tags
    createdAt: new Date('2019-01-01T00:00:00Z')
  },
  {
    name: 'José María González', // Unicode characters
    email: 'jose.gonzalez@company.com',
    active: true,
    departmentId: 7,
    organisationId: 1,
    salary: 92000,
    tags: ['research', 'innovation'], // R&D tags
    createdAt: new Date('2023-04-15T00:00:00Z')
  },
  {
    name: 'Employee With NULL Salary', // NULL salary edge case
    email: 'null.salary@company.com',
    active: true,
    departmentId: 8, // QA
    organisationId: 1,
    salary: null,
    tags: null, // NULL tags edge case
    createdAt: new Date('2023-12-01T00:00:00Z')
  },
  {
    name: 'No Department Employee', // NULL department edge case
    email: 'no.dept@company.com',
    active: true,
    departmentId: null,
    organisationId: 1,
    salary: 50000,
    tags: [], // Empty array edge case
    createdAt: new Date('2024-01-01T00:00:00Z')
  },

  // Organization 2 employees (for multi-tenant testing)
  {
    name: 'John Doe Org2',
    email: 'john.doe@org2.com',
    active: true,
    departmentId: 13, // Development (Org 2)
    organisationId: 2,
    salary: 120000,
    tags: ['senior', 'backend', 'java'], // Org 2 tags
    createdAt: new Date('2022-06-01T00:00:00Z')
  },
  {
    name: 'Jane Smith Org2',
    email: 'jane.smith@org2.com',
    active: true,
    departmentId: 14, // Product Management (Org 2)
    organisationId: 2,
    salary: 110000,
    tags: ['product', 'management'], // Org 2 tags
    createdAt: new Date('2023-02-15T00:00:00Z')
  },
  {
    name: 'Bob Wilson Org2',
    email: 'bob.wilson@org2.com',
    active: false, // Inactive in Org 2
    departmentId: 15, // Support (Org 2)
    organisationId: 2,
    salary: 75000,
    tags: ['support', 'customer-service'], // Org 2 tags
    createdAt: new Date('2021-09-10T00:00:00Z')
  },

  // Organization 3 employees (for additional isolation testing)
  {
    name: 'Alice Research',
    email: 'alice@org3.com',
    active: true,
    departmentId: 16, // Research (Org 3)
    organisationId: 3,
    salary: 130000,
    tags: ['senior', 'research', 'ml'], // Org 3 tags
    createdAt: new Date('2020-05-20T00:00:00Z')
  },
  {
    name: 'Dr. Analytics Expert',
    email: 'doctor@org3.com',
    active: true,
    departmentId: 17, // Analytics (Org 3)
    organisationId: 3,
    salary: 145000,
    tags: ['senior', 'analytics', 'data-science'], // Org 3 tags
    createdAt: new Date('2019-08-30T00:00:00Z')
  }
]

// Comprehensive productivity data generator with edge cases
export function generateComprehensiveProductivityData(insertedEmployees: any[]): any[] {
  const productivityData: any[] = []
  
  
  // Generate data for a full year (2024) for comprehensive time dimension testing
  // Use UTC dates to match query parsing
  const startDate = new Date('2024-01-01T00:00:00Z')
  const endDate = new Date('2024-12-31T23:59:59Z')
  
  // Create productivity profiles for different employee types
  const productivityProfiles: Record<string, { 
    role: string
    linesOfCodeBase: number
    pullRequestsBase: number
    deploymentsBase: number
    happinessVariability: number
  }> = {}
  
  // Initialize profiles based on employee data
  insertedEmployees.forEach((employee) => {
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
  for (let date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
    const dayOfWeek = date.getUTCDay() // 0 = Sunday, 6 = Saturday
    const month = date.getUTCMonth() + 1
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
        // Regular days off (weekends and holidays)
        daysOff = true
        happinessIndex = Math.round(Math.max(6, Math.min(10, 8 + Math.random() * 2 - 1))) // Higher happiness on days off
      } else {
        // Working day - generate realistic productivity
        const overallModifier = seasonalModifier * dayModifier * (0.5 + Math.random() * 0.8) // Random variation
        
        // Vacation days (realistic probability - ~15-20 vacation days per year)
        // Work days per year ~260, so 15-20 vacation days = 15-20/260 = 0.058-0.077 probability
        const vacationProbability = profile.role.includes('Senior') ? 0.070 : 0.055
        if (Math.random() < vacationProbability) {
          daysOff = true
          happinessIndex = Math.round(Math.max(8, Math.min(10, 9 + Math.random() * 1))) // Very happy on vacation
        } else {
          // Regular work day with edge cases
          daysOff = false // Explicitly set working day
          
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

  console.log(`Generated ${productivityData.length} productivity records for comprehensive testing`)
  return productivityData
}

/**
 * Generate comprehensive time entries data for performance testing
 * Creates realistic time tracking scenarios with fan-out relationships
 */
export function generateComprehensiveTimeEntriesData(
  insertedEmployees: any[], 
  insertedDepartments: any[]
): any[] {
  const timeEntriesData: any[] = []
  
  // Create department map for easy lookup
  const departmentMap: Record<number, any> = {}
  insertedDepartments.forEach(dept => {
    departmentMap[dept.id] = dept
  })
  
  // Allocation types with realistic distributions
  const allocationTypes = [
    { type: 'development', probability: 0.4, avgHours: 6 },
    { type: 'maintenance', probability: 0.15, avgHours: 2 },
    { type: 'meetings', probability: 0.2, avgHours: 1.5 },
    { type: 'research', probability: 0.1, avgHours: 3 },
    { type: 'documentation', probability: 0.1, avgHours: 2 },
    { type: 'testing', probability: 0.05, avgHours: 4 }
  ]
  
  // Time entry descriptions for realism
  const descriptions = {
    development: [
      'Feature implementation',
      'Bug fixes',
      'Code refactoring',
      'API development',
      'Frontend components',
      'Backend services'
    ],
    maintenance: [
      'Server maintenance',
      'Database optimization',
      'Security patches',
      'Performance tuning',
      'Legacy system updates'
    ],
    meetings: [
      'Daily standup',
      'Sprint planning',
      'Code review',
      'Architecture discussion',
      'Client meeting',
      'Team retrospective'
    ],
    research: [
      'Technology evaluation',
      'Proof of concept',
      'Performance analysis',
      'Market research',
      'Competitor analysis'
    ],
    documentation: [
      'API documentation',
      'User manual updates',
      'Technical specifications',
      'Process documentation',
      'Knowledge base updates'
    ],
    testing: [
      'Unit testing',
      'Integration testing',
      'Performance testing',
      'User acceptance testing',
      'Automated test development'
    ]
  }
  
  // Generate time entries for full year 2024
  // Use UTC dates to match query parsing
  const startDate = new Date('2024-01-01T00:00:00Z')
  const endDate = new Date('2024-12-31T23:59:59Z')
  
  // Process each employee
  insertedEmployees.forEach((employee) => {
    // Get employee's department
    const employeeDepartment = departmentMap[employee.departmentId]
    if (!employeeDepartment) return
    
    // Determine employee work pattern based on role
    const isEngineer = employee.name.includes('Alex') || 
                     employee.name.includes('Sarah') || 
                     employee.name.includes('Emily') || 
                     employee.name.includes('Jean-Luc') || 
                     employee.name.includes('Mike') ||
                     employee.name.includes('James')
                     
    const isManager = employee.name.includes('Lisa') || 
                     employee.name.includes('David')
                     
    const isSales = employee.name.includes('Tom') || 
                   employee.name.includes('Nina')
                   
    // Adjust allocation probabilities based on role
    let roleAllocationTypes = [...allocationTypes]
    if (isEngineer) {
      roleAllocationTypes[0].probability = 0.6  // More development
      roleAllocationTypes[1].probability = 0.2  // More maintenance
      roleAllocationTypes[2].probability = 0.15 // Fewer meetings
    } else if (isManager) {
      roleAllocationTypes[0].probability = 0.1  // Less development
      roleAllocationTypes[2].probability = 0.5  // More meetings
      roleAllocationTypes[3].probability = 0.2  // More research
    } else if (isSales) {
      roleAllocationTypes[0].probability = 0.05 // Minimal development
      roleAllocationTypes[2].probability = 0.7  // Lots of meetings
      roleAllocationTypes[3].probability = 0.2  // Sales research
    }
    
    // Generate entries for each work day
    for (let date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
      const dayOfWeek = date.getUTCDay() // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isHoliday = isApproximateHoliday(date)
      
      // Skip weekends and major holidays (most of the time)
      if (isWeekend || isHoliday) {
        // 10% chance of weekend/holiday work for engineers
        if (!isEngineer || Math.random() > 0.1) continue
      }
      
      // Determine how many time entries for this day (1-4 entries per day)
      const entriesPerDay = isEngineer 
        ? Math.floor(Math.random() * 3) + 2 // 2-4 entries 
        : Math.floor(Math.random() * 2) + 1 // 1-2 entries
        
      let totalDayHours = 0
      const maxDayHours = 8 + (Math.random() * 2) // 8-10 hours max per day
      
      for (let entryIndex = 0; entryIndex < entriesPerDay; entryIndex++) {
        if (totalDayHours >= maxDayHours) break
        
        // Select allocation type based on probabilities
        let selectedType = 'development'
        const rand = Math.random()
        let cumulativeProbability = 0
        
        for (const allocType of roleAllocationTypes) {
          cumulativeProbability += allocType.probability
          if (rand <= cumulativeProbability) {
            selectedType = allocType.type
            break
          }
        }
        
        const typeConfig = roleAllocationTypes.find(t => t.type === selectedType)!
        
        // Generate realistic hours with variation
        const baseHours = typeConfig.avgHours
        const variation = (Math.random() - 0.5) * baseHours * 0.4 // ±20% variation
        let hours = Math.max(0.25, Math.min(baseHours + variation, maxDayHours - totalDayHours))
        hours = Math.round(hours * 4) / 4 // Round to nearest 0.25 hours
        
        if (hours < 0.25) continue
        
        // Calculate billable hours (some types are more billable than others)
        const billableRates = {
          development: 0.9,
          maintenance: 0.7,
          meetings: 0.3,
          research: 0.5,
          documentation: 0.6,
          testing: 0.8
        }
        
        const billableRate = billableRates[selectedType as keyof typeof billableRates] || 0.5
        const billableHours = Math.round(hours * billableRate * 4) / 4
        
        // Select random description
        const typeDescriptions = descriptions[selectedType as keyof typeof descriptions] || ['General work']
        const description = typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)]
        
        // Some cross-department collaboration (5% chance)
        let workDepartmentId = employee.departmentId
        if (Math.random() < 0.05 && selectedType === 'meetings') {
          const otherDepts = insertedDepartments.filter(d => d.id !== employee.departmentId && d.organisationId === employee.organisationId)
          if (otherDepts.length > 0) {
            workDepartmentId = otherDepts[Math.floor(Math.random() * otherDepts.length)].id
          }
        }
        
        timeEntriesData.push({
          employeeId: employee.id,
          departmentId: workDepartmentId,
          date: new Date(date),
          allocationType: selectedType,
          hours,
          description,
          billableHours,
          organisationId: employee.organisationId
        })
        
        totalDayHours += hours
      }
    }
  })
  
  console.log(`Generated ${timeEntriesData.length} time entries for comprehensive testing`)
  return timeEntriesData
}

// Helper function to detect approximate holidays
function isApproximateHoliday(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Major US holidays
  return (
    (month === 1 && day === 1) || // New Year's Day
    (month === 7 && day === 4) || // Independence Day  
    (month === 12 && day === 25) || // Christmas
    (month === 11 && day >= 22 && day <= 28 && date.getDay() === 4) // Thanksgiving (4th Thursday)
  )
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

// Teams data for testing belongsToMany relationships
export const enhancedTeams = [
  // Organization 1 teams
  { name: 'Frontend Team', description: 'UI/UX and frontend development', organisationId: 1, createdAt: new Date('2020-01-01T00:00:00Z') },
  { name: 'Backend Team', description: 'API and server-side development', organisationId: 1, createdAt: new Date('2020-01-01T00:00:00Z') },
  { name: 'DevOps Team', description: 'Infrastructure and deployment', organisationId: 1, createdAt: new Date('2020-02-01T00:00:00Z') },
  { name: 'Data Team', description: 'Data engineering and analytics', organisationId: 1, createdAt: new Date('2020-03-01T00:00:00Z') },
  { name: 'Mobile Team', description: 'iOS and Android development', organisationId: 1, createdAt: new Date('2020-04-01T00:00:00Z') },
  { name: 'Security Team', description: 'Application and infrastructure security', organisationId: 1, createdAt: new Date('2020-05-01T00:00:00Z') },

  // Organization 2 teams
  { name: 'Product Team', description: 'Product development', organisationId: 2, createdAt: new Date('2020-01-01T00:00:00Z') },
  { name: 'Platform Team', description: 'Platform engineering', organisationId: 2, createdAt: new Date('2020-01-01T00:00:00Z') },

  // Organization 3 teams
  { name: 'Research Team', description: 'R&D and innovation', organisationId: 3, createdAt: new Date('2020-01-01T00:00:00Z') }
]

// EmployeeTeams junction data - maps employees to teams (many-to-many)
export const enhancedEmployeeTeams = [
  // Alex Chen (employee 1) - Senior, on multiple teams
  { employeeId: 1, teamId: 1, role: 'lead', organisationId: 1, joinedAt: new Date('2020-03-15T00:00:00Z') }, // Frontend lead
  { employeeId: 1, teamId: 2, role: 'member', organisationId: 1, joinedAt: new Date('2020-06-01T00:00:00Z') }, // Also contributes to Backend

  // Sarah Johnson (employee 2) - Frontend focused
  { employeeId: 2, teamId: 1, role: 'member', organisationId: 1, joinedAt: new Date('2022-01-20T00:00:00Z') },

  // Mike Rodriguez (employee 3) - Backend and DevOps
  { employeeId: 3, teamId: 2, role: 'lead', organisationId: 1, joinedAt: new Date('2021-08-10T00:00:00Z') },
  { employeeId: 3, teamId: 3, role: 'member', organisationId: 1, joinedAt: new Date('2021-09-01T00:00:00Z') },

  // Emily Davis (employee 4) - Mobile team
  { employeeId: 4, teamId: 5, role: 'member', organisationId: 1, joinedAt: new Date('2023-03-05T00:00:00Z') },

  // James Wilson (employee 5) - Data team
  { employeeId: 5, teamId: 4, role: 'lead', organisationId: 1, joinedAt: new Date('2019-11-10T00:00:00Z') },

  // Linda Martinez (employee 6) - Security team
  { employeeId: 6, teamId: 6, role: 'lead', organisationId: 1, joinedAt: new Date('2018-05-22T00:00:00Z') },

  // Robert Lee (employee 7) - Backend team
  { employeeId: 7, teamId: 2, role: 'member', organisationId: 1, joinedAt: new Date('2022-07-15T00:00:00Z') },

  // Jennifer Taylor (employee 8) - Frontend and Mobile
  { employeeId: 8, teamId: 1, role: 'member', organisationId: 1, joinedAt: new Date('2023-02-01T00:00:00Z') },
  { employeeId: 8, teamId: 5, role: 'member', organisationId: 1, joinedAt: new Date('2023-05-01T00:00:00Z') },

  // David Brown (employee 9) - DevOps team
  { employeeId: 9, teamId: 3, role: 'lead', organisationId: 1, joinedAt: new Date('2020-09-03T00:00:00Z') },

  // Org 2 employees on teams (employees 13-15)
  { employeeId: 13, teamId: 7, role: 'lead', organisationId: 2, joinedAt: new Date('2019-06-01T00:00:00Z') }, // Product team
  { employeeId: 14, teamId: 8, role: 'lead', organisationId: 2, joinedAt: new Date('2020-03-15T00:00:00Z') }, // Platform team
  { employeeId: 15, teamId: 7, role: 'member', organisationId: 2, joinedAt: new Date('2021-01-10T00:00:00Z') },

  // Org 3 employees on teams (employees 16-17)
  { employeeId: 16, teamId: 9, role: 'lead', organisationId: 3, joinedAt: new Date('2019-01-15T00:00:00Z') },
  { employeeId: 17, teamId: 9, role: 'member', organisationId: 3, joinedAt: new Date('2020-04-20T00:00:00Z') }
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
  futureDateHire: new Date('2030-01-01T00:00:00Z'), // Future date
  veryOldDateHire: new Date('1900-01-01T00:00:00Z'), // Very old date
  maxHappiness: 10,
  minHappiness: 1,
  zeroProductivity: 0,
  extremeProductivity: 10000
}

// ============================================================================
// STAR SCHEMA TEST DATA
// Products, Sales, Inventory - for fact-dimension-fact join pattern testing
// ============================================================================

// Products (Dimension Table) - Shared dimension for both fact tables
export const enhancedProducts = [
  // Organization 1 - Electronics Category
  { name: 'Laptop Pro 15', category: 'Electronics', sku: 'LAP-PRO-15', price: 1299.99, organisationId: 1 },
  { name: 'Wireless Mouse', category: 'Electronics', sku: 'MSE-WRL-01', price: 29.99, organisationId: 1 },
  { name: 'USB-C Hub', category: 'Electronics', sku: 'HUB-USBC-8', price: 49.99, organisationId: 1 },
  { name: 'Monitor 27"', category: 'Electronics', sku: 'MON-27-4K', price: 399.99, organisationId: 1 },
  { name: 'Keyboard Mechanical', category: 'Electronics', sku: 'KEY-MECH-RGB', price: 149.99, organisationId: 1 },

  // Organization 1 - Office Supplies Category
  { name: 'Notebook A4', category: 'Office Supplies', sku: 'NB-A4-100', price: 4.99, organisationId: 1 },
  { name: 'Pen Set', category: 'Office Supplies', sku: 'PEN-SET-12', price: 12.99, organisationId: 1 },
  { name: 'Desk Organizer', category: 'Office Supplies', sku: 'ORG-DESK-BLK', price: 24.99, organisationId: 1 },

  // Organization 1 - Furniture Category
  { name: 'Office Chair', category: 'Furniture', sku: 'CHR-ERG-BLK', price: 299.99, organisationId: 1 },
  { name: 'Standing Desk', category: 'Furniture', sku: 'DSK-STD-ADJ', price: 599.99, organisationId: 1 },

  // Organization 2 - Different products
  { name: 'Tablet Pro', category: 'Electronics', sku: 'TAB-PRO-11', price: 899.99, organisationId: 2 },
  { name: 'Headphones', category: 'Electronics', sku: 'HPH-NC-PRO', price: 299.99, organisationId: 2 },
  { name: 'Webcam HD', category: 'Electronics', sku: 'CAM-HD-1080', price: 89.99, organisationId: 2 },

  // Organization 3
  { name: 'Phone Stand', category: 'Accessories', sku: 'STD-PHN-ALU', price: 19.99, organisationId: 3 },
  { name: 'Cable Set', category: 'Accessories', sku: 'CBL-SET-5', price: 14.99, organisationId: 3 }
]

// Sales (Fact Table #1) - Sales transactions
export const enhancedSales = [
  // Organization 1 - Electronics Sales
  { productId: 1, quantity: 5, revenue: 6499.95, saleDate: new Date('2024-01-15T10:30:00Z'), organisationId: 1 },
  { productId: 1, quantity: 3, revenue: 3899.97, saleDate: new Date('2024-02-20T14:45:00Z'), organisationId: 1 },
  { productId: 2, quantity: 25, revenue: 749.75, saleDate: new Date('2024-01-10T09:15:00Z'), organisationId: 1 },
  { productId: 2, quantity: 15, revenue: 449.85, saleDate: new Date('2024-02-05T11:20:00Z'), organisationId: 1 },
  { productId: 3, quantity: 10, revenue: 499.90, saleDate: new Date('2024-01-25T16:00:00Z'), organisationId: 1 },
  { productId: 4, quantity: 7, revenue: 2799.93, saleDate: new Date('2024-01-30T13:30:00Z'), organisationId: 1 },
  { productId: 5, quantity: 4, revenue: 599.96, saleDate: new Date('2024-02-10T10:00:00Z'), organisationId: 1 },

  // Organization 1 - Office Supplies Sales
  { productId: 6, quantity: 100, revenue: 499.00, saleDate: new Date('2024-01-05T08:00:00Z'), organisationId: 1 },
  { productId: 7, quantity: 50, revenue: 649.50, saleDate: new Date('2024-01-12T12:30:00Z'), organisationId: 1 },
  { productId: 8, quantity: 20, revenue: 499.80, saleDate: new Date('2024-02-15T15:45:00Z'), organisationId: 1 },

  // Organization 1 - Furniture Sales
  { productId: 9, quantity: 8, revenue: 2399.92, saleDate: new Date('2024-01-20T11:00:00Z'), organisationId: 1 },
  { productId: 10, quantity: 2, revenue: 1199.98, saleDate: new Date('2024-02-25T14:00:00Z'), organisationId: 1 },

  // Organization 2 - Sales
  { productId: 11, quantity: 10, revenue: 8999.90, saleDate: new Date('2024-01-08T10:00:00Z'), organisationId: 2 },
  { productId: 12, quantity: 12, revenue: 3599.88, saleDate: new Date('2024-01-18T13:00:00Z'), organisationId: 2 },
  { productId: 13, quantity: 6, revenue: 539.94, saleDate: new Date('2024-02-12T09:30:00Z'), organisationId: 2 },

  // Organization 3 - Sales
  { productId: 14, quantity: 30, revenue: 599.70, saleDate: new Date('2024-01-22T11:00:00Z'), organisationId: 3 },
  { productId: 15, quantity: 40, revenue: 599.60, saleDate: new Date('2024-02-08T10:30:00Z'), organisationId: 3 },

  // Edge cases - high volume sales
  { productId: 2, quantity: 100, revenue: 2999.00, saleDate: new Date('2024-03-01T10:00:00Z'), organisationId: 1 },

  // Edge cases - single item sales
  { productId: 4, quantity: 1, revenue: 399.99, saleDate: new Date('2024-03-05T15:00:00Z'), organisationId: 1 }
]

// Inventory (Fact Table #2) - Inventory levels across warehouses
export const enhancedInventory = [
  // Organization 1 - Warehouse A
  { productId: 1, warehouse: 'Warehouse A', stockLevel: 45, organisationId: 1 },
  { productId: 2, warehouse: 'Warehouse A', stockLevel: 200, organisationId: 1 },
  { productId: 3, warehouse: 'Warehouse A', stockLevel: 75, organisationId: 1 },
  { productId: 4, warehouse: 'Warehouse A', stockLevel: 30, organisationId: 1 },
  { productId: 5, warehouse: 'Warehouse A', stockLevel: 25, organisationId: 1 },

  // Organization 1 - Warehouse B (different stock levels for same products)
  { productId: 1, warehouse: 'Warehouse B', stockLevel: 20, organisationId: 1 },
  { productId: 2, warehouse: 'Warehouse B', stockLevel: 150, organisationId: 1 },
  { productId: 3, warehouse: 'Warehouse B', stockLevel: 50, organisationId: 1 },
  { productId: 4, warehouse: 'Warehouse B', stockLevel: 15, organisationId: 1 },
  { productId: 5, warehouse: 'Warehouse B', stockLevel: 10, organisationId: 1 },

  // Organization 1 - Office Supplies in Warehouse C
  { productId: 6, warehouse: 'Warehouse C', stockLevel: 500, organisationId: 1 },
  { productId: 7, warehouse: 'Warehouse C', stockLevel: 300, organisationId: 1 },
  { productId: 8, warehouse: 'Warehouse C', stockLevel: 100, organisationId: 1 },

  // Organization 1 - Furniture in Warehouse D
  { productId: 9, warehouse: 'Warehouse D', stockLevel: 40, organisationId: 1 },
  { productId: 10, warehouse: 'Warehouse D', stockLevel: 15, organisationId: 1 },

  // Organization 2 - Warehouse E
  { productId: 11, warehouse: 'Warehouse E', stockLevel: 60, organisationId: 2 },
  { productId: 12, warehouse: 'Warehouse E', stockLevel: 80, organisationId: 2 },
  { productId: 13, warehouse: 'Warehouse E', stockLevel: 45, organisationId: 2 },

  // Organization 3 - Warehouse F
  { productId: 14, warehouse: 'Warehouse F', stockLevel: 200, organisationId: 3 },
  { productId: 15, warehouse: 'Warehouse F', stockLevel: 350, organisationId: 3 },

  // Edge cases - out of stock (0 inventory)
  { productId: 1, warehouse: 'Warehouse C', stockLevel: 0, organisationId: 1 },

  // Edge cases - overstocked
  { productId: 2, warehouse: 'Warehouse D', stockLevel: 1000, organisationId: 1 }
]