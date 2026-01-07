/**
 * State Persistence Utilities for AnalysisBuilder
 *
 * Functions for saving and loading builder state from localStorage.
 */

import type { Filter } from '../../../types'
import type { MetricItem, BreakdownItem, AnalysisBuilderState, AnalysisBuilderStorageState } from '../types'

// Storage key for localStorage persistence
export const STORAGE_KEY = 'drizzle-cube-analysis-builder-state'

/**
 * Create initial empty state for AnalysisBuilder
 *
 * Note: Only client-side configuration state is stored.
 * Server state (execution results, loading, errors) is managed by TanStack Query.
 */
export function createInitialState(): AnalysisBuilderState {
  return {
    metrics: [],
    breakdowns: [],
    filters: [],
    order: undefined,
    validationStatus: 'idle',
    validationError: null,
  }
}

/**
 * Load all state from localStorage once (to avoid repeated parsing)
 */
export function loadInitialStateFromStorage(
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
 * Save state to localStorage
 */
export function saveStateToStorage(state: {
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  filters: Filter[]
  chartType: string
  chartConfig: object
  displayConfig: object
  activeView: string
}): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore errors
  }
}

/**
 * Load state from localStorage (legacy format for backward compatibility)
 */
export function loadStateFromStorage(): {
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  filters: Filter[]
  chartType: string
  chartConfig: object
  displayConfig: object
  activeView: string
} | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore errors
  }
  return null
}

/**
 * Clear state from localStorage
 */
export function clearStateFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}
