import { describe, it, expect } from 'vitest'
import {
  hasTimeDimensionForPivot,
  pivotTableData,
  getMeasureType
} from '../../src/client/utils/pivotUtils'
import type { CubeMeta } from '../../src/client/hooks/useCubeMeta'

describe('pivotUtils', () => {
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
      // Should have: Product dimension, 2024-01, 2024-02 (NO Measure column for single measure)
      expect(result.columns).toHaveLength(3)
      expect(result.columns[0].key).toBe('Products.name')
      expect(result.columns[0].isMeasureColumn).toBeFalsy()
      expect(result.columns[1].key).toBe('2024-01')
      expect(result.columns[1].isTimeColumn).toBe(true)
      expect(result.columns[2].key).toBe('2024-02')

      expect(result.rows).toHaveLength(2) // Widget, Gadget

      // Check Widget row
      const widgetRow = result.rows.find(r => r.values['Products.name'] === 'Widget')
      expect(widgetRow?.values['2024-01']).toBe(100)
      expect(widgetRow?.values['2024-02']).toBe(150)

      // Check Gadget row - missing 2024-02 should be null
      const gadgetRow = result.rows.find(r => r.values['Products.name'] === 'Gadget')
      expect(gadgetRow?.values['2024-01']).toBe(50)
      expect(gadgetRow?.values['2024-02']).toBeNull()
    })

    it('should pivot data with multiple measures (Measure column first, grouped by measure)', () => {
      const data = [
        { 'Products.name': 'Widget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100, 'Sales.quantity': 10 },
        { 'Products.name': 'Widget', 'Sales.date': '2024-02-01T00:00:00.000Z', 'Sales.revenue': 150, 'Sales.quantity': 15 },
        { 'Products.name': 'Gadget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 50, 'Sales.quantity': 5 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue', 'Sales.quantity']
      }, mockGetFieldLabel)

      expect(result.isPivoted).toBe(true)
      // Should have: __measure__, Product, 2024-01, 2024-02
      expect(result.columns).toHaveLength(4)

      // First column should be Measure
      expect(result.columns[0].key).toBe('__measure__')
      expect(result.columns[0].label).toBe('Measure')
      expect(result.columns[0].isMeasureColumn).toBe(true)

      // Second column should be dimension
      expect(result.columns[1].key).toBe('Products.name')

      // Rows: 4 rows (2 measures x 2 products), grouped by measure
      // Order: Revenue-Widget, Revenue-Gadget, Quantity-Widget, Quantity-Gadget
      expect(result.rows).toHaveLength(4)

      // Revenue rows should come first (grouped together)
      expect(result.rows[0].measureField).toBe('Sales.revenue')
      expect(result.rows[0].values['Products.name']).toBe('Widget')
      expect(result.rows[0].isFirstInGroup).toBe(true)
      expect(result.rows[0].dimensionRowSpan).toBe(2) // Spans 2 product rows

      expect(result.rows[1].measureField).toBe('Sales.revenue')
      expect(result.rows[1].values['Products.name']).toBe('Gadget')
      expect(result.rows[1].isFirstInGroup).toBe(false)

      // Quantity rows should come second (grouped together)
      expect(result.rows[2].measureField).toBe('Sales.quantity')
      expect(result.rows[2].values['Products.name']).toBe('Widget')
      expect(result.rows[2].isFirstInGroup).toBe(true)
      expect(result.rows[2].dimensionRowSpan).toBe(2)

      expect(result.rows[3].measureField).toBe('Sales.quantity')
      expect(result.rows[3].values['Products.name']).toBe('Gadget')
      expect(result.rows[3].isFirstInGroup).toBe(false)
    })

    it('should group all rows for each measure together with correct row spanning', () => {
      const data = [
        { 'Products.name': 'Widget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100, 'Sales.quantity': 10, 'Sales.orders': 5 },
        { 'Products.name': 'Gadget', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 50, 'Sales.quantity': 5, 'Sales.orders': 2 },
        { 'Products.name': 'Sprocket', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 75, 'Sales.quantity': 8, 'Sales.orders': 3 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name'],
        measures: ['Sales.revenue', 'Sales.quantity', 'Sales.orders']
      }, mockGetFieldLabel)

      // Should have 9 rows: 3 measures x 3 products
      expect(result.rows).toHaveLength(9)

      // Revenue rows (first 3)
      const revenueRows = result.rows.slice(0, 3)
      expect(revenueRows.every(r => r.measureField === 'Sales.revenue')).toBe(true)
      expect(revenueRows[0].isFirstInGroup).toBe(true)
      expect(revenueRows[0].dimensionRowSpan).toBe(3) // Spans 3 product rows
      expect(revenueRows[1].isFirstInGroup).toBe(false)
      expect(revenueRows[2].isFirstInGroup).toBe(false)

      // Quantity rows (next 3)
      const quantityRows = result.rows.slice(3, 6)
      expect(quantityRows.every(r => r.measureField === 'Sales.quantity')).toBe(true)
      expect(quantityRows[0].isFirstInGroup).toBe(true)
      expect(quantityRows[0].dimensionRowSpan).toBe(3)

      // Orders rows (last 3)
      const ordersRows = result.rows.slice(6, 9)
      expect(ordersRows.every(r => r.measureField === 'Sales.orders')).toBe(true)
      expect(ordersRows[0].isFirstInGroup).toBe(true)
      expect(ordersRows[0].dimensionRowSpan).toBe(3)
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
      // Should have: 2024-01, 2024-02 (no dimension column, no measure column)
      expect(result.columns).toHaveLength(2)
      expect(result.columns[0].key).toBe('2024-01')
      expect(result.columns[1].key).toBe('2024-02')

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].values['2024-01']).toBe(100)
      expect(result.rows[0].values['2024-02']).toBe(150)
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

    it('should format time columns based on granularity', () => {
      // Test year granularity
      const yearData = [
        { 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const yearResult = pivotTableData(yearData, {
        timeDimension: 'Sales.date',
        granularity: 'year',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(yearResult.columns[0].key).toBe('2024')

      // Test quarter granularity
      const quarterData = [
        { 'Sales.date': '2024-04-01T00:00:00.000Z', 'Sales.revenue': 100 }
      ]

      const quarterResult = pivotTableData(quarterData, {
        timeDimension: 'Sales.date',
        granularity: 'quarter',
        dimensions: [],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      expect(quarterResult.columns[0].key).toBe('2024-Q2')
    })

    it('should handle multiple dimensions', () => {
      const data = [
        { 'Products.name': 'Widget', 'Employees.name': 'John', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 100 },
        { 'Products.name': 'Widget', 'Employees.name': 'Jane', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 75 },
        { 'Products.name': 'Gadget', 'Employees.name': 'John', 'Sales.date': '2024-01-01T00:00:00.000Z', 'Sales.revenue': 50 }
      ]

      const result = pivotTableData(data, {
        timeDimension: 'Sales.date',
        granularity: 'month',
        dimensions: ['Products.name', 'Employees.name'],
        measures: ['Sales.revenue']
      }, mockGetFieldLabel)

      // Should have: Product, Employee, 2024-01
      expect(result.columns).toHaveLength(3)
      expect(result.columns[0].key).toBe('Products.name')
      expect(result.columns[1].key).toBe('Employees.name')

      // Should have 3 rows (Widget-John, Widget-Jane, Gadget-John)
      expect(result.rows).toHaveLength(3)

      const widgetJohnRow = result.rows.find(
        r => r.values['Products.name'] === 'Widget' && r.values['Employees.name'] === 'John'
      )
      expect(widgetJohnRow?.values['2024-01']).toBe(100)
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
        }
      ]
    }

    it('should return measure type from metadata', () => {
      expect(getMeasureType('Sales.count', mockMeta)).toBe('count')
      expect(getMeasureType('Sales.revenue', mockMeta)).toBe('sum')
      expect(getMeasureType('Sales.avgPrice', mockMeta)).toBe('avg')
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
  })
})
