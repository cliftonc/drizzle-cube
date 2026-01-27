/**
 * Example cube definitions for dev server
 * Uses direct imports from the source code
 */

import { eq, sql } from 'drizzle-orm'
import { defineCube } from '../../src/server/index.js'
import type { QueryContext, BaseQueryDefinition, Cube } from '../../src/server/index.js'
import { employees, departments, productivity, prEvents, teams, employeeTeams } from './schema.js'
import type { Schema } from './schema.js'

// Forward declarations for circular dependency resolution
let employeesCube: Cube<Schema>
let departmentsCube: Cube<Schema>
let productivityCube: Cube<Schema>
let prEventsCube: Cube<Schema>
let teamsCube: Cube<Schema>
let employeeTeamsCube: Cube<Schema>

/**
 * Employees cube - employee analytics (single table)
 */
employeesCube = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Employee data and metrics including headcount, salaries, and location information',
  exampleQuestions: [
    'How many employees do we have?',
    'What is the average salary?',
    'Show me employee count by department',
    'Who are the active employees?',
    'What is the salary distribution?'
  ],

  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),

  // Hierarchies for drill-down navigation
  hierarchies: {
    location: {
      name: 'location',
      title: 'Geographic Location',
      levels: ['country', 'region', 'city']
    }
  },

  // Cube-level joins for cross-cube queries
  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: employees.departmentId, target: departments.id }
      ]
    },
    Productivity: {
      targetCube: () => productivityCube,
      relationship: 'hasMany',
      on: [
        { source: employees.id, target: productivity.employeeId }
      ]
    },
    PREvents: {
      targetCube: () => prEventsCube,
      relationship: 'hasMany',
      on: [
        { source: employees.id, target: prEvents.employeeId }
      ]
    },
    EmployeeTeams: {
      targetCube: () => employeeTeamsCube,
      relationship: 'hasMany',
      // Prefer this path when reaching Teams - uses junction table instead of Departments
      preferredFor: ['Teams'],
      on: [
        { source: employees.id, target: employeeTeams.employeeId }
      ]
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
    createdAt: {
      name: 'createdAt',
      title: 'Hire Date',
      type: 'time',
      sql: employees.createdAt
    },
    // Location dimensions
    city: {
      name: 'city',
      title: 'City',
      type: 'string',
      sql: employees.city
    },
    region: {
      name: 'region',
      title: 'State/Region',
      type: 'string',
      sql: employees.region
    },
    country: {
      name: 'country',
      title: 'Country',
      type: 'string',
      sql: employees.country
    },
    latitude: {
      name: 'latitude',
      title: 'Latitude',
      type: 'number',
      sql: employees.latitude
    },
    longitude: {
      name: 'longitude',
      title: 'Longitude',
      type: 'number',
      sql: employees.longitude
    }
  },

  measures: {
    count: {
      name: 'count',
      title: 'Total Employees',
      type: 'countDistinct',
      sql: employees.id,
      description: 'Total number of unique employees',
      synonyms: ['headcount', 'employee count', 'staff count', 'team size'],
      drillMembers: ['Employees.name', 'Employees.email', 'Employees.isActive', 'Departments.name']
    },
    activeCount: {
      name: 'activeCount',
      title: 'Active Employees',
      type: 'countDistinct',
      sql: employees.id,
      filters: [
        () => eq(employees.active, true)
      ],
      drillMembers: ['Employees.name', 'Employees.email', 'Departments.name']
    },
    totalSalary: {
      name: 'totalSalary',
      title: 'Total Salary',
      type: 'sum',
      sql: employees.salary,
      drillMembers: ['Employees.name', 'Departments.name', 'Employees.city']
    },
    avgSalary: {
      name: 'avgSalary',
      title: 'Average Salary',
      type: 'avg',
      sql: employees.salary,
      format: 'currency',
      description: 'Average salary across all employees',
      synonyms: ['mean salary', 'average pay', 'avg compensation'],
      drillMembers: ['Employees.name', 'Departments.name', 'Employees.city']
    },
    // Statistical measures - Salary Distribution
    stddevSalary: {
      name: 'stddevSalary',
      title: 'Salary Std Dev',
      type: 'stddev',
      sql: employees.salary,
      description: 'Standard deviation of salaries - measures pay spread'
    },
    medianSalary: {
      name: 'medianSalary',
      title: 'Median Salary',
      type: 'median',
      sql: employees.salary,
      description: 'Median salary (50th percentile)',
      format: 'currency'
    },
    p95Salary: {
      name: 'p95Salary',
      title: '95th Percentile Salary',
      type: 'p95',
      sql: employees.salary,
      description: 'Top 5% salary threshold',
      format: 'currency'
    },
    // Calculated measures
    activePercentage: {
      name: 'activePercentage',
      title: 'Active Employee %',
      type: 'calculated',
      calculatedSql: '({activeCount} / NULLIF({count}, 0)) * 100',
      description: 'Percentage of active employees',
      format: 'percent'
    },
    avgSalaryPerActive: {
      name: 'avgSalaryPerActive',
      title: 'Avg Salary Per Active Employee',
      type: 'calculated',
      calculatedSql: '{totalSalary} / NULLIF({activeCount}, 0)',
      description: 'Average salary across only active employees',
      format: 'currency'
    }
  }
}) as Cube<Schema>

