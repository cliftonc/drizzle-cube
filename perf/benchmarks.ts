/**
 * The benchmark catalog. Each entry is a named SemanticQuery exercising one
 * aspect of the query engine against the perf dataset (org 1: 700 employees,
 * ~335k productivity rows, ~730k of the ~1M time entries).
 *
 * Benchmark ids are stable identifiers — renaming one breaks comparability
 * of results across runs.
 */

import type { BenchmarkDef } from './types'

// Employee IDs are deterministic (TRUNCATE ... RESTART IDENTITY on reseed):
// org1 employees occupy ids 1-700
const EMPLOYEE_ID_LIST = Array.from({ length: 100 }, (_, i) => i + 1)

const YEAR_2024: [string, string] = ['2024-01-01', '2024-12-31']

export const BENCHMARKS: BenchmarkDef[] = [
  // --- baseline: single aggregations over the large fact tables ---
  {
    id: 'baseline.count-time-entries',
    name: 'Count over ~730k time entries',
    category: 'baseline',
    mode: 'execute',
    query: { measures: ['TimeEntries.count'] }
  },
  {
    id: 'baseline.sum-avg-productivity',
    name: 'Sum + avg over ~335k productivity rows',
    category: 'baseline',
    mode: 'execute',
    query: { measures: ['Productivity.totalLinesOfCode', 'Productivity.avgLinesOfCode'] }
  },
  {
    id: 'baseline.count-distinct',
    name: 'Count distinct employees over time entries',
    category: 'baseline',
    mode: 'execute',
    query: { measures: ['TimeEntries.distinctEmployees'] }
  },
  {
    id: 'baseline.min-max',
    name: 'Min + max lines of code',
    category: 'baseline',
    mode: 'execute',
    query: { measures: ['Productivity.minLinesOfCode', 'Productivity.maxLinesOfCode'] }
  },
  {
    id: 'baseline.calculated-measure',
    name: 'Calculated measure (productivity score)',
    category: 'baseline',
    mode: 'execute',
    query: { measures: ['Productivity.productivityScore'] }
  },

  // --- multi-measure ---
  {
    id: 'multi.six-measures',
    name: 'Six measures on time entries',
    category: 'multi-measure',
    mode: 'execute',
    query: {
      measures: [
        'TimeEntries.totalHours',
        'TimeEntries.avgHours',
        'TimeEntries.totalBillableHours',
        'TimeEntries.count',
        'TimeEntries.minHours',
        'TimeEntries.maxHours'
      ]
    }
  },
  {
    id: 'multi.mixed-types',
    name: 'Mixed aggregation types on productivity',
    category: 'multi-measure',
    mode: 'execute',
    query: {
      measures: [
        'Productivity.recordCount',
        'Productivity.countDistinctEmployees',
        'Productivity.avgHappinessIndex',
        'Productivity.totalPullRequests'
      ]
    }
  },

  // --- group-by cardinality ---
  {
    id: 'groupby.low-cardinality',
    name: 'Group by allocation type (6 groups)',
    category: 'group-by',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours'],
      dimensions: ['TimeEntries.allocationType']
    }
  },
  {
    id: 'groupby.mid-cardinality',
    name: 'Group by department (~25 groups)',
    category: 'group-by',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours'],
      dimensions: ['TimeEntries.departmentId']
    }
  },
  {
    id: 'groupby.high-cardinality',
    name: 'Group by employee (~700 groups)',
    category: 'group-by',
    mode: 'execute',
    query: {
      measures: ['Productivity.totalLinesOfCode'],
      dimensions: ['Productivity.employeeId']
    }
  },
  {
    id: 'groupby.two-dimensions',
    name: 'Group by allocation type + department',
    category: 'group-by',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours', 'TimeEntries.count'],
      dimensions: ['TimeEntries.allocationType', 'TimeEntries.departmentId']
    }
  },

  // --- filters ---
  {
    id: 'filter.equals',
    name: 'Equals filter (development entries)',
    category: 'filters',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.count', 'TimeEntries.totalHours'],
      filters: [{ member: 'TimeEntries.allocationType', operator: 'equals', values: ['development'] }]
    }
  },
  {
    id: 'filter.numeric-range',
    name: 'Numeric range filter (linesOfCode > 100)',
    category: 'filters',
    mode: 'execute',
    query: {
      measures: ['Productivity.recordCount', 'Productivity.avgLinesOfCode'],
      filters: [{ member: 'Productivity.linesOfCode', operator: 'gt', values: [100] }]
    }
  },
  {
    id: 'filter.string-contains',
    name: 'String contains filter on employee name',
    category: 'filters',
    mode: 'execute',
    query: {
      measures: ['Employees.count', 'Employees.avgSalary'],
      filters: [{ member: 'Employees.name', operator: 'contains', values: ['an'] }]
    }
  },
  {
    id: 'filter.nested-and-or',
    name: 'Nested AND/OR filter on time entries',
    category: 'filters',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.count'],
      filters: [
        {
          or: [
            {
              and: [
                { member: 'TimeEntries.allocationType', operator: 'equals', values: ['development'] },
                { member: 'TimeEntries.employeeId', operator: 'lt', values: [350] }
              ]
            },
            {
              and: [
                { member: 'TimeEntries.allocationType', operator: 'equals', values: ['meetings'] },
                { member: 'TimeEntries.departmentId', operator: 'lte', values: [10] }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'filter.in-list-100',
    name: 'IN-list filter with 100 employee ids',
    category: 'filters',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.count', 'TimeEntries.totalHours'],
      filters: [{ member: 'TimeEntries.employeeId', operator: 'equals', values: EMPLOYEE_ID_LIST }]
    }
  },

  // --- time dimensions ---
  {
    id: 'time.day-granularity-year',
    name: 'Daily time series over 2024 (~366 buckets)',
    category: 'time',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours'],
      timeDimensions: [
        { dimension: 'TimeEntries.date', granularity: 'day', dateRange: YEAR_2024, fillMissingDates: false }
      ]
    }
  },
  {
    id: 'time.month-granularity',
    name: 'Monthly time series over 2024',
    category: 'time',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours', 'TimeEntries.count'],
      timeDimensions: [
        { dimension: 'TimeEntries.date', granularity: 'month', dateRange: YEAR_2024, fillMissingDates: false }
      ]
    }
  },
  {
    id: 'time.week-with-dimension',
    name: 'Weekly series split by allocation type (H1 2024)',
    category: 'time',
    mode: 'execute',
    query: {
      measures: ['Productivity.totalLinesOfCode'],
      dimensions: ['Productivity.happinessLevel'],
      timeDimensions: [
        { dimension: 'Productivity.date', granularity: 'week', dateRange: ['2024-01-01', '2024-06-30'], fillMissingDates: false }
      ]
    }
  },
  {
    id: 'time.gap-fill',
    name: 'Daily series with fillMissingDates over 16 months',
    category: 'time',
    mode: 'execute',
    query: {
      measures: ['Productivity.totalLinesOfCode'],
      timeDimensions: [
        {
          dimension: 'Productivity.date',
          granularity: 'day',
          dateRange: ['2023-09-01', '2024-12-31'],
          fillMissingDates: true
        }
      ]
    }
  },
  {
    id: 'time.compare-date-range',
    name: 'Period comparison Q1 vs Q2 2024 by month',
    category: 'time',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours'],
      timeDimensions: [
        {
          dimension: 'TimeEntries.date',
          granularity: 'month',
          compareDateRange: [
            ['2024-01-01', '2024-03-31'],
            ['2024-04-01', '2024-06-30']
          ]
        }
      ]
    }
  },

  // --- joins ---
  {
    id: 'join.belongs-to',
    name: 'Employees joined to departments',
    category: 'joins',
    mode: 'execute',
    query: {
      measures: ['Employees.count', 'Employees.avgSalary'],
      dimensions: ['Departments.name']
    }
  },
  {
    id: 'join.has-many-fanout',
    name: 'Employee count with time-entry fan-out (~730k child rows)',
    category: 'joins',
    mode: 'execute',
    query: {
      measures: ['Employees.count', 'TimeEntries.totalHours'],
      dimensions: ['Departments.name']
    }
  },
  {
    id: 'join.many-to-many',
    name: 'Employees by team via junction table',
    category: 'joins',
    mode: 'execute',
    query: {
      measures: ['Employees.count'],
      dimensions: ['Teams.name']
    }
  },
  {
    id: 'join.three-cubes',
    name: 'Departments + employees + time entries',
    category: 'joins',
    mode: 'execute',
    query: {
      measures: ['Employees.count', 'TimeEntries.totalHours', 'TimeEntries.totalBillableHours'],
      dimensions: ['Departments.name'],
      filters: [{ member: 'TimeEntries.allocationType', operator: 'notEquals', values: ['meetings'] }]
    }
  },

  // --- result-set shape ---
  {
    id: 'rows.ordered-700',
    name: '~700 ordered group rows',
    category: 'result-set',
    mode: 'execute',
    query: {
      measures: ['TimeEntries.totalHours'],
      dimensions: ['TimeEntries.employeeId'],
      order: { 'TimeEntries.totalHours': 'desc' }
    }
  },
  {
    id: 'rows.deep-offset',
    name: 'Ungrouped page at offset 100k (limit 1000)',
    category: 'result-set',
    mode: 'execute',
    query: {
      dimensions: ['TimeEntries.id', 'TimeEntries.employeeId', 'TimeEntries.allocationType'],
      measures: ['TimeEntries.totalHours'],
      ungrouped: true,
      order: { 'TimeEntries.id': 'asc' },
      limit: 1000,
      offset: 100_000
    }
  },
  {
    id: 'rows.ungrouped-10k',
    name: 'Ungrouped raw rows (limit 10,000)',
    category: 'result-set',
    mode: 'execute',
    query: {
      dimensions: ['TimeEntries.employeeId', 'TimeEntries.date', 'TimeEntries.allocationType'],
      measures: ['TimeEntries.totalHours'],
      ungrouped: true,
      limit: 10_000
    }
  },

  // --- analysis modes ---
  {
    id: 'analysis.funnel',
    name: 'Three-step funnel over ~335k events',
    category: 'analysis',
    mode: 'execute',
    query: {
      funnel: {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [
          { name: 'Any Activity' },
          {
            name: 'Productive Day',
            filter: { member: 'Events.linesOfCode', operator: 'gt', values: [100] }
          },
          {
            name: 'Shipped PRs',
            filter: { member: 'Events.pullRequests', operator: 'gt', values: [3] }
          }
        ]
      }
    }
  },
  {
    id: 'analysis.flow',
    name: 'Flow with 2 steps before/after',
    category: 'analysis',
    mode: 'execute',
    query: {
      flow: {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventType',
        stepsBefore: 2,
        stepsAfter: 2,
        startingStep: {
          name: 'High Happiness',
          filter: { member: 'Events.eventType', operator: 'equals', values: ['high'] }
        }
      }
    }
  },
  {
    id: 'analysis.retention',
    name: 'Monthly retention over 2024 (6 periods)',
    category: 'analysis',
    mode: 'execute',
    query: {
      retention: {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        granularity: 'month',
        periods: 6,
        retentionType: 'classic'
      }
    }
  },

  // --- compile-only: SQL generation cost without touching the database ---
  {
    id: 'compile.simple',
    name: 'Compile simple aggregation query',
    category: 'compile',
    mode: 'dryRun',
    query: { measures: ['Productivity.totalLinesOfCode', 'Productivity.avgLinesOfCode'] }
  },
  {
    id: 'compile.complex',
    name: 'Compile multi-cube query with filters + time dimension',
    category: 'compile',
    mode: 'dryRun',
    query: {
      measures: ['Employees.count', 'TimeEntries.totalHours', 'TimeEntries.totalBillableHours'],
      dimensions: ['Departments.name'],
      filters: [{ member: 'TimeEntries.allocationType', operator: 'notEquals', values: ['meetings'] }],
      timeDimensions: [
        { dimension: 'TimeEntries.date', granularity: 'month', dateRange: YEAR_2024, fillMissingDates: false }
      ]
    }
  },

  // --- cache: result-cache effectiveness on a mid-size group-by ---
  {
    id: 'cache.miss',
    name: 'Cache-enabled executor, cache bypassed',
    category: 'cache',
    mode: 'cache-miss',
    query: {
      measures: ['Productivity.totalLinesOfCode'],
      dimensions: ['Productivity.employeeId']
    }
  },
  {
    id: 'cache.hit',
    name: 'Cache-enabled executor, warm cache',
    category: 'cache',
    mode: 'cache-hit',
    query: {
      measures: ['Productivity.totalLinesOfCode'],
      dimensions: ['Productivity.employeeId']
    }
  }
]
