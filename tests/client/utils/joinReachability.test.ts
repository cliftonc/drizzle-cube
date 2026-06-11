/**
 * Tests for joinReachability
 * Covers BFS over cube relationships, per-mode cube extraction from portlets,
 * and reachable dimension option generation for filter field mapping
 */

import { describe, it, expect } from 'vitest'
import {
  getReachableCubes,
  getPortletQueryCubes,
  getReachableDimensionOptions
} from '../../../src/client/utils/joinReachability'
import type { CubeMeta, PortletConfig } from '../../../src/client/types'

// Orders ↔ Customers ↔ Invoices joined via Customers; Standalone is disconnected.
// Relationships are declared one-way (belongsTo from the fact side) to verify
// the BFS treats them as undirected.
const meta: CubeMeta = {
  cubes: [
    {
      name: 'Orders',
      title: 'Orders',
      measures: [{ name: 'Orders.count', title: 'Count', shortTitle: 'Count', type: 'count' }],
      dimensions: [
        { name: 'Orders.customerId', title: 'Customer ID', shortTitle: 'Cust ID', type: 'string' },
        { name: 'Orders.createdAt', title: 'Created At', shortTitle: 'Created', type: 'time' }
      ],
      segments: [],
      relationships: [{ targetCube: 'Customers', relationship: 'belongsTo' }]
    },
    {
      name: 'Customers',
      title: 'Customers',
      measures: [],
      dimensions: [
        { name: 'Customers.name', title: 'Name', shortTitle: 'Name', type: 'string' },
        { name: 'Customers.age', title: 'Age', shortTitle: 'Age', type: 'number' }
      ],
      segments: []
    },
    {
      name: 'Invoices',
      title: 'Invoices',
      measures: [{ name: 'Invoices.total', title: 'Total', shortTitle: 'Total', type: 'sum' }],
      dimensions: [
        { name: 'Invoices.customerId', title: 'Customer ID', shortTitle: 'Cust ID', type: 'string' }
      ],
      segments: [],
      relationships: [{ targetCube: 'Customers', relationship: 'belongsTo' }]
    },
    {
      name: 'Standalone',
      title: 'Standalone',
      measures: [],
      dimensions: [
        { name: 'Standalone.field', title: 'Field', shortTitle: 'Field', type: 'string' }
      ],
      segments: []
    }
  ]
}

function createPortlet(query: object): PortletConfig {
  return {
    id: 'p1',
    title: 'Portlet',
    query: JSON.stringify(query),
    chartType: 'bar',
    w: 6,
    h: 4,
    x: 0,
    y: 0
  } as PortletConfig
}

describe('joinReachability', () => {
  describe('getReachableCubes', () => {
    it('should include the start cubes themselves', () => {
      const reachable = getReachableCubes(meta, ['Standalone'])
      expect(reachable).toEqual(new Set(['Standalone']))
    })

    it('should traverse relationships in the declared direction', () => {
      const reachable = getReachableCubes(meta, ['Orders'])
      expect(reachable.has('Customers')).toBe(true)
    })

    it('should traverse relationships bidirectionally (reverse edges)', () => {
      // Customers declares no relationships of its own; both edges point at it
      const reachable = getReachableCubes(meta, ['Customers'])
      expect(reachable.has('Orders')).toBe(true)
      expect(reachable.has('Invoices')).toBe(true)
    })

    it('should reach transitively across intermediate cubes', () => {
      const reachable = getReachableCubes(meta, ['Orders'])
      expect(reachable.has('Invoices')).toBe(true) // Orders → Customers → Invoices
    })

    it('should not reach disconnected cubes', () => {
      const reachable = getReachableCubes(meta, ['Orders'])
      expect(reachable.has('Standalone')).toBe(false)
    })

    it('should handle null metadata and empty start cubes', () => {
      expect(getReachableCubes(null, ['Orders'])).toEqual(new Set(['Orders']))
      expect(getReachableCubes(meta, [])).toEqual(new Set())
    })
  })

  describe('getPortletQueryCubes', () => {
    it('should extract cubes from a single query', () => {
      const portlet = createPortlet({
        measures: ['Orders.count'],
        dimensions: ['Customers.name'],
        timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'month' }]
      })
      expect(getPortletQueryCubes(portlet).sort()).toEqual(['Customers', 'Orders'])
    })

    it('should extract cubes from all queries of a multi-query config', () => {
      const portlet = createPortlet({
        queries: [
          { measures: ['Orders.count'] },
          { measures: ['Invoices.total'] }
        ]
      })
      expect(getPortletQueryCubes(portlet).sort()).toEqual(['Invoices', 'Orders'])
    })

    it('should extract cubes from a funnel query', () => {
      const portlet = createPortlet({
        funnel: {
          bindingKey: 'Orders.customerId',
          timeDimension: 'Orders.createdAt',
          steps: [
            { name: 'Step 1', cube: 'Orders' },
            { name: 'Step 2', cube: 'Invoices' }
          ]
        }
      })
      expect(getPortletQueryCubes(portlet).sort()).toEqual(['Invoices', 'Orders'])
    })

    it('should handle funnel object-form binding key and time dimension', () => {
      const portlet = createPortlet({
        funnel: {
          bindingKey: [{ cube: 'Orders', dimension: 'customerId' }],
          timeDimension: [{ cube: 'Invoices', dimension: 'createdAt' }],
          steps: []
        }
      })
      expect(getPortletQueryCubes(portlet).sort()).toEqual(['Invoices', 'Orders'])
    })

    it('should return empty array for an invalid query', () => {
      const portlet = createPortlet({})
      expect(getPortletQueryCubes(portlet)).toEqual([])
    })
  })

  describe('getReachableDimensionOptions', () => {
    const ordersPortlet = createPortlet({ measures: ['Orders.count'] })

    it('should offer dimensions of reachable cubes only', () => {
      const groups = getReachableDimensionOptions(meta, ordersPortlet)
      const cubeNames = groups.map(g => g.cubeName)

      expect(cubeNames).toContain('Orders')
      expect(cubeNames).toContain('Customers')
      expect(cubeNames).toContain('Invoices')
      expect(cubeNames).not.toContain('Standalone')
    })

    it('should restrict to dimensions of the same type as the reference field', () => {
      const groups = getReachableDimensionOptions(meta, ordersPortlet, {
        sameTypeAs: 'Orders.customerId' // string
      })
      const allDimensions = groups.flatMap(g => g.dimensions.map(d => d.name))

      expect(allDimensions).toContain('Invoices.customerId')
      expect(allDimensions).toContain('Customers.name')
      expect(allDimensions).not.toContain('Customers.age') // number
      expect(allDimensions).not.toContain('Orders.createdAt') // time
    })

    it('should not type-restrict when the reference field is unknown', () => {
      const groups = getReachableDimensionOptions(meta, ordersPortlet, {
        sameTypeAs: 'Unknown.field'
      })
      const allDimensions = groups.flatMap(g => g.dimensions.map(d => d.name))
      expect(allDimensions).toContain('Customers.age')
    })

    it('should return empty for null metadata or a portlet with no query cubes', () => {
      expect(getReachableDimensionOptions(null, ordersPortlet)).toEqual([])
      expect(getReachableDimensionOptions(meta, createPortlet({}))).toEqual([])
    })
  })
})
