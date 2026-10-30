import { describe, it, expect } from 'vitest'
import {
  selectBestChartType,
  shouldAutoSwitchChartType,
  getSmartChartDefaults,
} from '../../../src/client/shared/chartDefaults'
import type { MetricItem, BreakdownItem } from '../../../src/client/components/AnalysisBuilder/types'

const count: MetricItem = { id: 'm1', field: 'Employees.count', label: 'A' }
const department: BreakdownItem = { id: 'b1', field: 'Employees.departmentName', isTimeDimension: false }
const createdAt: BreakdownItem = {
  id: 'b2',
  field: 'Employees.createdAt',
  isTimeDimension: true,
  granularity: 'month',
}

describe('selectBestChartType', () => {
  it('falls back to table when a dimension-only query does not fit the current type', () => {
    expect(selectBestChartType([], [department], 'bar')).toBe('table')
  })

  it('keeps the current type when the table fallback is hidden', () => {
    expect(selectBestChartType([], [department], 'bar', ['table'])).toBe('bar')
  })

  it('switches to line when a measure over time does not fit the current type', () => {
    expect(selectBestChartType([count], [createdAt], 'bubble')).toBe('line')
  })

  it('keeps the current type when line is hidden', () => {
    expect(selectBestChartType([count], [createdAt], 'bubble', ['line'])).toBe('bubble')
  })

  it('keeps the current type when kpiNumber is hidden for a measure-only query', () => {
    expect(selectBestChartType([count], [], 'bar', ['kpiNumber'])).toBe('bar')
  })

  it('keeps a hidden current type that still fits the query', () => {
    expect(selectBestChartType([], [department], 'table', ['table'])).toBe('table')
  })
})

describe('shouldAutoSwitchChartType', () => {
  it('recommends table for a dimension-only query', () => {
    expect(shouldAutoSwitchChartType([], [department], 'bar', false)).toBe('table')
  })

  it('recommends no switch when the only candidate is hidden', () => {
    expect(shouldAutoSwitchChartType([], [department], 'bar', false, ['table'])).toBeNull()
  })

  it('recommends no switch from a manual choice when the only candidate is hidden', () => {
    expect(shouldAutoSwitchChartType([], [department], 'bar', true, ['table'])).toBeNull()
  })
})

describe('getSmartChartDefaults', () => {
  it('returns table for a dimension-only query', () => {
    expect(getSmartChartDefaults([], [department], 'bar').chartType).toBe('table')
  })

  it('keeps the current type when the best type is hidden', () => {
    expect(getSmartChartDefaults([], [department], 'bar', ['table']).chartType).toBe('bar')
  })
})
