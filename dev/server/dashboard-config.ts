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
      // ============================================
      // TOP ROW - KPI Numbers
      // ============================================
      {
        id: 'total-lines-kpi',
        title: 'Total Lines of Code',
        query: JSON.stringify({
          measures: ['Productivity.totalLinesOfCode'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'month',
            dateRange: 'last year'
          }],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }, null, 2),
        chartType: 'kpiNumber' as const,
        chartConfig: {
          yAxis: ['Productivity.totalLinesOfCode']
        },
        displayConfig: {
          suffix: ' lines'
        },
        w: 4,
        h: 4,
        x: 0,
        y: 0
      },
      {
        id: 'total-deployments-kpi',
        title: 'Total Deployments',
        query: JSON.stringify({
          measures: ['Productivity.totalDeployments'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'month',
            dateRange: 'last year'
          }]
        }, null, 2),
        chartType: 'kpiNumber' as const,
        chartConfig: {
          yAxis: ['Productivity.totalDeployments']
        },
        displayConfig: {
          suffix: ' deployments'
        },
        w: 4,
        h: 4,
        x: 4,
        y: 0
      },
      {
        id: 'avg-happiness-kpi',
        title: 'Average Happiness Score',
        query: JSON.stringify({
          measures: ['Productivity.avgHappinessIndex'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'month',
            dateRange: 'last year'
          }],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }, null, 2),
        chartType: 'kpiNumber' as const,
        chartConfig: {
          yAxis: ['Productivity.avgHappinessIndex']
        },
        displayConfig: {
          decimals: 1,
          suffix: '/10'
        },
        w: 4,
        h: 4,
        x: 8,
        y: 0
      },

      // ============================================
      // ROW 2 - Activity Grid
      // ============================================
      {
        id: 'code-activity-grid',
        title: 'Daily Code Output Activity (Last Year)',
        query: JSON.stringify({
          measures: ['Productivity.totalLinesOfCode'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'day',
            dateRange: 'last year'
          }],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }, null, 2),
        chartType: 'activityGrid' as const,
        chartConfig: {
          dateField: ['Productivity.date'],
          valueField: ['Productivity.totalLinesOfCode']
        },
        displayConfig: {
          showLabels: true,
          showTooltip: true
        },
        w: 12,
        h: 4,
        x: 0,
        y: 4
      },

      // ============================================
      // ROW 3 - Trends and Distribution
      // ============================================
      {
        id: 'productivity-trends',
        title: 'Team Productivity Trends (Last 12 Months)',
        query: JSON.stringify({
          measures: ['Productivity.avgLinesOfCode'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'week',
            dateRange: 'last 12 months'
          }],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }, null, 2),
        chartType: 'line' as const,
        chartConfig: {
          xAxis: ['Productivity.date'],
          yAxis: ['Productivity.avgLinesOfCode'],
          series: []
        },
        displayConfig: {
          showLegend: false
        },
        w: 8,
        h: 6,
        x: 0,
        y: 8
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
        }, null, 2),
        chartType: 'pie' as const,
        chartConfig: {
          xAxis: ['Productivity.happinessLevel'],
          yAxis: ['Productivity.recordCount'],
          series: []
        },
        displayConfig: {
          showLegend: true
        },
        w: 4,
        h: 6,
        x: 8,
        y: 8
      },

      // ============================================
      // ROW 4 - Department Comparison
      // ============================================
      {
        id: 'department-productivity',
        title: 'Productivity by Department',
        query: JSON.stringify({
          measures: ['Productivity.totalLinesOfCode', 'Productivity.totalPullRequests', 'Productivity.totalDeployments'],
          dimensions: ['Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments']
        }, null, 2),
        chartType: 'bar' as const,
        chartConfig: {
          xAxis: ['Departments.name'],
          yAxis: ['Productivity.totalLinesOfCode', 'Productivity.totalPullRequests', 'Productivity.totalDeployments'],
          series: []
        },
        displayConfig: {
          showLegend: true,
          stackedBarChart: false
        },
        w: 6,
        h: 6,
        x: 0,
        y: 14
      },
      {
        id: 'happiness-by-department',
        title: 'Happiness by Department',
        query: JSON.stringify({
          measures: ['Productivity.avgHappinessIndex'],
          dimensions: ['Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments']
        }, null, 2),
        chartType: 'bar' as const,
        chartConfig: {
          xAxis: ['Departments.name'],
          yAxis: ['Productivity.avgHappinessIndex'],
          series: []
        },
        displayConfig: {
          showLegend: false
        },
        w: 6,
        h: 6,
        x: 6,
        y: 14
      },

      // ============================================
      // ROW 5 - Bubble Chart (Correlation)
      // ============================================
      {
        id: 'productivity-bubble',
        title: 'Productivity Metrics Correlation',
        query: JSON.stringify({
          measures: [
            'Productivity.avgLinesOfCode',
            'Productivity.avgPullRequests',
            'Productivity.avgDeployments',
            'Productivity.avgHappinessIndex'
          ],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'week'
          }]
        }, null, 2),
        chartType: 'bubble' as const,
        chartConfig: {
          xAxis: 'Productivity.avgPullRequests',
          yAxis: 'Productivity.avgLinesOfCode',
          series: 'Productivity.date',
          sizeField: 'Productivity.avgDeployments',
          colorField: 'Productivity.avgHappinessIndex'
        },
        displayConfig: {
          showLegend: true
        },
        w: 12,
        h: 8,
        x: 0,
        y: 20
      },

      // ============================================
      // ROW 6 - Treemap Visualization
      // ============================================
      {
        id: 'happiness-treemap',
        title: 'Employee Happiness by Department (Treemap)',
        query: JSON.stringify({
          measures: [
            'Productivity.avgHappinessIndex',
            'Productivity.daysOffCount'
          ],
          dimensions: [
            'Employees.name',
            'Departments.name'
          ],
          cubes: ['Productivity', 'Employees', 'Departments']
        }, null, 2),
        chartType: 'treemap' as const,
        chartConfig: {
          xAxis: ['Employees.name'],
          yAxis: 'Productivity.avgHappinessIndex',
          series: 'Departments.name'
        },
        displayConfig: {
          showLegend: true
        },
        w: 12,
        h: 8,
        x: 0,
        y: 28
      },

      // ============================================
      // ROW 7 - Individual Performance
      // ============================================
      {
        id: 'top-performers',
        title: 'Top Performers (This Year)',
        query: JSON.stringify({
          measures: ['Productivity.recordCount', 'Productivity.avgHappinessIndex'],
          dimensions: ['Employees.name', 'Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            dateRange: 'this year'
          }],
          order: {
            'Productivity.avgHappinessIndex': 'desc'
          },
          limit: 10
        }, null, 2),
        chartType: 'table' as const,
        chartConfig: {},
        displayConfig: {},
        w: 6,
        h: 8,
        x: 0,
        y: 36
      },
      {
        id: 'work-life-balance',
        title: 'Work-Life Balance Metrics',
        query: JSON.stringify({
          measures: ['Productivity.workingDaysCount', 'Productivity.daysOffCount'],
          dimensions: ['Employees.name'],
          cubes: ['Productivity', 'Employees']
        }, null, 2),
        chartType: 'bar' as const,
        chartConfig: {
          xAxis: ['Employees.name'],
          yAxis: ['Productivity.workingDaysCount', 'Productivity.daysOffCount'],
          series: []
        },
        displayConfig: {
          showLegend: true,
          stackedBarChart: true
        },
        w: 6,
        h: 8,
        x: 6,
        y: 36
      },

      // ============================================
      // ROW 8 - Detailed Analytics
      // ============================================
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
        }, null, 2),
        chartType: 'area' as const,
        chartConfig: {
          xAxis: ['Productivity.date'],
          yAxis: ['Productivity.totalLinesOfCode'],
          series: []
        },
        displayConfig: {
          showLegend: false
        },
        w: 6,
        h: 6,
        x: 0,
        y: 44
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
        }, null, 2),
        chartType: 'line' as const,
        chartConfig: {
          xAxis: ['Productivity.date'],
          yAxis: ['Productivity.totalDeployments'],
          series: ['Departments.name']
        },
        displayConfig: {
          showLegend: true
        },
        w: 6,
        h: 6,
        x: 6,
        y: 44
      },

      // ============================================
      // ROW 9 - Summary Table
      // ============================================
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
        }, null, 2),
        chartType: 'table' as const,
        chartConfig: {},
        displayConfig: {},
        w: 12,
        h: 10,
        x: 0,
        y: 50
      },

      // ============================================
      // STATISTICAL & WINDOW FUNCTIONS SECTION
      // ============================================

      // Statistical: Salary Distribution by Department
      {
        id: 'salary-stats-by-dept',
        title: 'Statistical: Salary Distribution by Department (Median vs Avg)',
        query: JSON.stringify({
          measures: [
            'Employees.medianSalary',
            'Employees.avgSalary',
            'Employees.stddevSalary'
          ],
          dimensions: ['Departments.name'],
          cubes: ['Employees', 'Departments']
        }, null, 2),
        chartType: 'bar' as const,
        chartConfig: {
          xAxis: ['Departments.name'],
          yAxis: ['Employees.medianSalary', 'Employees.avgSalary'],
          series: []
        },
        displayConfig: {
          showLegend: true
        },
        w: 6,
        h: 7,
        x: 0,
        y: 60
      },

      // Statistical: Bubble - Correlation with Stddev
      {
        id: 'productivity-scatter',
        title: 'Statistical: Productivity vs Happiness (Bubble = Consistency)',
        query: JSON.stringify({
          measures: [
            'Productivity.avgLinesOfCode',
            'Productivity.avgHappinessIndex',
            'Productivity.stddevLinesOfCode',
            'Productivity.recordCount'
          ],
          dimensions: ['Employees.name'],
          cubes: ['Productivity', 'Employees'],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }]
        }, null, 2),
        chartType: 'bubble' as const,
        chartConfig: {
          xAxis: 'Productivity.avgHappinessIndex',
          yAxis: 'Productivity.avgLinesOfCode',
          sizeField: 'Productivity.stddevLinesOfCode',
          series: 'Employees.name'
        },
        displayConfig: {
          showLegend: false
        },
        w: 6,
        h: 7,
        x: 6,
        y: 60
      },

      // Statistical: Area - Percentile Bands Over Time (Engineering only - where code is written)
      {
        id: 'percentile-thresholds-area',
        title: 'Statistical: Code Output Percentiles Over Time (Median / Avg / P95)',
        query: JSON.stringify({
          measures: ['Productivity.medianLinesOfCode', 'Productivity.p95LinesOfCode', 'Productivity.avgLinesOfCode'],
          dimensions: ['Departments.name'],
          cubes: ['Productivity', 'Employees', 'Departments'],
          timeDimensions: [{
            dimension: 'Productivity.date',
            granularity: 'week',
            dateRange: 'last 6 months'
          }],
          filters: [
            {
              member: 'Productivity.isDayOff',
              operator: 'equals',
              values: [false]
            },
            {
              member: 'Departments.name',
              operator: 'equals',
              values: ['Engineering']
            }
          ]
        }, null, 2),
        chartType: 'area' as const,
        chartConfig: {
          xAxis: ['Productivity.date'],
          yAxis: ['Productivity.medianLinesOfCode', 'Productivity.avgLinesOfCode', 'Productivity.p95LinesOfCode'],
          series: []
        },
        displayConfig: {
          showLegend: true
        },
        w: 12,
        h: 6,
        x: 0,
        y: 67
      },

      // Window Function: Moving Average Line Chart
      {
        id: 'moving-average-trend',
        title: 'Window Function: Daily Output with 7-Day Moving Average',
        query: JSON.stringify({
          measures: ['Productivity.movingAvg7Day'],
          dimensions: ['Productivity.date', 'Productivity.linesOfCode'],
          filters: [{
            member: 'Productivity.isDayOff',
            operator: 'equals',
            values: [false]
          }],
          order: {
            'Productivity.date': 'asc'
          },
          limit: 90
        }, null, 2),
        chartType: 'line' as const,
        chartConfig: {
          xAxis: ['Productivity.date'],
          yAxis: ['Productivity.linesOfCode', 'Productivity.movingAvg7Day'],
          series: []
        },
        displayConfig: {
          showLegend: true
        },
        w: 12,
        h: 6,
        x: 0,
        y: 73
      }
    ]
  }
}
