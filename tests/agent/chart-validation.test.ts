/**
 * Tests for agent chart-config validation and inference
 * Covers validateChartConfig / inferChartConfig / buildChartRequirementsDescription
 * from src/server/agent/chart-validation.ts
 */

import { describe, it, expect } from 'vitest'
import {
  validateChartConfig,
  inferChartConfig,
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
