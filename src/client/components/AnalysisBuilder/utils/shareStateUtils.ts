/**
 * Share-state extraction utilities
 *
 * Pure helpers that derive per-mode initial state (funnel / flow / retention)
 * from a decoded share-URL AnalysisConfig. Extracted from index.tsx so the
 * component body stays small. Behaviour is identical to the previous inline IIFEs.
 */

import type { AnalysisConfig } from '../../../types/analysisConfig.js'

/**
 * Extract funnel initial state from a shared AnalysisConfig.
 *
 * Phase 3: funnel config is in query.funnel, chart config is in charts.funnel.
 */
export function extractFunnelStateFromShare(sharedState: AnalysisConfig | null) {
  if (!sharedState || sharedState.analysisType !== 'funnel') return undefined
  const funnelQuery = 'funnel' in sharedState.query ? sharedState.query.funnel : null
  if (!funnelQuery) return undefined

  const funnelChartConfig = sharedState.charts?.funnel

  return {
    funnelCube: null, // Not stored in AnalysisConfig directly - will be derived from steps
    funnelSteps: [], // Steps need to be reconstructed from ServerFunnelQuery format
    funnelTimeDimension: typeof funnelQuery.timeDimension === 'string' ? funnelQuery.timeDimension : null,
    funnelBindingKey: funnelQuery.bindingKey
      ? { dimension: funnelQuery.bindingKey }
      : null,
    funnelChartType: funnelChartConfig?.chartType || 'funnel',
    funnelChartConfig: funnelChartConfig?.chartConfig || {},
    funnelDisplayConfig: funnelChartConfig?.displayConfig || {},
  }
}

/**
 * Extract flow initial state from a shared AnalysisConfig.
 */
export function extractFlowStateFromShare(sharedState: AnalysisConfig | null) {
  if (!sharedState || sharedState.analysisType !== 'flow') return undefined
  const flowQuery = 'flow' in sharedState.query ? sharedState.query.flow : null
  if (!flowQuery) return undefined

  const flowChartConfig = sharedState.charts?.flow

  return {
    flowCube: null, // Not stored in AnalysisConfig directly
    flowBindingKey: flowQuery.bindingKey
      ? (typeof flowQuery.bindingKey === 'string'
          ? { dimension: flowQuery.bindingKey }
          : { dimension: flowQuery.bindingKey[0]?.dimension || '' })
      : null,
    flowTimeDimension: typeof flowQuery.timeDimension === 'string'
      ? flowQuery.timeDimension
      : flowQuery.timeDimension?.[0]?.dimension || null,
    startingStep: flowQuery.startingStep
      ? {
          name: flowQuery.startingStep.name || '',
          filters: Array.isArray(flowQuery.startingStep.filter)
            ? flowQuery.startingStep.filter
            : flowQuery.startingStep.filter
              ? [flowQuery.startingStep.filter]
              : [],
        }
      : { name: '', filters: [] },
    stepsBefore: flowQuery.stepsBefore ?? 3,
    stepsAfter: flowQuery.stepsAfter ?? 3,
    eventDimension: flowQuery.eventDimension || null,
    flowChartType: flowChartConfig?.chartType || 'sankey',
    flowChartConfig: flowChartConfig?.chartConfig || {},
    flowDisplayConfig: flowChartConfig?.displayConfig || {},
  }
}

/**
 * Extract retention initial state from a shared AnalysisConfig.
 */
export function extractRetentionStateFromShare(sharedState: AnalysisConfig | null) {
  if (!sharedState || sharedState.analysisType !== 'retention') return undefined
  const retentionQuery = 'retention' in sharedState.query ? sharedState.query.retention : null
  if (!retentionQuery) return undefined

  const retentionChartConfig = sharedState.charts?.retention

  return {
    retentionCube: null, // Not stored directly - derived from timeDimension
    retentionBindingKey: retentionQuery.bindingKey
      ? (typeof retentionQuery.bindingKey === 'string'
          ? { dimension: retentionQuery.bindingKey }
          : { dimension: retentionQuery.bindingKey })
      : null,
    retentionTimeDimension: typeof retentionQuery.timeDimension === 'string'
      ? retentionQuery.timeDimension
      : null,
    retentionDateRange: retentionQuery.dateRange,
    retentionCohortFilters: Array.isArray(retentionQuery.cohortFilters)
      ? retentionQuery.cohortFilters
      : retentionQuery.cohortFilters
        ? [retentionQuery.cohortFilters]
        : [],
    retentionActivityFilters: Array.isArray(retentionQuery.activityFilters)
      ? retentionQuery.activityFilters
      : retentionQuery.activityFilters
        ? [retentionQuery.activityFilters]
        : [],
    retentionBreakdowns: retentionQuery.breakdownDimensions?.map((field: string) => ({
      field,
      label: field.split('.').pop() || field,
    })) || [],
    retentionViewGranularity: retentionQuery.granularity || 'week',
    retentionPeriods: retentionQuery.periods || 12,
    retentionType: retentionQuery.retentionType || 'classic',
    retentionChartType: retentionChartConfig?.chartType || 'retentionCombined',
    retentionChartConfig: retentionChartConfig?.chartConfig || {},
    retentionDisplayConfig: retentionChartConfig?.displayConfig || {},
  }
}
