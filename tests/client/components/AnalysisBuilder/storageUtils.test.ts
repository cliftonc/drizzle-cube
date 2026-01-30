/**
 * Comprehensive tests for AnalysisBuilder storage utilities
 *
 * Tests cover:
 * - State initialization (createInitialState)
 * - localStorage persistence (save/load/clear)
 * - Storage error handling
 * - Workspace persistence with AnalysisConfig format
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createInitialState,
  loadInitialStateFromStorage,
  saveStateToStorage,
  loadStateFromStorage,
  clearStateFromStorage,
  STORAGE_KEY,
  STORAGE_KEY_V2,
} from '../../../../src/client/components/AnalysisBuilder/utils/storageUtils'
import type { AnalysisBuilderStorageState } from '../../../../src/client/components/AnalysisBuilder/types'

describe('storageUtils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Clear any mocks
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('STORAGE_KEY constants', () => {
    it('should have correct v3 storage key', () => {
      expect(STORAGE_KEY).toBe('drizzle-cube-analysis-builder-v3')
    })

    it('should have legacy v2 storage key for backward compatibility', () => {
      expect(STORAGE_KEY_V2).toBe('drizzle-cube-analysis-builder-v2')
    })
  })

  describe('createInitialState', () => {
    it('should create state with empty metrics array', () => {
      const state = createInitialState()
      expect(state.metrics).toEqual([])
    })

    it('should create state with empty breakdowns array', () => {
      const state = createInitialState()
      expect(state.breakdowns).toEqual([])
    })

    it('should create state with empty filters array', () => {
      const state = createInitialState()
      expect(state.filters).toEqual([])
    })

    it('should create state with undefined order', () => {
      const state = createInitialState()
      expect(state.order).toBeUndefined()
    })

    it('should create state with idle validation status', () => {
      const state = createInitialState()
      expect(state.validationStatus).toBe('idle')
    })

    it('should create state with null validation error', () => {
      const state = createInitialState()
      expect(state.validationError).toBeNull()
    })

    it('should create a new object each time', () => {
      const state1 = createInitialState()
      const state2 = createInitialState()

      expect(state1).not.toBe(state2)
      expect(state1.metrics).not.toBe(state2.metrics)
      expect(state1.breakdowns).not.toBe(state2.breakdowns)
      expect(state1.filters).not.toBe(state2.filters)
    })

    it('should return consistent shape for all calls', () => {
      const states = Array.from({ length: 5 }, () => createInitialState())

      states.forEach(state => {
        expect(state).toHaveProperty('metrics')
        expect(state).toHaveProperty('breakdowns')
        expect(state).toHaveProperty('filters')
        expect(state).toHaveProperty('order')
        expect(state).toHaveProperty('validationStatus')
        expect(state).toHaveProperty('validationError')
      })
    })
  })

  describe('loadInitialStateFromStorage', () => {
    it('should return null when localStorage is disabled', () => {
      const savedState: AnalysisBuilderStorageState = {
        metrics: [{ id: '1', field: 'Test.count', label: 'A' }],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState))

      const result = loadInitialStateFromStorage(true)

      expect(result).toBeNull()
    })

    it('should return null when localStorage is empty', () => {
      const result = loadInitialStateFromStorage(false)

      expect(result).toBeNull()
    })

    it('should load valid state from localStorage', () => {
      const savedState: AnalysisBuilderStorageState = {
        metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
        breakdowns: [{ id: '2', field: 'Employees.department', isTimeDimension: false }],
        filters: [{ member: 'Employees.isActive', operator: 'equals', values: ['true'] }],
        chartType: 'line',
        chartConfig: { yAxis: ['Employees.count'] },
        displayConfig: { showLegend: true },
        activeView: 'chart'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState))

      const result = loadInitialStateFromStorage(false)

      expect(result).toEqual(savedState)
    })

    it('should return null on JSON parse error', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {{{')

      const result = loadInitialStateFromStorage(false)

      expect(result).toBeNull()
    })

    it('should preserve order in loaded state', () => {
      const savedState: AnalysisBuilderStorageState = {
        metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
        breakdowns: [],
        filters: [],
        order: { 'Employees.count': 'desc' },
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'table'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState))

      const result = loadInitialStateFromStorage(false)

      expect(result?.order).toEqual({ 'Employees.count': 'desc' })
    })

    it('should load multi-query state from localStorage', () => {
      const multiQueryState: AnalysisBuilderStorageState = {
        metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
        breakdowns: [],
        filters: [],
        chartType: 'line',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart',
        queryStates: [
          {
            metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
            breakdowns: [],
            filters: [],
            order: undefined,
            validationStatus: 'idle',
            validationError: null,
          },
          {
            metrics: [{ id: '2', field: 'Departments.count', label: 'A' }],
            breakdowns: [],
            filters: [],
            order: undefined,
            validationStatus: 'idle',
            validationError: null,
          }
        ],
        activeQueryIndex: 1,
        mergeStrategy: 'merge'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(multiQueryState))

      const result = loadInitialStateFromStorage(false)

      expect(result?.queryStates).toHaveLength(2)
      expect(result?.activeQueryIndex).toBe(1)
      expect(result?.mergeStrategy).toBe('merge')
    })

    it('should handle localStorage.getItem throwing an error', () => {
      // Mock localStorage to throw an error
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn(() => {
        throw new Error('QuotaExceeded')
      })

      const result = loadInitialStateFromStorage(false)

      expect(result).toBeNull()

      // Restore
      localStorage.getItem = originalGetItem
    })
  })

  describe('saveStateToStorage', () => {
    it('should save state to localStorage', () => {
      const state = {
        metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }

      saveStateToStorage(state)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toEqual(state)
    })

    it('should overwrite existing state', () => {
      const state1 = {
        metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }
      const state2 = {
        metrics: [{ id: '2', field: 'Departments.count', label: 'B' }],
        breakdowns: [],
        filters: [],
        chartType: 'line',
        chartConfig: {},
        displayConfig: {},
        activeView: 'table'
      }

      saveStateToStorage(state1)
      saveStateToStorage(state2)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(JSON.parse(stored!)).toEqual(state2)
    })

    it('should handle localStorage.setItem errors gracefully', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceeded')
      })

      const state = {
        metrics: [],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }

      // Should not throw
      expect(() => saveStateToStorage(state)).not.toThrow()

      localStorage.setItem = originalSetItem
    })

    it('should serialize complex filter structures', () => {
      const state = {
        metrics: [],
        breakdowns: [],
        filters: [
          {
            type: 'and' as const,
            filters: [
              { member: 'Employees.isActive', operator: 'equals', values: ['true'] },
              { member: 'Employees.salary', operator: 'gt', values: [50000] }
            ]
          }
        ],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }

      saveStateToStorage(state)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.filters[0].type).toBe('and')
      expect(stored.filters[0].filters).toHaveLength(2)
    })
  })

  describe('loadStateFromStorage', () => {
    it('should return null when localStorage is empty', () => {
      const result = loadStateFromStorage()
      expect(result).toBeNull()
    })

    it('should load valid state from localStorage', () => {
      const state = {
        metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: { xAxis: ['Employees.department'] },
        displayConfig: { showLegend: false },
        activeView: 'table'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      const result = loadStateFromStorage()

      expect(result).toEqual(state)
    })

    it('should return null on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, '{invalid')

      const result = loadStateFromStorage()

      expect(result).toBeNull()
    })

    it('should handle empty string in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, '')

      const result = loadStateFromStorage()

      expect(result).toBeNull()
    })

    it('should preserve all chart configuration', () => {
      const state = {
        metrics: [{ id: '1', field: 'Sales.revenue', label: 'A' }],
        breakdowns: [{ id: '2', field: 'Products.category', isTimeDimension: false }],
        filters: [],
        chartType: 'pie',
        chartConfig: {
          xAxis: ['Products.category'],
          yAxis: ['Sales.revenue'],
          series: ['Products.brand']
        },
        displayConfig: {
          showLegend: true,
          showGrid: false,
          showTooltip: true,
          stacked: true
        },
        activeView: 'chart'
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      const result = loadStateFromStorage()

      expect(result?.chartConfig).toEqual(state.chartConfig)
      expect(result?.displayConfig).toEqual(state.displayConfig)
    })
  })

  describe('clearStateFromStorage', () => {
    it('should remove state from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, '{"test": true}')

      clearStateFromStorage()

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('should not throw when localStorage is already empty', () => {
      expect(() => clearStateFromStorage()).not.toThrow()
    })

    it('should only remove the analysis builder key', () => {
      localStorage.setItem(STORAGE_KEY, '{"test": true}')
      localStorage.setItem('other-key', 'other-value')

      clearStateFromStorage()

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem('other-key')).toBe('other-value')
    })

    it('should handle localStorage.removeItem errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage unavailable')
      })

      expect(() => clearStateFromStorage()).not.toThrow()

      localStorage.removeItem = originalRemoveItem
    })
  })

  describe('round-trip persistence', () => {
    it('should preserve state through save/load cycle', () => {
      const originalState = {
        metrics: [
          { id: '1', field: 'Employees.count', label: 'A' },
          { id: '2', field: 'Employees.avgSalary', label: 'B' }
        ],
        breakdowns: [
          { id: '3', field: 'Employees.department', isTimeDimension: false }
        ],
        filters: [
          { member: 'Employees.isActive', operator: 'equals', values: ['true'] }
        ],
        chartType: 'bar',
        chartConfig: { xAxis: ['Employees.department'], yAxis: ['Employees.count'] },
        displayConfig: { showLegend: true, stacked: false },
        activeView: 'chart'
      }

      saveStateToStorage(originalState)
      const loadedState = loadStateFromStorage()

      expect(loadedState).toEqual(originalState)
    })

    it('should handle nested filter groups', () => {
      const stateWithNestedFilters = {
        metrics: [],
        breakdowns: [],
        filters: [
          {
            type: 'or' as const,
            filters: [
              {
                type: 'and' as const,
                filters: [
                  { member: 'a', operator: 'equals', values: ['1'] },
                  { member: 'b', operator: 'equals', values: ['2'] }
                ]
              },
              { member: 'c', operator: 'equals', values: ['3'] }
            ]
          }
        ],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }

      saveStateToStorage(stateWithNestedFilters)
      const loaded = loadStateFromStorage()

      expect(loaded?.filters).toEqual(stateWithNestedFilters.filters)
    })

    it('should handle special characters in values', () => {
      const stateWithSpecialChars = {
        metrics: [],
        breakdowns: [],
        filters: [
          { member: 'field', operator: 'contains', values: ['test "quotes"'] },
          { member: 'field2', operator: 'equals', values: ['line\nbreak'] },
          { member: 'field3', operator: 'equals', values: ['unicode: \u00e9\u00e8'] }
        ],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart'
      }

      saveStateToStorage(stateWithSpecialChars)
      const loaded = loadStateFromStorage()

      expect(loaded?.filters).toEqual(stateWithSpecialChars.filters)
    })
  })

  describe('state type safety', () => {
    it('should handle all valid chart types', () => {
      const chartTypes = ['line', 'bar', 'pie', 'table', 'area', 'scatter', 'radar'] as const

      chartTypes.forEach(chartType => {
        const state = {
          metrics: [],
          breakdowns: [],
          filters: [],
          chartType,
          chartConfig: {},
          displayConfig: {},
          activeView: 'chart' as const
        }

        saveStateToStorage(state)
        const loaded = loadStateFromStorage()

        expect(loaded?.chartType).toBe(chartType)
      })
    })

    it('should handle activeView values', () => {
      const views = ['chart', 'table'] as const

      views.forEach(activeView => {
        const state = {
          metrics: [],
          breakdowns: [],
          filters: [],
          chartType: 'bar',
          chartConfig: {},
          displayConfig: {},
          activeView
        }

        saveStateToStorage(state)
        const loaded = loadStateFromStorage()

        expect(loaded?.activeView).toBe(activeView)
      })
    })

    it('should preserve order direction', () => {
      const state = {
        metrics: [],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'table',
        order: { 'Employees.count': 'asc' as const, 'Employees.name': 'desc' as const }
      }

      saveStateToStorage(state)
      const loaded = loadStateFromStorage()

      expect(loaded?.order?.['Employees.count']).toBe('asc')
      expect(loaded?.order?.['Employees.name']).toBe('desc')
    })
  })

  describe('backwards compatibility', () => {
    it('should load state even with extra unknown properties', () => {
      const stateWithExtra = {
        metrics: [],
        breakdowns: [],
        filters: [],
        chartType: 'bar',
        chartConfig: {},
        displayConfig: {},
        activeView: 'chart',
        unknownProperty: 'should be preserved',
        anotherUnknown: { nested: true }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithExtra))
      const loaded = loadStateFromStorage()

      expect(loaded).not.toBeNull()
      expect(loaded?.chartType).toBe('bar')
      // Extra properties are preserved by JSON parse
      expect((loaded as any)?.unknownProperty).toBe('should be preserved')
    })
  })
})
