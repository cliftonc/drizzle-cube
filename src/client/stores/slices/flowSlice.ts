/**
 * Flow Slice
 *
 * Handles flow mode state and actions:
 * - flowCube (selected cube for flow analysis)
 * - flowBindingKey (entity linking)
 * - flowTimeDimension (temporal ordering)
 * - startingStep (anchor event definition)
 * - stepsBefore/stepsAfter (exploration depth)
 * - eventDimension (event categorization)
 */

import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type { Filter, FunnelBindingKey } from '../../types'
import type { ServerFlowQuery, FlowStartingStep } from '../../types/flow'
import { FLOW_MIN_DEPTH, FLOW_MAX_DEPTH } from '../../types/flow'

// ============================================================================
// Types
// ============================================================================

/**
 * Flow slice state
 */
export interface FlowSliceState {
  /** Selected cube for flow mode (must be an eventStream cube) */
  flowCube: string | null
  /** Binding key that links events to entities */
  flowBindingKey: FunnelBindingKey | null
  /** Time dimension for event ordering */
  flowTimeDimension: string | null
  /** Starting step configuration (anchor point for exploration) */
  startingStep: FlowStartingStep
  /** Number of steps to explore before starting step (0-5) */
  stepsBefore: number
  /** Number of steps to explore after starting step (0-5) */
  stepsAfter: number
  /** Event dimension that categorizes events (node labels) */
  eventDimension: string | null
  /** Join strategy for flow execution */
  joinStrategy: 'auto' | 'lateral' | 'window'
}

/**
 * Flow slice actions
 */
export interface FlowSliceActions {
  /** Set the flow cube (clears binding key/time dimension) */
  setFlowCube: (cube: string | null) => void
  /** Set the flow binding key */
  setFlowBindingKey: (key: FunnelBindingKey | null) => void
  /** Set the flow time dimension */
  setFlowTimeDimension: (dim: string | null) => void
  /** Set the event dimension */
  setEventDimension: (dim: string | null) => void
  /** Set the starting step name */
  setStartingStepName: (name: string) => void
  /** Set all starting step filters at once */
  setStartingStepFilters: (filters: Filter[]) => void
  /** Add a filter to the starting step */
  addStartingStepFilter: (filter: Filter) => void
  /** Remove a filter from the starting step by index */
  removeStartingStepFilter: (index: number) => void
  /** Update a filter in the starting step by index */
  updateStartingStepFilter: (index: number, filter: Filter) => void
  /** Set the number of steps to explore before starting step */
  setStepsBefore: (count: number) => void
  /** Set the number of steps to explore after starting step */
  setStepsAfter: (count: number) => void
  /** Set the join strategy */
  setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void
  /** Check if in flow mode (analysisType === 'flow') */
  isFlowMode: () => boolean
  /** Check if flow mode is properly configured and ready for execution */
  isFlowModeEnabled: () => boolean
  /** Build ServerFlowQuery from flow state */
  buildFlowQuery: () => ServerFlowQuery | null
}

export type FlowSlice = FlowSliceState & FlowSliceActions

// ============================================================================
// Initial State
// ============================================================================

export const createInitialFlowState = (): FlowSliceState => ({
  flowCube: null,
  flowBindingKey: null,
  flowTimeDimension: null,
  startingStep: {
    name: '',
    filters: [],
  },
  stepsBefore: 3,
  stepsAfter: 3,
  eventDimension: null,
  joinStrategy: 'auto',
})

// ============================================================================
// Slice Creator
// ============================================================================

/**
 * Create the flow slice.
 * Uses StateCreator pattern for composability.
 */
