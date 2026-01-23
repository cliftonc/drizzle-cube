/**
 * Core Slice
 *
 * Handles:
 * - analysisType (mode selection)
 * - charts map (per-mode chart configurations)
 * - save/load delegation to adapters
 *
 * This slice is mode-agnostic - it delegates to the adapter registry
 * for mode-specific logic.
 */

import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
// Import from barrel export to ensure adapters are auto-registered via initializeAdapters()
import {
  adapterRegistry,
  queryModeAdapter,
  funnelModeAdapter,
  flowModeAdapter,
  retentionModeAdapter,
} from '../../adapters'
import type {
  AnalysisConfig,
  AnalysisType,
  ChartConfig,
  AnalysisWorkspace,
  QueryAnalysisConfig,
  FunnelAnalysisConfig,
  FlowAnalysisConfig,
  RetentionAnalysisConfig,
} from '../../types/analysisConfig'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../types'

// ============================================================================
// Types
// ============================================================================

/**
 * Core slice state
 */
export interface CoreSliceState {
  /** Current analysis mode */
  analysisType: AnalysisType

  /**
   * Per-mode chart configuration map.
   * Each mode owns its own chart settings.
   * Phase 4: This is now the source of truth for all chart configuration.
   */
  charts: {
    [K in AnalysisType]?: ChartConfig
  }

  /**
   * Per-mode active view (table or chart) map.
   * Each mode owns its own view preference.
   * This preserves view preference when switching between modes.
   */
  activeViews: {
    [K in AnalysisType]?: 'table' | 'chart'
  }

  /** Whether user manually selected a chart type */
  userManuallySelectedChart: boolean
  /** Color palette name */
  localPaletteName: string
}

/**
 * Core slice actions
 */
export interface CoreSliceActions {
  /** Set the analysis type (switches between Query/Funnel modes) */
  setAnalysisType: (type: AnalysisType) => void

  /** Set chart type for current mode */
  setChartType: (type: ChartType) => void

  /** Set chart type with manual selection flag */
  setChartTypeManual: (type: ChartType) => void

  /** Set chart config for current mode */
  setChartConfig: (config: ChartAxisConfig) => void

  /** Set display config for current mode */
  setDisplayConfig: (config: ChartDisplayConfig) => void

  /** Set color palette name */
  setLocalPaletteName: (name: string) => void

  /** Set user manually selected chart flag */
  setUserManuallySelectedChart: (value: boolean) => void

  /**
   * @deprecated Use setChartType() instead - works for any mode via charts map.
   * This setter is kept for backward compatibility but will be removed in a future version.
   */
  setFunnelChartType: (type: ChartType) => void

  /**
   * @deprecated Use setChartConfig() instead - works for any mode via charts map.
   * This setter is kept for backward compatibility but will be removed in a future version.
   */
  setFunnelChartConfig: (config: ChartAxisConfig) => void

  /**
   * @deprecated Use setDisplayConfig() instead - works for any mode via charts map.
   * This setter is kept for backward compatibility but will be removed in a future version.
   */
  setFunnelDisplayConfig: (config: ChartDisplayConfig) => void

  /**
   * Save current state to AnalysisConfig format.
   * Delegates to the appropriate adapter based on analysisType.
   * Use for share URLs and portlets (single-mode).
   */
  save: () => AnalysisConfig

  /**
   * Load state from AnalysisConfig.
   * Delegates to the appropriate adapter based on config.analysisType.
   * Use for share URLs and portlets (single-mode).
   */
  load: (config: AnalysisConfig) => void

  /**
   * Save ALL modes to AnalysisWorkspace format.
   * Used for localStorage persistence to preserve state across mode switches.
   */
  saveWorkspace: () => AnalysisWorkspace

  /**
   * Load ALL modes from AnalysisWorkspace.
   * Used for localStorage persistence to restore state for all modes.
   */
  loadWorkspace: (workspace: AnalysisWorkspace) => void
}

export type CoreSlice = CoreSliceState & CoreSliceActions

// ============================================================================
// Initial State
// ============================================================================

export const createInitialCoreState = (): CoreSliceState => ({
  analysisType: 'query',

  // Use adapter defaults as single source of truth for chart configuration
  charts: {
    query: queryModeAdapter.getDefaultChartConfig(),
    funnel: funnelModeAdapter.getDefaultChartConfig(),
    flow: flowModeAdapter.getDefaultChartConfig(),
    retention: retentionModeAdapter.getDefaultChartConfig(),
  },

  // Per-mode active view preference
  activeViews: {
    query: 'chart',
    funnel: 'chart',
    flow: 'chart',
    retention: 'chart',
  },

  userManuallySelectedChart: false,
  localPaletteName: 'default',
})

// ============================================================================
// Slice Creator
// ============================================================================

/**
 * Create the core slice.
 * Uses StateCreator pattern for composability with other slices.
 */
