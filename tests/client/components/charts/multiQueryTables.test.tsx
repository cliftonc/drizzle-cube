/**
 * Tests for the Table and the Records Table with a portlet that has several
 * queries.
 *
 * The rows come from the real `mergeQueryResults`, and the tables get the
 * query from the real `combineQueriesForChart`: the query that both the
 * AnalysisBuilder preview and the dashboard portlet give a multi-query chart.
 */

import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DataTable from '../../../../src/client/components/charts/DataTable'
import RecordsTable from '../../../../src/client/components/charts/RecordsTable'
import { combineQueriesForChart, mergeQueryResults } from '../../../../src/client/utils/multiQueryUtils'
import type { CubeQuery, CubeResultSet, QueryMergeStrategy } from '../../../../src/client/types'

vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeMeta: () => ({
    getFieldLabel: (field: string) => ({
      'Employees.department': 'Department',
      'Employees.createdAt': 'Created',
      'Employees.count': 'Employee count',
      'Productivity.linesOfCode': 'Lines of code'
    }[field] ?? field),
    meta: null
  })
}))

function resultSet(rows: Record<string, unknown>[]): CubeResultSet {
  return { rawData: () => rows, tablePivot: () => rows, series: () => rows, annotation: () => ({}) }
}

function headerTexts(): string[] {
  return within(screen.getAllByRole('rowgroup')[0])
    .getAllByRole('columnheader')
    .map(cell => cell.textContent?.trim() ?? '')
}

function bodyRowTexts(): string[][] {
  return within(screen.getAllByRole('rowgroup')[1])
    .getAllByRole('row')
    .map(row => within(row).getAllByRole('cell').map(cell => cell.textContent?.trim() ?? ''))
}

const employeeQuery: CubeQuery = { measures: ['Employees.count'], dimensions: ['Employees.department'] }
const productivityQuery: CubeQuery = { measures: ['Productivity.linesOfCode'], dimensions: ['Employees.department'] }

const employeeRows = [
  { 'Employees.department': 'Engineering', 'Employees.count': 10 },
  { 'Employees.department': 'Sales', 'Employees.count': 5 }
]
const productivityRows = [
  { 'Employees.department': 'Engineering', 'Productivity.linesOfCode': 1000 },
  { 'Employees.department': 'Sales', 'Productivity.linesOfCode': 200 }
]

const queries = [employeeQuery, productivityQuery]
const chartQuery = combineQueriesForChart(queries)

function merge(strategy: QueryMergeStrategy, secondRows = productivityRows) {
  return mergeQueryResults(
    [resultSet(employeeRows), resultSet(secondRows)],
    queries,
    strategy,
    strategy === 'merge' ? ['Employees.department'] : undefined
  )
}

const allFields = ['Employees.department', 'Employees.count', 'Productivity.linesOfCode']

describe('Table with several queries', () => {
  it('should show the fields of every query and not the merge metadata', () => {
    render(<DataTable data={merge('concat')} queryObject={chartQuery} />)

    expect(headerTexts()).toEqual(['Department', 'Employee count', 'Lines of code'])
    expect(bodyRowTexts()).toEqual([
      ['Engineering', '10', ''],
      ['Sales', '5', ''],
      ['Engineering', '', '1,000'],
      ['Sales', '', '200']
    ])
  })

  it('should keep an assigned column that only the second query returns', () => {
    render(<DataTable data={merge('concat')} queryObject={chartQuery} chartConfig={{ xAxis: allFields }} />)

    expect(headerTexts()).toEqual(['Department', 'Employee count', 'Lines of code'])
  })

  it('should keep a measure of the first query when the first merged row exists only in the second query', () => {
    const data = merge('merge', [{ 'Employees.department': 'Admin', 'Productivity.linesOfCode': 50 }, ...productivityRows])

    render(<DataTable data={data} queryObject={chartQuery} />)

    expect(headerTexts()).toEqual(['Department', 'Employee count', 'Lines of code'])
    expect(bodyRowTexts()).toEqual([
      ['Admin', '', '50'],
      ['Engineering', '10', '1,000'],
      ['Sales', '5', '200']
    ])
  })

  it('should keep the value of every query in a time dimension pivot', () => {
    const month = { dimension: 'Employees.createdAt', granularity: 'month' }
    const timeQueries: CubeQuery[] = [
      { measures: ['Employees.count'], timeDimensions: [month] },
      { measures: ['Productivity.linesOfCode'], timeDimensions: [month] }
    ]
    const data = mergeQueryResults(
      [
        resultSet([{ 'Employees.createdAt': '2024-01-01T00:00:00.000', 'Employees.count': 10 }]),
        resultSet([{ 'Employees.createdAt': '2024-01-01T00:00:00.000', 'Productivity.linesOfCode': 1000 }])
      ],
      timeQueries,
      'concat'
    )

    render(<DataTable data={data} queryObject={combineQueriesForChart(timeQueries)} />)

    expect(headerTexts()).toEqual(['Measure', '2024-01'])
    expect(bodyRowTexts()).toEqual([
      ['Employee count', '10'],
      ['Lines of code', '1,000']
    ])
  })
})

describe('Records Table with several queries', () => {
  it('should show the fields of every query and not the merge metadata', () => {
    render(<RecordsTable data={merge('concat')} queryObject={chartQuery} />)

    expect(headerTexts()).toEqual(['Department', 'Employee count', 'Lines of code'])
  })

  it('should keep an assigned column that only the second query returns', () => {
    render(<RecordsTable data={merge('concat')} queryObject={chartQuery} chartConfig={{ columns: allFields }} />)

    expect(headerTexts()).toEqual(['Department', 'Employee count', 'Lines of code'])
  })
})
