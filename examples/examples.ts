/**
 * Semantic Layer Usage Examples - Cube.js Compatible Format
 * 
 * This file demonstrates how to use the Cube.js-compatible semantic layer API
 */

/**
 * Example 1: Employee Analysis by Department
 * Get employee count and total FTE by department
 */
export const employeesByDepartmentQuery = {
  measures: ['People.count', 'People.totalFte', 'People.activeCount'],
  dimensions: ['Departments.name'],
  filters: [
    { member: 'People.active', operator: 'equals', values: [true] }
  ],
  order: { 'People.count': 'desc' }
}

/**
 * Example 2: Budget Analysis over Time
 * Get monthly budget costs by department
 */
export const budgetTrendsQuery = {
  measures: ['Budgets.totalCost', 'Budgets.totalOpex', 'Budgets.totalCapex', 'Budgets.totalFte'],
  dimensions: ['Departments.name'],
  timeDimensions: [
    { dimension: 'Periods.startDate', granularity: 'month' }
  ],
  filters: [
    { member: 'Budgets.budgetStatus', operator: 'equals', values: ['published'] },
    { member: 'Periods.startDate', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
  ],
  order: { 'Periods.startDate': 'asc' }
}

/**
 * Example 3: Supplier Cost Analysis
 * Compare internal vs external supplier costs
 */
export const supplierAnalysisQuery = {
  measures: ['People.count', 'People.totalFte'],
  dimensions: ['Suppliers.name', 'Departments.name'],
  filters: [
    { member: 'People.active', operator: 'equals', values: [true] }
  ],
  order: { 'People.count': 'desc' }
}

/**
 * Example 4: Historical Snapshot Comparison
 * Compare costs across different snapshots
 */
export const snapshotComparisonQuery = {
  measures: ['Snapshots.totalCost', 'Snapshots.totalFte', 'Snapshots.uniqueEmployees'],
  dimensions: ['Snapshots.snapshotName', 'Departments.name'],
  filters: [
    { member: 'Snapshots.snapshotCreated', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
  ],
  order: { 'Snapshots.totalCost': 'desc' }
}

/**
 * Example 5: Team Allocation Analysis
 * Find teams with highest allocations and costs
 */
export const teamAllocationQuery = {
  measures: ['Budgets.totalCost', 'Budgets.totalFte', 'Budgets.averageAllocation'],
  dimensions: ['Teams.name', 'Departments.name'],
  filters: [
    { member: 'Budgets.totalFte', operator: 'gt', values: [1] },
    { member: 'Budgets.budgetStatus', operator: 'equals', values: ['published'] }
  ],
  limit: 20,
  order: { 'Budgets.totalCost': 'desc' }
}

/**
 * Example 6: CAPEX vs OPEX Analysis
 * Analyze capital vs operational expenditure by department
 */
export const capexOpexQuery = {
  measures: ['Budgets.totalCapex', 'Budgets.totalOpex', 'Budgets.capexPercentage'],
  dimensions: ['Departments.name', 'Periods.year'],
  filters: [
    { member: 'Budgets.totalCost', operator: 'gt', values: [0] }
  ],
  order: { 'Budgets.totalCapex': 'desc' }
}

/**
 * Example API Usage with Cube.js format:
 * 
 * // Direct fetch API call:
 * const query = employeesByDepartmentQuery
 * const queryParam = encodeURIComponent(JSON.stringify(query))
 * const response = await fetch(`/cubejs-api/v1/load?query=${queryParam}`)
 * const result = await response.json()
 * 
 * console.log('Query results:', result.data)
 * console.log('Annotations:', result.annotation)
 * console.log('Total rows:', result.total)
 */

/**
 * Complex filtering example
 */
export const complexFilterQuery = {
  measures: ['People.count', 'People.totalFte', 'People.averageCapexPercentage'],
  dimensions: ['Departments.name', 'RoleLevels.name'],
  filters: [
    { member: 'People.active', operator: 'equals', values: [true] },
    { member: 'Departments.name', operator: 'contains', values: ['Engineering'] },
    { member: 'People.fteBasis', operator: 'gt', values: [0.5] },
    { member: 'People.startDate', operator: 'inDateRange', values: ['2023-01-01', '2024-12-31'] }
  ],
  limit: 50,
  order: { 'People.totalFte': 'desc' }
}

/**
 * Time-based analysis example
 */
export const quarterlyTrendsQuery = {
  measures: ['Snapshots.totalCost', 'Snapshots.totalFte', 'Snapshots.averageCost'],
  dimensions: ['Departments.name'],
  timeDimensions: [
    { dimension: 'Periods.startDate', granularity: 'quarter', dateRange: 'last 4 quarters' }
  ],
  order: { 'Periods.startDate': 'asc' }
}

/**
 * Drill-down example: Department -> Team -> Position
 */
export const drillDownQueries = {
  // Level 1: Department overview
  departments: {
    measures: ['People.count', 'People.totalFte', 'People.activeCount'],
    dimensions: ['Departments.name'],
    filters: [
      { member: 'People.active', operator: 'equals', values: [true] }
    ],
    order: { 'People.count': 'desc' }
  },
  
  // Level 2: Teams within a department (add filter for specific department)
  teams: (departmentName: string) => ({
    measures: ['Budgets.totalCost', 'Budgets.totalFte', 'Budgets.count'],
    dimensions: ['Teams.name'],
    filters: [
      { member: 'Departments.name', operator: 'equals', values: [departmentName] },
      { member: 'Budgets.budgetStatus', operator: 'equals', values: ['published'] }
    ],
    order: { 'Budgets.totalCost': 'desc' }
  }),
  
  // Level 3: Positions within a team
  positions: (departmentName: string, teamName: string) => ({
    measures: ['Budgets.totalCost', 'Budgets.averageRate', 'Budgets.totalFte'],
    dimensions: ['Positions.name'],
    filters: [
      { member: 'Departments.name', operator: 'equals', values: [departmentName] },
      { member: 'Teams.name', operator: 'equals', values: [teamName] }
    ],
    order: { 'Budgets.totalCost': 'desc' }
  })
}

/**
 * Export all example queries for easy access
 */
export const exampleQueries = {
  employeesByDepartment: employeesByDepartmentQuery,
  budgetTrends: budgetTrendsQuery,
  supplierAnalysis: supplierAnalysisQuery,
  snapshotComparison: snapshotComparisonQuery,
  teamAllocation: teamAllocationQuery,
  capexOpex: capexOpexQuery,
  complexFilter: complexFilterQuery,
  quarterlyTrends: quarterlyTrendsQuery,
  drillDown: drillDownQueries
}

/**
 * Helper function to execute any query
 */
export async function executeQuery(query: any): Promise<any> {
  const queryParam = encodeURIComponent(JSON.stringify(query))
  const response = await fetch(`/cubejs-api/v1/load?query=${queryParam}`)
  
  if (!response.ok) {
    const errorData = await response.json() as any
    throw new Error(errorData.error || 'Query execution failed')
  }
  
  return response.json()
}

/**
 * Helper function to get SQL for any query (dry run)
 */
export async function getQuerySQL(query: any): Promise<any> {
  const queryParam = encodeURIComponent(JSON.stringify(query))
  const response = await fetch(`/cubejs-api/v1/sql?query=${queryParam}`)
  
  if (!response.ok) {
    const errorData = await response.json() as any
    throw new Error(errorData.error || 'SQL generation failed')
  }
  
  return response.json()
}