/**
 * Adapter Registry
 *
 * A central registry for mode adapters. This allows the store to look up
 * the appropriate adapter based on analysis type without hardcoding
 * conditionals throughout the codebase.
 *
 * Usage:
 *   // Registration (at app initialization)
 *   import { adapterRegistry } from './adapters'
 *   import { queryModeAdapter } from './adapters/queryModeAdapter'
 *   import { funnelModeAdapter } from './adapters/funnelModeAdapter'
 *
 *   adapterRegistry.register(queryModeAdapter)
 *   adapterRegistry.register(funnelModeAdapter)
 *
 *   // Lookup (in store)
 *   const adapter = adapterRegistry.get(state.analysisType)
 *   const modeState = adapter.extractState(storeState)
 */

import type { ModeAdapter } from './modeAdapter'
import type { AnalysisType } from '../types/analysisConfig'

// Internal storage for registered adapters
const adapters = new Map<AnalysisType, ModeAdapter<unknown>>()

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
   *
   * @param type - The analysis type to get adapter for
   * @returns The registered adapter
   * @throws Error if no adapter is registered for the type
   */
  get<T>(type: AnalysisType): ModeAdapter<T> {
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
   *
   * @param type - The analysis type to check
   * @returns True if an adapter is registered
   */
  has(type: AnalysisType): boolean {
    return adapters.has(type)
  },

  /**
   * Get all registered analysis types.
   *
   * @returns Array of registered types
   */
  getRegisteredTypes(): AnalysisType[] {
    return Array.from(adapters.keys())
  },

  /**
   * Clear all registered adapters.
   * Primarily useful for testing.
   */
  clear(): void {
    adapters.clear()
  },
}
