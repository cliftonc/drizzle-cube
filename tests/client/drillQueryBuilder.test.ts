/**
 * Tests for drill-down query builder utilities
 * Covers buildDrillOptions, buildDrillQuery, and helper functions
 */

import { describe, it, expect } from 'vitest'
import {
  buildDrillOptions,
  buildDrillQuery,
  isTimeDimension,
  getTimeDimensionGranularities,
  getCurrentGranularity,
  getMeasureDrillMembers,
  findHierarchyForDimension
} from '../../src/client/utils/drillQueryBuilder'
import type { CubeMeta, CubeQuery } from '../../src/client/types'
import type { ChartDataPointClickEvent, DrillOption } from '../../src/client/types/drill'

// Helper to create a click event
function createClickEvent(
  clickedField: string,
  xValue: unknown,
  dataPoint: Record<string, unknown> = {}
): ChartDataPointClickEvent {
  return {
    dataPoint: { ...dataPoint, [clickedField]: 100 },
    clickedField,
    xValue,
    position: { x: 100, y: 100 }
  }
}

// Create test metadata with hierarchies and drillMembers
function createTestMeta(): CubeMeta {
  return {
    cubes: [
      {
        name: 'Sales',
        title: 'Sales',
        segments: [],
        measures: [
          {
            name: 'Sales.revenue',
            type: 'sum',
            title: 'Revenue',
            shortTitle: 'Revenue',
            drillMembers: ['Sales.orderId', 'Sales.productName', 'Sales.customerName']
          },
          {
            name: 'Sales.count',
            type: 'count',
            title: 'Order Count',
            shortTitle: 'Count'
            // No drillMembers
          },
          {
            name: 'Sales.totalOrders',
            type: 'count',
            title: 'Total Orders',
            shortTitle: 'Orders',
            // drillMembers includes a time dimension
            drillMembers: ['Sales.orderDate', 'Sales.orderId']
          }
        ],
        dimensions: [
          { name: 'Sales.category', type: 'string', title: 'Category', shortTitle: 'Category' },
          { name: 'Sales.subcategory', type: 'string', title: 'Subcategory', shortTitle: 'Subcategory' },
          { name: 'Sales.product', type: 'string', title: 'Product', shortTitle: 'Product' },
          { name: 'Sales.region', type: 'string', title: 'Region', shortTitle: 'Region' },
          { name: 'Sales.country', type: 'string', title: 'Country', shortTitle: 'Country' },
          { name: 'Sales.city', type: 'string', title: 'City', shortTitle: 'City' },
          {
            name: 'Sales.orderDate',
            type: 'time',
            title: 'Order Date',
            shortTitle: 'Date',
            granularities: ['year', 'quarter', 'month', 'week', 'day']
          },
          { name: 'Sales.orderId', type: 'string', title: 'Order ID', shortTitle: 'ID' },
          { name: 'Sales.productName', type: 'string', title: 'Product Name', shortTitle: 'Product' },
          { name: 'Sales.customerName', type: 'string', title: 'Customer Name', shortTitle: 'Customer' }
        ],
        hierarchies: [
          {
            name: 'product',
            title: 'Product Hierarchy',
            levels: ['Sales.category', 'Sales.subcategory', 'Sales.product'],
            cubeName: 'Sales'
          },
          {
            name: 'location',
            title: 'Location Hierarchy',
            levels: ['Sales.region', 'Sales.country', 'Sales.city'],
            cubeName: 'Sales'
          }
        ]
      }
    ]
  }
}

// Simpler metadata for testing helper functions
function createSimpleMeta(): CubeMeta {
  return {
    cubes: [
      {
        name: 'Orders',
        title: 'Orders',
        segments: [],
        measures: [],
        dimensions: [
          { name: 'Orders.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' }
        ]
      }
    ]
  }
}

