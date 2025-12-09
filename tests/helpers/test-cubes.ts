/**
 * Shared cube definitions for comprehensive testing
 * These cubes are used across all test suites to ensure consistency
 */

import { eq, and, sql } from 'drizzle-orm'
import { defineCube } from '../../src/server/cube-utils'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition 
} from '../../src/server/types'
import { getTestSchema } from './test-database'

// Dynamic cube creation only - remove static imports
// All tests should use createTestCubesForCurrentDatabase() function

/**
 * DEPRECATED: Static cube definitions removed for database isolation
 * Use createTestCubesForCurrentDatabase() instead to get database-specific cubes
 * 
 * This ensures tests use the correct schema (PostgreSQL/MySQL/SQLite) tables
 */


/**
 * Compatibility layer - creates static-like cube map using dynamic cubes
 * This allows existing tests to work while we transition to fully dynamic approach
 */
export async function getTestCubes(cubeNames?: string[]): Promise<Map<string, Cube<any>>> {
  const { testEmployeesCube, testDepartmentsCube, testProductivityCube, testTimeEntriesCube, testTeamsCube } = await createTestCubesForCurrentDatabase()

  const allCubes = new Map([
    ['Employees', testEmployeesCube],
    ['Departments', testDepartmentsCube],
    ['Productivity', testProductivityCube],
    ['TimeEntries', testTimeEntriesCube],
    ['Teams', testTeamsCube]
  ])

  if (!cubeNames) {
    return allCubes
  }
  
  const filteredCubes = new Map<string, Cube<any>>()
  for (const name of cubeNames) {
    const cube = allCubes.get(name)
    if (cube) {
      filteredCubes.set(name, cube)
    }
  }
  return filteredCubes
}

/**
 * Create cubes dynamically for the current database type
 * This ensures that cubes use the correct schema tables (MySQL vs PostgreSQL vs SQLite)
 */
