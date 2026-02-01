/**
 * Comprehensive tests for pivotUtils
 * Covers all exported functions including getOrderedColumnsFromQuery
 */

import { describe, it, expect } from 'vitest'
import {
  getOrderedColumnsFromQuery,
  hasTimeDimensionForPivot,
  pivotTableData,
  getMeasureType,
  type PivotConfig,
  type PivotColumn,
  type PivotRow,
  type PivotedTableData
} from '../../../src/client/utils/pivotUtils'
import type { CubeMeta } from '../../../src/client/types'

describe('pivotUtils', () => {
  describe('getOrderedColumnsFromQuery', () => {
    it('should return empty array when no queryObject', () => {
      expect(getOrderedColumnsFromQuery(undefined)).toEqual([])
    })

    it('should return empty array for empty queryObject', () => {
      expect(getOrderedColumnsFromQuery({})).toEqual([])
    })

    it('should return dimensions first', () => {
      const columns = getOrderedColumnsFromQuery({
        dimensions: ['Products.name', 'Products.category']
      })
      expect(columns).toEqual(['Products.name', 'Products.category'])
    })

    it('should return measures after dimensions', () => {
      const columns = getOrderedColumnsFromQuery({
        dimensions: ['Products.name'],
        measures: ['Sales.revenue', 'Sales.count']
      })
      expect(columns).toEqual(['Products.name', 'Sales.revenue', 'Sales.count'])
    })

    it('should include time dimensions between dimensions and measures', () => {
      const columns = getOrderedColumnsFromQuery({
        dimensions: ['Products.name'],
        timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }],
        measures: ['Sales.revenue']
      })
      expect(columns).toEqual(['Products.name', 'Sales.date', 'Sales.revenue'])
    })

    it('should not duplicate time dimension if already in dimensions', () => {
      const columns = getOrderedColumnsFromQuery({
        dimensions: ['Products.name', 'Sales.date'],
        timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }],
        measures: ['Sales.revenue']
      })
      // Sales.date should only appear once
      expect(columns).toEqual(['Products.name', 'Sales.date', 'Sales.revenue'])
    })

    it('should handle multiple time dimensions', () => {
      const columns = getOrderedColumnsFromQuery({
        timeDimensions: [
          { dimension: 'Sales.date', granularity: 'month' },
          { dimension: 'Sales.createdAt', granularity: 'day' }
        ],
        measures: ['Sales.revenue']
      })
      expect(columns).toEqual(['Sales.date', 'Sales.createdAt', 'Sales.revenue'])
    })

    it('should handle measures only', () => {
      const columns = getOrderedColumnsFromQuery({
        measures: ['Sales.revenue', 'Sales.count', 'Sales.avgPrice']
      })
      expect(columns).toEqual(['Sales.revenue', 'Sales.count', 'Sales.avgPrice'])
    })

    it('should handle dimensions only', () => {
      const columns = getOrderedColumnsFromQuery({
        dimensions: ['Products.name', 'Products.category']
      })
      expect(columns).toEqual(['Products.name', 'Products.category'])
    })

    it('should preserve order within each section', () => {
      const columns = getOrderedColumnsFromQuery({
        dimensions: ['z.field', 'a.field', 'm.field'],
        measures: ['z.measure', 'a.measure']
      })
      expect(columns).toEqual(['z.field', 'a.field', 'm.field', 'z.measure', 'a.measure'])
    })
  })

  describe('hasTimeDimensionForPivot', () => {
    it('should return null when no queryObject', () => {
      expect(hasTimeDimensionForPivot(undefined)).toBeNull()
    })

    it('should return null when no timeDimensions', () => {
      expect(hasTimeDimensionForPivot({ measures: ['count'] })).toBeNull()
    })

    it('should return null when timeDimensions array is empty', () => {
      expect(hasTimeDimensionForPivot({
        measures: ['Sales.count'],
        timeDimensions: []
      })).toBeNull()
    })

    it('should return null when timeDimension has no granularity', () => {
      expect(hasTimeDimensionForPivot({
        measures: ['Sales.count'],
        timeDimensions: [{ dimension: 'Sales.date' }]
      })).toBeNull()
    })

    it('should return null when no measures', () => {
      expect(hasTimeDimensionForPivot({
        dimensions: ['Products.name'],
        timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
      })).toBeNull()
    })

    it('should return null when measures array is empty', () => {
      expect(hasTimeDimensionForPivot({
        measures: [],
        timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
      })).toBeNull()
    })

    it('should return config when timeDimension has granularity', () => {
      const result = hasTimeDimensionForPivot({
        measures: ['Sales.revenue', 'Sales.quantity'],
        dimensions: ['Products.name'],
        timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
      })

      expect(result).toEqual({
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue', 'Sales.quantity']
      })
    })

    it('should use first timeDimension with granularity', () => {
      const result = hasTimeDimensionForPivot({
        measures: ['Sales.count'],
        timeDimensions: [
          { dimension: 'Sales.date' }, // No granularity
          { dimension: 'Sales.createdAt', granularity: 'year' }
        ]
      })

      expect(result?.timeDimension).toBe('Sales.createdAt')
      expect(result?.granularity).toBe('year')
    })

    it('should filter dimensions from xAxisOverride', () => {
      const result = hasTimeDimensionForPivot(
        {
          measures: ['Sales.revenue', 'Sales.count'],
          dimensions: ['Products.name', 'Products.category'],
          timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
        },
        ['Products.name', 'Sales.revenue']
      )

      expect(result?.dimensions).toEqual(['Products.name'])
      expect(result?.measures).toEqual(['Sales.revenue'])
    })

    it('should exclude time dimension from xAxisOverride dimensions', () => {
      const result = hasTimeDimensionForPivot(
        {
          measures: ['Sales.revenue'],
          dimensions: ['Products.name'],
          timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
        },
        ['Products.name', 'Sales.date']
      )

      expect(result?.dimensions).toEqual(['Products.name'])
      expect(result?.dimensions).not.toContain('Sales.date')
    })

    it('should fall back to all measures if no measures in xAxisOverride', () => {
      const result = hasTimeDimensionForPivot(
        {
          measures: ['Sales.revenue', 'Sales.count'],
          dimensions: ['Products.name'],
          timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
        },
        ['Products.name'] // No measures in override
      )

      expect(result?.measures).toEqual(['Sales.revenue', 'Sales.count'])
    })

    it('should return null if xAxisOverride results in empty measures', () => {
      // This shouldn't happen normally, but test the edge case
      const result = hasTimeDimensionForPivot(
        {
          measures: ['Sales.revenue'],
          timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }]
        },
        [] // Empty xAxisOverride
      )

      // Should fall back to all measures
      expect(result?.measures).toEqual(['Sales.revenue'])
    })
  })

  describe('pivotTableData', () => {
    const mockGetFieldLabel = (field: string) => {
      const labels: Record<string, string> = {
        'Products.name': 'Product',
        'Sales.revenue': 'Revenue',
        'Sales.quantity': 'Quantity',
        'Employees.name': 'Employee'
      }
      return labels[field] || field
    }

    it('should handle empty data', () => {
      const result = pivotTableData([], {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.isPivoted).toBe(true)
      expect(result.columns).toHaveLength(0)
      expect(result.rows).toHaveLength(0)
    })

    it('should handle null data', () => {
      const result = pivotTableData(null as any, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.isPivoted).toBe(true)
      expect(result.columns).toHaveLength(0)
      expect(result.rows).toHaveLength(0)
    })

    it('should pivot data with single measure (no Measure column)', () => {
      const data = [
        { 'Products.name': 'Widget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Products.name': 'Widget', 'Sales.date': '2024-02-01T00:00:00.000Z', 'Sales.revenue': 150 },
        { 'Products.name': 'Gadget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 50 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.isPivoted).toBe(true)
      expect(result.columns).toHaveLength(3) // Product, 2024-01, 2024-02
      expect(result.columns[0].isMeasureColumn).toBeFalsy()
      expect(result.rows).toHaveLength(2)
    })

    it('should pivot data with multiple measures (includes Measure column)', () => {
      const data = [
        { 'Products.name': 'Widget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100, 'Sales.quantity': 10 },
        { 'Products.name': 'Gadget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 50, 'Sales.quantity': 5 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue', 'Sales.quantity']
      }, mockGetFieldLabel)

      expect(result.columns[0].isMeasureColumn).toBe(true)
      expect(result.columns[0].label).toBe('Measure')
      expect(result.rows).toHaveLength(4) // 2 products x 2 measures
    })

    it('should handle no dimensions (measures only over time)', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Sales.date': '2024-02-01T00:00:00.000Z', 'Sales.revenue': 150 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.isPivoted).toBe(true)
      expect(result.columns).toHaveLength(2) // Only time columns
      expect(result.rows).toHaveLength(1)
    })

    it('should sort time columns chronologically', () => {
      const data = [
        { 'Sales.date': '2024-03-01T00:00:00.000Z', 'Sales.revenue': 300 },
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Sales.date': '2024-02-01T00:00:00.000Z', 'Sales.revenue': 200 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      const timeColumns = result.columns.filter(c => c.isTimeColumn)
      expect(timeColumns.map(c => c.key)).toEqual(['2024-01', '2024-02', '2024-03'])
    })

    it('should format time columns by granularity - year', () => {
      const data = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'year',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.columns[0].key).toBe('2024')
    })

    it('should format time columns by granularity - quarter', () => {
      const data = [
        { 'Sales.date': '2024-04-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'quarter',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.columns[0].key).toBe('2024-Q2')
    })

    it('should handle null time values in data', () => {
      const data = [
        { 'Products.name': 'Widget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Products.name': 'Gadget', 'Sales.date': null, 'Sales.revenue': 50 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      // Should only have time column for valid date
      expect(result.columns.filter(c => c.isTimeColumn)).toHaveLength(1)
    })

    it('should handle multiple dimensions', () => {
      const data = [
        { 'Products.name': 'Widget', 'Employees.name': 'John', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Products.name': 'Widget', 'Employees.name': 'Jane', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 75 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name', 'Employees.name'],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(result.columns[0].key).toBe('Products.name')
      expect(result.columns[1].key).toBe('Employees.name')
      expect(result.rows).toHaveLength(2)
    })

    it('should set isFirstInGroup and dimensionRowSpan for measure grouping', () => {
      const data = [
        { 'Products.name': 'Widget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100, 'Sales.quantity': 10 },
        { 'Products.name': 'Gadget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 50, 'Sales.quantity': 5 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue', 'Sales.quantity']
      }, mockGetFieldLabel)

      // First row of revenue group
      expect(result.rows[0].isFirstInGroup).toBe(true)
      expect(result.rows[0].dimensionRowSpan).toBe(2)

      // Second row of revenue group
      expect(result.rows[1].isFirstInGroup).toBe(false)

      // First row of quantity group
      expect(result.rows[2].isFirstInGroup).toBe(true)
      expect(result.rows[2].dimensionRowSpan).toBe(2)
    })
  })

  describe('getMeasureType', () => {
    const mockMeta: CubeMeta = {
      cubes: [
        {
          name: 'Sales',
          title: 'Sales',
          measures: [
            { name: 'Sales.count', type: 'count', title: 'Count', shortTitle: 'Count' },
            { name: 'Sales.revenue', type: 'sum', title: 'Revenue', shortTitle: 'Revenue' },
            { name: 'Sales.avgPrice', type: 'avg', title: 'Avg Price', shortTitle: 'Avg' }
          ],
          dimensions: [],
          segments: []
        },
        {
          name: 'Products',
          title: 'Products',
          measures: [
            { name: 'Products.count', type: 'count', title: 'Count', shortTitle: 'Count' }
          ],
          dimensions: [],
          segments: []
        }
      ]
    }

    it('should return measure type from metadata', () => {
      expect(getMeasureType('Sales.count', mockMeta)).toBe('count')
      expect(getMeasureType('Sales.revenue', mockMeta)).toBe('sum')
      expect(getMeasureType('Sales.avgPrice', mockMeta)).toBe('avg')
    })

    it('should find measure type across multiple cubes', () => {
      expect(getMeasureType('Products.count', mockMeta)).toBe('count')
    })

    it('should return undefined for unknown measure', () => {
      expect(getMeasureType('Unknown.measure', mockMeta)).toBeUndefined()
    })

    it('should return undefined when meta is null', () => {
      expect(getMeasureType('Sales.count', null)).toBeUndefined()
    })

    it('should return undefined when meta has no cubes', () => {
      expect(getMeasureType('Sales.count', { cubes: [] })).toBeUndefined()
    })

    it('should return undefined when meta cubes is undefined', () => {
      expect(getMeasureType('Sales.count', {} as CubeMeta)).toBeUndefined()
    })
  })

  describe('Type exports', () => {
    it('should export PivotConfig type', () => {
      const config: PivotConfig = {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue']
      }
      expect(config.timeDimension).toBe('Sales.date')
    })

    it('should export PivotColumn type', () => {
      const column: PivotColumn = {
        key: 'Products.name',
        label: 'Product',
        isTimeColumn: false
      }
      expect(column.key).toBe('Products.name')
    })

    it('should export PivotRow type', () => {
      const row: PivotRow = {
        id: 'row-1',
        measureField: 'Sales.revenue',
        values: { 'Products.name': 'Widget', '2024-01': 100 }
      }
      expect(row.id).toBe('row-1')
    })

    it('should export PivotedTableData type', () => {
      const tableData: PivotedTableData = {
        isPivoted: true,
        columns: [],
        rows: []
      }
      expect(tableData.isPivoted).toBe(true)
    })
  })
})