describe('drillQueryBuilder', () => {
  describe('isTimeDimension', () => {
    const meta = createTestMeta()

    it('should return true for time dimensions', () => {
      expect(isTimeDimension('Sales.orderDate', meta)).toBe(true)
    })

    it('should return false for non-time dimensions', () => {
      expect(isTimeDimension('Sales.category', meta)).toBe(false)
      expect(isTimeDimension('Sales.region', meta)).toBe(false)
    })

    it('should return false for non-existent dimensions', () => {
      expect(isTimeDimension('Sales.nonExistent', meta)).toBe(false)
    })
  })

  describe('getTimeDimensionGranularities', () => {
    const meta = createTestMeta()

    it('should return granularities from metadata', () => {
      const granularities = getTimeDimensionGranularities('Sales.orderDate', meta)
      expect(granularities).toEqual(['year', 'quarter', 'month', 'week', 'day'])
    })

    it('should return default granularities for dimensions without explicit granularities', () => {
      const metaNoGran = createSimpleMeta()
      const granularities = getTimeDimensionGranularities('Orders.createdAt', metaNoGran)
      expect(granularities).toEqual(['year', 'quarter', 'month', 'week', 'day', 'hour'])
    })
  })

  describe('getCurrentGranularity', () => {
    it('should return granularity from query', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        timeDimensions: [{ dimension: 'Sales.orderDate', granularity: 'month' }]
      }
      expect(getCurrentGranularity(query)).toBe('month')
    })

    it('should return null when no time dimensions', () => {
      const query: CubeQuery = { measures: ['Sales.revenue'] }
      expect(getCurrentGranularity(query)).toBeNull()
    })

    it('should return null when no granularity set', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        timeDimensions: [{ dimension: 'Sales.orderDate' }]
      }
      expect(getCurrentGranularity(query)).toBeNull()
    })
  })

  describe('getMeasureDrillMembers', () => {
    const meta = createTestMeta()

    it('should return drillMembers for measures that have them', () => {
      const drillMembers = getMeasureDrillMembers('Sales.revenue', meta)
      expect(drillMembers).toEqual(['Sales.orderId', 'Sales.productName', 'Sales.customerName'])
    })

    it('should return null for measures without drillMembers', () => {
      expect(getMeasureDrillMembers('Sales.count', meta)).toBeNull()
    })

    it('should return null for non-existent measures', () => {
      expect(getMeasureDrillMembers('Sales.nonExistent', meta)).toBeNull()
    })
  })

  describe('findHierarchyForDimension', () => {
    const meta = createTestMeta()

    it('should find hierarchy for dimension at first level', () => {
      const result = findHierarchyForDimension('Sales.category', meta)
      expect(result).not.toBeNull()
      expect(result!.hierarchy.name).toBe('product')
      expect(result!.levelIndex).toBe(0)
    })

    it('should find hierarchy for dimension at middle level', () => {
      const result = findHierarchyForDimension('Sales.subcategory', meta)
      expect(result).not.toBeNull()
      expect(result!.hierarchy.name).toBe('product')
      expect(result!.levelIndex).toBe(1)
    })

    it('should find hierarchy for dimension at last level', () => {
      const result = findHierarchyForDimension('Sales.product', meta)
      expect(result).not.toBeNull()
      expect(result!.hierarchy.name).toBe('product')
      expect(result!.levelIndex).toBe(2)
    })

    it('should find correct hierarchy for location dimensions', () => {
      const result = findHierarchyForDimension('Sales.country', meta)
      expect(result).not.toBeNull()
      expect(result!.hierarchy.name).toBe('location')
      expect(result!.levelIndex).toBe(1)
    })

    it('should return null for dimensions not in any hierarchy', () => {
      expect(findHierarchyForDimension('Sales.orderId', meta)).toBeNull()
    })
  })

  describe('buildDrillOptions', () => {
    const meta = createTestMeta()

    it('should return empty array when no metadata', () => {
      const query: CubeQuery = { measures: ['Sales.revenue'] }
      const event = createClickEvent('Sales.revenue', '2024-01')
      expect(buildDrillOptions(event, query, null)).toEqual([])
    })

    it('should return time drill options for queries with time dimensions', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        timeDimensions: [{ dimension: 'Sales.orderDate', granularity: 'month' }]
      }
      const event = createClickEvent('Sales.revenue', '2024-01')
      const options = buildDrillOptions(event, query, meta)

      // Should have drill down options (week, day) and drill up options (quarter, year)
      const drillDownOptions = options.filter(o => o.type === 'drillDown' && o.icon === 'time')
      const drillUpOptions = options.filter(o => o.type === 'drillUp' && o.icon === 'time')

      expect(drillDownOptions.length).toBeGreaterThan(0)
      expect(drillUpOptions.length).toBeGreaterThan(0)

      // Verify granularity targets
      expect(drillDownOptions.some(o => o.targetGranularity === 'week')).toBe(true)
      expect(drillDownOptions.some(o => o.targetGranularity === 'day')).toBe(true)
      expect(drillUpOptions.some(o => o.targetGranularity === 'quarter')).toBe(true)
      expect(drillUpOptions.some(o => o.targetGranularity === 'year')).toBe(true)
    })

    it('should return hierarchy drill options for dimensions in hierarchies', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        dimensions: ['Sales.category']
      }
      const event = createClickEvent('Sales.revenue', 'Electronics')
      const options = buildDrillOptions(event, query, meta)

      // Should have drill down to subcategory
      const hierarchyOptions = options.filter(o => o.icon === 'hierarchy')
      expect(hierarchyOptions.length).toBeGreaterThan(0)

      const drillDownOption = hierarchyOptions.find(o => o.type === 'drillDown')
      expect(drillDownOption).toBeDefined()
      expect(drillDownOption!.targetDimension).toBe('Sales.subcategory')
    })

    it('should return drill up options for dimensions not at top of hierarchy', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        dimensions: ['Sales.subcategory']
      }
      const event = createClickEvent('Sales.revenue', 'Phones')
      const options = buildDrillOptions(event, query, meta)

      const hierarchyOptions = options.filter(o => o.icon === 'hierarchy')
      const drillUpOption = hierarchyOptions.find(o => o.type === 'drillUp')
      expect(drillUpOption).toBeDefined()
      expect(drillUpOption!.targetDimension).toBe('Sales.category')
    })

    it('should return details options for each drillMember when measure has drillMembers', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        dimensions: ['Sales.category']
      }
      const event = createClickEvent('Sales.revenue', 'Electronics')
      const options = buildDrillOptions(event, query, meta)

      // Should have one option per drillMember
      const detailsOptions = options.filter(o => o.type === 'details')
      expect(detailsOptions.length).toBe(3) // Sales.revenue has 3 drillMembers

      // Check each option has proper structure
      expect(detailsOptions[0].icon).toBe('table')
      expect(detailsOptions[0].label).toBe('Show by Order ID')
      expect(detailsOptions[0].targetDimension).toBe('Sales.orderId')

      expect(detailsOptions[1].label).toBe('Show by Product Name')
      expect(detailsOptions[1].targetDimension).toBe('Sales.productName')

      expect(detailsOptions[2].label).toBe('Show by Customer Name')
      expect(detailsOptions[2].targetDimension).toBe('Sales.customerName')
    })

    it('should not return details option when measure has no drillMembers', () => {
      const query: CubeQuery = {
        measures: ['Sales.count'],
        dimensions: ['Sales.category']
      }
      const event = createClickEvent('Sales.count', 'Electronics')
      const options = buildDrillOptions(event, query, meta)

      const detailsOption = options.find(o => o.type === 'details')
      expect(detailsOption).toBeUndefined()
    })

    it('should return "View by X" options when time dimension has no granularity set', () => {
      const query: CubeQuery = {
        measures: ['Sales.revenue'],
        timeDimensions: [{ dimension: 'Sales.orderDate' }] // No granularity
      }
      const event = createClickEvent('Sales.revenue', '2024-01-15')
      const options = buildDrillOptions(event, query, meta)

      // Should have "View by" options for all available granularities
      const timeOptions = options.filter(o => o.icon === 'time')
      expect(timeOptions.length).toBeGreaterThan(0)

      // All should be drillDown type with "View by" labels
      expect(timeOptions.every(o => o.type === 'drillDown')).toBe(true)
      expect(timeOptions.some(o => o.label === 'View by Year')).toBe(true)
      expect(timeOptions.some(o => o.label === 'View by Month')).toBe(true)
      expect(timeOptions.some(o => o.label === 'View by Day')).toBe(true)

      // Should not have drill up options (nothing to roll up from)
      const drillUpOptions = timeOptions.filter(o => o.type === 'drillUp')
      expect(drillUpOptions.length).toBe(0)
    })

  })

  describe('buildDrillQuery', () => {
    const meta = createTestMeta()

    describe('time drill down', () => {
      it('should change granularity and add date range filter', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          timeDimensions: [{ dimension: 'Sales.orderDate', granularity: 'month' }]
        }
        const option: DrillOption = {
          id: 'time-down-week',
          label: 'Drill to Week',
          type: 'drillDown',
          icon: 'time',
          targetGranularity: 'week',
          scope: 'portlet'
        }
        const event = createClickEvent('Sales.revenue', '2024-01-15')

        const result = buildDrillQuery(option, event, query, meta)

        expect(result.query.timeDimensions![0].granularity).toBe('week')
        expect(result.pathEntry.granularity).toBe('week')
        expect(result.pathEntry.label).toBe('2024-01-15')
      })
    })

    describe('time drill up', () => {
      it('should change granularity to less granular level', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          timeDimensions: [{ dimension: 'Sales.orderDate', granularity: 'day' }]
        }
        const option: DrillOption = {
          id: 'time-up-month',
          label: 'Roll up to Month',
          type: 'drillUp',
          icon: 'time',
          targetGranularity: 'month',
          scope: 'portlet'
        }
        const event = createClickEvent('Sales.revenue', '2024-01-15')

        const result = buildDrillQuery(option, event, query, meta)

        expect(result.query.timeDimensions![0].granularity).toBe('month')
        expect(result.pathEntry.granularity).toBe('month')
      })
    })

    describe('hierarchy drill down', () => {
      it('should replace dimension with next level and add filter', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          dimensions: ['Sales.category']
        }
        const option: DrillOption = {
          id: 'hierarchy-down-product',
          label: 'Drill to Subcategory',
          type: 'drillDown',
          icon: 'hierarchy',
          hierarchy: 'product',
          targetDimension: 'Sales.subcategory',
          scope: 'portlet'
        }
        const event = createClickEvent('Sales.revenue', 'Electronics')

        const result = buildDrillQuery(option, event, query, meta)

        expect(result.query.dimensions).toContain('Sales.subcategory')
        expect(result.query.filters).toHaveLength(1)
        expect(result.query.filters![0]).toMatchObject({
          member: 'Sales.category',
          operator: 'equals',
          values: ['Electronics']
        })
        expect(result.pathEntry.dimension).toBe('Sales.subcategory')
        expect(result.pathEntry.clickedValue).toBe('Electronics')
      })
    })

    describe('hierarchy drill up', () => {
      it('should replace dimension with previous level', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          dimensions: ['Sales.subcategory'],
          filters: [{ member: 'Sales.category', operator: 'equals', values: ['Electronics'] }]
        }
        const option: DrillOption = {
          id: 'hierarchy-up-product',
          label: 'Roll up to Category',
          type: 'drillUp',
          icon: 'hierarchy',
          hierarchy: 'product',
          targetDimension: 'Sales.category',
          scope: 'portlet'
        }
        const event = createClickEvent('Sales.revenue', 'Phones')

        const result = buildDrillQuery(option, event, query, meta)

        expect(result.query.dimensions).toContain('Sales.category')
        expect(result.query.dimensions).not.toContain('Sales.subcategory')
        expect(result.pathEntry.dimension).toBe('Sales.category')
      })
    })

    describe('details drill', () => {
      it('should create query with selected drillMember as dimension', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          dimensions: ['Sales.category']
        }
        const option: DrillOption = {
          id: 'details-revenue-Sales.productName',
          label: 'Show by Product Name',
          type: 'details',
          icon: 'table',
          scope: 'portlet',
          measure: 'Sales.revenue',
          targetDimension: 'Sales.productName' // User selected this drillMember
        }
        const event = createClickEvent('Sales.revenue', 'Electronics')

        const result = buildDrillQuery(option, event, query, meta)

        expect(result.query.measures).toEqual(['Sales.revenue'])
        expect(result.query.dimensions).toEqual(['Sales.productName']) // Only selected dimension
        expect(result.query.limit).toBe(100)

        // Should have filter for clicked value
        const categoryFilter = result.query.filters!.find(f =>
          'member' in f && f.member === 'Sales.category'
        )
        expect(categoryFilter).toBeDefined()
      })

      it('should throw error when no targetDimension specified', () => {
        const query: CubeQuery = {
          measures: ['Sales.count'],
          dimensions: ['Sales.category']
        }
        const option: DrillOption = {
          id: 'details-count',
          label: 'Show Details',
          type: 'details',
          icon: 'table',
          scope: 'portlet',
          measure: 'Sales.count'
          // No targetDimension specified
        }
        const event = createClickEvent('Sales.count', 'Electronics')

        expect(() => buildDrillQuery(option, event, query, meta)).toThrow('No targetDimension specified')
      })

      it('should generate chartConfig mapping selected dimension to xAxis', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          dimensions: ['Sales.category']
        }
        const option: DrillOption = {
          id: 'details-revenue-Sales.customerName',
          label: 'Show by Customer Name',
          type: 'details',
          icon: 'table',
          scope: 'portlet',
          measure: 'Sales.revenue',
          targetDimension: 'Sales.customerName'
        }
        const event = createClickEvent('Sales.revenue', 'Electronics')

        const result = buildDrillQuery(option, event, query, meta)

        // Should have chartConfig with selected dimension as xAxis
        expect(result.chartConfig).toBeDefined()
        expect(result.chartConfig!.xAxis).toEqual(['Sales.customerName']) // Selected dimension as xAxis
        expect(result.chartConfig!.yAxis).toEqual(['Sales.revenue']) // Measure as yAxis

        // pathEntry should also contain chartConfig
        expect(result.pathEntry.chartConfig).toBeDefined()
        expect(result.pathEntry.chartConfig).toEqual(result.chartConfig)
      })

      it('should place time dimension drillMember in timeDimensions, not dimensions', () => {
        const query: CubeQuery = {
          measures: ['Sales.totalOrders'],
          dimensions: ['Sales.category']
        }
        const option: DrillOption = {
          id: 'details-totalOrders-Sales.orderDate',
          label: 'Show by Order Date',
          type: 'details',
          icon: 'table',
          scope: 'portlet',
          measure: 'Sales.totalOrders',
          targetDimension: 'Sales.orderDate' // This is a time dimension
        }
        const event = createClickEvent('Sales.totalOrders', 'Electronics')

        const result = buildDrillQuery(option, event, query, meta)

        // Time dimension should go in timeDimensions, not dimensions
        expect(result.query.dimensions).toEqual([])
        expect(result.query.timeDimensions).toBeDefined()
        expect(result.query.timeDimensions!.length).toBe(1)
        expect(result.query.timeDimensions![0].dimension).toBe('Sales.orderDate')
        expect(result.query.timeDimensions![0].granularity).toBe('day') // Default granularity
      })

      it('should preserve dateRange from original query when drilling to time dimension', () => {
        const query: CubeQuery = {
          measures: ['Sales.totalOrders'],
          dimensions: ['Sales.category'],
          timeDimensions: [{
            dimension: 'Sales.orderDate',
            granularity: 'month',
            dateRange: ['2024-01-01', '2024-12-31'] // Dashboard filter dateRange
          }]
        }
        const option: DrillOption = {
          id: 'details-totalOrders-Sales.orderDate',
          label: 'Show by Order Date',
          type: 'details',
          icon: 'table',
          scope: 'portlet',
          measure: 'Sales.totalOrders',
          targetDimension: 'Sales.orderDate'
        }
        const event = createClickEvent('Sales.totalOrders', 'Electronics')

        const result = buildDrillQuery(option, event, query, meta)

        // Should preserve dateRange from original query
        expect(result.query.timeDimensions![0].dateRange).toEqual(['2024-01-01', '2024-12-31'])
        // Should use original granularity
        expect(result.query.timeDimensions![0].granularity).toBe('month')
      })

      it('should preserve existing timeDimensions when drilling to non-time dimension', () => {
        const query: CubeQuery = {
          measures: ['Sales.revenue'],
          dimensions: ['Sales.category'],
          timeDimensions: [{
            dimension: 'Sales.orderDate',
            granularity: 'month',
            dateRange: ['2024-01-01', '2024-06-30']
          }]
        }
        const option: DrillOption = {
          id: 'details-revenue-Sales.productName',
          label: 'Show by Product Name',
          type: 'details',
          icon: 'table',
          scope: 'portlet',
          measure: 'Sales.revenue',
          targetDimension: 'Sales.productName' // Non-time dimension
        }
        const event = createClickEvent('Sales.revenue', 'Electronics')

        const result = buildDrillQuery(option, event, query, meta)

        // Non-time dimension goes in dimensions
        expect(result.query.dimensions).toEqual(['Sales.productName'])

        // Original timeDimensions should be preserved
        expect(result.query.timeDimensions).toBeDefined()
        expect(result.query.timeDimensions!.length).toBe(1)
        expect(result.query.timeDimensions![0].dimension).toBe('Sales.orderDate')
        expect(result.query.timeDimensions![0].granularity).toBe('month')
        expect(result.query.timeDimensions![0].dateRange).toEqual(['2024-01-01', '2024-06-30'])
      })
    })
  })
})
