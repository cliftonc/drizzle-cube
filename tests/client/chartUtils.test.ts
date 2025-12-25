/**
 * Tests for chartUtils
 * Covers numeric value handling, field labels, time formatting, and data transformation
 */

import { describe, it, expect } from 'vitest'
import {
  isValidNumericValue,
  parseNumericValue,
  formatNumericValue,
  getFieldLabel,
  transformSeriesKeysWithLabels,
  formatTimeValue,
  getFieldGranularity,
  transformChartData,
  transformChartDataWithSeries
} from '../../src/client/utils/chartUtils'
import type { FieldLabelMap } from '../../src/client/hooks/useCubeMeta'

describe('chartUtils', () => {
  describe('isValidNumericValue', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumericValue(0)).toBe(true)
      expect(isValidNumericValue(42)).toBe(true)
      expect(isValidNumericValue(-10)).toBe(true)
      expect(isValidNumericValue(3.14)).toBe(true)
      expect(isValidNumericValue('123')).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidNumericValue(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidNumericValue(undefined)).toBe(false)
    })

    it('should return false for NaN', () => {
      expect(isValidNumericValue(NaN)).toBe(false)
      expect(isValidNumericValue('not a number')).toBe(false)
    })
  })

  describe('parseNumericValue', () => {
    it('should parse valid numbers', () => {
      expect(parseNumericValue(42)).toBe(42)
      expect(parseNumericValue('123')).toBe(123)
      expect(parseNumericValue(3.14)).toBe(3.14)
      expect(parseNumericValue('3.14')).toBe(3.14)
    })

    it('should return null for null', () => {
      expect(parseNumericValue(null)).toBe(null)
    })

    it('should return null for undefined', () => {
      expect(parseNumericValue(undefined)).toBe(null)
    })

    it('should return null for non-numeric strings', () => {
      expect(parseNumericValue('not a number')).toBe(null)
    })

    it('should handle zero correctly', () => {
      expect(parseNumericValue(0)).toBe(0)
      expect(parseNumericValue('0')).toBe(0)
    })
  })

  describe('formatNumericValue', () => {
    it('should format integers without decimals', () => {
      expect(formatNumericValue(42)).toBe('42')
      expect(formatNumericValue(1000)).toBe('1,000')
      expect(formatNumericValue(1000000)).toBe('1,000,000')
    })

    it('should format decimals with up to 2 places', () => {
      expect(formatNumericValue(3.14159)).toBe('3.14')
      expect(formatNumericValue(3.1)).toBe('3.1')
      expect(formatNumericValue(3.10)).toBe('3.1')
    })

    it('should return "No data" for null', () => {
      expect(formatNumericValue(null)).toBe('No data')
    })

    it('should return "No data" for undefined', () => {
      expect(formatNumericValue(undefined)).toBe('No data')
    })

    it('should return original value for non-numeric strings', () => {
      expect(formatNumericValue('hello')).toBe('hello')
    })

    it('should handle zero correctly', () => {
      expect(formatNumericValue(0)).toBe('0')
    })
  })

  describe('getFieldLabel', () => {
    it('should return label from map', () => {
      const labelMap: FieldLabelMap = {
        'Sales.count': 'Total Sales',
        'Products.name': 'Product Name'
      }
      expect(getFieldLabel('Sales.count', labelMap)).toBe('Total Sales')
    })

    it('should return field name if not in map', () => {
      const labelMap: FieldLabelMap = {}
      expect(getFieldLabel('Sales.count', labelMap)).toBe('Sales.count')
    })
  })

  describe('transformSeriesKeysWithLabels', () => {
    it('should transform all keys using label map', () => {
      const keys = ['Sales.count', 'Sales.total']
      const labelMap: FieldLabelMap = {
        'Sales.count': 'Count',
        'Sales.total': 'Total'
      }
      expect(transformSeriesKeysWithLabels(keys, labelMap)).toEqual(['Count', 'Total'])
    })

    it('should preserve keys not in label map', () => {
      const keys = ['Sales.count', 'Unknown.field']
      const labelMap: FieldLabelMap = {
        'Sales.count': 'Count'
      }
      expect(transformSeriesKeysWithLabels(keys, labelMap)).toEqual(['Count', 'Unknown.field'])
    })
  })

  describe('formatTimeValue', () => {
    describe('with granularity', () => {
      it('should format year granularity', () => {
        expect(formatTimeValue('2024-01-01T00:00:00.000', 'year')).toBe('2024')
      })

      it('should format quarter granularity', () => {
        expect(formatTimeValue('2024-04-01T00:00:00.000', 'quarter')).toBe('2024-Q2')
        expect(formatTimeValue('2024-07-01T00:00:00.000', 'quarter')).toBe('2024-Q3')
      })

      it('should format month granularity', () => {
        expect(formatTimeValue('2024-03-01T00:00:00.000', 'month')).toBe('2024-03')
      })

      it('should format day granularity', () => {
        expect(formatTimeValue('2024-03-15T00:00:00.000', 'day')).toBe('2024-03-15')
      })

      it('should format hour granularity', () => {
        expect(formatTimeValue('2024-03-15T14:00:00.000', 'hour')).toBe('2024-03-15 14:00')
      })

      it('should format minute granularity', () => {
        expect(formatTimeValue('2024-03-15T14:30:00.000', 'minute')).toBe('2024-03-15 14:30')
      })
    })

    describe('with heuristic detection', () => {
      it('should detect day granularity from midnight timestamp', () => {
        expect(formatTimeValue('2024-03-15T00:00:00.000')).toBe('2024-03-15')
      })

      it('should detect month granularity from first of month at midnight', () => {
        expect(formatTimeValue('2024-03-01T00:00:00.000')).toBe('2024-03')
      })

      it('should detect quarter granularity from first of quarter month', () => {
        expect(formatTimeValue('2024-04-01T00:00:00.000')).toBe('2024-Q2')
      })

      it('should detect hour granularity', () => {
        expect(formatTimeValue('2024-03-15T14:00:00.000')).toBe('2024-03-15 14:00')
      })
    })

    it('should handle PostgreSQL format timestamps', () => {
      expect(formatTimeValue('2024-03-15 14:30:00+00', 'minute')).toBe('2024-03-15 14:30')
    })

    it('should return non-timestamp values as-is', () => {
      expect(formatTimeValue('hello')).toBe('hello')
      expect(formatTimeValue(123)).toBe('123')
    })

    it('should handle null/undefined', () => {
      expect(formatTimeValue(null)).toBe('Unknown')
      expect(formatTimeValue(undefined)).toBe('Unknown')
    })
  })

  describe('getFieldGranularity', () => {
    it('should extract granularity from timeDimensions', () => {
      const queryObject = {
        timeDimensions: [
          { dimension: 'Orders.createdAt', granularity: 'day' }
        ]
      }
      expect(getFieldGranularity(queryObject, 'Orders.createdAt')).toBe('day')
    })

    it('should match field with granularity suffix', () => {
      const queryObject = {
        timeDimensions: [
          { dimension: 'Orders.createdAt', granularity: 'month' }
        ]
      }
      expect(getFieldGranularity(queryObject, 'Orders.createdAt_month')).toBe('month')
    })

    it('should extract granularity from field name suffix as fallback', () => {
      const queryObject = {}
      expect(getFieldGranularity(queryObject, 'Orders_createdAt_day')).toBe('day')
      expect(getFieldGranularity(queryObject, 'Orders_createdAt_month')).toBe('month')
    })

    it('should return undefined for non-time fields', () => {
      const queryObject = {}
      expect(getFieldGranularity(queryObject, 'Orders.count')).toBeUndefined()
    })

    it('should handle null/undefined queryObject', () => {
      expect(getFieldGranularity(null, 'field')).toBeUndefined()
      expect(getFieldGranularity(undefined, 'field')).toBeUndefined()
    })
  })

  describe('transformChartData', () => {
    it('should transform data with x and y axis fields', () => {
      // Use mid-month dates to avoid quarter/month detection heuristics
      const data = [
        { date: '2024-02-15T00:00:00.000', count: 10, total: 100 },
        { date: '2024-02-16T00:00:00.000', count: 20, total: 200 }
      ]
      const result = transformChartData(data, 'date', ['count', 'total'], {})

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        name: '2024-02-15',
        count: 10,
        total: 100
      })
    })

    it('should use label map for field names', () => {
      const data = [
        { date: '2024-01-01T00:00:00.000', 'Sales.count': 10 }
      ]
      const labelMap: FieldLabelMap = { 'Sales.count': 'Total Sales' }
      const result = transformChartData(data, 'date', ['Sales.count'], {}, labelMap)

      expect(result[0]).toHaveProperty('Total Sales', 10)
    })

    it('should preserve null values', () => {
      const data = [
        { date: '2024-01-01T00:00:00.000', count: null }
      ]
      const result = transformChartData(data, 'date', ['count'], {})

      expect(result[0].count).toBe(null)
    })

    it('should handle empty data', () => {
      expect(transformChartData([], 'date', ['count'], {})).toEqual([])
    })
  })

  describe('transformChartDataWithSeries', () => {
    it('should return standard transformation when no series fields', () => {
      // Use mid-month dates to avoid quarter detection heuristics
      const data = [
        { date: '2024-02-15T00:00:00.000', count: 10 }
      ]
      const result = transformChartDataWithSeries(data, 'date', ['count'], {
        measures: ['count']
      })

      expect(result.hasDimensions).toBe(false)
      expect(result.seriesKeys).toEqual(['count'])
      expect(result.data[0]).toMatchObject({ name: '2024-02-15', count: 10 })
    })

    it('should group by dimension when series fields provided', () => {
      // Use mid-month dates to avoid quarter detection heuristics
      const data = [
        { date: '2024-02-15T00:00:00.000', category: 'A', count: 10 },
        { date: '2024-02-15T00:00:00.000', category: 'B', count: 20 },
        { date: '2024-02-16T00:00:00.000', category: 'A', count: 15 }
      ]
      const result = transformChartDataWithSeries(
        data,
        'date',
        ['count'],
        { measures: ['count'], dimensions: ['category'] },
        ['category']
      )

      expect(result.hasDimensions).toBe(true)
      expect(result.seriesKeys).toContain('A')
      expect(result.seriesKeys).toContain('B')
      expect(result.data.find(d => d.name === '2024-02-15')).toMatchObject({
        A: 10,
        B: 20
      })
    })

    it('should handle empty data', () => {
      const result = transformChartDataWithSeries([], 'date', ['count'], {})
      expect(result.data).toEqual([])
      expect(result.seriesKeys).toEqual([])
      expect(result.hasDimensions).toBe(false)
    })

    it('should use label map for series keys', () => {
      const data = [
        { date: '2024-01-01T00:00:00.000', 'Sales.count': 10 }
      ]
      const labelMap: FieldLabelMap = { 'Sales.count': 'Total Sales' }
      const result = transformChartDataWithSeries(
        data,
        'date',
        ['Sales.count'],
        { measures: ['Sales.count'] },
        undefined,
        labelMap
      )

      expect(result.seriesKeys).toEqual(['Total Sales'])
    })
  })
})