/**
 * Departments cube - department-level analytics (single table)
 */
departmentsCube = defineCube('Departments', {
  title: 'Department Analytics',
  description: 'Department-level metrics including budget allocation and team structure',
  exampleQuestions: [
    'How many departments are there?',
    'What is the total budget?',
    'Show budget by department',
    'Which department has the highest budget?'
  ],

  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: departments,
    where: eq(departments.organisationId, ctx.securityContext.organisationId)
  }),

  // Cube-level joins for cross-cube queries
  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'hasMany',
      on: [
        { source: departments.id, target: employees.departmentId }
      ]
    },
    Productivity: {
      targetCube: () => productivityCube,
      relationship: 'hasMany',
      on: [
        { source: departments.id, target: productivity.departmentId }
      ]
    },
    Teams: {
      targetCube: () => teamsCube,
      relationship: 'hasMany',
      on: [
        { source: departments.id, target: teams.departmentId }
      ]
    }
  },

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
      type: 'countDistinct',
      sql: departments.id,
      drillMembers: ['Departments.name']
    },
    totalBudget: {
      name: 'totalBudget',
      title: 'Total Budget',
      type: 'sum',
      sql: departments.budget,
      drillMembers: ['Departments.name']
    },
    avgBudget: {
      name: 'avgBudget',
      title: 'Average Budget',
      type: 'avg',
      sql: departments.budget,
      drillMembers: ['Departments.name']
    },
    // Statistical measures - Budget Distribution
    stddevBudget: {
      name: 'stddevBudget',
      title: 'Budget Std Dev',
      type: 'stddev',
      sql: departments.budget,
      description: 'Standard deviation of department budgets'
    },
    medianBudget: {
      name: 'medianBudget',
      title: 'Median Budget',
      type: 'median',
      sql: departments.budget,
      description: 'Median department budget allocation'
    },
    // Calculated measures
    budgetPerDepartment: {
      name: 'budgetPerDepartment',
      title: 'Budget Per Department',
      type: 'calculated',
      calculatedSql: '{totalBudget} / NULLIF({count}, 0)',
      description: 'Average budget allocation per department',
      format: 'currency'
    }
  }
}) as Cube<Schema>

/**
 * Productivity cube - productivity metrics with time dimensions
 */
