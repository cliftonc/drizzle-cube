/**
 * Adapters Index
 *
 * Barrel export for all adapter-related modules.
 * Also handles adapter registration.
 */

// Export types and interface
export type { ModeAdapter, ValidationResult } from './modeAdapter'

// Export registry
export { adapterRegistry } from './adapterRegistry'

// Export adapters
export { queryModeAdapter } from './queryModeAdapter'
export type { QuerySliceState } from './queryModeAdapter'

export { funnelModeAdapter } from './funnelModeAdapter'
export type { FunnelSliceState } from './funnelModeAdapter'

// ============================================================================
// Adapter Registration
// ============================================================================

import { adapterRegistry } from './adapterRegistry'
import { queryModeAdapter } from './queryModeAdapter'
import { funnelModeAdapter } from './funnelModeAdapter'

/**
 * Initialize and register all adapters.
 * Call this once at application startup.
 *
 * @example
 * // In your app's entry point:
 * import { initializeAdapters } from './adapters'
 * initializeAdapters()
 */
export function initializeAdapters(): void {
  // Register built-in adapters
  adapterRegistry.register(queryModeAdapter)
  adapterRegistry.register(funnelModeAdapter)
}

// Auto-register adapters on import
// This ensures adapters are available as soon as this module is imported
initializeAdapters()
