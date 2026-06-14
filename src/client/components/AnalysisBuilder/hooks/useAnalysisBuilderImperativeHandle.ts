/**
 * useAnalysisBuilderImperativeHandle Hook
 *
 * Wires the AnalysisBuilder ref API (getQueryConfig, getFunnelState, etc.).
 * Extracted from index.tsx to keep AnalysisBuilderInner's body flat — behaviour
 * is identical to the previous inline useImperativeHandle.
 */

import { useImperativeHandle } from 'react'
import type { Ref } from 'react'
import type { StoreApi } from 'zustand'
import type { AnalysisBuilderRef } from '../types'
import type { AnalysisBuilderStore } from '../../../stores/analysisBuilderStore'

interface ImperativeHandleDeps {
  getQueryConfig: AnalysisBuilderRef['getQueryConfig']
  getChartConfig: AnalysisBuilderRef['getChartConfig']
  getAnalysisType: AnalysisBuilderRef['getAnalysisType']
  clearQuery: AnalysisBuilderRef['clearQuery']
  storeApi: StoreApi<AnalysisBuilderStore>
}

export function useAnalysisBuilderImperativeHandle(
  ref: Ref<AnalysisBuilderRef>,
  deps: ImperativeHandleDeps
): void {
  const { getQueryConfig, getChartConfig, getAnalysisType, clearQuery, storeApi } = deps

  useImperativeHandle(
    ref,
    () => ({
      getQueryConfig,
      getChartConfig,
      getAnalysisType,
      getFunnelState: () => {
        // Read directly from store to ensure fresh values (same pattern as getQueryConfig/getChartConfig)
        const state = storeApi.getState()
        // Get funnel chart config from charts map (Phase 4 - use charts map)
        const funnelConfig = state.charts.funnel || {
          chartType: 'funnel' as const,
          chartConfig: {},
          displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
        }
        return {
          funnelCube: state.funnelCube,
          funnelSteps: state.funnelSteps,
          funnelTimeDimension: state.funnelTimeDimension,
          funnelBindingKey: state.funnelBindingKey,
          funnelChartType: funnelConfig.chartType,
          funnelChartConfig: funnelConfig.chartConfig,
          funnelDisplayConfig: funnelConfig.displayConfig,
          activeFunnelStepIndex: state.activeFunnelStepIndex,
        }
      },
      // Phase 3: Complete AnalysisConfig from store.save()
      getAnalysisConfig: () => storeApi.getState().save(),
      executeQuery: () => {
        // Manual execute would refetch - for now just invalidate cache
        // This could be enhanced to trigger a refetch
      },
      clearQuery
    }),
    [getQueryConfig, getChartConfig, getAnalysisType, clearQuery, storeApi]
  )
}
