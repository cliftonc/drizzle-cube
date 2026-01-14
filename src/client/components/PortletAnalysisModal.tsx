import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Modal from './Modal'
import AnalysisBuilder from './AnalysisBuilderLazy'
import type { AnalysisBuilderRef, AnalysisBuilderInitialFunnelState, AnalysisBuilderInitialFlowState } from './AnalysisBuilder/types'
import type { PortletConfig, ColorPalette, CubeQuery, MultiQueryConfig, DashboardFilter, AnalysisType } from '../types'
import type { AnalysisConfig } from '../types/analysisConfig'
import { ensureAnalysisConfig } from '../utils/configMigration'
import { funnelModeAdapter } from '../adapters/funnelModeAdapter'
import { flowModeAdapter } from '../adapters/flowModeAdapter'
import {
  mergeDashboardAndPortletFilters,
  applyUniversalTimeFilters
} from '../utils/filterUtils'

interface PortletAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void
  portlet?: PortletConfig | null
  /** Initial data to display (avoids re-fetching when editing) */
  initialData?: any[]
  title: string
  submitText: string
  colorPalette?: ColorPalette
  /** Dashboard filters to apply to preview (when editing portlet in dashboard context) */
  dashboardFilters?: DashboardFilter[]
}

/**
 * PortletAnalysisModal - A modal wrapper around AnalysisBuilder for portlet editing
 *
 * This replaces PortletEditModal with the modern AnalysisBuilder interface.
 * Features:
 * - Two-panel layout with results and query builder
 * - Auto-execution of queries
 * - Smart chart defaults
 * - Title input in header
 * - Initial data support (no re-fetch when editing)
 */
