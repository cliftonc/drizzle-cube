/**
 * Tests for agent chart-config validation and inference
 * Covers validateChartConfig / inferChartConfig / buildChartRequirementsDescription
 * from src/server/agent/chart-validation.ts
 */

import { describe, it, expect } from 'vitest'
import {
  validateChartConfig,
  inferChartConfig,
  resolveChartTypeFallback,
  buildChartRequirementsDescription
} from '../../src/server/agent/chart-validation'

const recordQuery = {
  dimensions: ['Employees.name', 'Employees.department'],
  measures: ['Employees.salary'],
  ungrouped: true
}

describe('record-grain charts', () => {
  it('infers columns from the query but never hides them', () => {
    const config = inferChartConfig('recordsTable', undefined, recordQuery)

    expect(config.columns).toEqual([
      'Employees.name',
      'Employees.department',
      'Employees.salary'
    ])
    // Hidden columns are opt-in: inferring them would hide every column and
    // render an empty table.
    expect(config.hiddenColumns).toBeUndefined()
  })

  it('leaves an explicit hiddenColumns choice alone', () => {
    const config = inferChartConfig(
      'recordsTable',
      { hiddenColumns: ['Employees.id'] },
      recordQuery
    )

    expect(config.hiddenColumns).toEqual(['Employees.id'])
    expect(config.columns).toEqual([
      'Employees.name',
      'Employees.department',
      'Employees.salary'
    ])
  })

  it('rejects a grouped query for a listing chart', () => {
    const { ungrouped: _ungrouped, ...grouped } = recordQuery
    const result = validateChartConfig('recordsTable', { columns: ['Employees.name'] }, grouped)

    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toContain('"ungrouped": true')
  })

  it('accepts an ungrouped query for a listing chart', () => {
    const result = validateChartConfig(
      'recordsTable',
      { columns: ['Employees.name'] },
      recordQuery
    )

    expect(result).toEqual({ isValid: true, errors: [] })
  })

  it('does not impose the ungrouped requirement on aggregate charts', () => {
    const result = validateChartConfig(
      'table',
      { xAxis: ['Employees.department'] },
      { dimensions: ['Employees.department'], measures: ['Employees.count'] }
    )

    expect(result.isValid).toBe(true)
  })
})

describe('buildChartRequirementsDescription', () => {
  it('resolves the i18n keys carried by chart configs', () => {
    const text = buildChartRequirementsDescription(['bar'])

    expect(text).toContain('Compare values across categories')
    expect(text).not.toContain('chart.bar.description')
  })

  it('flags the ungrouped requirement only for listing charts', () => {
    expect(buildChartRequirementsDescription(['recordsTable'])).toContain('"ungrouped": true')
    expect(buildChartRequirementsDescription(['bar'])).not.toContain('"ungrouped": true')
  })

  // Requiring ungrouped implies a second restriction the model otherwise only
  // discovers by having its query rejected: no hasMany joins.
  it('states the hasMany restriction that comes with ungrouped', () => {
    expect(buildChartRequirementsDescription(['recordsTable'])).toContain('hasMany')
  })
})

describe('bar chart axis rules', () => {
  const barQuery = { dimensions: ['Sales.region'], measures: ['Sales.total'] }

  it('accepts a bar chart with an explicit xAxis', () => {
    const result = validateChartConfig('bar', { xAxis: ['Sales.region'], yAxis: ['Sales.total'] }, barQuery)
    expect(result.isValid).toBe(true)
  })

  it('rejects a bar chart with dimensions available but no xAxis chosen', () => {
    const result = validateChartConfig('bar', { yAxis: ['Sales.total'] }, barQuery)
    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toContain('xAxis')
  })

  it('rejects a bar chart whose query has no dimension at all', () => {
    const result = validateChartConfig('bar', { yAxis: ['Sales.total'] }, { measures: ['Sales.total'] })
    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toContain('dimension')
  })

  it('rejects series that repeats an xAxis field', () => {
    const result = validateChartConfig(
      'bar',
      { xAxis: ['Sales.region'], yAxis: ['Sales.total'], series: ['Sales.region'] },
      barQuery
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.join(' ')).toContain('Sales.region')
  })

  it('accepts a series on a second, different dimension', () => {
    const result = validateChartConfig(
      'bar',
      { xAxis: ['Sales.region'], yAxis: ['Sales.total'], series: ['Sales.channel'] },
      { dimensions: ['Sales.region', 'Sales.channel'], measures: ['Sales.total'] }
    )
    expect(result.isValid).toBe(true)
  })

  it('handles the string form of xAxis/series as well as the array form', () => {
    const result = validateChartConfig(
      'bar',
      { xAxis: 'Sales.region', yAxis: ['Sales.total'], series: 'Sales.region' },
      barQuery
    )
    expect(result.isValid).toBe(false)
  })
})

