/**
 * Adapters Index
 *
 * Barrel export for all adapter-related modules.
 * Also handles adapter registration.
 */
export type { ModeAdapter, ValidationResult } from './modeAdapter.js';
export { adapterRegistry } from './adapterRegistry.js';
export { queryModeAdapter } from './queryModeAdapter.js';
export type { QuerySliceState } from './queryModeAdapter.js';
export { funnelModeAdapter } from './funnelModeAdapter.js';
export type { FunnelSliceState } from './funnelModeAdapter.js';
export { flowModeAdapter } from './flowModeAdapter.js';
export { retentionModeAdapter } from './retentionModeAdapter.js';
export type { RetentionSliceState } from '../types/retention.js';
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
export declare function initializeAdapters(): void;
