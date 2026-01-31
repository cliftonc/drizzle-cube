/**
 * Comprehensive tests for Core Slice
 * Tests all core slice state and actions for Zustand store
 *
 * The core slice manages:
 * - analysisType (mode selection)
 * - charts map (per-mode chart configurations)
 * - activeViews map (per-mode view preferences)
 * - save/load delegation to adapters
 * - saveWorkspace/loadWorkspace for multi-mode persistence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAnalysisBuilderStore,
  type AnalysisBuilderStore,
} from '../../../../src/client/stores/analysisBuilderStore'
import type { StoreApi } from 'zustand'
import type {
  AnalysisConfig,
  QueryAnalysisConfig,
  FunnelAnalysisConfig,
  AnalysisWorkspace,
} from '../../../../src/client/types/analysisConfig'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../../../src/client/types'

// ============================================================================
// Test Setup
// ============================================================================

describe('CoreSlice', () => {
  let store: StoreApi<AnalysisBuilderStore>

  beforeEach(() => {
    localStorage.clear()
    store = createAnalysisBuilderStore({ disableLocalStorage: true })
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ==========================================================================
  // Initial State
  // ==========================================================================
  describe('Initial State', () => {
    it('should have query as default analysisType', () => {
      expect(store.getState().analysisType).toBe('query')
    })

    it('should have charts map with configs for all modes', () => {
      const { charts } = store.getState()
      expect(charts).toBeDefined()
      expect(charts.query).toBeDefined()
      expect(charts.funnel).toBeDefined()
      expect(charts.flow).toBeDefined()
      expect(charts.retention).toBeDefined()
    })

    it('should have default chart types for each mode', () => {
      const { charts } = store.getState()
      expect(charts.query?.chartType).toBe('bar')
      expect(charts.funnel?.chartType).toBe('funnel')
      expect(charts.flow?.chartType).toBe('sankey')
      expect(charts.retention?.chartType).toBe('retentionCombined')
    })

    it('should have default chart configs for each mode', () => {
      const { charts } = store.getState()

      // All modes should have chartConfig and displayConfig
      expect(charts.query?.chartConfig).toBeDefined()
      expect(charts.query?.displayConfig).toBeDefined()
      expect(charts.funnel?.chartConfig).toBeDefined()
      expect(charts.funnel?.displayConfig).toBeDefined()
      expect(charts.flow?.chartConfig).toBeDefined()
      expect(charts.flow?.displayConfig).toBeDefined()
      expect(charts.retention?.chartConfig).toBeDefined()
      expect(charts.retention?.displayConfig).toBeDefined()
    })

    it('should have activeViews map with chart as default for all modes', () => {
      const { activeViews } = store.getState()
      expect(activeViews).toBeDefined()
      expect(activeViews.query).toBe('chart')
      expect(activeViews.funnel).toBe('chart')
      expect(activeViews.flow).toBe('chart')
      expect(activeViews.retention).toBe('chart')
    })

    it('should have userManuallySelectedChart as false by default', () => {
      expect(store.getState().userManuallySelectedChart).toBe(false)
    })

    it('should have default localPaletteName', () => {
      expect(store.getState().localPaletteName).toBe('default')
    })
  })

  // ==========================================================================
  // setAnalysisType
  // ==========================================================================
  describe('setAnalysisType', () => {
    it('should switch to funnel mode', () => {
      store.getState().setAnalysisType('funnel')
      expect(store.getState().analysisType).toBe('funnel')
    })

    it('should switch to flow mode', () => {
      store.getState().setAnalysisType('flow')
      expect(store.getState().analysisType).toBe('flow')
    })

    it('should switch to retention mode', () => {
      store.getState().setAnalysisType('retention')
      expect(store.getState().analysisType).toBe('retention')
    })

    it('should switch back to query mode', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setAnalysisType('query')
      expect(store.getState().analysisType).toBe('query')
    })

    it('should update activeView from activeViews map when switching modes', () => {
      // Set table view for funnel mode
      store.getState().setAnalysisType('funnel')
      store.getState().setActiveView('table')

      // Switch to query mode
      store.getState().setAnalysisType('query')

      // Switch back to funnel - should restore table view
      store.getState().setAnalysisType('funnel')
      expect(store.getState().activeView).toBe('table')
    })

    it('should preserve chart config when switching between modes', () => {
      // Configure query mode
      store.getState().setChartType('line')

      // Switch to funnel
      store.getState().setAnalysisType('funnel')
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')

      // Switch back to query - should preserve line chart
      store.getState().setAnalysisType('query')
      expect(store.getState().charts.query?.chartType).toBe('line')
    })

    it('should apply default chart config if mode config is missing', () => {
      // Create a fresh store and manually remove a chart config
      const state = store.getState()
      const newCharts = { ...state.charts }
      delete newCharts.funnel

      store.setState({ charts: newCharts })

      // Switch to funnel - should apply default config
      store.getState().setAnalysisType('funnel')

      expect(store.getState().charts.funnel).toBeDefined()
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')
    })

    it('should set default activeView if mode activeView is missing', () => {
      // Manually remove an activeView
      const state = store.getState()
      const newActiveViews = { ...state.activeViews }
      delete newActiveViews.flow

      store.setState({ activeViews: newActiveViews })

      // Switch to flow - should default to chart
      store.getState().setAnalysisType('flow')
      expect(store.getState().activeView).toBe('chart')
      expect(store.getState().activeViews.flow).toBe('chart')
    })
  })

  // ==========================================================================
  // setChartType / setChartTypeManual
  // ==========================================================================
  describe('setChartType', () => {
    it('should update current mode chart type in charts map', () => {
      store.getState().setChartType('line')
      expect(store.getState().charts.query?.chartType).toBe('line')
    })

    it('should update funnel mode chart type when in funnel mode', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setChartType('bar')
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
    })

    it('should update flow mode chart type when in flow mode', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setChartType('sunburst')
      expect(store.getState().charts.flow?.chartType).toBe('sunburst')
    })

    it('should update retention mode chart type when in retention mode', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setChartType('line')
      expect(store.getState().charts.retention?.chartType).toBe('line')
    })

    it('should not affect other modes chart types', () => {
      store.getState().setChartType('line')

      expect(store.getState().charts.query?.chartType).toBe('line')
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')
      expect(store.getState().charts.flow?.chartType).toBe('sankey')
      expect(store.getState().charts.retention?.chartType).toBe('retentionCombined')
    })

    it('should not set userManuallySelectedChart flag', () => {
      store.getState().setChartType('line')
      expect(store.getState().userManuallySelectedChart).toBe(false)
    })
  })

  describe('setChartTypeManual', () => {
    it('should update current mode chart type', () => {
      store.getState().setChartTypeManual('line')
      expect(store.getState().charts.query?.chartType).toBe('line')
    })

    it('should set userManuallySelectedChart flag to true', () => {
      store.getState().setChartTypeManual('line')
      expect(store.getState().userManuallySelectedChart).toBe(true)
    })

    it('should set activeView to chart', () => {
      store.getState().setActiveView('table')
      store.getState().setChartTypeManual('line')
      expect(store.getState().activeView).toBe('chart')
    })

    it('should update activeViews map for current mode', () => {
      store.getState().setActiveView('table')
      store.getState().setChartTypeManual('line')
      expect(store.getState().activeViews.query).toBe('chart')
    })

    it('should work correctly in funnel mode', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setActiveView('table')
      store.getState().setChartTypeManual('bar')

      expect(store.getState().charts.funnel?.chartType).toBe('bar')
      expect(store.getState().userManuallySelectedChart).toBe(true)
      expect(store.getState().activeViews.funnel).toBe('chart')
    })
  })

  // ==========================================================================
  // setChartConfig / setDisplayConfig
  // ==========================================================================
  describe('setChartConfig', () => {
    it('should update current mode chart config in charts map', () => {
      const config: ChartAxisConfig = {
        xAxis: ['dimension1'],
        yAxis: ['measure1'],
      }

      store.getState().setChartConfig(config)

      expect(store.getState().charts.query?.chartConfig).toEqual(config)
    })

    it('should set activeView to chart', () => {
      store.getState().setActiveView('table')
      store.getState().setChartConfig({ xAxis: ['dim1'] })
      expect(store.getState().activeView).toBe('chart')
    })

    it('should update activeViews map for current mode', () => {
      store.getState().setActiveView('table')
      store.getState().setChartConfig({ xAxis: ['dim1'] })
      expect(store.getState().activeViews.query).toBe('chart')
    })

    it('should work correctly in funnel mode', () => {
      store.getState().setAnalysisType('funnel')
      const config: ChartAxisConfig = { series: ['step'] }

      store.getState().setChartConfig(config)

      expect(store.getState().charts.funnel?.chartConfig).toEqual(config)
      expect(store.getState().activeViews.funnel).toBe('chart')
    })

    it('should not affect other modes chart configs', () => {
      const originalFunnelConfig = store.getState().charts.funnel?.chartConfig

      store.getState().setChartConfig({ xAxis: ['newDim'] })

      expect(store.getState().charts.funnel?.chartConfig).toEqual(originalFunnelConfig)
    })
  })

  describe('setDisplayConfig', () => {
    it('should update current mode display config in charts map', () => {
      const displayConfig: ChartDisplayConfig = {
        showLegend: false,
        showGrid: false,
        stacked: true,
      }

      store.getState().setDisplayConfig(displayConfig)

      expect(store.getState().charts.query?.displayConfig).toEqual(displayConfig)
    })

    it('should set activeView to chart', () => {
      store.getState().setActiveView('table')
      store.getState().setDisplayConfig({ showLegend: true })
      expect(store.getState().activeView).toBe('chart')
    })

    it('should update activeViews map for current mode', () => {
      store.getState().setActiveView('table')
      store.getState().setDisplayConfig({ showLegend: true })
      expect(store.getState().activeViews.query).toBe('chart')
    })

    it('should work correctly in flow mode', () => {
      store.getState().setAnalysisType('flow')
      const displayConfig: ChartDisplayConfig = {
        showTooltip: false,
      }

      store.getState().setDisplayConfig(displayConfig)

      expect(store.getState().charts.flow?.displayConfig).toEqual(displayConfig)
      expect(store.getState().activeViews.flow).toBe('chart')
    })

    it('should not affect other modes display configs', () => {
      const originalFunnelDisplayConfig = store.getState().charts.funnel?.displayConfig

      store.getState().setDisplayConfig({ showLegend: false })

      expect(store.getState().charts.funnel?.displayConfig).toEqual(originalFunnelDisplayConfig)
    })
  })

  // ==========================================================================
  // setLocalPaletteName / setUserManuallySelectedChart
  // ==========================================================================
  describe('setLocalPaletteName', () => {
    it('should update palette name', () => {
      store.getState().setLocalPaletteName('vibrant')
      expect(store.getState().localPaletteName).toBe('vibrant')
    })

    it('should allow setting to any string', () => {
      store.getState().setLocalPaletteName('custom-palette-123')
      expect(store.getState().localPaletteName).toBe('custom-palette-123')
    })
  })

  describe('setUserManuallySelectedChart', () => {
    it('should set flag to true', () => {
      store.getState().setUserManuallySelectedChart(true)
      expect(store.getState().userManuallySelectedChart).toBe(true)
    })

    it('should set flag to false', () => {
      store.getState().setUserManuallySelectedChart(true)
      store.getState().setUserManuallySelectedChart(false)
      expect(store.getState().userManuallySelectedChart).toBe(false)
    })
  })

  // ==========================================================================
  // Deprecated Funnel-Specific Setters
  // ==========================================================================
  describe('Deprecated Funnel Setters', () => {
    describe('setFunnelChartType', () => {
      it('should update funnel chart type directly', () => {
        store.getState().setFunnelChartType('bar')
        expect(store.getState().charts.funnel?.chartType).toBe('bar')
      })

      it('should work regardless of current mode', () => {
        store.getState().setAnalysisType('query')
        store.getState().setFunnelChartType('line')
        expect(store.getState().charts.funnel?.chartType).toBe('line')
      })
    })

    describe('setFunnelChartConfig', () => {
      it('should update funnel chart config directly', () => {
        const config: ChartAxisConfig = { xAxis: ['step'] }
        store.getState().setFunnelChartConfig(config)
        expect(store.getState().charts.funnel?.chartConfig).toEqual(config)
      })
    })

    describe('setFunnelDisplayConfig', () => {
      it('should update funnel display config directly', () => {
        const displayConfig: ChartDisplayConfig = { showLegend: false }
        store.getState().setFunnelDisplayConfig(displayConfig)
        expect(store.getState().charts.funnel?.displayConfig).toEqual(displayConfig)
      })
    })
  })

  // ==========================================================================
  // save / load
  // ==========================================================================
  describe('save', () => {
    it('should return AnalysisConfig with correct analysisType for query mode', () => {
      const config = store.getState().save()

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('query')
      expect(config.activeView).toBe('chart')
    })

    it('should return AnalysisConfig with correct analysisType for funnel mode', () => {
      store.getState().setAnalysisType('funnel')
      const config = store.getState().save()

      expect(config.analysisType).toBe('funnel')
    })

    it('should return AnalysisConfig with correct analysisType for flow mode', () => {
      store.getState().setAnalysisType('flow')
      const config = store.getState().save()

      expect(config.analysisType).toBe('flow')
    })

    it('should return AnalysisConfig with correct analysisType for retention mode', () => {
      store.getState().setAnalysisType('retention')
      const config = store.getState().save()

      expect(config.analysisType).toBe('retention')
    })

    it('should include charts map in saved config', () => {
      store.getState().setChartType('line')
      const config = store.getState().save()

      expect(config.charts).toBeDefined()
      expect(config.charts.query?.chartType).toBe('line')
    })

    it('should include activeView from per-mode activeViews', () => {
      store.getState().setActiveView('table')
      const config = store.getState().save()

      expect(config.activeView).toBe('table')
    })

    it('should include query data for query mode', () => {
      store.getState().addMetric('Sales.revenue')
      const config = store.getState().save() as QueryAnalysisConfig

      expect(config.query).toBeDefined()
      expect(config.query.measures).toContain('Sales.revenue')
    })
  })

  describe('load', () => {
    it('should restore state from query config', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'table',
        charts: {
          query: {
            chartType: 'line',
            chartConfig: { xAxis: ['dim1'] },
            displayConfig: { showLegend: false },
          },
        },
        query: {
          measures: ['Sales.revenue'],
          dimensions: ['Products.name'],
        },
      }

      store.getState().load(config)

      expect(store.getState().analysisType).toBe('query')
      expect(store.getState().activeView).toBe('table')
      expect(store.getState().charts.query?.chartType).toBe('line')
    })

    it('should restore state from funnel config', () => {
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: {
            chartType: 'bar',
            chartConfig: {},
            displayConfig: { showLegend: true },
          },
        },
        query: {
          funnel: {
            bindingKey: 'Users.id',
            timeDimension: 'Events.timestamp',
            steps: [{ name: 'Step 1' }],
          },
        },
      }

      store.getState().load(config)

      expect(store.getState().analysisType).toBe('funnel')
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
    })

    it('should preserve other modes settings when loading single mode config', () => {
      // First set up some query mode state
      store.getState().setChartType('line')
      const originalQueryChart = store.getState().charts.query?.chartType

      // Load a funnel config
      const funnelConfig: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: {
            chartType: 'bar',
            chartConfig: {},
            displayConfig: {},
          },
        },
        query: {
          funnel: {
            bindingKey: 'Users.id',
            timeDimension: 'Events.timestamp',
            steps: [],
          },
        },
      }

      store.getState().load(funnelConfig)

      // Query mode settings should be preserved
      expect(store.getState().charts.query?.chartType).toBe(originalQueryChart)
    })

    it('should merge charts from config with existing charts', () => {
      // Set up initial state
      store.getState().setChartType('line') // query mode

      // Load config with only funnel charts
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: {
            chartType: 'area',
            chartConfig: {},
            displayConfig: {},
          },
        },
        query: {
          funnel: {
            bindingKey: '',
            timeDimension: '',
            steps: [],
          },
        },
      }

      store.getState().load(config)

      // Both should be present
      expect(store.getState().charts.query?.chartType).toBe('line')
      expect(store.getState().charts.funnel?.chartType).toBe('area')
    })

    it('should update activeViews map for the loaded mode', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'table',
        charts: {
          query: {
            chartType: 'bar',
            chartConfig: {},
            displayConfig: {},
          },
        },
        query: { measures: [] },
      }

      store.getState().load(config)

      expect(store.getState().activeViews.query).toBe('table')
    })

    it('should apply default chart config if config charts is missing for mode', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      }

      store.getState().load(config)

      expect(store.getState().charts.query).toBeDefined()
      expect(store.getState().charts.query?.chartType).toBe('bar')
    })

    it('should not load invalid config', () => {
      const originalAnalysisType = store.getState().analysisType

      // Invalid config (wrong version)
      const invalidConfig = {
        version: 99,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      } as unknown as AnalysisConfig

      store.getState().load(invalidConfig)

      // State should remain unchanged
      expect(store.getState().analysisType).toBe(originalAnalysisType)
    })
  })

  // ==========================================================================
  // saveWorkspace / loadWorkspace
  // ==========================================================================
  describe('saveWorkspace', () => {
    it('should return AnalysisWorkspace with version 1', () => {
      const workspace = store.getState().saveWorkspace()

      expect(workspace.version).toBe(1)
    })

    it('should return AnalysisWorkspace with current activeType', () => {
      store.getState().setAnalysisType('funnel')
      const workspace = store.getState().saveWorkspace()

      expect(workspace.activeType).toBe('funnel')
    })

    it('should include configs for all modes in modes object', () => {
      const workspace = store.getState().saveWorkspace()

      expect(workspace.modes).toBeDefined()
      expect(workspace.modes.query).toBeDefined()
      expect(workspace.modes.funnel).toBeDefined()
      expect(workspace.modes.flow).toBeDefined()
      expect(workspace.modes.retention).toBeDefined()
    })

    it('should save each mode with correct analysisType', () => {
      const workspace = store.getState().saveWorkspace()

      expect(workspace.modes.query?.analysisType).toBe('query')
      expect(workspace.modes.funnel?.analysisType).toBe('funnel')
      expect(workspace.modes.flow?.analysisType).toBe('flow')
      expect(workspace.modes.retention?.analysisType).toBe('retention')
    })

    it('should preserve state for each mode independently', () => {
      // Configure query mode
      store.getState().setChartType('line')
      store.getState().addMetric('Sales.revenue')

      // Configure funnel mode
      store.getState().setAnalysisType('funnel')
      store.getState().setChartType('bar')

      // Configure flow mode
      store.getState().setAnalysisType('flow')
      store.getState().setChartType('sunburst')

      // Save workspace
      const workspace = store.getState().saveWorkspace()

      // Verify each mode's config
      expect(workspace.modes.query?.charts?.query?.chartType).toBe('line')
      expect(workspace.modes.funnel?.charts?.funnel?.chartType).toBe('bar')
      expect(workspace.modes.flow?.charts?.flow?.chartType).toBe('sunburst')
    })

    it('should include activeView for each mode', () => {
      // Set different views for different modes
      store.getState().setActiveView('table')

      store.getState().setAnalysisType('funnel')
      store.getState().setActiveView('chart')

      const workspace = store.getState().saveWorkspace()

      expect(workspace.modes.query?.activeView).toBe('table')
      expect(workspace.modes.funnel?.activeView).toBe('chart')
    })
  })

  describe('loadWorkspace', () => {
    it('should restore activeType from workspace', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'funnel',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: 'chart',
            charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
            query: { measures: [] },
          },
          funnel: {
            version: 1,
            analysisType: 'funnel',
            activeView: 'chart',
            charts: { funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: {} } },
            query: { funnel: { bindingKey: '', timeDimension: '', steps: [] } },
          },
        },
      }

      store.getState().loadWorkspace(workspace)

      expect(store.getState().analysisType).toBe('funnel')
    })

    it('should restore all modes from workspace', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'query',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: 'table',
            charts: { query: { chartType: 'line', chartConfig: {}, displayConfig: {} } },
            query: { measures: ['Sales.revenue'] },
          },
          funnel: {
            version: 1,
            analysisType: 'funnel',
            activeView: 'chart',
            charts: { funnel: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
            query: { funnel: { bindingKey: 'Users.id', timeDimension: '', steps: [] } },
          },
          flow: {
            version: 1,
            analysisType: 'flow',
            activeView: 'chart',
            charts: { flow: { chartType: 'sunburst', chartConfig: {}, displayConfig: {} } },
            query: {
              flow: {
                bindingKey: 'Events.userId',
                timeDimension: 'Events.timestamp',
                eventDimension: 'Events.type',
                startingStep: { name: 'Start', filter: undefined },
                stepsBefore: 2,
                stepsAfter: 3,
                joinStrategy: 'auto',
              },
            },
          },
          retention: {
            version: 1,
            analysisType: 'retention',
            activeView: 'table',
            charts: { retention: { chartType: 'line', chartConfig: {}, displayConfig: {} } },
            query: {
              retention: {
                timeDimension: 'Events.timestamp',
                bindingKey: 'Events.userId',
                dateRange: { start: '2024-01-01', end: '2024-12-31' },
                granularity: 'week',
                periods: 8,
                retentionType: 'classic',
              },
            },
          },
        },
      }

      store.getState().loadWorkspace(workspace)

      // Check query mode was restored
      expect(store.getState().charts.query?.chartType).toBe('line')
      expect(store.getState().activeViews.query).toBe('table')

      // Check funnel mode was restored
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
      expect(store.getState().funnelBindingKey?.dimension).toBe('Users.id')

      // Check flow mode was restored
      expect(store.getState().charts.flow?.chartType).toBe('sunburst')
      expect(store.getState().flowBindingKey?.dimension).toBe('Events.userId')

      // Check retention mode was restored
      expect(store.getState().charts.retention?.chartType).toBe('line')
      expect(store.getState().activeViews.retention).toBe('table')
    })

    it('should merge charts from all modes', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'query',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: 'chart',
            charts: { query: { chartType: 'area', chartConfig: {}, displayConfig: {} } },
            query: { measures: [] },
          },
          funnel: {
            version: 1,
            analysisType: 'funnel',
            activeView: 'chart',
            charts: { funnel: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
            query: { funnel: { bindingKey: '', timeDimension: '', steps: [] } },
          },
        },
      }

      store.getState().loadWorkspace(workspace)

      // Both should be merged
      expect(store.getState().charts.query?.chartType).toBe('area')
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
    })

    it('should update activeViews from all modes', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'query',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: 'table',
            charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
            query: { measures: [] },
          },
          funnel: {
            version: 1,
            analysisType: 'funnel',
            activeView: 'chart',
            charts: { funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: {} } },
            query: { funnel: { bindingKey: '', timeDimension: '', steps: [] } },
          },
        },
      }

      store.getState().loadWorkspace(workspace)

      expect(store.getState().activeViews.query).toBe('table')
      expect(store.getState().activeViews.funnel).toBe('chart')
    })

    it('should set activeView from the active mode config', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'funnel',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: 'chart',
            charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
            query: { measures: [] },
          },
          funnel: {
            version: 1,
            analysisType: 'funnel',
            activeView: 'table',
            charts: { funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: {} } },
            query: { funnel: { bindingKey: '', timeDimension: '', steps: [] } },
          },
        },
      }

      store.getState().loadWorkspace(workspace)

      // activeView should be from the active mode (funnel)
      expect(store.getState().activeView).toBe('table')
    })

    it('should handle partial workspace with missing modes', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'query',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: 'chart',
            charts: { query: { chartType: 'line', chartConfig: {}, displayConfig: {} } },
            query: { measures: [] },
          },
          // funnel, flow, retention modes are missing
        },
      }

      // Should not throw
      store.getState().loadWorkspace(workspace)

      // Query mode should be loaded
      expect(store.getState().charts.query?.chartType).toBe('line')

      // Other modes should retain their default configs
      expect(store.getState().charts.funnel).toBeDefined()
    })

    it('should default activeView to chart when mode config is missing activeView', () => {
      const workspace: AnalysisWorkspace = {
        version: 1,
        activeType: 'query',
        modes: {
          query: {
            version: 1,
            analysisType: 'query',
            activeView: undefined as unknown as 'chart',
            charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
            query: { measures: [] },
          },
        },
      }

      store.getState().loadWorkspace(workspace)

      expect(store.getState().activeViews.query).toBe('chart')
    })
  })

  // ==========================================================================
  // Round-trip Tests (save -> load)
  // ==========================================================================
  describe('Round-trip Tests', () => {
    it('should preserve query mode state through save/load cycle', () => {
      // Set up state
      store.getState().setChartType('area')
      store.getState().setDisplayConfig({ showLegend: false, stacked: true })
      store.getState().setActiveView('table')
      store.getState().addMetric('Revenue.total')
      store.getState().addBreakdown('Time.month', true, 'month')

      // Save and load
      const config = store.getState().save()
      store.getState().reset()
      store.getState().load(config)

      // Verify
      expect(store.getState().charts.query?.chartType).toBe('area')
      expect(store.getState().charts.query?.displayConfig?.showLegend).toBe(false)
      expect(store.getState().charts.query?.displayConfig?.stacked).toBe(true)
      expect(store.getState().activeView).toBe('table')
    })

    it('should preserve funnel mode state through save/load cycle', () => {
      // Set up funnel state
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setFunnelBindingKey({ dimension: 'Events.userId' })
      store.getState().setFunnelTimeDimension('Events.timestamp')
      store.getState().setChartType('bar')

      // Save and load
      const config = store.getState().save()
      store.getState().reset()
      store.getState().load(config)

      // Verify
      expect(store.getState().analysisType).toBe('funnel')
      expect(store.getState().funnelBindingKey?.dimension).toBe('Events.userId')
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
    })

    it('should preserve all modes through saveWorkspace/loadWorkspace cycle', () => {
      // Configure query mode
      store.getState().setChartType('line')
      store.getState().addMetric('Sales.amount')

      // Configure funnel mode
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setChartType('bar')

      // Configure flow mode
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setChartType('sunburst')

      // Configure retention mode
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Users')
      store.getState().setChartType('line')

      // Stay in retention mode for active type
      const workspace = store.getState().saveWorkspace()

      // Reset and load
      store.getState().reset()
      store.getState().loadWorkspace(workspace)

      // Verify all modes
      expect(store.getState().analysisType).toBe('retention')
      expect(store.getState().charts.query?.chartType).toBe('line')
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
      expect(store.getState().charts.flow?.chartType).toBe('sunburst')
      expect(store.getState().charts.retention?.chartType).toBe('line')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty charts map gracefully in setChartType', () => {
      // Force empty charts state
      store.setState({ charts: {} })

      // Should create the mode's chart config
      store.getState().setChartType('line')

      expect(store.getState().charts.query?.chartType).toBe('line')
    })

    it('should handle missing mode config in setChartConfig', () => {
      // Force missing query config
      const charts = { ...store.getState().charts }
      delete charts.query
      store.setState({ charts })

      // Should create the config
      store.getState().setChartConfig({ xAxis: ['dim1'] })

      expect(store.getState().charts.query?.chartConfig).toEqual({ xAxis: ['dim1'] })
    })

    it('should handle missing mode config in setDisplayConfig', () => {
      // Force missing query config
      const charts = { ...store.getState().charts }
      delete charts.query
      store.setState({ charts })

      // Should create the config
      store.getState().setDisplayConfig({ showLegend: false })

      expect(store.getState().charts.query?.displayConfig).toEqual({ showLegend: false })
    })

    it('should handle rapid mode switching', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setAnalysisType('flow')
      store.getState().setAnalysisType('retention')
      store.getState().setAnalysisType('query')
      store.getState().setAnalysisType('funnel')

      expect(store.getState().analysisType).toBe('funnel')
    })

    it('should handle rapid chart type changes', () => {
      const chartTypes: ChartType[] = ['bar', 'line', 'area', 'pie', 'scatter', 'bar']

      for (const type of chartTypes) {
        store.getState().setChartType(type)
      }

      expect(store.getState().charts.query?.chartType).toBe('bar')
    })

    it('should maintain state isolation between modes', () => {
      // Set up query mode
      store.getState().setChartType('line')
      store.getState().setChartConfig({ xAxis: ['queryDim'] })

      // Set up funnel mode
      store.getState().setAnalysisType('funnel')
      store.getState().setChartType('bar')
      store.getState().setChartConfig({ xAxis: ['funnelDim'] })

      // Verify isolation
      expect(store.getState().charts.query?.chartType).toBe('line')
      expect(store.getState().charts.query?.chartConfig?.xAxis).toEqual(['queryDim'])
      expect(store.getState().charts.funnel?.chartType).toBe('bar')
      expect(store.getState().charts.funnel?.chartConfig?.xAxis).toEqual(['funnelDim'])
    })
  })

  // ==========================================================================
  // Integration with Reset
  // ==========================================================================
  describe('Integration with Reset', () => {
    it('should reset to default state', () => {
      // Make various changes
      store.getState().setAnalysisType('funnel')
      store.getState().setChartType('bar')
      store.getState().setActiveView('table')
      store.getState().setUserManuallySelectedChart(true)

      // Reset
      store.getState().reset()

      // Verify defaults
      expect(store.getState().analysisType).toBe('query')
      expect(store.getState().charts.query?.chartType).toBe('bar')
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')
      expect(store.getState().userManuallySelectedChart).toBe(false)
    })

    it('should reset all activeViews to chart', () => {
      // Set various views
      store.getState().setActiveView('table')
      store.getState().setAnalysisType('funnel')
      store.getState().setActiveView('table')

      // Reset
      store.getState().reset()

      // All should be chart
      expect(store.getState().activeViews.query).toBe('chart')
      expect(store.getState().activeViews.funnel).toBe('chart')
      expect(store.getState().activeViews.flow).toBe('chart')
      expect(store.getState().activeViews.retention).toBe('chart')
    })

    it('should reset localPaletteName to default', () => {
      store.getState().setLocalPaletteName('custom')
      store.getState().reset()
      expect(store.getState().localPaletteName).toBe('default')
    })
  })

  // ==========================================================================
  // Integration with clearCurrentMode
  // ==========================================================================
  describe('Integration with clearCurrentMode', () => {
    it('should clear query mode state', () => {
      store.getState().setChartType('line')
      store.getState().addMetric('Sales.revenue')

      store.getState().clearCurrentMode()

      expect(store.getState().charts.query?.chartType).toBe('bar')
      expect(store.getState().queryStates[0].metrics.length).toBe(0)
    })

    it('should clear funnel mode state', () => {
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')
      store.getState().setChartType('bar')

      store.getState().clearCurrentMode()

      expect(store.getState().funnelCube).toBeNull()
      expect(store.getState().charts.funnel?.chartType).toBe('funnel')
    })

    it('should clear flow mode state', () => {
      store.getState().setAnalysisType('flow')
      store.getState().setFlowCube('Events')
      store.getState().setChartType('sunburst')

      store.getState().clearCurrentMode()

      expect(store.getState().flowCube).toBeNull()
      expect(store.getState().charts.flow?.chartType).toBe('sankey')
    })

    it('should clear retention mode state', () => {
      store.getState().setAnalysisType('retention')
      store.getState().setRetentionCube('Users')
      store.getState().setChartType('line')

      store.getState().clearCurrentMode()

      expect(store.getState().retentionCube).toBeNull()
      expect(store.getState().charts.retention?.chartType).toBe('retentionCombined')
    })

    it('should not affect other modes when clearing current', () => {
      // Set up query mode
      store.getState().setChartType('line')

      // Switch to funnel and set up
      store.getState().setAnalysisType('funnel')
      store.getState().setFunnelCube('Events')

      // Clear funnel mode
      store.getState().clearCurrentMode()

      // Query mode should be preserved
      expect(store.getState().charts.query?.chartType).toBe('line')
    })
  })
})
