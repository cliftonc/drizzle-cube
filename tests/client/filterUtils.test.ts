/**
 * Tests for filterUtils
 * Covers filter application, merging, validation, and universal time filters
 */

import { describe, it, expect } from 'vitest'
import {
  getApplicableDashboardFilters,
  mergeDashboardAndPortletFilters,
  validateFilterForCube,
  validatePortletFilterMapping,
  extractDashboardFields,
  applyUniversalTimeFilters,
  normalizeFilterMapping,
  serializeFilterMapping,
  mappingIncludesFilter,
  getMappingMemberOverride,
  applyMemberOverride
} from '../../src/client/utils/filterUtils'
import type { DashboardFilter, DashboardFilterMapping, CubeMeta, DashboardConfig, Filter, SimpleFilter } from '../../src/client/types'

// Helper to create simple filter
function createSimpleFilter(member: string, values: string[] = ['value1']): SimpleFilter {
  return {
    member,
    operator: 'equals',
    values
  }
}

// Helper to create dashboard filter
function createDashboardFilter(id: string, member: string, values: string[] = ['value1']): DashboardFilter {
  return {
    id,
    label: `Filter ${id}`,
    filter: createSimpleFilter(member, values)
  }
}

describe('filterUtils', () => {
  describe('getApplicableDashboardFilters', () => {
    it('should return empty array when no dashboard filters', () => {
      expect(getApplicableDashboardFilters(undefined, ['filter-1'])).toEqual([])
      expect(getApplicableDashboardFilters([], ['filter-1'])).toEqual([])
    })

    it('should return empty array when no filter mapping', () => {
      const dashboardFilters = [createDashboardFilter('filter-1', 'Sales.category')]
      expect(getApplicableDashboardFilters(dashboardFilters, undefined)).toEqual([])
      expect(getApplicableDashboardFilters(dashboardFilters, [])).toEqual([])
    })

    it('should return filters that match the mapping', () => {
      const dashboardFilters = [
        createDashboardFilter('filter-1', 'Sales.category', ['A']),
        createDashboardFilter('filter-2', 'Sales.region', ['US']),
        createDashboardFilter('filter-3', 'Sales.year', ['2024'])
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter-1', 'filter-3'])

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ member: 'Sales.category', values: ['A'] })
      expect(result[1]).toMatchObject({ member: 'Sales.year', values: ['2024'] })
    })

    it('should exclude filters with empty values', () => {
      const dashboardFilters = [
        createDashboardFilter('filter-1', 'Sales.category', ['A']),
        createDashboardFilter('filter-2', 'Sales.region', []) // Empty values
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter-1', 'filter-2'])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ member: 'Sales.category' })
    })

    it('should include filters with set/notSet operators even without values', () => {
      const dashboardFilters: DashboardFilter[] = [
        {
          id: 'filter-1',
          label: 'Filter 1',
          filter: {
            member: 'Sales.discount',
            operator: 'set',
            values: []
          }
        }
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter-1'])

      expect(result).toHaveLength(1)
    })

    it('should include inDateRange filters with dateRange property', () => {
      const dashboardFilters: DashboardFilter[] = [
        {
          id: 'filter-1',
          label: 'Date Filter',
          filter: {
            member: 'Orders.createdAt',
            operator: 'inDateRange',
            values: [],
            dateRange: ['2024-01-01', '2024-12-31']
          } as SimpleFilter
        }
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter-1'])

      expect(result).toHaveLength(1)
    })
  })

  describe('mergeDashboardAndPortletFilters', () => {
    it('should return portlet filters when no dashboard filters', () => {
      const portletFilters = [createSimpleFilter('Sales.category', ['A'])]
      expect(mergeDashboardAndPortletFilters([], portletFilters)).toEqual(portletFilters)
    })

    it('should return dashboard filters when no portlet filters', () => {
      const dashboardFilters = [createSimpleFilter('Sales.region', ['US'])]
      expect(mergeDashboardAndPortletFilters(dashboardFilters, undefined)).toEqual(dashboardFilters)
      expect(mergeDashboardAndPortletFilters(dashboardFilters, [])).toEqual(dashboardFilters)
    })

    it('should merge both filter sets with AND logic', () => {
      const dashboardFilters = [createSimpleFilter('Sales.region', ['US'])]
      const portletFilters = [createSimpleFilter('Sales.category', ['Electronics'])]
      const result = mergeDashboardAndPortletFilters(dashboardFilters, portletFilters)

      expect(result).toHaveLength(1)
      expect(result![0]).toHaveProperty('and')
      const andGroup = (result![0] as any).and
      expect(andGroup).toHaveLength(2)
    })

    it('should handle group filters correctly', () => {
      const dashboardFilters: Filter[] = [
        {
          type: 'or',
          filters: [
            createSimpleFilter('Sales.region', ['US']),
            createSimpleFilter('Sales.region', ['EU'])
          ]
        }
      ]
      const portletFilters = [createSimpleFilter('Sales.category', ['A'])]
      const result = mergeDashboardAndPortletFilters(dashboardFilters, portletFilters)

      expect(result).toHaveLength(1)
      expect(result![0]).toHaveProperty('and')
    })
  })

  describe('validateFilterForCube', () => {
    const cubeMeta: CubeMeta = {
      cubes: [
        {
          name: 'Sales',
          measures: [
            { name: 'Sales.count', type: 'count' },
            { name: 'Sales.total', type: 'sum' }
          ],
          dimensions: [
            { name: 'Sales.category', type: 'string' },
            { name: 'Sales.region', type: 'string' }
          ]
        },
        {
          name: 'Products',
          measures: [
            { name: 'Products.count', type: 'count' }
          ],
          dimensions: [
            { name: 'Products.name', type: 'string' }
          ]
        }
      ]
    }

    it('should return true when no metadata available', () => {
      const filter = createSimpleFilter('Unknown.field')
      expect(validateFilterForCube(filter, null)).toBe(true)
    })

    it('should return true for valid dimension filter', () => {
      const filter = createSimpleFilter('Sales.category', ['A'])
      expect(validateFilterForCube(filter, cubeMeta)).toBe(true)
    })

    it('should return true for valid measure filter', () => {
      const filter = createSimpleFilter('Sales.count', ['100'])
      expect(validateFilterForCube(filter, cubeMeta)).toBe(true)
    })

    it('should return false for invalid field', () => {
      const filter = createSimpleFilter('Unknown.field', ['A'])
      expect(validateFilterForCube(filter, cubeMeta)).toBe(false)
    })

    it('should handle group filters recursively', () => {
      const filter: Filter = {
        type: 'and',
        filters: [
          createSimpleFilter('Sales.category', ['A']),
          createSimpleFilter('Sales.region', ['US'])
        ]
      }
      expect(validateFilterForCube(filter, cubeMeta)).toBe(true)
    })

    it('should return false when all nested filters are invalid', () => {
      const filter: Filter = {
        type: 'and',
        filters: [
          createSimpleFilter('Unknown.field1', ['A']),
          createSimpleFilter('Unknown.field2', ['B'])
        ]
      }
      expect(validateFilterForCube(filter, cubeMeta)).toBe(false)
    })
  })

  describe('validatePortletFilterMapping', () => {
    const dashboardFilters: DashboardFilter[] = [
      createDashboardFilter('filter-1', 'Sales.category'),
      createDashboardFilter('filter-2', 'Sales.region')
    ]

    const cubeMeta: CubeMeta = {
      cubes: [
        {
          name: 'Sales',
          measures: [],
          dimensions: [
            { name: 'Sales.category', type: 'string' },
            { name: 'Sales.region', type: 'string' }
          ]
        }
      ]
    }

    it('should return valid for empty mapping', () => {
      const result = validatePortletFilterMapping(dashboardFilters, [], cubeMeta)
      expect(result.isValid).toBe(true)
      expect(result.invalidFilterIds).toEqual([])
      expect(result.missingFilterIds).toEqual([])
    })

    it('should return valid for mapping with existing filters', () => {
      const result = validatePortletFilterMapping(dashboardFilters, ['filter-1'], cubeMeta)
      expect(result.isValid).toBe(true)
    })

    it('should return missing filter IDs for non-existent filters', () => {
      const result = validatePortletFilterMapping(dashboardFilters, ['filter-3'], cubeMeta)
      expect(result.isValid).toBe(false)
      expect(result.missingFilterIds).toContain('filter-3')
    })

    it('should return invalid filter IDs when filter field not in schema', () => {
      const filtersWithInvalid: DashboardFilter[] = [
        createDashboardFilter('filter-1', 'Unknown.field')
      ]
      const result = validatePortletFilterMapping(filtersWithInvalid, ['filter-1'], cubeMeta)
      expect(result.isValid).toBe(false)
      expect(result.invalidFilterIds).toContain('filter-1')
    })

    it('should handle when no dashboard filters exist', () => {
      const result = validatePortletFilterMapping(undefined, ['filter-1'], cubeMeta)
      expect(result.isValid).toBe(false)
      expect(result.missingFilterIds).toContain('filter-1')
    })

    it('should validate the effective filter when a member override is set', () => {
      const mapping: DashboardFilterMapping = [{ filterId: 'filter-1', member: 'Sales.region' }]
      const result = validatePortletFilterMapping(dashboardFilters, mapping, cubeMeta)
      expect(result.isValid).toBe(true)
    })

    it('should flag a member override pointing at an unknown field', () => {
      const mapping: DashboardFilterMapping = [{ filterId: 'filter-1', member: 'Unknown.field' }]
      const result = validatePortletFilterMapping(dashboardFilters, mapping, cubeMeta)
      expect(result.isValid).toBe(false)
      expect(result.invalidFilterIds).toContain('filter-1')
    })

    it('should flag a member override set on a group filter', () => {
      const groupDashboardFilters: DashboardFilter[] = [
        {
          id: 'filter-group',
          label: 'Group',
          filter: {
            type: 'and',
            filters: [createSimpleFilter('Sales.category', ['A'])]
          }
        }
      ]
      const mapping: DashboardFilterMapping = [{ filterId: 'filter-group', member: 'Sales.region' }]
      const result = validatePortletFilterMapping(groupDashboardFilters, mapping, cubeMeta)
      expect(result.isValid).toBe(false)
      expect(result.invalidFilterIds).toContain('filter-group')
    })
  })

  describe('filter mapping helpers', () => {
    describe('normalizeFilterMapping', () => {
      it('should return empty array for undefined', () => {
        expect(normalizeFilterMapping(undefined)).toEqual([])
      })

      it('should convert plain strings to entries', () => {
        expect(normalizeFilterMapping(['filter-1', 'filter-2'])).toEqual([
          { filterId: 'filter-1' },
          { filterId: 'filter-2' }
        ])
      })

      it('should pass object entries through and handle mixed mappings', () => {
        const mapping: DashboardFilterMapping = [
          'filter-1',
          { filterId: 'filter-2', member: 'Invoices.customerId' }
        ]
        expect(normalizeFilterMapping(mapping)).toEqual([
          { filterId: 'filter-1' },
          { filterId: 'filter-2', member: 'Invoices.customerId' }
        ])
      })
    })

    describe('serializeFilterMapping', () => {
      it('should collapse entries without overrides to plain strings', () => {
        expect(serializeFilterMapping([
          { filterId: 'filter-1' },
          { filterId: 'filter-2', member: 'Invoices.customerId' }
        ])).toEqual([
          'filter-1',
          { filterId: 'filter-2', member: 'Invoices.customerId' }
        ])
      })

      it('should round-trip a legacy string mapping unchanged', () => {
        const legacy: DashboardFilterMapping = ['filter-1', 'filter-2']
        expect(serializeFilterMapping(normalizeFilterMapping(legacy))).toEqual(legacy)
      })
    })

    describe('mappingIncludesFilter', () => {
      const mapping: DashboardFilterMapping = [
        'filter-1',
        { filterId: 'filter-2', member: 'Invoices.customerId' }
      ]

      it('should match plain string entries', () => {
        expect(mappingIncludesFilter(mapping, 'filter-1')).toBe(true)
      })

      it('should match object entries', () => {
        expect(mappingIncludesFilter(mapping, 'filter-2')).toBe(true)
      })

      it('should return false for absent filters and undefined mapping', () => {
        expect(mappingIncludesFilter(mapping, 'filter-3')).toBe(false)
        expect(mappingIncludesFilter(undefined, 'filter-1')).toBe(false)
      })
    })

    describe('getMappingMemberOverride', () => {
      const mapping: DashboardFilterMapping = [
        'filter-1',
        { filterId: 'filter-2', member: 'Invoices.customerId' },
        { filterId: 'filter-3' }
      ]

      it('should return the override for object entries that have one', () => {
        expect(getMappingMemberOverride(mapping, 'filter-2')).toBe('Invoices.customerId')
      })

      it('should return undefined for string entries, no-override entries, and absent filters', () => {
        expect(getMappingMemberOverride(mapping, 'filter-1')).toBeUndefined()
        expect(getMappingMemberOverride(mapping, 'filter-3')).toBeUndefined()
        expect(getMappingMemberOverride(mapping, 'filter-9')).toBeUndefined()
        expect(getMappingMemberOverride(undefined, 'filter-1')).toBeUndefined()
      })
    })

    describe('applyMemberOverride', () => {
      it('should clone a simple filter with the member rewritten', () => {
        const original = createSimpleFilter('Orders.customerId', ['42'])
        const result = applyMemberOverride(original, 'Invoices.customerId')

        expect(result).toEqual({
          member: 'Invoices.customerId',
          operator: 'equals',
          values: ['42']
        })
        // Original is not mutated
        expect(original.member).toBe('Orders.customerId')
      })

      it('should return the filter unchanged when no override is given', () => {
        const original = createSimpleFilter('Orders.customerId')
        expect(applyMemberOverride(original, undefined)).toBe(original)
      })

      it('should pass group filters through unchanged', () => {
        const group: Filter = {
          type: 'and',
          filters: [createSimpleFilter('Sales.category', ['A'])]
        }
        expect(applyMemberOverride(group, 'Sales.region')).toBe(group)
      })
    })

    describe('getApplicableDashboardFilters with member overrides', () => {
      it('should rewrite the member for entries with an override', () => {
        const dashboardFilters = [
          createDashboardFilter('filter-1', 'Orders.customerId', ['42']),
          createDashboardFilter('filter-2', 'Sales.region', ['US'])
        ]
        const mapping: DashboardFilterMapping = [
          { filterId: 'filter-1', member: 'Invoices.customerId' },
          'filter-2'
        ]

        const result = getApplicableDashboardFilters(dashboardFilters, mapping)

        expect(result).toHaveLength(2)
        expect(result[0]).toMatchObject({ member: 'Invoices.customerId', operator: 'equals', values: ['42'] })
        expect(result[1]).toMatchObject({ member: 'Sales.region', values: ['US'] })
        // The dashboard filter itself is untouched
        expect((dashboardFilters[0].filter as SimpleFilter).member).toBe('Orders.customerId')
      })

      it('should still exclude overridden filters with empty values', () => {
        const dashboardFilters = [createDashboardFilter('filter-1', 'Orders.customerId', [])]
        const mapping: DashboardFilterMapping = [{ filterId: 'filter-1', member: 'Invoices.customerId' }]

        expect(getApplicableDashboardFilters(dashboardFilters, mapping)).toEqual([])
      })
    })

    describe('applyUniversalTimeFilters with mixed mapping shapes', () => {
      it('should apply a mapped universal time filter referenced by an object entry', () => {
        const dashboardFilters: DashboardFilter[] = [
          {
            id: 'time-1',
            label: 'Date Range',
            isUniversalTime: true,
            filter: {
              member: '__universal_time__',
              operator: 'inDateRange',
              values: ['last 30 days']
            }
          }
        ]
        const timeDimensions = [{ dimension: 'Orders.createdAt', granularity: 'month' }]

        const result = applyUniversalTimeFilters(
          dashboardFilters,
          [{ filterId: 'time-1' }],
          timeDimensions
        )

        expect(result).toEqual([
          { dimension: 'Orders.createdAt', granularity: 'month', dateRange: 'last 30 days' }
        ])
      })
    })
  })

  describe('extractDashboardFields', () => {
    it('should extract measures from portlet queries', () => {
      const config: DashboardConfig = {
        portlets: [
          {
            id: 'p1',
            title: 'Portlet 1',
            query: JSON.stringify({ measures: ['Sales.count', 'Sales.total'] }),
            chartType: 'bar',
            x: 0, y: 0, w: 6, h: 4
          }
        ]
      }
      const result = extractDashboardFields(config)
      expect(result.measures.has('Sales.count')).toBe(true)
      expect(result.measures.has('Sales.total')).toBe(true)
    })

    it('should extract dimensions from portlet queries', () => {
      const config: DashboardConfig = {
        portlets: [
          {
            id: 'p1',
            title: 'Portlet 1',
            query: JSON.stringify({ dimensions: ['Products.name', 'Products.category'] }),
            chartType: 'bar',
            x: 0, y: 0, w: 6, h: 4
          }
        ]
      }
      const result = extractDashboardFields(config)
      expect(result.dimensions.has('Products.name')).toBe(true)
      expect(result.dimensions.has('Products.category')).toBe(true)
    })

    it('should extract timeDimensions from portlet queries', () => {
      const config: DashboardConfig = {
        portlets: [
          {
            id: 'p1',
            title: 'Portlet 1',
            query: JSON.stringify({
              timeDimensions: [
                { dimension: 'Orders.createdAt', granularity: 'day' }
              ]
            }),
            chartType: 'bar',
            x: 0, y: 0, w: 6, h: 4
          }
        ]
      }
      const result = extractDashboardFields(config)
      expect(result.timeDimensions.has('Orders.createdAt')).toBe(true)
    })

    it('should extract fields from filters', () => {
      const config: DashboardConfig = {
        portlets: [
          {
            id: 'p1',
            title: 'Portlet 1',
            query: JSON.stringify({
              filters: [
                { member: 'Sales.region', operator: 'equals', values: ['US'] }
              ]
            }),
            chartType: 'bar',
            x: 0, y: 0, w: 6, h: 4
          }
        ]
      }
      const result = extractDashboardFields(config)
      expect(result.dimensions.has('Sales.region')).toBe(true)
    })

    it('should handle invalid JSON gracefully', () => {
      const config: DashboardConfig = {
        portlets: [
          {
            id: 'p1',
            title: 'Portlet 1',
            query: 'invalid-json',
            chartType: 'bar',
            x: 0, y: 0, w: 6, h: 4
          }
        ]
      }
      // Should not throw
      const result = extractDashboardFields(config)
      expect(result.measures.size).toBe(0)
    })

    it('should deduplicate fields across multiple portlets', () => {
      const config: DashboardConfig = {
        portlets: [
          {
            id: 'p1',
            title: 'Portlet 1',
            query: JSON.stringify({ measures: ['Sales.count'] }),
            chartType: 'bar',
            x: 0, y: 0, w: 6, h: 4
          },
          {
            id: 'p2',
            title: 'Portlet 2',
            query: JSON.stringify({ measures: ['Sales.count', 'Sales.total'] }),
            chartType: 'line',
            x: 6, y: 0, w: 6, h: 4
          }
        ]
      }
      const result = extractDashboardFields(config)
      expect(result.measures.size).toBe(2) // count and total, not 3
    })
  })

  describe('applyUniversalTimeFilters', () => {
    it('should return undefined when no time dimensions', () => {
      const result = applyUniversalTimeFilters([], [], undefined)
      expect(result).toBeUndefined()
    })

    it('should return time dimensions as-is when no filter mapping', () => {
      const timeDimensions = [{ dimension: 'Orders.createdAt', granularity: 'day' }]
      const result = applyUniversalTimeFilters([], undefined, timeDimensions)
      expect(result).toEqual(timeDimensions)
    })

    it('should return time dimensions as-is when no universal time filters', () => {
      const dashboardFilters: DashboardFilter[] = [
        createDashboardFilter('filter-1', 'Sales.category') // Not a universal time filter
      ]
      const timeDimensions = [{ dimension: 'Orders.createdAt', granularity: 'day' }]
      const result = applyUniversalTimeFilters(dashboardFilters, ['filter-1'], timeDimensions)
      expect(result).toEqual(timeDimensions)
    })

    it('should apply dateRange from universal time filter', () => {
      const dashboardFilters: DashboardFilter[] = [
        {
          id: 'time-filter',
          label: 'Date Range',
          isUniversalTime: true,
          filter: {
            member: 'Orders.createdAt',
            operator: 'inDateRange',
            values: ['2024-01-01', '2024-12-31']
          }
        }
      ]
      const timeDimensions = [
        { dimension: 'Orders.createdAt', granularity: 'day' },
        { dimension: 'Shipments.shippedAt', granularity: 'month' }
      ]
      const result = applyUniversalTimeFilters(dashboardFilters, ['time-filter'], timeDimensions)

      expect(result).toHaveLength(2)
      expect(result![0].dateRange).toEqual(['2024-01-01', '2024-12-31'])
      expect(result![1].dateRange).toEqual(['2024-01-01', '2024-12-31'])
    })

    it('should handle preset date ranges (single string value)', () => {
      const dashboardFilters: DashboardFilter[] = [
        {
          id: 'time-filter',
          label: 'Date Range',
          isUniversalTime: true,
          filter: {
            member: 'Orders.createdAt',
            operator: 'inDateRange',
            values: ['this quarter']
          }
        }
      ]
      const timeDimensions = [{ dimension: 'Orders.createdAt', granularity: 'day' }]
      const result = applyUniversalTimeFilters(dashboardFilters, ['time-filter'], timeDimensions)

      expect(result![0].dateRange).toBe('this quarter')
    })

    it('should only apply filters in the mapping', () => {
      const dashboardFilters: DashboardFilter[] = [
        {
          id: 'time-filter-1',
          label: 'Date Range 1',
          isUniversalTime: true,
          filter: {
            member: 'Orders.createdAt',
            operator: 'inDateRange',
            values: ['2024-01-01', '2024-06-30']
          }
        },
        {
          id: 'time-filter-2',
          label: 'Date Range 2',
          isUniversalTime: true,
          filter: {
            member: 'Orders.createdAt',
            operator: 'inDateRange',
            values: ['2024-07-01', '2024-12-31']
          }
        }
      ]
      const timeDimensions = [{ dimension: 'Orders.createdAt', granularity: 'day' }]
      const result = applyUniversalTimeFilters(dashboardFilters, ['time-filter-2'], timeDimensions)

      expect(result![0].dateRange).toEqual(['2024-07-01', '2024-12-31'])
    })
  })
})