productivityCube = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Daily productivity metrics including lines of code, pull requests, deployments, and happiness scores',
  exampleQuestions: [
    'What are the total lines of code this month?',
    'Show productivity trends over time',
    'How many pull requests were submitted?',
    'What is the average happiness index?',
    'Show deployments by week'
  ],

  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: productivity,
    where: eq(productivity.organisationId, ctx.securityContext.organisationId)
  }),

  // Hierarchies for drill-down navigation
  hierarchies: {
    happinessHierarchy: {
      name: 'happinessHierarchy',
      title: 'Happiness Breakdown',
      levels: ['happinessLevel', 'happinessIndex']
    }
  },

  // Cube-level joins for multi-cube queries
  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'belongsTo',
      on: [
        { source: productivity.employeeId, target: employees.id }
      ]
    },
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: productivity.departmentId, target: departments.id }
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
      sql: sql`
        CASE 
          WHEN ${productivity.happinessIndex} >= 8 THEN 'High'
          WHEN ${productivity.happinessIndex} >= 6 THEN 'Medium'
          ELSE 'Low'
        END
      `
    },
    departmentId: {
      name: 'departmentId',
      title: 'Department ID',
      type: 'number',
      sql: productivity.departmentId
    },
    linesOfCode: {
      name: 'linesOfCode',
      title: 'Lines of Code',
      type: 'number',
      sql: productivity.linesOfCode,
      description: 'Raw lines of code for this record'
    },
    pullRequests: {
      name: 'pullRequests',
      title: 'Pull Requests',
      type: 'number',
      sql: productivity.pullRequests,
      description: 'Raw PR count for this record'
    }
  },

  measures: {
    count: {
      name: 'count',
      title: 'Total Records',
      type: 'count',
      sql: productivity.id,
      drillMembers: ['Productivity.date', 'Employees.name', 'Departments.name']
    },
    recordCount: {
      name: 'recordCount',
      title: 'Record Count',
      type: 'count',
      sql: productivity.id,
      drillMembers: ['Productivity.date', 'Employees.name', 'Departments.name']
    },
    workingDaysCount: {
      name: 'workingDaysCount',
      title: 'Working Days',
      type: 'count',
      sql: productivity.id,
      filters: [
        () => eq(productivity.daysOff, false)
      ],
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.isDayOff']
    },
    daysOffCount: {
      name: 'daysOffCount',
      title: 'Days Off',
      type: 'count',
      sql: productivity.id,
      filters: [
        () => eq(productivity.daysOff, true)
      ],
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.isDayOff']
    },
    avgLinesOfCode: {
      name: 'avgLinesOfCode',
      title: 'Average Lines of Code',
      type: 'avg',
      sql: productivity.linesOfCode,
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.linesOfCode', 'Departments.name']
    },
    totalLinesOfCode: {
      name: 'totalLinesOfCode',
      title: 'Total Lines of Code',
      type: 'sum',
      sql: productivity.linesOfCode,
      description: 'Sum of all lines of code written',
      synonyms: ['LOC', 'code output', 'lines written', 'code volume'],
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.linesOfCode', 'Departments.name']
    },
    totalPullRequests: {
      name: 'totalPullRequests',
      title: 'Total Pull Requests',
      type: 'sum',
      sql: productivity.pullRequests,
      description: 'Total number of pull requests submitted',
      synonyms: ['PRs', 'merge requests', 'code reviews'],
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.pullRequests', 'Departments.name']
    },
    avgPullRequests: {
      name: 'avgPullRequests',
      title: 'Average Pull Requests',
      type: 'avg',
      sql: productivity.pullRequests,
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.pullRequests', 'Departments.name']
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
      title: 'Average Happiness',
      type: 'avg',
      sql: productivity.happinessIndex,
      drillMembers: ['Productivity.date', 'Employees.name', 'Productivity.happinessIndex', 'Productivity.happinessLevel']
    },
    // Statistical measures - Code Output Distribution
    stddevLinesOfCode: {
      name: 'stddevLinesOfCode',
      title: 'Lines of Code Std Dev',
      type: 'stddev',
      sql: productivity.linesOfCode,
      description: 'Variation in daily code output'
    },
    medianLinesOfCode: {
      name: 'medianLinesOfCode',
      title: 'Median Lines of Code',
      type: 'median',
      sql: productivity.linesOfCode,
      description: 'Median daily code output'
    },
    p95LinesOfCode: {
      name: 'p95LinesOfCode',
      title: '95th Percentile Lines',
      type: 'p95',
      sql: productivity.linesOfCode,
      description: 'High performer code output threshold'
    },
    // Statistical measures - Happiness Distribution
    stddevHappinessIndex: {
      name: 'stddevHappinessIndex',
      title: 'Happiness Std Dev',
      type: 'stddev',
      sql: productivity.happinessIndex,
      description: 'Variation in team happiness'
    },
    medianHappinessIndex: {
      name: 'medianHappinessIndex',
      title: 'Median Happiness',
      type: 'median',
      sql: productivity.happinessIndex,
      description: 'Median happiness score (more robust than average)'
    },
    // Statistical measures - Pull Requests Distribution
    medianPullRequests: {
      name: 'medianPullRequests',
      title: 'Median Pull Requests',
      type: 'median',
      sql: productivity.pullRequests,
      description: 'Median daily pull requests'
    },
    p95PullRequests: {
      name: 'p95PullRequests',
      title: '95th Percentile PRs',
      type: 'p95',
      sql: productivity.pullRequests,
      description: 'High performer PR threshold'
    },
    productivityScore: {
      name: 'productivityScore',
      title: 'Productivity Score',
      type: 'avg',
      sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
      description: 'Composite productivity score based on code output, reviews, and deployments'
    },
    // Calculated measures
    workingDaysPercentage: {
      name: 'workingDaysPercentage',
      title: 'Working Days %',
      type: 'calculated',
      calculatedSql: '({workingDaysCount} / NULLIF({recordCount}, 0)) * 100',
      description: 'Percentage of working days vs total days',
      format: 'percent'
    },
    avgCodePerWorkday: {
      name: 'avgCodePerWorkday',
      title: 'Avg Lines Per Working Day',
      type: 'calculated',
      calculatedSql: '{totalLinesOfCode} / NULLIF({workingDaysCount}, 0)',
      description: 'Average lines of code per working day'
    },
    avgPRsPerWorkday: {
      name: 'avgPRsPerWorkday',
      title: 'Avg PRs Per Working Day',
      type: 'calculated',
      calculatedSql: '{totalPullRequests} / NULLIF({workingDaysCount}, 0)',
      description: 'Average pull requests per working day'
    },
    compositeProductivityScore: {
      name: 'compositeProductivityScore',
      title: 'Composite Productivity Score',
      type: 'calculated',
      calculatedSql: '({totalLinesOfCode} * 0.3 + {totalPullRequests} * 2 + {totalDeployments} * 5) / NULLIF({workingDaysCount}, 0)',
      description: 'Weighted productivity score: lines (30%), PRs (2x), deployments (5x) per working day'
    },
    deploymentRate: {
      name: 'deploymentRate',
      title: 'Deployment Rate',
      type: 'calculated',
      calculatedSql: '({totalDeployments} / NULLIF({workingDaysCount}, 0)) * 100',
      description: 'Deployments per 100 working days',
      format: 'percent'
    },

    // ============================================
    // Post-Aggregation Window Function Measures
    // These operate on aggregated data - the base measure is aggregated first,
    // then the window function is applied to the aggregated results.
    // ============================================

    // LAG - Compare to previous period's total (difference)
    linesOfCodeChange: {
      name: 'linesOfCodeChange',
      title: 'Lines Change (vs Previous)',
      type: 'lag',
      description: 'Change in lines of code compared to previous period',
      windowConfig: {
        measure: 'totalLinesOfCode',
        operation: 'difference',
        orderBy: [{ field: 'date', direction: 'asc' }]
      }
    },

    // LAG - Get previous period's total (raw value)
    previousPeriodLines: {
      name: 'previousPeriodLines',
      title: 'Previous Period Lines',
      type: 'lag',
      description: 'Lines of code from the previous period',
      windowConfig: {
        measure: 'totalLinesOfCode',
        operation: 'raw',
        orderBy: [{ field: 'date', direction: 'asc' }]
      }
    },

    // LAG - Percent change from previous period
    linesPercentChange: {
      name: 'linesPercentChange',
      title: 'Lines % Change',
      type: 'lag',
      description: 'Percent change in lines of code from previous period',
      windowConfig: {
        measure: 'totalLinesOfCode',
        operation: 'percentChange',
        orderBy: [{ field: 'date', direction: 'asc' }]
      }
    },

    // RANK - Rank periods by total lines (most productive = rank 1)
    productivityRank: {
      name: 'productivityRank',
      title: 'Productivity Rank',
      type: 'rank',
      description: 'Rank by total lines of code (1 = most productive period)',
      windowConfig: {
        measure: 'totalLinesOfCode',
        operation: 'raw',
        orderBy: [{ field: 'totalLinesOfCode', direction: 'desc' }]
      }
    },

    // Running total - Cumulative sum of lines
    runningTotalLines: {
      name: 'runningTotalLines',
      title: 'Running Total Lines',
      type: 'movingSum',
      description: 'Cumulative total lines of code over time',
      windowConfig: {
        measure: 'totalLinesOfCode',
        operation: 'raw',
        orderBy: [{ field: 'date', direction: 'asc' }],
        frame: {
          type: 'rows',
          start: 'unbounded',
          end: 'current'
        }
      }
    },

    // Moving 7-period average for trend analysis
    movingAvg7Period: {
      name: 'movingAvg7Period',
      title: '7-Period Moving Avg',
      type: 'movingAvg',
      description: '7-period moving average of lines of code',
      windowConfig: {
        measure: 'totalLinesOfCode',
        operation: 'raw',
        orderBy: [{ field: 'date', direction: 'asc' }],
        frame: {
          type: 'rows',
          start: 6,
          end: 'current'
        }
      }
    }
  }
}) as Cube<Schema>