describe('inference never assigns one field to two zones', () => {
  // Inference used to fill xAxis from every dimension, including one the agent
  // had already put in series — then the duplicate check rejected a config the
  // inference itself had created.
  it('keeps an agent-chosen series field out of the inferred xAxis', () => {
    const query = { dimensions: ['C.x', 'C.y'], measures: ['C.n'] }
    const config = inferChartConfig('bar', { series: ['C.x'] }, query)

    expect(config.xAxis).toEqual(['C.y'])
    expect(validateChartConfig('bar', config, query).isValid).toBe(true)
  })

  it('gives a heatmap two different dimensions and a measure to colour by', () => {
    const query = { dimensions: ['A.x', 'A.y'], measures: ['A.n'] }
    const config = inferChartConfig('heatmap', undefined, query)

    expect(config.xAxis).toEqual(['A.x'])
    expect(config.yAxis).toEqual(['A.y'])
    expect(config.valueField).toEqual(['A.n'])
    expect(validateChartConfig('heatmap', config, query).isValid).toBe(true)
  })

  // Same rule, same deliberate consequence as the scatter case below: a heatmap
  // needs two different dimensions to cross, so one dimension is an error
  // rather than a grid of a value against itself.
  it('rejects a heatmap that has only one dimension to cross', () => {
    const query = { dimensions: ['A.x'], measures: ['A.n'] }
    const config = inferChartConfig('heatmap', undefined, query)

    expect(config.xAxis).toEqual(['A.x'])
    expect(config.yAxis).toBeUndefined()
    expect(validateChartConfig('heatmap', config, query).isValid).toBe(false)
  })

  it('plots a scatter of two measures against each other, not one against itself', () => {
    const config = inferChartConfig('scatter', undefined, { measures: ['A.m1', 'A.m2'] })

    expect(config.xAxis).toEqual(['A.m1'])
    expect(config.yAxis).toEqual(['A.m2'])
  })

  // Consequence of the rule above, and the right one: a scatter of a single
  // measure against itself is a diagonal line. Better to tell the model it
  // needs a second measure than to render something meaningless.
  it('rejects a scatter that has only one measure to plot', () => {
    const query = { measures: ['A.m1'] }
    const config = inferChartConfig('scatter', undefined, query)

    expect(config.xAxis).toEqual(['A.m1'])
    expect(config.yAxis).toBeUndefined()
    expect(validateChartConfig('scatter', config, query).isValid).toBe(false)
  })
})

describe('resolveChartTypeFallback', () => {
  it('turns a single-measure bar into a KPI', () => {
    const { chartType, note } = resolveChartTypeFallback('bar', undefined, { measures: ['A.total'] })
    expect(chartType).toBe('kpiNumber')
    expect(note).toContain('kpiNumber')
  })

  it('turns a multi-measure bar into a table', () => {
    const { chartType, note } = resolveChartTypeFallback('bar', undefined, { measures: ['A.a', 'A.b', 'A.c'] })
    expect(chartType).toBe('table')
    expect(note).toContain('table')
  })

  it('leaves a bar with a dimension alone', () => {
    const result = resolveChartTypeFallback('bar', undefined, { dimensions: ['A.d'], measures: ['A.n'] })
    expect(result).toEqual({ chartType: 'bar' })
  })

  it('leaves a bar with only a time dimension alone', () => {
    const result = resolveChartTypeFallback('bar', undefined, {
      measures: ['A.n'],
      timeDimensions: [{ dimension: 'A.createdAt' }]
    })
    expect(result).toEqual({ chartType: 'bar' })
  })

  it('leaves a bar the agent gave an explicit xAxis alone', () => {
    const result = resolveChartTypeFallback('bar', { xAxis: ['A.d'] }, { measures: ['A.n'] })
    expect(result).toEqual({ chartType: 'bar' })
  })

  it('never touches a chart type other than bar', () => {
    const result = resolveChartTypeFallback('table', undefined, { measures: ['A.n'] })
    expect(result).toEqual({ chartType: 'table' })
  })
})

describe('newly exposed chart types', () => {
  it('describes their mandatory drop zones to the model', () => {
    const text = buildChartRequirementsDescription(['waterfall', 'gauge', 'treemap', 'activityGrid'])

    expect(text).toContain('waterfall')
    expect(text).toContain('gauge')
    expect(text).toContain('treemap')
    expect(text).toContain('activityGrid')
  })

  it('fills the mandatory zones of each new type from a plain query', () => {
    const query = {
      dimensions: ['A.category'],
      measures: ['A.total'],
      timeDimensions: [{ dimension: 'A.day', granularity: 'day' }]
    }
    for (const chartType of ['treemap', 'waterfall', 'radialBar', 'measureProfile', 'proportionBar', 'dotStrip', 'kpiText', 'gauge', 'activityGrid']) {
      const config = inferChartConfig(chartType, undefined, query)
      const result = validateChartConfig(chartType, config, query)
      expect(result.errors, `${chartType}: ${result.errors.join(', ')}`).toEqual([])
    }
  })
})