export default function PortletAnalysisModal({
  isOpen,
  onClose,
  onSave,
  portlet,
  initialData,
  title: modalTitle,
  submitText,
  colorPalette,
  dashboardFilters
}: PortletAnalysisModalProps) {

  // Ref to AnalysisBuilder for getting current query and chart config
  const builderRef = useRef<AnalysisBuilderRef>(null)

  // Title state
  const [formTitle, setFormTitle] = useState('')

  // Get applicable regular dashboard filters for this portlet
  // Universal time filters are handled separately - they apply to timeDimensions, not the filters array
  const applicableFilters = useMemo(() => {
    if (!dashboardFilters || !portlet?.dashboardFilterMapping) {
      return []
    }
    const mapping = portlet.dashboardFilterMapping
    // Only include regular filters (not universal time filters which use __universal_time__ placeholder)
    return dashboardFilters
      .filter(df => !df.isUniversalTime && mapping.includes(df.id))
      .map(df => df.filter)
  }, [dashboardFilters, portlet?.dashboardFilterMapping])

  // =========================================================================
  // Load from analysisConfig (migrating from legacy format if needed)
  // =========================================================================
  const derivedConfig = useMemo<AnalysisConfig | null>(() => {
    if (!portlet) return null

    // Use ensureAnalysisConfig which handles both new and legacy formats
    const normalizedPortlet = ensureAnalysisConfig(portlet)
    return normalizedPortlet.analysisConfig
  }, [portlet])

  // Parse initial query from derived config and merge dashboard filters
  // AnalysisBuilder handles both single CubeQuery and MultiQueryConfig internally
  const initialQuery = useMemo<CubeQuery | MultiQueryConfig | undefined>(() => {
    if (!derivedConfig) return undefined

    // Get query from derived config
    const query = derivedConfig.query
    if (!query) return undefined

    // Handle funnel mode - return the ServerFunnelQuery as-is (no filter merging)
    if (derivedConfig.analysisType === 'funnel') {
      // For funnel, query is ServerFunnelQuery - return as-is
      return query as CubeQuery | MultiQueryConfig
    }

    // Handle MultiQueryConfig
    if ('queries' in query && Array.isArray(query.queries)) {
      return {
        ...query,
        queries: query.queries.map((q: CubeQuery) => ({
          ...q,
          // Merge regular dashboard filters (not universal time)
          filters: mergeDashboardAndPortletFilters(applicableFilters, q.filters, 'client'),
          // Apply universal time filter dateRange to all time dimensions
          timeDimensions: applyUniversalTimeFilters(
            dashboardFilters,
            portlet?.dashboardFilterMapping,
            q.timeDimensions
          )
        }))
      }
    }

    // Handle single CubeQuery
    const cubeQuery = query as CubeQuery
    return {
      ...cubeQuery,
      // Merge regular dashboard filters (not universal time)
      filters: mergeDashboardAndPortletFilters(applicableFilters, cubeQuery.filters, 'client'),
      // Apply universal time filter dateRange to all time dimensions
      timeDimensions: applyUniversalTimeFilters(
        dashboardFilters,
        portlet?.dashboardFilterMapping,
        cubeQuery.timeDimensions
      )
    }
  }, [derivedConfig, applicableFilters, dashboardFilters, portlet?.dashboardFilterMapping])

  // Initial chart config from derived config
  const initialChartConfig = useMemo(() => {
    if (!derivedConfig) return undefined

    // Get chart config for current mode
    const modeCharts = derivedConfig.charts[derivedConfig.analysisType]
    if (!modeCharts) return undefined

    return {
      chartType: modeCharts.chartType,
      chartConfig: modeCharts.chartConfig,
      displayConfig: modeCharts.displayConfig
    }
  }, [derivedConfig])

  // Initial analysis type from derived config
  const initialAnalysisType: AnalysisType | undefined = derivedConfig?.analysisType

  // Initial funnel state from portlet (when analysisType === 'funnel')
  // Note: The funnel query data is in derivedConfig.query, but we need to pass
  // the store-level funnel state (funnelCube, funnelSteps, etc.) separately
  const initialFunnelState: AnalysisBuilderInitialFunnelState | undefined = useMemo(() => {
    if (derivedConfig?.analysisType !== 'funnel') return undefined

    // Option 1: Use legacy fields if present (backward compatibility)
    if (portlet?.funnelSteps && portlet.funnelSteps.length > 0) {
      return {
        funnelCube: portlet.funnelCube,
        funnelSteps: portlet.funnelSteps,
        funnelTimeDimension: portlet.funnelTimeDimension,
        funnelBindingKey: portlet.funnelBindingKey,
        funnelChartType: portlet.funnelChartType,
        funnelChartConfig: portlet.funnelChartConfig,
        funnelDisplayConfig: portlet.funnelDisplayConfig,
      }
    }

    // Option 2: Parse from analysisConfig.query (Phase 4 implementation)
    // This handles the case where only analysisConfig exists (no legacy fields)
    if (derivedConfig.query && 'funnel' in derivedConfig.query) {
      // Use adapter's conversion logic - already handles all formats
      const funnelState = funnelModeAdapter.load(derivedConfig)
      const chartConfig = derivedConfig.charts?.funnel

      return {
        ...funnelState,
        funnelChartType: chartConfig?.chartType,
        funnelChartConfig: chartConfig?.chartConfig,
        funnelDisplayConfig: chartConfig?.displayConfig,
      }
    }

    return undefined
  }, [derivedConfig, portlet])

  // Initial flow state from portlet (when analysisType === 'flow')
  const initialFlowState: AnalysisBuilderInitialFlowState | undefined = useMemo(() => {
    if (derivedConfig?.analysisType !== 'flow') return undefined

    // Parse from analysisConfig.query
    if (derivedConfig.query && 'flow' in derivedConfig.query) {
      // Use adapter's conversion logic
      const flowState = flowModeAdapter.load(derivedConfig)
      const chartConfig = derivedConfig.charts?.flow

      return {
        ...flowState,
        flowChartType: chartConfig?.chartType,
        flowChartConfig: chartConfig?.chartConfig,
        flowDisplayConfig: chartConfig?.displayConfig,
      }
    }

    return undefined
  }, [derivedConfig])

  // Reset form state when modal opens/closes or portlet changes
  useEffect(() => {
    if (isOpen) {
      setFormTitle(portlet?.title || '')
    }
  }, [isOpen, portlet])

  // Handle save - Phase 4: Only save analysisConfig (no more dual-write)
  const handleSave = useCallback(() => {
    if (!formTitle.trim()) {
      alert('Please enter a title for the portlet.')
      return
    }

    // Get AnalysisConfig from store - this is the only format we save now
    const analysisConfig = builderRef.current?.getAnalysisConfig()

    if (!analysisConfig) {
      alert('Please configure a query before saving.')
      return
    }

    // Validate content based on analysis type
    const { query, analysisType } = analysisConfig
    let hasContent = false

    // Check for ServerFlowQuery format { flow: {...} }
    if ('flow' in query && query.flow) {
      // Flow mode: check for required configuration
      hasContent = !!(
        query.flow.bindingKey &&
        query.flow.timeDimension &&
        query.flow.eventDimension &&
        query.flow.startingStep?.filter
      )
    } else if ('funnel' in query && query.funnel) {
      // Funnel mode: check for steps
      hasContent = !!(query.funnel.steps && query.funnel.steps.length >= 2)
    } else if ('queries' in query) {
      // Multi-query: check the first query
      const firstQuery = query.queries[0]
      hasContent = !!(
        (firstQuery?.measures && firstQuery.measures.length > 0) ||
        (firstQuery?.dimensions && firstQuery.dimensions.length > 0) ||
        (firstQuery?.timeDimensions && firstQuery.timeDimensions.length > 0)
      )
    } else {
      // Single query: check directly (type narrowed to CubeQuery)
      const cubeQuery = query as CubeQuery
      hasContent = !!(
        (cubeQuery.measures && cubeQuery.measures.length > 0) ||
        (cubeQuery.dimensions && cubeQuery.dimensions.length > 0) ||
        (cubeQuery.timeDimensions && cubeQuery.timeDimensions.length > 0)
      )
    }

    if (!hasContent) {
      let message: string
      if (analysisType === 'flow') {
        message = 'Please configure the flow analysis (binding key, time dimension, event dimension, and starting step filter).'
      } else if (analysisType === 'funnel') {
        message = 'Please add at least two funnel steps.'
      } else {
        message = 'Please add at least one metric or breakdown to your query.'
      }
      alert(message)
      return
    }

    // Build portlet config with ONLY analysisConfig (no more legacy fields)
    const portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'> = {
      ...(portlet || {}),
      title: formTitle.trim(),

      // === Canonical format - single source of truth ===
      analysisConfig,

      // Preserve dashboard filter mapping and eager load settings
      dashboardFilterMapping: portlet?.dashboardFilterMapping,
      eagerLoad: portlet?.eagerLoad,

      // Preserve existing position or use defaults for new portlets
      w: portlet?.w || 5,
      h: portlet?.h || 4
    } as PortletConfig

    onSave(portletData)
    onClose()
  }, [formTitle, portlet, onSave, onClose])

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  // Footer with save/cancel buttons
  const footer = (
    <>
      <button
        type="button"
        onClick={handleCancel}
        className="px-4 py-2 text-sm font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface border border-dc-border rounded-md hover:bg-dc-surface-hover transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 text-sm font-medium text-white bg-dc-accent hover:bg-dc-accent-hover rounded-md transition-colors"
      >
        {submitText}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="fullscreen-mobile"
      showCloseButton={true}
      closeOnBackdropClick={false}
      closeOnEscape={true}
      noPadding={true}
      footer={footer}
    >
      {/* Custom content with title input */}
      <div className="flex flex-col h-full">
        {/* Title input section */}
        <div className="shrink-0 px-4 py-3 border-b border-dc-border bg-dc-surface-secondary">
          <div className="flex items-center gap-3">
            <label htmlFor="portlet-title" className="text-sm font-medium text-dc-text-secondary shrink-0">
              Title
            </label>
            <input
              id="portlet-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter portlet title..."
              autoComplete="off"
              className="flex-1 px-3 py-1.5 text-sm bg-dc-surface border border-dc-border rounded-md text-dc-text placeholder-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-accent focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* AnalysisBuilder content */}
        <div className="flex-1 min-h-0">
          <AnalysisBuilder
            ref={builderRef}
            maxHeight="100%"
            initialQuery={initialQuery}
            initialChartConfig={initialChartConfig}
            initialAnalysisType={initialAnalysisType}
            initialFunnelState={initialFunnelState}
            initialFlowState={initialFlowState}
            initialData={initialData}
            colorPalette={colorPalette}
            disableLocalStorage={true}
            className="h-full"
          />
        </div>
      </div>
    </Modal>
  )
}
