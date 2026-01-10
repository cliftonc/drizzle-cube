/**
 * Adapter Registry
 *
 * A central registry for mode adapters. This allows the store to look up
 * the appropriate adapter based on analysis type without hardcoding
 * conditionals throughout the codebase.
 *
 * The registry uses lazy initialization to ensure adapters are always
 * available, regardless of import order or tree-shaking. Built-in adapters
 * (query, funnel) are registered automatically on first access.
 *
 * Usage:
 *   // Lookup (in store) - adapters are auto-initialized
 *   const adapter = adapterRegistry.get(state.analysisType)
 *   const modeState = adapter.extractState(storeState)
 *
 *   // Manual registration (for custom adapters)
 *   adapterRegistry.register(customAdapter)
 */

import type { ModeAdapter } from './modeAdapter'
import type { AnalysisType } from '../types/analysisConfig'
import { queryModeAdapter } from './queryModeAdapter'
import { funnelModeAdapter } from './funnelModeAdapter'

// Internal storage for registered adapters
const adapters = new Map<AnalysisType, ModeAdapter<unknown>>()

// Track if built-in adapters have been initialized
let builtInAdaptersInitialized = false

/**
 * Initialize built-in adapters (query, funnel).
 * Called automatically on first registry access.
 * Safe to call multiple times.
 */
function ensureBuiltInAdaptersInitialized(): void {
  if (builtInAdaptersInitialized) return

  if (!adapters.has('query')) {
    adapters.set('query', queryModeAdapter as ModeAdapter<unknown>)
  }
  if (!adapters.has('funnel')) {
    adapters.set('funnel', funnelModeAdapter as ModeAdapter<unknown>)
  }

  builtInAdaptersInitialized = true
}

/**
 * Adapter registry - manages mode adapters
 */
export const adapterRegistry = {
  /**
   * Register an adapter for a specific analysis type.
   * Should be called once at app initialization.
   *
   * @param adapter - The adapter to register
   */
  register<T>(adapter: ModeAdapter<T>): void {
    if (adapters.has(adapter.type)) {
      console.warn(
        `[adapterRegistry] Overwriting existing adapter for type: ${adapter.type}`
      )
    }
    adapters.set(adapter.type, adapter as ModeAdapter<unknown>)
  },

  /**
   * Get the adapter for a specific analysis type.
   * Built-in adapters (query, funnel) are initialized automatically.
   *
   * @param type - The analysis type to get adapter for
   * @returns The registered adapter
   * @throws Error if no adapter is registered for the type
   */
  get<T>(type: AnalysisType): ModeAdapter<T> {
    ensureBuiltInAdaptersInitialized()
    const adapter = adapters.get(type)
    if (!adapter) {
      throw new Error(
        `[adapterRegistry] No adapter registered for type: ${type}. ` +
          `Available types: ${Array.from(adapters.keys()).join(', ') || 'none'}`
      )
    }
    return adapter as ModeAdapter<T>
  },

  /**
   * Check if an adapter is registered for a specific type.
   * Built-in adapters (query, funnel) are initialized automatically.
   *
   * @param type - The analysis type to check
   * @returns True if an adapter is registered
   */
  has(type: AnalysisType): boolean {
    ensureBuiltInAdaptersInitialized()
    return adapters.has(type)
  },

  /**
   * Get all registered analysis types.
   * Built-in adapters (query, funnel) are initialized automatically.
   *
   * @returns Array of registered types
   */
  getRegisteredTypes(): AnalysisType[] {
    ensureBuiltInAdaptersInitialized()
    return Array.from(adapters.keys())
  },

  /**
   * Clear all registered adapters.
   * Primarily useful for testing.
   * Note: Built-in adapters will be re-initialized on next access.
   */
  clear(): void {
    adapters.clear()
    builtInAdaptersInitialized = false
  },
}
