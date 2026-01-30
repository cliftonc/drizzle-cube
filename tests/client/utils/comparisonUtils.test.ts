/**
 * Tests for comparisonUtils
 * Covers period-over-period comparison data transformation for charts
 */

import { describe, it, expect } from 'vitest'
import {
  isComparisonData,
  getPeriodLabels,
  getPeriodIndices,
  generatePeriodShortLabel,
  transformForSeparateMode,
  transformForOverlayMode,
  formatPeriodDayIndex,
  isPriorPeriodSeries,
  getPriorPeriodStrokeDashArray
} from '../../../src/client/utils/comparisonUtils'

describe('comparisonUtils', () => {
  describe('isComparisonData', () => {
    it('should return true for data with __periodIndex', () => {
      const data = [
        { date: '2024-01-01', value: 100, __periodIndex: 0 }
      ]
      expect(isComparisonData(data)).toBe(true)
    })

    it('should return false for data without __periodIndex', () => {
      const data = [
        { date: '2024-01-01', value: 100 }
      ]
      expect(isComparisonData(data)).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(isComparisonData([])).toBe(false)
    })
  })

  describe('getPeriodLabels', () => {
    it('should extract unique period labels', () => {
      const data = [
        { __periodIndex: 0, __period: '2024-01' },
        { __periodIndex: 0, __period: '2024-01' },
        { __periodIndex: 1, __period: '2023-01' }
      ]
      expect(getPeriodLabels(data)).toEqual(['2024-01', '2023-01'])
    })

    it('should return empty array for non-comparison data', () => {
      const data = [{ value: 100 }]
      expect(getPeriodLabels(data)).toEqual([])
    })

    it('should return empty array for empty data', () => {
      expect(getPeriodLabels([])).toEqual([])
    })
  })

  describe('getPeriodIndices', () => {
    it('should extract and sort unique period indices', () => {
      const data = [
        { __periodIndex: 1 },
        { __periodIndex: 0 },
        { __periodIndex: 1 },
        { __periodIndex: 0 }
      ]
      expect(getPeriodIndices(data)).toEqual([0, 1])
    })

    it('should return empty array for non-comparison data', () => {
      expect(getPeriodIndices([{ value: 100 }])).toEqual([])
    })
  })

  describe('generatePeriodShortLabel', () => {
    it('should return "Current" for index 0', () => {
      expect(generatePeriodShortLabel('2024-01', 0)).toBe('Current')
    })

    it('should return "Prior" for index > 0', () => {
      expect(generatePeriodShortLabel('2023-01', 1)).toBe('Prior')
      expect(generatePeriodShortLabel('2022-01', 2)).toBe('Prior')
    })
  })

  describe('transformForSeparateMode', () => {
    it('should create series keys for each measure + period', () => {
      const data = [
        { date: '2024-01-01', value: 100, __periodIndex: 0, __period: '2024-01' },
        { date: '2023-01-01', value: 80, __periodIndex: 1, __period: '2023-01' }
      ]
      const result = transformForSeparateMode(data, ['value'], 'date')

      expect(result.seriesKeys).toEqual(['value (Current)', 'value (Prior)'])
    })

    it('should handle multiple measures', () => {
      const data = [
        { date: '2024-01-01', count: 100, total: 500, __periodIndex: 0, __period: '2024-01' },
        { date: '2023-01-01', count: 80, total: 400, __periodIndex: 1, __period: '2023-01' }
      ]
      const result = transformForSeparateMode(data, ['count', 'total'], 'date')

      expect(result.seriesKeys).toEqual([
        'count (Current)', 'count (Prior)',
        'total (Current)', 'total (Prior)'
      ])
    })

    it('should return original data and measures for non-comparison data', () => {
      const data = [{ date: '2024-01-01', value: 100 }]
      const result = transformForSeparateMode(data, ['value'], 'date')

      expect(result.data).toBe(data)
      expect(result.seriesKeys).toEqual(['value'])
    })
  })

  describe('transformForOverlayMode', () => {
    const comparisonData = [
      { date: '2024-01-01', value: 100, __periodIndex: 0, __periodDayIndex: 0, __period: '2024-01' },
      { date: '2024-01-02', value: 110, __periodIndex: 0, __periodDayIndex: 1, __period: '2024-01' },
      { date: '2023-01-01', value: 80, __periodIndex: 1, __periodDayIndex: 0, __period: '2023-01' },
      { date: '2023-01-02', value: 85, __periodIndex: 1, __periodDayIndex: 1, __period: '2023-01' }
    ]

    it('should pivot data by period day index', () => {
      const result = transformForOverlayMode(comparisonData, ['value'], 'date')

      expect(result.data).toHaveLength(2)
      expect(result.data[0].__periodDayIndex).toBe(0)
      expect(result.data[1].__periodDayIndex).toBe(1)
    })

    it('should create period-labeled columns', () => {
      const result = transformForOverlayMode(comparisonData, ['value'], 'date')

      expect(result.data[0]).toHaveProperty('value (Current)', 100)
      expect(result.data[0]).toHaveProperty('value (Prior)', 80)
      expect(result.data[1]).toHaveProperty('value (Current)', 110)
      expect(result.data[1]).toHaveProperty('value (Prior)', 85)
    })

    it('should generate correct series keys', () => {
      const result = transformForOverlayMode(comparisonData, ['value'], 'date')

      expect(result.seriesKeys).toEqual(['value (Current)', 'value (Prior)'])
    })

    it('should set xAxisKey to __periodDayIndex', () => {
      const result = transformForOverlayMode(comparisonData, ['value'], 'date')

      expect(result.xAxisKey).toBe('__periodDayIndex')
    })

    it('should preserve display date from current period', () => {
      const result = transformForOverlayMode(comparisonData, ['value'], 'date')

      expect(result.data[0].__displayDate).toBe('2024-01-01')
      expect(result.data[1].__displayDate).toBe('2024-01-02')
    })

    it('should use field label function when provided', () => {
      const getFieldLabel = (field: string) =>
        field === 'value' ? 'Total Value' : field

      const result = transformForOverlayMode(
        comparisonData, ['value'], 'date', getFieldLabel
      )

      expect(result.seriesKeys).toEqual(['Total Value (Current)', 'Total Value (Prior)'])
      expect(result.data[0]).toHaveProperty('Total Value (Current)', 100)
    })

    it('should return original format for non-comparison data', () => {
      const regularData = [{ date: '2024-01-01', value: 100 }]
      const result = transformForOverlayMode(regularData, ['value'], 'date')

      expect(result.data).toBe(regularData)
      expect(result.seriesKeys).toEqual(['value'])
      expect(result.xAxisKey).toBe('date')
    })

    describe('with dimensions', () => {
      const dataWithDimensions = [
        { date: '2024-01-01', 'Dept.name': 'Engineering', value: 100, __periodIndex: 0, __periodDayIndex: 0, __period: '2024' },
        { date: '2024-01-01', 'Dept.name': 'Sales', value: 50, __periodIndex: 0, __periodDayIndex: 0, __period: '2024' },
        { date: '2023-01-01', 'Dept.name': 'Engineering', value: 80, __periodIndex: 1, __periodDayIndex: 0, __period: '2023' },
        { date: '2023-01-01', 'Dept.name': 'Sales', value: 40, __periodIndex: 1, __periodDayIndex: 0, __period: '2023' }
      ]

      it('should create dimension-prefixed series keys', () => {
        const result = transformForOverlayMode(dataWithDimensions, ['value'], 'date')

        expect(result.seriesKeys).toContain('Engineering - value (Current)')
        expect(result.seriesKeys).toContain('Engineering - value (Prior)')
        expect(result.seriesKeys).toContain('Sales - value (Current)')
        expect(result.seriesKeys).toContain('Sales - value (Prior)')
      })

      it('should pivot data with dimension prefix', () => {
        const result = transformForOverlayMode(dataWithDimensions, ['value'], 'date')

        expect(result.data[0]).toHaveProperty('Engineering - value (Current)', 100)
        expect(result.data[0]).toHaveProperty('Engineering - value (Prior)', 80)
        expect(result.data[0]).toHaveProperty('Sales - value (Current)', 50)
        expect(result.data[0]).toHaveProperty('Sales - value (Prior)', 40)
      })
    })
  })

  describe('formatPeriodDayIndex', () => {
    it('should format as "Day N" when showDayNumber is true', () => {
      expect(formatPeriodDayIndex(0, undefined, { showDayNumber: true })).toBe('Day 1')
      expect(formatPeriodDayIndex(5, undefined, { showDayNumber: true })).toBe('Day 6')
    })

    it('should format date when displayDate is provided', () => {
      const result = formatPeriodDayIndex(0, '2024-03-15T00:00:00Z')
      expect(result).toBe('Mar 15')
    })

    it('should use long date format when specified', () => {
      const result = formatPeriodDayIndex(0, '2024-03-15T00:00:00Z', { dateFormat: 'long' })
      expect(result).toBe('March 15')
    })

    it('should fall back to index + 1 when no display date', () => {
      expect(formatPeriodDayIndex(2)).toBe('3')
    })

    it('should handle Date object as displayDate', () => {
      const date = new Date('2024-03-15T00:00:00Z')
      const result = formatPeriodDayIndex(0, date)
      expect(result).toBe('Mar 15')
    })

    it('should fall back to index when date is invalid', () => {
      expect(formatPeriodDayIndex(3, 'invalid-date')).toBe('4')
    })
  })

  describe('isPriorPeriodSeries', () => {
    const periodLabels = ['2024-01', '2023-01']

    it('should return true for prior period series', () => {
      expect(isPriorPeriodSeries('value (Prior)', periodLabels)).toBe(true)
    })

    it('should return false for current period series', () => {
      expect(isPriorPeriodSeries('value (Current)', periodLabels)).toBe(false)
    })

    it('should return false for series without period marker', () => {
      expect(isPriorPeriodSeries('value', periodLabels)).toBe(false)
    })

    it('should return false for single period', () => {
      expect(isPriorPeriodSeries('value (Prior)', ['2024-01'])).toBe(false)
    })

    it('should return false for empty period labels', () => {
      expect(isPriorPeriodSeries('value (Prior)', [])).toBe(false)
    })
  })

  describe('getPriorPeriodStrokeDashArray', () => {
    it('should return undefined for solid style', () => {
      expect(getPriorPeriodStrokeDashArray('solid')).toBeUndefined()
    })

    it('should return dashed pattern for dashed style', () => {
      expect(getPriorPeriodStrokeDashArray('dashed')).toBe('5 5')
    })

    it('should return dotted pattern for dotted style', () => {
      expect(getPriorPeriodStrokeDashArray('dotted')).toBe('2 2')
    })

    it('should default to dashed pattern', () => {
      expect(getPriorPeriodStrokeDashArray()).toBe('5 5')
    })
  })
})
