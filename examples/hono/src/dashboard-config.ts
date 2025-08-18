/**
 * Shared dashboard configuration
 * Used by both seed script and create-example API endpoint
 */

export const productivityDashboardConfig = {
  name: 'Productivity Analytics Dashboard',
  description: 'Comprehensive productivity analytics including code output, deployments, happiness tracking, and team performance insights',
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
          x: 'Productivity.date',
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
          dimensions: ['Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Departments.name',
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
          dimensions: ['Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Departments.name',
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
          dimensions: ['Employees.name', 'Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments'],
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
          dimensions: ['Employees.name'],
          cubes: ['Productivity', 'Employees']
        }),
        chartType: 'bar' as const,
        chartConfig: {
          x: 'Employees.name',
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
          x: 'Productivity.date',
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
          dimensions: ['Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments'],
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
          x: 'Productivity.date',
          y: ['Productivity.totalDeployments'],
          series: 'Departments.name'
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
          dimensions: ['Employees.name', 'Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments'],
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