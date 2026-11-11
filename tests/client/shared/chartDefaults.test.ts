import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  selectBestChartType,
  shouldAutoSwitchChartType,
  getSmartChartDefaults,
} from '../../../src/client/shared/chartDefaults'
import { chartPluginRegistry } from '../../../src/client/charts/chartPlugin'
import type { ChartConfigBuildContext, ChartTypeConfig } from '../../../src/client/charts/chartConfigs'
import type { ChartAxisConfig } from '../../../src/client/types'
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

describe('getSmartChartDefaults with a chart that defines buildChartConfig', () => {
  const pivotConfig: ChartAxisConfig = {
    xAxis: ['Employees.departmentName'],
    series: ['Employees.createdAt'],
    yAxis: ['Employees.count'],
  }

  const allFieldsAsColumns = ({ metrics, breakdowns }: ChartConfigBuildContext): ChartAxisConfig => ({
    xAxis: [...breakdowns.map((b) => b.field), ...metrics.map((m) => m.field)],
  })

  function registerChart(type: string, buildChartConfig?: ChartTypeConfig['buildChartConfig']) {
    chartPluginRegistry.register({
      type,
      label: type,
      config: { dropZones: [], buildChartConfig },
      component: () => null,
    })
  }

  afterEach(() => {
    for (const type of chartPluginRegistry.getCustomTypes()) {
      chartPluginRegistry.unregister(type)
    }
  })

  it('uses the default rule for a custom chart without buildChartConfig', () => {
    registerChart('customTable')

    expect(getSmartChartDefaults([count], [department, createdAt], 'customTable')).toEqual({
      chartType: 'customTable',
      chartConfig: { xAxis: ['Employees.departmentName'], yAxis: ['Employees.count'] },
    })
  })

  it('uses the buildChartConfig of a custom chart over the default rule', () => {
    registerChart('customTable', allFieldsAsColumns)

    expect(getSmartChartDefaults([count], [department, createdAt], 'customTable')).toEqual({
      chartType: 'customTable',
      chartConfig: { xAxis: ['Employees.departmentName', 'Employees.createdAt', 'Employees.count'] },
    })
  })

  it('uses the buildChartConfig of a custom chart that overrides a built-in chart', () => {
    registerChart('bar', allFieldsAsColumns)

    expect(getSmartChartDefaults([count], [department], 'bar').chartConfig).toEqual({
      xAxis: ['Employees.departmentName', 'Employees.count'],
    })
  })

  it('passes the previous chart to buildChartConfig', () => {
    const buildChartConfig = vi.fn(allFieldsAsColumns)
    registerChart('customTable', buildChartConfig)

    getSmartChartDefaults([count], [department, createdAt], 'customTable', [], {
      chartType: 'customPivot',
      chartConfig: pivotConfig,
    })

    expect(buildChartConfig).toHaveBeenCalledExactlyOnceWith({
      metrics: [count],
      breakdowns: [department, createdAt],
      timeDimension: createdAt,
      dimension: department,
      dimensions: [department],
      previousChartType: 'customPivot',
      previousChartConfig: pivotConfig,
    })
  })

  it('passes no previous chart to buildChartConfig when there is none', () => {
    const buildChartConfig = vi.fn(allFieldsAsColumns)
    registerChart('customTable', buildChartConfig)

    getSmartChartDefaults([count], [department], 'customTable')

    expect(buildChartConfig).toHaveBeenCalledExactlyOnceWith({
      metrics: [count],
      breakdowns: [department],
      timeDimension: undefined,
      dimension: department,
      dimensions: [department],
      previousChartType: undefined,
      previousChartConfig: undefined,
    })
  })

  it('keeps the built-in rule of a built-in chart when a previous chart is given', () => {
    expect(
      getSmartChartDefaults([count], [department], 'table', [], {
        chartType: 'customPivot',
        chartConfig: pivotConfig,
      }).chartConfig
    ).toEqual({ xAxis: ['Employees.departmentName', 'Employees.count'] })
  })
})