/**
 * PR Events cube - PR lifecycle events for funnel analysis
 */
prEventsCube = defineCube('PREvents', {
  title: 'PR Events',
  description: 'Pull request lifecycle events including creation, review, approval, and merge for funnel and flow analysis',
  exampleQuestions: [
    'How many PR events occurred?',
    'Show the PR funnel from creation to merge',
    'What is the PR approval rate?',
    'How many unique PRs were created?'
  ],

  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: prEvents,
    where: eq(prEvents.organisationId, ctx.securityContext.organisationId)
  }),

  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'belongsTo',
      on: [
        { source: prEvents.employeeId, target: employees.id }
      ]
    }
  },

  dimensions: {
    id: {
      name: 'id',
      title: 'Event ID',
      type: 'number',
      sql: prEvents.id,
      primaryKey: true
    },
    prNumber: {
      name: 'prNumber',
      title: 'PR Number',
      type: 'number',
      sql: prEvents.prNumber
    },
    eventType: {
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      sql: prEvents.eventType
    },
    employeeId: {
      name: 'employeeId',
      title: 'Employee ID',
      type: 'number',
      sql: prEvents.employeeId
    },
    timestamp: {
      name: 'timestamp',
      title: 'Event Timestamp',
      type: 'time',
      sql: prEvents.timestamp
    },
    createdAt: {
      name: 'createdAt',
      title: 'Created At',
      type: 'time',
      sql: prEvents.createdAt
    }
  },

  measures: {
    count: {
      name: 'count',
      title: 'Event Count',
      type: 'count',
      sql: prEvents.id,
      drillMembers: ['PREvents.prNumber', 'PREvents.eventType', 'PREvents.timestamp', 'Employees.name']
    },
    uniquePRs: {
      name: 'uniquePRs',
      title: 'Unique PRs',
      type: 'countDistinct',
      sql: prEvents.prNumber,
      drillMembers: ['PREvents.prNumber', 'PREvents.eventType', 'PREvents.timestamp']
    },
    uniqueActors: {
      name: 'uniqueActors',
      title: 'Unique Actors',
      type: 'countDistinct',
      sql: prEvents.employeeId,
      drillMembers: ['Employees.name', 'PREvents.prNumber', 'PREvents.eventType']
    }
  },

  // Event stream marker for funnel queries
  meta: {
    eventStream: {
      bindingKey: 'PREvents.prNumber',
      timeDimension: 'PREvents.timestamp'
    }
  }
}) as Cube<Schema>

