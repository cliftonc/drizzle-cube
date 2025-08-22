/**
 * Simple dashboard configuration for Express example
 */
import type { DashboardConfig, ChartType } from 'drizzle-cube/client'

export const dashboardConfig: DashboardConfig = {
  portlets: [
    {
      id: 'employees-by-dept',
      title: 'Employees by Department',
      query: JSON.stringify({
        measures: ['Employees.count'],
        dimensions: ['Departments.name'],
        cubes: ['Employees', 'Departments']
      }),
      chartType: 'bar' as ChartType,
      chartConfig: {
        xAxis: ['Departments.name'],
        yAxis: ['Employees.count']
      },
      displayConfig: {
        showLegend: false
      },
      x: 0, y: 0, w: 6, h: 4
    },
    {
      id: 'productivity-trend',
      title: 'Productivity Trend (Last 30 Days)',
      query: JSON.stringify({
        measures: ['Productivity.avgLinesOfCode'],
        timeDimensions: [{
          dimension: 'Productivity.date',
          granularity: 'day'
        }],
        filters: [{
          member: 'Productivity.isDayOff',
          operator: 'equals',
          values: [false]
        }]
      }),
      chartType: 'line' as ChartType,
      chartConfig: {
        xAxis: ['Productivity.date'],
        yAxis: ['Productivity.avgLinesOfCode']
      },
      displayConfig: {
        showLegend: false
      },
      x: 6, y: 0, w: 6, h: 4
    },
    {
      id: 'happiness-distribution',
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
      chartType: 'pie' as ChartType,
      chartConfig: {
        xAxis: ['Productivity.happinessLevel'],
        yAxis: ['Productivity.recordCount']
      },
      displayConfig: {
        showLegend: true
      },
      x: 0, y: 4, w: 6, h: 4
    },
    {
      id: 'department-productivity',
      title: 'Productivity by Department',
      query: JSON.stringify({
        measures: ['Productivity.totalLinesOfCode'],
        dimensions: ['Departments.name'],
        cubes: ['Productivity', 'Employees', 'Departments']
      }),
      chartType: 'bar' as ChartType,
      chartConfig: {
        xAxis: ['Departments.name'],
        yAxis: ['Productivity.totalLinesOfCode']
      },
      displayConfig: {
        showLegend: false
      },
      x: 6, y: 4, w: 6, h: 4
    }
  ]
}