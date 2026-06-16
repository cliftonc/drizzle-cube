/**
 * Slices Barrel Export
 *
 * Exports all slice types, state creators, and action types for use in
 * the main store composition.
 */

// Core slice - analysis type, charts map, save/load
export {
  createCoreSlice,
  createInitialCoreState,
  type CoreSlice,
  type CoreSliceState,
  type CoreSliceActions,
} from './coreSlice.js'

// Query slice - query states, merge strategy, query actions
export {
  createQuerySlice,
  createInitialQueryState,
  type QuerySlice,
  type QuerySliceState,
  type QuerySliceActions,
} from './querySlice.js'

// Funnel slice - funnel steps, binding key, time dimension
export {
  createFunnelSlice,
  createInitialFunnelState,
  type FunnelSlice,
  type FunnelSliceState,
  type FunnelSliceActions,
} from './funnelSlice.js'

// Flow slice - flow analysis, starting step, depth config
export {
  createFlowSlice,
  createInitialFlowState,
  type FlowSlice,
  type FlowSliceState,
  type FlowSliceActions,
} from './flowSlice.js'

// Retention slice - cohort-based retention analysis
export {
  createRetentionSlice,
  createInitialRetentionState,
  type RetentionSlice,
  type RetentionSliceActions,
} from './retentionSlice.js'
export type { RetentionSliceState } from '../../types/retention.js'

// UI slice - tabs, views, modals, AI state
export {
  createUISlice,
  createInitialUIState,
  type UISlice,
  type UISliceState,
  type UISliceActions,
  type FieldModalMode,
} from './uiSlice.js'