/**
 * Teams cube - team analytics
 */
teamsCube = defineCube('Teams', {
  title: 'Team Analytics',
  description: 'Team structure and membership analysis',

  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: teams,
    where: eq(teams.organisationId, ctx.securityContext.organisationId)
  }),

  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: teams.departmentId, target: departments.id }
      ]
    },
    EmployeeTeams: {
      targetCube: () => employeeTeamsCube,
      relationship: 'hasMany',
      on: [
        { source: teams.id, target: employeeTeams.teamId }
      ]
    }
  },

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
      title: 'Description',
      type: 'string',
      sql: teams.description
    },
    departmentId: {
      name: 'departmentId',
      title: 'Department ID',
      type: 'number',
      sql: teams.departmentId
    },
    createdAt: {
      name: 'createdAt',
      title: 'Created At',
      type: 'time',
      sql: teams.createdAt
    }
  },

  measures: {
    count: {
      name: 'count',
      title: 'Total Teams',
      type: 'countDistinct',
      sql: teams.id,
      drillMembers: ['Teams.name', 'Teams.description', 'Departments.name']
    }
  }
}) as Cube<Schema>

/**
 * EmployeeTeams cube - junction table for many-to-many analysis
 */
employeeTeamsCube = defineCube('EmployeeTeams', {
  title: 'Employee Team Membership',
  description: 'Employee team assignments and roles',

  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employeeTeams,
    where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId)
  }),

  // Hierarchies for drill-down navigation
  hierarchies: {
    roleHierarchy: {
      name: 'roleHierarchy',
      title: 'Team Role',
      levels: ['role']
    }
  },

  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'belongsTo',
      on: [
        { source: employeeTeams.employeeId, target: employees.id }
      ]
    },
    Teams: {
      targetCube: () => teamsCube,
      relationship: 'belongsTo',
      on: [
        { source: employeeTeams.teamId, target: teams.id }
      ]
    }
  },

  dimensions: {
    id: {
      name: 'id',
      title: 'Membership ID',
      type: 'number',
      sql: employeeTeams.id,
      primaryKey: true
    },
    employeeId: {
      name: 'employeeId',
      title: 'Employee ID',
      type: 'number',
      sql: employeeTeams.employeeId
    },
    teamId: {
      name: 'teamId',
      title: 'Team ID',
      type: 'number',
      sql: employeeTeams.teamId
    },
    role: {
      name: 'role',
      title: 'Team Role',
      type: 'string',
      sql: employeeTeams.role
    },
    joinedAt: {
      name: 'joinedAt',
      title: 'Joined Team',
      type: 'time',
      sql: employeeTeams.joinedAt
    }
  },

  measures: {
    count: {
      name: 'count',
      title: 'Total Memberships',
      type: 'count',
      sql: employeeTeams.id,
      drillMembers: ['Employees.name', 'Teams.name', 'EmployeeTeams.role', 'EmployeeTeams.joinedAt']
    },
    uniqueEmployees: {
      name: 'uniqueEmployees',
      title: 'Unique Employees',
      type: 'countDistinct',
      sql: employeeTeams.employeeId,
      drillMembers: ['Employees.name', 'Teams.name', 'EmployeeTeams.role']
    },
    uniqueTeams: {
      name: 'uniqueTeams',
      title: 'Unique Teams',
      type: 'countDistinct',
      sql: employeeTeams.teamId,
      drillMembers: ['Teams.name', 'Employees.name', 'EmployeeTeams.role']
    },
    leadCount: {
      name: 'leadCount',
      title: 'Team Leads',
      type: 'count',
      sql: employeeTeams.id,
      filters: [
        () => eq(employeeTeams.role, 'lead')
      ],
      drillMembers: ['Employees.name', 'Teams.name', 'EmployeeTeams.joinedAt']
    }
  }
}) as Cube<Schema>

/**
 * Export cubes for use in other modules
 */
export { employeesCube, departmentsCube, productivityCube, prEventsCube, teamsCube, employeeTeamsCube }

/**
 * All cubes for registration
 */
export const allCubes = [
  employeesCube,
  departmentsCube,
  productivityCube,
  prEventsCube,
  teamsCube,
  employeeTeamsCube
]