/**
 * Adapters Index
 *
 * Barrel export for all adapter-related modules.
 * Also handles adapter registration.
 */

// Export types and interface
export type { ModeAdapter, ValidationResult } from './modeAdapter.js'

// Export registry
export { adapterRegistry } from './adapterRegistry.js'

// Export adapters
export { queryModeAdapter } from './queryModeAdapter.js'
export type { QuerySliceState } from './queryModeAdapter.js'

export { funnelModeAdapter } from './funnelModeAdapter.js'
export type { FunnelSliceState } from './funnelModeAdapter.js'

export { flowModeAdapter } from './flowModeAdapter.js'

export { retentionModeAdapter } from './retentionModeAdapter.js'
export type { RetentionSliceState } from '../types/retention.js'

// ============================================================================
// Adapter Registration (Optional - Built-in adapters auto-initialize on access)
// ============================================================================

import { adapterRegistry } from './adapterRegistry.js'
import { queryModeAdapter } from './queryModeAdapter.js'
import { funnelModeAdapter } from './funnelModeAdapter.js'
import { flowModeAdapter } from './flowModeAdapter.js'
import { retentionModeAdapter } from './retentionModeAdapter.js'

/**
 * Manually initialize and register all adapters.
 *
 * Note: This function is no longer required to be called. Built-in adapters
 * (query, funnel) are now automatically initialized on first access to the
 * registry. This function is kept for backward compatibility and for cases
 * where explicit early initialization is preferred.
 *
 * @example
 * // Optional - adapters auto-initialize on first use
 * import { initializeAdapters } from './adapters'
 * initializeAdapters()
 */
export function initializeAdapters(): void {
  // Register built-in adapters
  // Safe to call multiple times - registry ignores duplicates
  adapterRegistry.register(queryModeAdapter)
  adapterRegistry.register(funnelModeAdapter)
  adapterRegistry.register(flowModeAdapter)
  adapterRegistry.register(retentionModeAdapter)
}

// Note: Auto-registration removed to avoid tree-shaking issues.
// Adapters now self-initialize on first registry access.
// See adapterRegistry.ts ensureBuiltInAdaptersInitialized()