export const createFlowSlice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  FlowSlice
> = (set, get) => ({
  ...createInitialFlowState(),

  setFlowCube: (cube) =>
    set(() => ({
      flowCube: cube,
      // Clear binding key and time dimension since they may not exist in new cube
      flowBindingKey: null,
      flowTimeDimension: null,
      eventDimension: null,
      // Reset starting step filters when cube changes
      startingStep: {
        name: '',
        filters: [],
      },
    })),

  setFlowBindingKey: (key) => set({ flowBindingKey: key }),

  setFlowTimeDimension: (dim) => set({ flowTimeDimension: dim }),

  setEventDimension: (dim) => set({ eventDimension: dim }),

  setStartingStepName: (name) =>
    set((state) => ({
      startingStep: {
        ...state.startingStep,
        name,
      },
    })),

  setStartingStepFilters: (filters) =>
    set((state) => ({
      startingStep: {
        ...state.startingStep,
        filters,
      },
    })),

  addStartingStepFilter: (filter) =>
    set((state) => ({
      startingStep: {
        ...state.startingStep,
        filters: [...state.startingStep.filters, filter],
      },
    })),

  removeStartingStepFilter: (index) =>
    set((state) => ({
      startingStep: {
        ...state.startingStep,
        filters: state.startingStep.filters.filter((_, i) => i !== index),
      },
    })),

  updateStartingStepFilter: (index, filter) =>
    set((state) => {
      const newFilters = [...state.startingStep.filters]
      if (newFilters[index]) {
        newFilters[index] = filter
      }
      return {
        startingStep: {
          ...state.startingStep,
          filters: newFilters,
        },
      }
    }),

  setStepsBefore: (count) =>
    set({
      stepsBefore: Math.max(FLOW_MIN_DEPTH, Math.min(FLOW_MAX_DEPTH, count)),
    }),

  setStepsAfter: (count) =>
    set({
      stepsAfter: Math.max(FLOW_MIN_DEPTH, Math.min(FLOW_MAX_DEPTH, count)),
    }),

  setJoinStrategy: (strategy) =>
    set(() => ({
      joinStrategy: strategy,
    })),

  isFlowMode: () => get().analysisType === 'flow',

  isFlowModeEnabled: () => {
    const state = get()

    if (state.analysisType !== 'flow') return false
    if (!state.flowCube) return false
    if (!state.flowBindingKey?.dimension) return false
    if (!state.flowTimeDimension) return false
    if (!state.eventDimension) return false
    if (state.startingStep.filters.length === 0) return false

    return true
  },

  buildFlowQuery: () => {
    const state = get()

    if (state.analysisType !== 'flow') return null
    if (!state.flowBindingKey?.dimension) return null
    if (!state.flowTimeDimension) return null
    if (!state.eventDimension) return null
    if (state.startingStep.filters.length === 0) return null

    // Convert binding key to server format
    let bindingKey: ServerFlowQuery['flow']['bindingKey']
    if (typeof state.flowBindingKey.dimension === 'string') {
      bindingKey = state.flowBindingKey.dimension
    } else if (Array.isArray(state.flowBindingKey.dimension)) {
      bindingKey = state.flowBindingKey.dimension.map((mapping) => ({
        cube: mapping.cube,
        dimension: mapping.dimension,
      }))
    } else {
      return null
    }

    // Convert starting step filter to server format
    // Server accepts Filter | Filter[] for multiple filters
    const startingStepFilter: Filter | Filter[] =
      state.startingStep.filters.length === 1
        ? state.startingStep.filters[0]
        : state.startingStep.filters

    // Determine output mode based on chart type
    // Sunburst requires path-qualified nodes, sankey allows path convergence
    const flowChartType = state.charts?.flow?.chartType
    const outputMode: 'sankey' | 'sunburst' =
      flowChartType === 'sunburst' ? 'sunburst' : 'sankey'
    const effectiveStepsBefore = outputMode === 'sunburst' ? 0 : state.stepsBefore

    return {
      flow: {
        bindingKey,
        timeDimension: state.flowTimeDimension,
        startingStep: {
          name: state.startingStep.name || 'Starting Step',
          filter: startingStepFilter,
        },
        stepsBefore: effectiveStepsBefore,
        stepsAfter: state.stepsAfter,
        eventDimension: state.eventDimension,
        outputMode,
        joinStrategy: state.joinStrategy,
      },
    }
  },
})
