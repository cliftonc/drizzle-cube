/**
 * Example cube definitions for dev server
 * Uses direct imports from the source code
 */

import { eq, sql } from 'drizzle-orm'
import { defineCube } from '../../src/server/index.js'
import type { QueryContext, BaseQueryDefinition, Cube } from '../../src/server/index.js'
import { employees, departments, productivity, prEvents } from './schema.js'
import type { Schema } from './schema.js'

// Forward declarations for circular dependency resolution
let employeesCube: Cube<Schema>
let departmentsCube: Cube<Schema>
let productivityCube: Cube<Schema>
let prEventsCube: Cube<Schema>

/**
 * Employees cube - employee analytics (single table)
 */
employeesCube = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Employee data and metrics',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),

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
        () => eq(employees.active, true)
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
      sql: employees.salary,
      format: 'currency'
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
  description: 'Department-level metrics and budget analysis',
  
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
      type: 'count',
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
  description: 'Daily productivity metrics including code output and deployments',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: productivity,  
    where: eq(productivity.organisationId, ctx.securityContext.organisationId)
  }),

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
      sql: productivity.id
    },
    recordCount: {
      name: 'recordCount',
      title: 'Record Count',
      type: 'count',
      sql: productivity.id
    },
    workingDaysCount: {
      name: 'workingDaysCount',
      title: 'Working Days',
      type: 'count',
      sql: productivity.id,
      filters: [
        () => eq(productivity.daysOff, false)
      ]
    },
    daysOffCount: {
      name: 'daysOffCount',
      title: 'Days Off',
      type: 'count',
      sql: productivity.id,
      filters: [
        () => eq(productivity.daysOff, true)
      ]
    },
    avgLinesOfCode: {
      name: 'avgLinesOfCode',
      title: 'Average Lines of Code',
      type: 'avg',
      sql: productivity.linesOfCode
    },
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
      title: 'Average Happiness',
      type: 'avg',
      sql: productivity.happinessIndex
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
  description: 'Pull request lifecycle events for funnel analysis',

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
      sql: prEvents.id
    },
    uniquePRs: {
      name: 'uniquePRs',
      title: 'Unique PRs',
      type: 'countDistinct',
      sql: prEvents.prNumber
    },
    uniqueActors: {
      name: 'uniqueActors',
      title: 'Unique Actors',
      type: 'countDistinct',
      sql: prEvents.employeeId
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
 * Export cubes for use in other modules
 */
export { employeesCube, departmentsCube, productivityCube, prEventsCube }

/**
 * All cubes for registration
 */
export const allCubes = [
  employeesCube,
  departmentsCube,
  productivityCube,
  prEventsCube
]