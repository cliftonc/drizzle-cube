/**
 * Funnel Slice
 *
 * Handles funnel mode state and actions:
 * - funnelCube (selected cube for all steps)
 * - funnelSteps (step definitions)
 * - funnelTimeDimension (temporal ordering)
 * - funnelBindingKey (entity linking)
 */

import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type { FunnelStepState, FunnelBindingKey, FunnelConfig } from '../../types'
import type { ServerFunnelQuery } from '../../types/funnel'
import { generateId } from '../../components/AnalysisBuilder/utils'

// ============================================================================
// Types
// ============================================================================

/**
 * Funnel slice state
 */
export interface FunnelSliceState {
  /** Selected cube for funnel mode (all steps use this cube) */
  funnelCube: string | null
  /** Dedicated funnel steps (separate from queryStates) */
  funnelSteps: FunnelStepState[]
  /** Index of currently active funnel step */
  activeFunnelStepIndex: number
  /** Time dimension for funnel temporal ordering */
  funnelTimeDimension: string | null
  /** Binding key dimension that links funnel steps together */
  funnelBindingKey: FunnelBindingKey | null
  /** @deprecated Use funnelSteps[].timeToConvert instead - kept for backward compat */
  stepTimeToConvert: (string | null)[]
}

/**
 * Funnel slice actions
 */
export interface FunnelSliceActions {
  /** Add a new funnel step */
  addFunnelStep: () => void
  /** Remove a funnel step by index */
  removeFunnelStep: (index: number) => void
  /** Update a funnel step by index */
  updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void
  /** Set the active funnel step index */
  setActiveFunnelStepIndex: (index: number) => void
  /** Reorder funnel steps */
  reorderFunnelSteps: (fromIndex: number, toIndex: number) => void
  /** Set the time dimension for funnel */
  setFunnelTimeDimension: (dimension: string | null) => void
  /** Set the funnel binding key */
  setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void
  /** Set the funnel cube (clears binding key/time dimension, updates all steps) */
  setFunnelCube: (cube: string | null) => void
  /** @deprecated No-op - use updateFunnelStep with timeToConvert instead */
  setStepTimeToConvert: (stepIndex: number, duration: string | null) => void
  /** @deprecated Always returns null - use buildFunnelQueryFromSteps instead */
  buildFunnelConfig: () => FunnelConfig | null
  /** Build ServerFunnelQuery from dedicated funnelSteps */
  buildFunnelQueryFromSteps: () => ServerFunnelQuery | null
  /** Check if in funnel mode (analysisType === 'funnel') */
  isFunnelMode: () => boolean
  /** Check if funnel mode is properly configured and ready for execution */
  isFunnelModeEnabled: () => boolean
}

export type FunnelSlice = FunnelSliceState & FunnelSliceActions

// ============================================================================
// Initial State
// ============================================================================

export const createInitialFunnelState = (): FunnelSliceState => ({
  funnelCube: null,
  funnelSteps: [],
  activeFunnelStepIndex: 0,
  funnelTimeDimension: null,
  funnelBindingKey: null,
  stepTimeToConvert: [], // Deprecated - kept for backward compat
})

// ============================================================================
// Slice Creator
// ============================================================================

/**
 * Create the funnel slice.
 * Uses StateCreator pattern for composability.
 */
export const createFunnelSlice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  FunnelSlice
> = (set, get) => ({
  ...createInitialFunnelState(),

  addFunnelStep: () =>
    set((state) => {
      // Copy filters and timeToConvert from last step if exists
      const lastStep = state.funnelSteps[state.funnelSteps.length - 1]
      const newStep: FunnelStepState = {
        id: generateId(),
        name: `Step ${state.funnelSteps.length + 1}`,
        cube: state.funnelCube || '',
        // Deep copy filters from previous step, or empty array if first step
        filters: lastStep?.filters ? JSON.parse(JSON.stringify(lastStep.filters)) : [],
        // Copy timeToConvert from previous step
        timeToConvert: lastStep?.timeToConvert,
      }
      return {
        funnelSteps: [...state.funnelSteps, newStep],
        activeFunnelStepIndex: state.funnelSteps.length,
      }
    }),

  removeFunnelStep: (index) =>
    set((state) => {
      if (state.funnelSteps.length <= 1) return state
      const newSteps = state.funnelSteps.filter((_, i) => i !== index)
      const newActiveIndex = Math.min(state.activeFunnelStepIndex, newSteps.length - 1)
      return {
        funnelSteps: newSteps,
        activeFunnelStepIndex: newActiveIndex,
      }
    }),

  updateFunnelStep: (index, updates) =>
    set((state) => {
      const newSteps = [...state.funnelSteps]
      if (newSteps[index]) {
        newSteps[index] = { ...newSteps[index], ...updates }
      }
      return { funnelSteps: newSteps }
    }),

  setActiveFunnelStepIndex: (index) => set({ activeFunnelStepIndex: index }),

  reorderFunnelSteps: (fromIndex, toIndex) =>
    set((state) => {
      const newSteps = [...state.funnelSteps]
      const [removed] = newSteps.splice(fromIndex, 1)
      newSteps.splice(toIndex, 0, removed)
      return { funnelSteps: newSteps }
    }),

  setFunnelTimeDimension: (dimension) => set({ funnelTimeDimension: dimension }),

  setFunnelBindingKey: (bindingKey) => set({ funnelBindingKey: bindingKey }),

  setFunnelCube: (cube) =>
    set((state) => {
      // Update all existing steps to use the new cube
      const updatedSteps = state.funnelSteps.map((step) => ({
        ...step,
        cube: cube || '',
      }))
      return {
        funnelCube: cube,
        // Clear binding key and time dimension since they may not exist in new cube
        funnelBindingKey: null,
        funnelTimeDimension: null,
        funnelSteps: updatedSteps,
      }
    }),

  // Deprecated: no-op - legacy queryStates-based funnels are no longer supported
  // Use updateFunnelStep with timeToConvert instead
  setStepTimeToConvert: () => {},

  // Deprecated: always returns null - legacy queryStates-based funnels are no longer supported
  // Use buildFunnelQueryFromSteps instead
  buildFunnelConfig: () => null,

  // New: Build ServerFunnelQuery from dedicated funnelSteps
  buildFunnelQueryFromSteps: () => {
    const state = get()
    if (state.analysisType !== 'funnel') return null
    if (!state.funnelBindingKey) return null
    if (!state.funnelTimeDimension) return null
    if (state.funnelSteps.length < 2) return null

    // Validate all steps have a cube and name
    const validSteps = state.funnelSteps.filter((s) => s.cube && s.name)
    if (validSteps.length < 2) return null

    return {
      funnel: {
        bindingKey: state.funnelBindingKey.dimension,
        timeDimension: state.funnelTimeDimension,
        steps: validSteps.map((step) => ({
          name: step.name,
          cube: step.cube,
          filter: step.filters.length > 0 ? step.filters : undefined,
          timeToConvert: step.timeToConvert,
        })),
        includeTimeMetrics: true,
      },
    }
  },

  isFunnelMode: () => get().analysisType === 'funnel',

  isFunnelModeEnabled: () => {
    const state = get()

    if (state.analysisType !== 'funnel') return false
    if (!state.funnelBindingKey) return false
    if (!state.funnelTimeDimension) return false
    if (state.funnelSteps.length < 2) return false

    // All steps need at least cube and name
    const validSteps = state.funnelSteps.filter((s) => s.cube && s.name)
    return validSteps.length >= 2
  },
})