export async function createTestCubesForCurrentDatabase(): Promise<{
  testEmployeesCube: Cube<any>
  testDepartmentsCube: Cube<any>
  testProductivityCube: Cube<any>
  testTimeEntriesCube: Cube<any>
  testTeamsCube: Cube<any>
}> {
  const { employees, departments, productivity, timeEntries, teams, employeeTeams, dbTrue, dbFalse } = await getTestSchema()

  // Declare cube variables first to handle forward references
  let testEmployeesCube: Cube<any>
  let testDepartmentsCube: Cube<any>
  let testProductivityCube: Cube<any>
  let testTimeEntriesCube: Cube<any>
  let testTeamsCube: Cube<any>
  
  // Create employees cube with correct schema
  testEmployeesCube = defineCube('Employees', {
    title: 'Employees Analytics',
    description: 'Comprehensive employee data with department information and all field types',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: employees,    
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Productivity: {
        targetCube: () => testProductivityCube,
        relationship: 'hasMany',
        on: [
          { source: employees.id, target: productivity.employeeId }
        ]
      },
      Departments: {
        targetCube: () => testDepartmentsCube,
        relationship: 'belongsTo',
        on: [
          { source: employees.departmentId, target: departments.id }
        ]
      },
      // Many-to-many relationship through timeEntries junction table
      DepartmentsViaTimeEntries: {
        targetCube: () => testDepartmentsCube,
        relationship: 'belongsToMany',
        on: [], // Not used for belongsToMany
        through: {
          table: timeEntries,
          sourceKey: [
            { source: employees.id, target: timeEntries.employeeId }
          ],
          targetKey: [
            { source: timeEntries.departmentId, target: departments.id }
          ],
          securitySql: (securityContext) =>
            eq(timeEntries.organisationId, securityContext.organisationId)
        }
      },
      // Many-to-many relationship to Teams through employeeTeams junction table
      Teams: {
        targetCube: () => testTeamsCube,
        relationship: 'belongsToMany',
        on: [], // Not used for belongsToMany
        through: {
          table: employeeTeams,
          sourceKey: [
            { source: employees.id, target: employeeTeams.employeeId }
          ],
          targetKey: [
            { source: employeeTeams.teamId, target: teams.id }
          ],
          securitySql: (securityContext) =>
            eq(employeeTeams.organisationId, securityContext.organisationId)
        }
      }
    },
    
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
      departmentId: {
        name: 'departmentId',
        title: 'Department ID',
        type: 'number',
        sql: employees.departmentId
      },
      isActive: {
        name: 'isActive',
        title: 'Active Status',
        type: 'boolean',
        sql: employees.active
      },
      active: {
        name: 'active',
        title: 'Active',
        type: 'boolean',
        sql: employees.active
      },
      createdAt: {
        name: 'createdAt',
        title: 'Hire Date',
        type: 'time',
        sql: employees.createdAt
      },
      salary: {
        name: 'salary',
        title: 'Salary',
        type: 'number',
        sql: employees.salary
      },
      tags: {
        name: 'tags',
        title: 'Employee Tags',
        type: 'string', // PostgreSQL TEXT[] array - used for array operator testing
        sql: employees.tags
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Total Employees',
        type: 'countDistinct',
        sql: employees.id
      },
      activeCount: {
        name: 'activeCount',
        title: 'Active Employees',
        type: 'countDistinct',
        sql: employees.id,
        filters: [
          () => eq(employees.active, dbTrue)
        ]
      },
      inactiveCount: {
        name: 'inactiveCount',
        title: 'Inactive Employees',
        type: 'countDistinct',
        sql: employees.id,
        filters: [
          () => eq(employees.active, dbFalse)
        ]
      },
      totalSalary: {
        name: 'totalSalary',
        title: 'Total Salary',
        type: 'sum',
        sql: employees.salary
      },
      avgSalary: {
        name: 'avgSalary',
        title: 'Average Salary',
        type: 'avg',
        sql: employees.salary
      },
      minSalary: {
        name: 'minSalary',
        title: 'Minimum Salary',
        type: 'min',
        sql: employees.salary
      },
      maxSalary: {
        name: 'maxSalary',
        title: 'Maximum Salary',
        type: 'max',
        sql: employees.salary
      },
      countDistinctDepartments: {
        name: 'countDistinctDepartments',
        title: 'Unique Departments',
        type: 'countDistinct',
        sql: employees.departmentId
      }
    }
  })

  // Create departments cube with correct schema  
  testDepartmentsCube = defineCube('Departments', {
    title: 'Departments Analytics',
    description: 'Department information and metrics',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
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
        title: 'Name',
        type: 'string',
        sql: departments.name
      }
    },
    
    measures: {
      count: {
        name: 'count',
        title: 'Department Count',
        type: 'countDistinct',
        sql: departments.id
      },
      totalBudget: {
        name: 'totalBudget',
        title: 'Total Budget',
        type: 'sum',
        sql: departments.budget
      },
      avgBudget: {
        name: 'avgBudget',
        title: 'Average Budget',
        type: 'avg',
        sql: departments.budget
      },
      minBudget: {
        name: 'minBudget',
        title: 'Minimum Budget',
        type: 'min',
        sql: departments.budget
      },
      maxBudget: {
        name: 'maxBudget',
        title: 'Maximum Budget',
        type: 'max',
        sql: departments.budget
      }
    }
  })

  // Create productivity cube with correct schema
  testProductivityCube = defineCube('Productivity', {
    title: 'Productivity Analytics',
    description: 'Daily productivity metrics including code output, deployments, and happiness tracking',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),

    // Cube-level joins for multi-cube queries
    joins: {
      Employees: {
        targetCube: () => testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: productivity.employeeId, target: employees.id }
        ]
      }
    },
    
    dimensions: {
      id: {
        name: 'id',
        title: 'Record ID',
        type: 'number',
        sql: productivity.id,
        primaryKey: true
      },
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: productivity.employeeId
      },
      date: {
        name: 'date',
        title: 'Date',
        type: 'time',
        sql: productivity.date
      },
      createdAt: {
        name: 'createdAt',
        title: 'Created At',
        type: 'time',
        sql: productivity.createdAt
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
      happinessIndex: {
        name: 'happinessIndex',
        title: 'Happiness Index',
        type: 'number',
        sql: productivity.happinessIndex
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
      },
      linesOfCode: {
        name: 'linesOfCode',
        title: 'Lines of Code',
        type: 'number',
        sql: productivity.linesOfCode
      },
      pullRequests: {
        name: 'pullRequests',
        title: 'Pull Requests',
        type: 'number',
        sql: productivity.pullRequests
      },
      deployments: {
        name: 'deployments',
        title: 'Deployments',
        type: 'number',
        sql: productivity.liveDeployments
      }
    },
    
    measures: {
      // Count measures
      recordCount: {
        name: 'recordCount',
        title: 'Total Records',
        type: 'count',
        sql: productivity.id
      },
      workingDaysCount: {
        name: 'workingDaysCount',
        title: 'Working Days',
        type: 'count',
        sql: productivity.id,
        filters: [
          () => eq(productivity.daysOff, dbFalse)
        ]
      },
      daysOffCount: {
        name: 'daysOffCount',
        title: 'Days Off',
        type: 'count',
        sql: productivity.id,
        filters: [
          () => eq(productivity.daysOff, dbTrue)
        ]
      },
      
      // Sum measures
      totalLinesOfCode: {
        name: 'totalLinesOfCode',
        title: 'Total Lines of Code',
        type: 'sum',
        sql: productivity.linesOfCode
      },
      totalPullRequests: {
        name: 'totalPullRequests',
        title: 'Total Pull Requests',
        type: 'sum',
        sql: productivity.pullRequests
      },
      totalDeployments: {
        name: 'totalDeployments',
        title: 'Total Deployments',
        type: 'sum',
        sql: productivity.liveDeployments
      },
      
      // Average measures
      avgLinesOfCode: {
        name: 'avgLinesOfCode',
        title: 'Average Lines of Code',
        type: 'avg',
        sql: productivity.linesOfCode
      },
      avgPullRequests: {
        name: 'avgPullRequests',
        title: 'Average Pull Requests',
        type: 'avg',
        sql: productivity.pullRequests
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
      
      // Min/Max measures
      minHappinessIndex: {
        name: 'minHappinessIndex',
        title: 'Minimum Happiness',
        type: 'min',
        sql: productivity.happinessIndex
      },
      maxHappinessIndex: {
        name: 'maxHappinessIndex',
        title: 'Maximum Happiness',
        type: 'max',
        sql: productivity.happinessIndex
      },
      minLinesOfCode: {
        name: 'minLinesOfCode',
        title: 'Minimum Lines of Code',
        type: 'min',
        sql: productivity.linesOfCode
      },
      maxLinesOfCode: {
        name: 'maxLinesOfCode',
        title: 'Maximum Lines of Code',
        type: 'max',
        sql: productivity.linesOfCode
      },
      
      // CountDistinct measures
      countDistinctEmployees: {
        name: 'countDistinctEmployees',
        title: 'Unique Employees',
        type: 'countDistinct',
        sql: productivity.employeeId
      },
      
      // Conditional measures for testing edge cases
      highProductivityDays: {
        name: 'highProductivityDays',
        title: 'High Productivity Days',
        type: 'count',
        sql: productivity.id,
        filters: [
          () => sql`${productivity.linesOfCode} > 200`
        ]
      },
      happyWorkDays: {
        name: 'happyWorkDays',
        title: 'Happy Work Days',
        type: 'count',
        sql: productivity.id,
        filters: [
          () => and(
            eq(productivity.daysOff, dbFalse),
            sql`${productivity.happinessIndex} >= 7`
          )
        ]
      },
      
      // Complex calculated measures
      productivityScore: {
        name: 'productivityScore',
        title: 'Productivity Score',
        type: 'avg',
        sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
        description: 'Composite productivity score based on code output, reviews, and deployments'
      }
    }
  })

  // Create time entries cube with comprehensive fan-out scenarios and aggregations
  testTimeEntriesCube = defineCube('TimeEntries', {
    title: 'Time Entries Analytics', 
    description: 'Employee time tracking with allocation types, departments, and billable hours',
    
    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: timeEntries,    
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),

    joins: {
      Employees: {
        targetCube: () => testEmployeesCube,
        relationship: 'belongsTo',
        on: [
          { source: timeEntries.employeeId, target: employees.id }
        ]
      },
      Departments: {
        targetCube: () => testDepartmentsCube,
        relationship: 'belongsTo', 
        on: [
          { source: timeEntries.departmentId, target: departments.id }
        ]
      }
    },

    dimensions: {
      id: {
        name: 'id',
        title: 'Time Entry ID',
        type: 'number',
        sql: timeEntries.id,
        primaryKey: true
      },
      employeeId: {
        name: 'employeeId',
        title: 'Employee ID',
        type: 'number',
        sql: timeEntries.employeeId
      },
      departmentId: {
        name: 'departmentId', 
        title: 'Department ID',
        type: 'number',
        sql: timeEntries.departmentId
      },
      allocationType: {
        name: 'allocationType',
        title: 'Allocation Type',
        type: 'string',
        sql: timeEntries.allocationType
      },
      description: {
        name: 'description',
        title: 'Task Description',
        type: 'string',
        sql: timeEntries.description
      },
      date: {
        name: 'date',
        title: 'Date',
        type: 'time',
        sql: timeEntries.date
      },
      createdAt: {
        name: 'createdAt',
        title: 'Created At',
        type: 'time',
        sql: timeEntries.createdAt
      }
    },

    measures: {
      // Basic count measures
      count: {
        name: 'count',
        title: 'Total Time Entries',
        type: 'count',
        sql: timeEntries.id,
        description: 'Total number of time entries'
      },
      
      // Hours-based measures
      totalHours: {
        name: 'totalHours',
        title: 'Total Hours',
        type: 'sum',
        sql: timeEntries.hours,
        description: 'Sum of all logged hours'
      },
      avgHours: {
        name: 'avgHours',
        title: 'Average Hours per Entry',
        type: 'avg',
        sql: timeEntries.hours,
        description: 'Average hours per time entry'
      },
      minHours: {
        name: 'minHours',
        title: 'Minimum Hours',
        type: 'min',
        sql: timeEntries.hours
      },
      maxHours: {
        name: 'maxHours',
        title: 'Maximum Hours',
        type: 'max',
        sql: timeEntries.hours
      },
      
      // Billable hours measures
      totalBillableHours: {
        name: 'totalBillableHours',
        title: 'Total Billable Hours',
        type: 'sum',
        sql: timeEntries.billableHours,
        description: 'Sum of all billable hours'
      },
      avgBillableHours: {
        name: 'avgBillableHours',
        title: 'Average Billable Hours',
        type: 'avg',
        sql: timeEntries.billableHours
      },
      
      // Allocation-specific measures with filters
      developmentHours: {
        name: 'developmentHours',
        title: 'Development Hours',
        type: 'sum',
        sql: timeEntries.hours,
        filters: [
          { member: timeEntries.allocationType, operator: 'equals', values: ['development'] }
        ],
        description: 'Total hours spent on development tasks'
      },
      meetingHours: {
        name: 'meetingHours',
        title: 'Meeting Hours',
        type: 'sum',
        sql: timeEntries.hours,
        filters: [
          { member: timeEntries.allocationType, operator: 'equals', values: ['meetings'] }
        ],
        description: 'Total hours spent in meetings'
      },
      maintenanceHours: {
        name: 'maintenanceHours',
        title: 'Maintenance Hours',
        type: 'sum',
        sql: timeEntries.hours,
        filters: [
          { member: timeEntries.allocationType, operator: 'equals', values: ['maintenance'] }
        ]
      },
      
      // Distinct count measures
      distinctEmployees: {
        name: 'distinctEmployees',
        title: 'Unique Employees',
        type: 'countDistinct',
        sql: timeEntries.employeeId,
        description: 'Number of unique employees with time entries'
      },
      distinctDepartments: {
        name: 'distinctDepartments',
        title: 'Unique Departments',
        type: 'countDistinct', 
        sql: timeEntries.departmentId
      },
      distinctAllocations: {
        name: 'distinctAllocations',
        title: 'Unique Allocation Types',
        type: 'countDistinct',
        sql: timeEntries.allocationType
      },
      
      // Complex calculated measures
      utilizationRate: {
        name: 'utilizationRate',
        title: 'Utilization Rate (%)',
        type: 'avg',
        sql: sql`(${timeEntries.billableHours} / NULLIF(${timeEntries.hours}, 0) * 100)`,
        description: 'Percentage of billable vs total hours'
      },
      avgDailyHours: {
        name: 'avgDailyHours',  
        title: 'Average Daily Hours',
        type: 'avg',
        sql: sql`${timeEntries.hours}`, // This will be grouped by date in queries
        description: 'Average hours logged per day'
      },
      productiveDays: {
        name: 'productiveDays',
        title: 'Productive Days',
        type: 'countDistinct',
        sql: timeEntries.date,
        filters: [
          { member: timeEntries.hours, operator: 'gt', values: [6] }
        ],
        description: 'Days with more than 6 hours logged'
      },
      
      // Fan-out testing measures (multiple entries per employee per day)
      entriesPerDay: {
        name: 'entriesPerDay',
        title: 'Entries per Day',
        type: 'avg',
        sql: sql`COUNT(*)`, // This creates fan-out when grouped by employee+date
        description: 'Average number of time entries per day'
      },
      maxDailyHours: {
        name: 'maxDailyHours',
        title: 'Maximum Daily Hours',
        type: 'max', 
        sql: sql`SUM(${timeEntries.hours})`, // Aggregated per day
        description: 'Maximum hours logged in a single day'
      }
    }
  })

  // Create teams cube with comprehensive measures and dimensions
  testTeamsCube = defineCube('Teams', {
    title: 'Teams Analytics',
    description: 'Team information and metrics',

    sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
      from: teams,
      where: eq(teams.organisationId, ctx.securityContext.organisationId)
    }),

    dimensions: {
      id: {
        name: 'id',
        title: 'Team ID',
        type: 'number',
        sql: teams.id,
        primaryKey: true
      },
      name: {
        name: 'name',
        title: 'Team Name',
        type: 'string',
        sql: teams.name
      },
      description: {
        name: 'description',
        title: 'Team Description',
        type: 'string',
        sql: teams.description
      },
      createdAt: {
        name: 'createdAt',
        title: 'Created Date',
        type: 'time',
        sql: teams.createdAt
      }
    },

    measures: {
      count: {
        name: 'count',
        title: 'Total Teams',
        type: 'count',
        sql: teams.id,
        description: 'Total number of teams'
      }
    }
  })

  return {
    testEmployeesCube,
    testDepartmentsCube,
    testProductivityCube,
    testTimeEntriesCube,
    testTeamsCube
  }
}