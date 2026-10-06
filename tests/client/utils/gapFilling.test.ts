/**
 * Tests for chart-side gap filling (issue #1368): the server returns observed
 * rows only, and charts fill missing time buckets as Cube.js's client does.
 */

import { describe, it, expect, vi } from 'vitest'
import { fillChartRows, withChartGapFilling } from '../../../src/client/utils/gapFilling'
import type { CubeResultSet } from '../../../src/client/types'

const rows = () => [
  { 'Snapshots.date': '2026-08-01T00:00:00.000Z', 'Snapshots.compliantCount': 12 },
  { 'Snapshots.date': '2026-08-03T00:00:00.000Z', 'Snapshots.compliantCount': 14 }
]

const query = (fillMissingDates?: boolean) => ({
  measures: ['Snapshots.compliantCount'],
  timeDimensions: [{
    dimension: 'Snapshots.date',
    granularity: 'day',
    dateRange: ['2026-08-01', '2026-08-03'],
    ...(fillMissingDates !== undefined && { fillMissingDates })
  }]
})

const annotation = (fillMissingDates?: boolean) => ({
  timeDimensions: { 'Snapshots.date': fillMissingDates === undefined ? {} : { fillMissingDates } }
})

describe('fillChartRows', () => {
  it('fills missing buckets by default, like Cube.js charts', () => {
    const result = fillChartRows(rows(), query(), annotation())
    expect(result).toHaveLength(3)
    expect(result[1]).toEqual({ 'Snapshots.date': '2026-08-02T00:00:00.000Z', 'Snapshots.compliantCount': 0 })
  })

  it('follows the cube time dimension when the chart is on auto', () => {
    expect(fillChartRows(rows(), query(), annotation(false))).toHaveLength(2)
    expect(fillChartRows(rows(), query(), annotation(false), { fillMissingDates: 'auto' })).toHaveLength(2)
  })

  it('lets the chart setting override the cube', () => {
    expect(fillChartRows(rows(), query(), annotation(false), { fillMissingDates: true })).toHaveLength(3)
    expect(fillChartRows(rows(), query(), annotation(true), { fillMissingDates: false })).toHaveLength(2)
  })

  it('lets the query override the chart setting (e.g. a drill-down)', () => {
    expect(fillChartRows(rows(), query(false), annotation(), { fillMissingDates: true })).toHaveLength(2)
  })

  it('uses the query fill value', () => {
    const result = fillChartRows(rows(), { ...query(), fillMissingDatesValue: null }, annotation())
    expect(result[1]['Snapshots.compliantCount']).toBeNull()
  })

  it('leaves comparison and ungrouped queries alone', () => {
    const compare = {
      ...query(),
      timeDimensions: [{ ...query().timeDimensions[0], compareDateRange: [['2026-07-01', '2026-07-03']] }]
    }
    expect(fillChartRows(rows(), compare, annotation())).toHaveLength(2)
    expect(fillChartRows(rows(), { ...query(), ungrouped: true }, annotation())).toHaveLength(2)
  })
})

describe('withChartGapFilling', () => {
  const resultSet = (loadResponse: unknown): CubeResultSet => ({
    rawData: vi.fn(rows),
    tablePivot: vi.fn(rows),
    series: vi.fn(rows),
    annotation: () => annotation(),
    loadResponse,
    totalCount: () => 2
  })

  it('fills rows from the query echoed in the load response', () => {
    const wrapped = withChartGapFilling(resultSet({ results: [{ query: query(), data: rows() }] }))
    expect(wrapped.rawData()).toHaveLength(3)
    expect(wrapped.tablePivot()).toHaveLength(3)
    expect(wrapped.totalCount?.()).toBe(2)
  })

  it('computes filled rows once', () => {
    const inner = resultSet({ results: [{ query: query() }] })
    const wrapped = withChartGapFilling(inner)
    wrapped.rawData()
    wrapped.rawData()
    expect(inner.rawData).toHaveBeenCalledTimes(1)
  })

  it('returns the result set unchanged when it has no query to fill from', () => {
    const inner = resultSet(undefined)
    expect(withChartGapFilling(inner)).toBe(inner)
  })
})