export const createCoreSlice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  CoreSlice
> = (set, get) => ({
  ...createInitialCoreState(),

  setAnalysisType: (type) => {
    set((state) => {
      // Ensure the target mode has chart config (apply defaults if missing)
      const charts = { ...state.charts }
      if (!charts[type]) {
        const adapter = adapterRegistry.get(type)
        charts[type] = adapter.getDefaultChartConfig()
      }
      const activeViews = { ...state.activeViews }
      if (!activeViews[type]) {
        activeViews[type] = 'chart'
      }
      return {
        analysisType: type,
        charts,
        activeViews,
        activeView: activeViews[type] ?? 'chart',
      }
    })
  },

  setChartType: (type) => {
    set((state) => {
      const mode = state.analysisType
      const currentConfig = state.charts[mode] || {
        chartType: type,
        chartConfig: {},
        displayConfig: {},
      }

      // Phase 4: Only update charts map (legacy fields removed)
      return {
        charts: {
          ...state.charts,
          [mode]: { ...currentConfig, chartType: type },
        },
      }
    })
  },

  setChartTypeManual: (type) => {
    set((state) => {
      const mode = state.analysisType
      const currentConfig = state.charts[mode] || {
        chartType: type,
        chartConfig: {},
        displayConfig: {},
      }

      // Phase 4: Only update charts map (legacy fields removed)
      return {
        charts: {
          ...state.charts,
          [mode]: { ...currentConfig, chartType: type },
        },
        userManuallySelectedChart: true,
        activeView: 'chart' as const,
        activeViews: {
          ...state.activeViews,
          [mode]: 'chart' as const,
        },
      }
    })
  },

  setChartConfig: (config) => {
    set((state) => {
      const mode = state.analysisType
      const currentConfig = state.charts[mode] || {
        chartType: 'bar',
        chartConfig: config,
        displayConfig: {},
      }

      // Phase 4: Only update charts map (legacy fields removed)
      return {
        charts: {
          ...state.charts,
          [mode]: { ...currentConfig, chartConfig: config },
        },
        activeView: 'chart' as const,
        activeViews: {
          ...state.activeViews,
          [mode]: 'chart' as const,
        },
      }
    })
  },

  setDisplayConfig: (config) => {
    set((state) => {
      const mode = state.analysisType
      const currentConfig = state.charts[mode] || {
        chartType: 'bar',
        chartConfig: {},
        displayConfig: config,
      }

      // Phase 4: Only update charts map (legacy fields removed)
      return {
        charts: {
          ...state.charts,
          [mode]: { ...currentConfig, displayConfig: config },
        },
        activeView: 'chart' as const,
        activeViews: {
          ...state.activeViews,
          [mode]: 'chart' as const,
        },
      }
    })
  },

  setLocalPaletteName: (name) => set({ localPaletteName: name }),

  setUserManuallySelectedChart: (value) => set({ userManuallySelectedChart: value }),

  // @deprecated - Use setChartType() instead
  // Kept for backward compatibility
  setFunnelChartType: (type) => {
    set((state) => {
      const currentConfig = state.charts.funnel || {
        chartType: type,
        chartConfig: {},
        displayConfig: {},
      }
      return {
        charts: {
          ...state.charts,
          funnel: { ...currentConfig, chartType: type },
        },
      }
    })
  },

  // @deprecated - Use setChartConfig() instead
  // Kept for backward compatibility
  setFunnelChartConfig: (config) => {
    set((state) => {
      const currentConfig = state.charts.funnel || {
        chartType: 'funnel',
        chartConfig: config,
        displayConfig: {},
      }
      return {
        charts: {
          ...state.charts,
          funnel: { ...currentConfig, chartConfig: config },
        },
      }
    })
  },

  // @deprecated - Use setDisplayConfig() instead
  // Kept for backward compatibility
  setFunnelDisplayConfig: (config) => {
    set((state) => {
      const currentConfig = state.charts.funnel || {
        chartType: 'funnel',
        chartConfig: {},
        displayConfig: config,
      }
      return {
        charts: {
          ...state.charts,
          funnel: { ...currentConfig, displayConfig: config },
        },
      }
    })
  },

  save: () => {
    const state = get()
    const adapter = adapterRegistry.get(state.analysisType)

    // Use adapter's extractState method for mode-specific state
    const modeState = adapter.extractState(state as unknown as Record<string, unknown>)

    // Use per-mode activeView, falling back to legacy activeView
    const activeView = state.activeViews[state.analysisType] ?? state.activeView ?? 'chart'

    return adapter.save(modeState, state.charts, activeView)
  },

  load: (config) => {
    const adapter = adapterRegistry.get(config.analysisType)

    // Validate config can be loaded
    if (!adapter.canLoad(config)) {
      console.warn('[coreSlice] Invalid config, cannot load')
      return
    }

    const modeState = adapter.load(config)

    // Merge charts to preserve other modes' settings
    const currentState = get()
    const mergedCharts = {
      ...currentState.charts,
      ...config.charts,
    }

    // Apply defaults if current mode's chart config is missing
    if (!mergedCharts[config.analysisType]) {
      mergedCharts[config.analysisType] = adapter.getDefaultChartConfig()
    }

    // Merge activeViews to preserve other modes' view preferences
    const mergedActiveViews = {
      ...currentState.activeViews,
      [config.analysisType]: config.activeView,
    }

    // Update state (mode-agnostic)
    set({
      analysisType: config.analysisType,
      charts: mergedCharts,
      activeView: config.activeView,
      activeViews: mergedActiveViews,
      // Mode-specific state from adapter
      ...(modeState as any),
    })
  },

  saveWorkspace: (): AnalysisWorkspace => {
    const state = get()
    const stateAsRecord = state as unknown as Record<string, unknown>

    // Save query mode state using adapter's extractState
    const queryAdapter = adapterRegistry.get('query')
    const queryModeState = queryAdapter.extractState(stateAsRecord)
    const queryActiveView = state.activeViews.query ?? state.activeView ?? 'chart'
    const queryConfig = queryAdapter.save(
      queryModeState,
      state.charts,
      queryActiveView
    ) as QueryAnalysisConfig

    // Save funnel mode state using adapter's extractState
    const funnelAdapter = adapterRegistry.get('funnel')
    const funnelModeState = funnelAdapter.extractState(stateAsRecord)
    const funnelActiveView = state.activeViews.funnel ?? state.activeView ?? 'chart'
    const funnelConfig = funnelAdapter.save(
      funnelModeState,
      state.charts,
      funnelActiveView
    ) as FunnelAnalysisConfig

    // Save flow mode state using adapter's extractState
    const flowAdapter = adapterRegistry.get('flow')
    const flowModeState = flowAdapter.extractState(stateAsRecord)
    const flowActiveView = state.activeViews.flow ?? state.activeView ?? 'chart'
    const flowConfig = flowAdapter.save(
      flowModeState,
      state.charts,
      flowActiveView
    ) as FlowAnalysisConfig

    // Save retention mode state using adapter's extractState
    const retentionAdapter = adapterRegistry.get('retention')
    const retentionModeState = retentionAdapter.extractState(stateAsRecord)
    const retentionActiveView = state.activeViews.retention ?? state.activeView ?? 'chart'
    const retentionConfig = retentionAdapter.save(
      retentionModeState,
      state.charts,
      retentionActiveView
    ) as RetentionAnalysisConfig

    return {
      version: 1,
      activeType: state.analysisType,
      modes: {
        query: queryConfig,
        funnel: funnelConfig,
        flow: flowConfig,
        retention: retentionConfig,
      },
    }
  },

  loadWorkspace: (workspace: AnalysisWorkspace): void => {
    const queryAdapter = adapterRegistry.get('query')
    const funnelAdapter = adapterRegistry.get('funnel')
    const flowAdapter = adapterRegistry.get('flow')
    const retentionAdapter = adapterRegistry.get('retention')

    let queryModeState: Record<string, unknown> = {}
    let funnelModeState: Record<string, unknown> = {}
    let flowModeState: Record<string, unknown> = {}
    let retentionModeState: Record<string, unknown> = {}
    let mergedCharts = { ...get().charts }
    let mergedActiveViews = { ...get().activeViews }

    // Load query mode if present
    if (workspace.modes.query && queryAdapter.canLoad(workspace.modes.query)) {
      queryModeState = queryAdapter.load(workspace.modes.query) as Record<string, unknown>
      mergedCharts = { ...mergedCharts, ...workspace.modes.query.charts }
      mergedActiveViews.query = workspace.modes.query.activeView ?? 'chart'
    }

    // Load funnel mode if present
    if (workspace.modes.funnel && funnelAdapter.canLoad(workspace.modes.funnel)) {
      funnelModeState = funnelAdapter.load(workspace.modes.funnel) as Record<string, unknown>
      mergedCharts = { ...mergedCharts, ...workspace.modes.funnel.charts }
      mergedActiveViews.funnel = workspace.modes.funnel.activeView ?? 'chart'
    }

    // Load flow mode if present
    if (workspace.modes.flow && flowAdapter.canLoad(workspace.modes.flow)) {
      flowModeState = flowAdapter.load(workspace.modes.flow) as Record<string, unknown>
      mergedCharts = { ...mergedCharts, ...workspace.modes.flow.charts }
      mergedActiveViews.flow = workspace.modes.flow.activeView ?? 'chart'
    }

    // Load retention mode if present
    if (workspace.modes.retention && retentionAdapter.canLoad(workspace.modes.retention)) {
      retentionModeState = retentionAdapter.load(workspace.modes.retention) as Record<string, unknown>
      mergedCharts = { ...mergedCharts, ...workspace.modes.retention.charts }
      mergedActiveViews.retention = workspace.modes.retention.activeView ?? 'chart'
    }

    // Determine activeView from the active mode's config
    const activeConfig = workspace.modes[workspace.activeType]
    const activeView = activeConfig?.activeView ?? 'chart'

    set({
      analysisType: workspace.activeType,
      charts: mergedCharts,
      activeViews: mergedActiveViews,
      activeView,
      ...queryModeState,
      ...funnelModeState,
      ...flowModeState,
      ...retentionModeState,
    })
  },
})
