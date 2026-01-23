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

export { flowModeAdapter } from './flowModeAdapter'

export { retentionModeAdapter } from './retentionModeAdapter'
export type { RetentionSliceState } from '../types/retention'

// ============================================================================
// Adapter Registration (Optional - Built-in adapters auto-initialize on access)
// ============================================================================

import { adapterRegistry } from './adapterRegistry'
import { queryModeAdapter } from './queryModeAdapter'
import { funnelModeAdapter } from './funnelModeAdapter'
import { flowModeAdapter } from './flowModeAdapter'
import { retentionModeAdapter } from './retentionModeAdapter'

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
