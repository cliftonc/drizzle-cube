/**
 * Tests for AnalysisBuilder storage utilities
 * Tests state initialization and localStorage persistence functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { AnalysisBuilderState, AnalysisBuilderStorageState } from '../../../src/client/components/AnalysisBuilder/types'

// Storage key constant (must match the one in index.tsx)
const STORAGE_KEY = 'drizzle-cube-analysis-builder-state'

/**
 * Create initial empty state
 * This function will be moved to utils/storageUtils.ts
 */
function createInitialState(): AnalysisBuilderState {
  return {
    metrics: [],
    breakdowns: [],
    filters: [],
    order: undefined,
    validationStatus: 'idle',
    validationError: null,
    executionStatus: 'idle',
    executionResults: null,
    executionError: null,
    totalRowCount: null,
    resultsStale: false
  }
}

/**
 * Load all state from localStorage once (to avoid repeated parsing)
 * This function will be moved to utils/storageUtils.ts
 */
function loadInitialStateFromStorage(
  disableLocalStorage: boolean
): AnalysisBuilderStorageState | null {
  if (disableLocalStorage) return null

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as AnalysisBuilderStorageState
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

/**
 * Generate a unique ID for items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate letter label for metrics (A, B, C, ..., AA, AB, ...)
 */
function generateMetricLabel(index: number): string {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

// =============================================================================
// Tests
// =============================================================================

describe('storageUtils', () => {
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
      expect(state.validationError).toBeNull()
    })

    it('should create state with idle execution status', () => {
      const state = createInitialState()
      expect(state.executionStatus).toBe('idle')
      expect(state.executionResults).toBeNull()
      expect(state.executionError).toBeNull()
    })

    it('should create state with null totalRowCount', () => {
      const state = createInitialState()
      expect(state.totalRowCount).toBeNull()
    })

    it('should create state with resultsStale as false', () => {
      const state = createInitialState()
      expect(state.resultsStale).toBe(false)
    })

    it('should create a new object each time', () => {
      const state1 = createInitialState()
      const state2 = createInitialState()
      expect(state1).not.toBe(state2)
      expect(state1.metrics).not.toBe(state2.metrics)
    })
  })

  describe('loadInitialStateFromStorage', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear()
    })

    afterEach(() => {
      // Clean up after each test
      localStorage.clear()
    })

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

    it('should load state from localStorage', () => {
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
            executionStatus: 'idle',
            executionResults: null,
            executionError: null,
            totalRowCount: null,
            resultsStale: false
          },
          {
            metrics: [{ id: '2', field: 'Departments.count', label: 'A' }],
            breakdowns: [],
            filters: [],
            order: undefined,
            validationStatus: 'idle',
            validationError: null,
            executionStatus: 'idle',
            executionResults: null,
            executionError: null,
            totalRowCount: null,
            resultsStale: false
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
  })

  describe('generateId', () => {
    it('should generate a non-empty string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('should contain a hyphen separator', () => {
      const id = generateId()
      expect(id).toContain('-')
    })
  })

  describe('generateMetricLabel', () => {
    it('should return A for index 0', () => {
      expect(generateMetricLabel(0)).toBe('A')
    })

    it('should return B for index 1', () => {
      expect(generateMetricLabel(1)).toBe('B')
    })

    it('should return Z for index 25', () => {
      expect(generateMetricLabel(25)).toBe('Z')
    })

    it('should return AA for index 26', () => {
      expect(generateMetricLabel(26)).toBe('AA')
    })

    it('should return AB for index 27', () => {
      expect(generateMetricLabel(27)).toBe('AB')
    })

    it('should return AZ for index 51', () => {
      expect(generateMetricLabel(51)).toBe('AZ')
    })

    it('should return BA for index 52', () => {
      expect(generateMetricLabel(52)).toBe('BA')
    })

    it('should return AAA for index 702', () => {
      // 26 + 26*26 = 26 + 676 = 702
      expect(generateMetricLabel(702)).toBe('AAA')
    })

    it('should handle sequential labels correctly', () => {
      const labels = []
      for (let i = 0; i < 30; i++) {
        labels.push(generateMetricLabel(i))
      }
      expect(labels.slice(0, 5)).toEqual(['A', 'B', 'C', 'D', 'E'])
      expect(labels.slice(24, 30)).toEqual(['Y', 'Z', 'AA', 'AB', 'AC', 'AD'])
    })
  })
})
