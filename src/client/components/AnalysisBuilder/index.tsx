/**
 * AnalysisBuilder Component (Refactored)
 *
 * A redesigned query builder with a modern UX:
 * - Results panel on the left (large)
 * - Query builder panel on the right
 * - Search-based field selection via modal
 * - Sections: Metrics (measures), Breakdown (dimensions), Filters
 * - Auto-execute queries on field changes
 *
 * This refactored version uses:
 * - `useAnalysisBuilder` master hook for all state and data fetching
 * - `useAnalysisShare` for share URL functionality
 * - `useAnalysisAI` for AI query generation
 * - Zustand store (via Context) for state management
 * - TanStack Query (via the master hook) for data fetching
 *
 * ARCHITECTURE: Instance-based stores
 * - Each AnalysisBuilder gets its own Zustand store instance
 * - Standalone mode: Uses localStorage persistence
 * - Modal/portlet editing: No persistence, initializes from props
 */

import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { useCubeFeatures, useCubeMeta } from '../../providers/CubeProvider'
import { AnalysisBuilderStoreProvider } from '../../stores/analysisBuilderStore'
import { useAnalysisBuilder } from '../../hooks/useAnalysisBuilderHook'
import { useAnalysisBuilderStoreApi } from '../../stores/analysisBuilderStore'
import { useAnalysisAI } from '../../hooks/useAnalysisAI'
import { useAnalysisShare } from '../../hooks/useAnalysisShare'
import { parseShareHash, decodeAndDecompress } from '../../utils/shareUtils'
import type {
  AnalysisBuilderProps,
  AnalysisBuilderRef,
} from './types'
import FieldSearchModal from './FieldSearchModal'
import AnalysisResultsPanel from './AnalysisResultsPanel'
import AnalysisQueryPanel from './AnalysisQueryPanel'
import AnalysisAIPanel from './AnalysisAIPanel'
import AnalysisModeErrorBoundary from './AnalysisModeErrorBoundary'
import type { MetaResponse } from '../../shared/types'

/**
 * Inner component that uses the store (must be inside provider)
 */
interface AnalysisBuilderInnerProps extends Omit<AnalysisBuilderProps, 'initialQuery' | 'initialChartConfig' | 'disableLocalStorage'> {
  hideShare?: boolean
}

const AnalysisBuilderInner = forwardRef<AnalysisBuilderRef, AnalysisBuilderInnerProps>(
  (
    {
      className = '',
      maxHeight,
      initialData,
      colorPalette: externalColorPalette,
      hideSettings: _hideSettings = false,
      hideShare = false,
      onQueryChange,
      onChartConfigChange
    },
    ref
  ) => {
    // Mark unused props for future use
    void _hideSettings

    // Get context
    const { meta } = useCubeMeta()
    const { features } = useCubeFeatures()

    // ========================================================================
    // Master Hook - Provides all state, data fetching, and actions
    // ========================================================================
    const analysis = useAnalysisBuilder({
      initialData,
      externalColorPalette,
      onQueryChange,
      onChartConfigChange,
    })

    // ========================================================================
    // AI Hook - Provides AI query generation functionality
    // ========================================================================

    // Get the store API for AI integration
    const storeApi = useAnalysisBuilderStoreApi()

    const {
      aiState,
      handleOpenAI,
      handleCloseAI,
      handleAIPromptChange,
      handleGenerateAI,
      handleAcceptAI,
      handleCancelAI
    } = useAnalysisAI({
      state: analysis.queryState,
      setState: (updater) => {
        // AI hook needs to update metrics, breakdowns, and filters all at once
        // Use the store's updateQueryState to apply the full state update
        const state = storeApi.getState()
        state.updateQueryState(analysis.activeQueryIndex, (prev) => {
          const newState = typeof updater === 'function' ? updater(prev) : updater
          return {
            ...prev,
            metrics: newState.metrics,
            breakdowns: newState.breakdowns,
            filters: newState.filters,
          }
        })
      },
      chartType: analysis.chartType,
      setChartType: analysis.actions.setChartType,
      chartConfig: analysis.chartConfig,
      setChartConfig: analysis.actions.setChartConfig,
      displayConfig: analysis.displayConfig,
      setDisplayConfig: analysis.actions.setDisplayConfig,
      setUserManuallySelectedChart: () => {
        // The store handles this internally via setChartTypeManual
      },
      setActiveView: analysis.actions.setActiveView,
      aiEndpoint: features?.aiEndpoint,
      // Funnel mode support
      analysisType: analysis.analysisType,
      setAnalysisType: analysis.actions.setAnalysisType,
      loadFunnelFromServerQuery: (serverQuery) => {
        // Create a FunnelAnalysisConfig and load it via the store
        const funnelConfig = {
          version: 1 as const,
          analysisType: 'funnel' as const,
          activeView: 'chart' as const,
          charts: {
            funnel: {
              chartType: 'funnel' as const,
              chartConfig: {},
              displayConfig: {},
            },
          },
          query: serverQuery,
        }
        storeApi.getState().load(funnelConfig)
      },
      // Full config snapshot/restore for complete undo (handles funnel mode properly)
      getFullConfig: () => storeApi.getState().save(),
      loadFullConfig: (config) => storeApi.getState().load(config),
    })

    // ========================================================================
    // Share Hook - Provides share URL functionality
    // Uses store.save() to get AnalysisConfig directly (Phase 3)
    // ========================================================================
    const {
      shareButtonState,
      handleShare
    } = useAnalysisShare({
      isValidQuery: analysis.isValidQuery,
      getAnalysisConfig: () => storeApi.getState().save(),
    })

    // ========================================================================
    // Derived Values
    // ========================================================================

    // Check if current mode can be cleared
    const canClear = useMemo(() => {
      if (analysis.analysisType === 'funnel') {
        // Funnel mode: can clear if there are steps, cube selected, or configuration
        return (
          analysis.funnelSteps.length > 0 ||
          analysis.funnelCube !== null ||
          analysis.funnelBindingKey !== null ||
          analysis.funnelTimeDimension !== null
        )
      }
      // Query mode: can clear if there are metrics, breakdowns, or filters
      return (
        analysis.queryState.metrics.length > 0 ||
        analysis.queryState.breakdowns.length > 0 ||
        analysis.queryState.filters.length > 0
      )
    }, [
      analysis.analysisType,
      analysis.funnelSteps.length,
      analysis.funnelCube,
      analysis.funnelBindingKey,
      analysis.funnelTimeDimension,
      analysis.queryState.metrics.length,
      analysis.queryState.breakdowns.length,
      analysis.queryState.filters.length
    ])

    // ========================================================================
    // Expose API via ref
    // ========================================================================
    useImperativeHandle(
      ref,
      () => ({
        getQueryConfig: analysis.getQueryConfig,
        getChartConfig: analysis.getChartConfig,
        getAnalysisType: analysis.getAnalysisType,
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
        clearQuery: analysis.actions.clearQuery
      }),
      [
        analysis.getQueryConfig,
        analysis.getChartConfig,
        analysis.getAnalysisType,
        analysis.actions.clearQuery,
        storeApi
      ]
    )

    // ========================================================================
    // Render
    // ========================================================================
    return (
      <div
        className={`dc:flex dc:flex-col dc:lg:flex-row bg-dc-surface dc:border-x dc:border-b border-dc-border ${maxHeight ? 'dc:lg:h-[var(--dc-max-h)] dc:lg:max-h-[var(--dc-max-h)] dc:lg:overflow-hidden' : 'dc:lg:h-full'} ${className}`}
        style={maxHeight ? { ['--dc-max-h' as string]: maxHeight } : undefined}
      >
        {/* Top/Left Panel - Results */}
        <div className="dc:h-[60vh] dc:lg:h-auto dc:lg:flex-1 dc:min-w-0 dc:border-b dc:lg:border-b-0 dc:lg:border-r border-dc-border dc:overflow-auto dc:flex dc:flex-col">
          {/* AI Panel - expands above results when open */}
          {aiState.isOpen && (
            <AnalysisAIPanel
              userPrompt={aiState.userPrompt}
              onPromptChange={handleAIPromptChange}
              isGenerating={aiState.isGenerating}
              error={aiState.error}
              hasGeneratedQuery={aiState.hasGeneratedQuery}
              onGenerate={handleGenerateAI}
              onAccept={handleAcceptAI}
              onCancel={handleCancelAI}
            />
          )}

          {/* Results Panel */}
          <div className="dc:flex-1 dc:overflow-auto">
            <AnalysisResultsPanel
              executionStatus={analysis.executionStatus}
              executionResults={analysis.executionResults}
              executionError={analysis.error?.message || null}
              totalRowCount={null}
              resultsStale={analysis.isLoading && analysis.executionResults !== null}
              chartType={analysis.chartType}
              chartConfig={analysis.chartConfig}
              displayConfig={
                analysis.analysisType === 'flow'
                  ? analysis.flowDisplayConfig
                  : analysis.analysisType === 'funnel'
                    ? analysis.funnelDisplayConfig
                    : analysis.displayConfig
              }
              colorPalette={analysis.colorPalette}
              // Only show palette selector in standalone mode (not when editing portlet)
              currentPaletteName={!externalColorPalette ? analysis.localPaletteName : undefined}
              onColorPaletteChange={!externalColorPalette ? analysis.actions.setLocalPaletteName : undefined}
              allQueries={analysis.allQueries}
              funnelExecutedQueries={analysis.funnelExecutedQueries ?? undefined}
              schema={meta as MetaResponse | null}
              activeView={analysis.activeView}
              onActiveViewChange={analysis.actions.setActiveView}
              displayLimit={analysis.displayLimit}
              onDisplayLimitChange={analysis.actions.setDisplayLimit}
              hasMetrics={analysis.analysisType === 'funnel' ? (analysis.funnelSteps.length >= 2 && !!analysis.funnelBindingKey && !!analysis.funnelTimeDimension) : analysis.queryState.metrics.length > 0}
              // Debug props - per-query debug data for multi-query mode
              debugDataPerQuery={analysis.debugDataPerQuery}
              // Share props (hidden when viewing shared analysis with initialQuery)
              onShareClick={hideShare ? undefined : handleShare}
              canShare={hideShare ? false : analysis.isValidQuery}
              shareButtonState={shareButtonState}
              // Refresh props
              onRefreshClick={analysis.actions.refetch}
              canRefresh={analysis.isValidQuery}
              isRefreshing={analysis.isFetching}
              needsRefresh={analysis.needsRefresh}
              // Clear props - use clearCurrentMode to handle both query and funnel modes
              onClearClick={analysis.actions.clearCurrentMode}
              canClear={canClear}
              // AI props
              enableAI={features?.enableAI !== false}
              isAIOpen={aiState.isOpen}
              onAIToggle={aiState.isOpen ? handleCloseAI : handleOpenAI}
              // Multi-query props
              queryCount={analysis.queryStates.length}
              perQueryResults={analysis.perQueryResults ?? undefined}
              activeTableIndex={analysis.activeTableIndex}
              onActiveTableChange={analysis.actions.setActiveTableIndex}
              // Analysis type (new) - primary way to detect mode
              analysisType={analysis.analysisType}
              // Legacy funnel mode prop (deprecated)
              isFunnelMode={analysis.isFunnelModeEnabled}
              // Funnel debug props
              funnelServerQuery={analysis.funnelServerQuery}
              funnelDebugData={analysis.funnelDebugData}
              // Flow debug props
              flowServerQuery={analysis.flowServerQuery}
              flowDebugData={analysis.flowDebugData}
              // Retention debug props
              retentionServerQuery={analysis.retentionServerQuery}
              retentionDebugData={analysis.retentionDebugData}
              retentionChartData={analysis.retentionChartData}
              retentionValidation={analysis.retentionValidation}
            />
          </div>
        </div>

        {/* Bottom/Right Panel - Query Builder */}
        <div className="dc:w-full dc:lg:w-96 dc:flex-shrink-0 dc:lg:h-full dc:overflow-auto dc:lg:overflow-hidden">
          <AnalysisModeErrorBoundary
            analysisType={analysis.analysisType}
            onSwitchToSafeMode={() => analysis.actions.setAnalysisType('query')}
          >
            <AnalysisQueryPanel
            metrics={analysis.queryState.metrics}
            breakdowns={analysis.effectiveBreakdowns}
            filters={analysis.queryState.filters}
            schema={meta as MetaResponse | null}
            activeTab={analysis.activeTab}
            onActiveTabChange={analysis.actions.setActiveTab}
            onAddMetric={analysis.actions.openMetricsModal}
            onRemoveMetric={analysis.actions.removeMetric}
            onReorderMetrics={analysis.actions.reorderMetrics}
            onAddBreakdown={analysis.actions.openBreakdownsModal}
            onRemoveBreakdown={analysis.actions.removeBreakdown}
            onBreakdownGranularityChange={analysis.actions.setBreakdownGranularity}
            onBreakdownComparisonToggle={analysis.actions.toggleBreakdownComparison}
            onReorderBreakdowns={analysis.actions.reorderBreakdowns}
            onFiltersChange={analysis.actions.setFilters}
            onDropFieldToFilter={analysis.actions.dropFieldToFilter}
            order={analysis.queryState.order}
            onOrderChange={analysis.actions.setOrder}
            chartType={analysis.chartType}
            chartConfig={analysis.chartConfig}
            displayConfig={analysis.displayConfig}
            colorPalette={analysis.colorPalette}
            chartAvailability={analysis.chartAvailability}
            onChartTypeChange={analysis.actions.setChartType}
            onChartConfigChange={analysis.actions.setChartConfig}
            onDisplayConfigChange={analysis.actions.setDisplayConfig}
            validationStatus={analysis.queryState.validationStatus}
            validationError={analysis.queryState.validationError}
            // Multi-query props
            queryCount={analysis.queryStates.length}
            activeQueryIndex={analysis.activeQueryIndex}
            mergeStrategy={analysis.mergeStrategy}
            onActiveQueryChange={analysis.actions.setActiveQueryIndex}
            onAddQuery={analysis.actions.addQuery}
            onRemoveQuery={analysis.actions.removeQuery}
            onMergeStrategyChange={analysis.actions.setMergeStrategy}
            breakdownsLocked={analysis.mergeStrategy === 'merge' && analysis.activeQueryIndex > 0}
            combinedMetrics={analysis.combinedMetrics}
            combinedBreakdowns={analysis.combinedBreakdowns}
            multiQueryValidation={analysis.multiQueryValidation}
            adapterValidation={analysis.adapterValidation}
            // Funnel props (legacy - merge strategy mode)
            funnelBindingKey={analysis.funnelBindingKey}
            onFunnelBindingKeyChange={analysis.actions.setFunnelBindingKey}
            // Analysis Type props (new)
            analysisType={analysis.analysisType}
            onAnalysisTypeChange={analysis.actions.setAnalysisType}
            // Funnel Mode props (new dedicated state)
            funnelCube={analysis.funnelCube}
            funnelSteps={analysis.funnelSteps}
            activeFunnelStepIndex={analysis.activeFunnelStepIndex}
            funnelTimeDimension={analysis.funnelTimeDimension}
            onFunnelCubeChange={analysis.actions.setFunnelCube}
            onAddFunnelStep={analysis.actions.addFunnelStep}
            onRemoveFunnelStep={analysis.actions.removeFunnelStep}
            onUpdateFunnelStep={analysis.actions.updateFunnelStep}
            onSelectFunnelStep={analysis.actions.setActiveFunnelStepIndex}
            onReorderFunnelSteps={analysis.actions.reorderFunnelSteps}
            onFunnelTimeDimensionChange={analysis.actions.setFunnelTimeDimension}
            // Funnel display config (for Display tab in funnel mode)
            funnelDisplayConfig={analysis.funnelDisplayConfig}
            onFunnelDisplayConfigChange={analysis.actions.setFunnelDisplayConfig}
            // Flow Mode props
            flowCube={analysis.flowCube}
            flowBindingKey={analysis.flowBindingKey}
            flowTimeDimension={analysis.flowTimeDimension}
            eventDimension={analysis.eventDimension}
            startingStep={analysis.startingStep}
            stepsBefore={analysis.stepsBefore}
            stepsAfter={analysis.stepsAfter}
            flowJoinStrategy={analysis.joinStrategy}
            onFlowCubeChange={analysis.actions.setFlowCube}
            onFlowBindingKeyChange={analysis.actions.setFlowBindingKey}
            onFlowTimeDimensionChange={analysis.actions.setFlowTimeDimension}
            onEventDimensionChange={analysis.actions.setEventDimension}
            onStartingStepFiltersChange={analysis.actions.setStartingStepFilters}
            onStepsBeforeChange={analysis.actions.setStepsBefore}
            onStepsAfterChange={analysis.actions.setStepsAfter}
            onFlowJoinStrategyChange={analysis.actions.setJoinStrategy}
            flowDisplayConfig={analysis.flowDisplayConfig}
            onFlowDisplayConfigChange={analysis.actions.setFlowDisplayConfig}
            // Retention Mode props (simplified Mixpanel-style)
            retentionCube={analysis.retentionCube}
            retentionBindingKey={analysis.retentionBindingKey}
            retentionTimeDimension={analysis.retentionTimeDimension}
            retentionDateRange={analysis.retentionDateRange}
            retentionCohortFilters={analysis.retentionCohortFilters}
            retentionActivityFilters={analysis.retentionActivityFilters}
            retentionBreakdowns={analysis.retentionBreakdowns}
            retentionViewGranularity={analysis.retentionViewGranularity}
            retentionPeriods={analysis.retentionPeriods}
            retentionType={analysis.retentionType}
            onRetentionCubeChange={analysis.actions.setRetentionCube}
            onRetentionBindingKeyChange={analysis.actions.setRetentionBindingKey}
            onRetentionTimeDimensionChange={analysis.actions.setRetentionTimeDimension}
            onRetentionDateRangeChange={analysis.actions.setRetentionDateRange}
            onRetentionCohortFiltersChange={analysis.actions.setRetentionCohortFilters}
            onRetentionActivityFiltersChange={analysis.actions.setRetentionActivityFilters}
            onRetentionBreakdownsChange={analysis.actions.setRetentionBreakdowns}
            onAddRetentionBreakdown={analysis.actions.addRetentionBreakdown}
            onRemoveRetentionBreakdown={analysis.actions.removeRetentionBreakdown}
            onRetentionViewGranularityChange={analysis.actions.setRetentionViewGranularity}
            onRetentionPeriodsChange={analysis.actions.setRetentionPeriods}
            onRetentionTypeChange={analysis.actions.setRetentionType}
            retentionDisplayConfig={analysis.retentionDisplayConfig}
            onRetentionDisplayConfigChange={analysis.actions.setRetentionDisplayConfig}
          />
          </AnalysisModeErrorBoundary>
        </div>

        {/* Field Search Modal */}
        <FieldSearchModal
          isOpen={analysis.showFieldModal}
          onClose={analysis.actions.closeFieldModal}
          onSelect={analysis.actions.handleFieldSelected}
          mode={analysis.fieldModalMode}
          schema={
            // In retention mode, filter schema to only show the selected cube's fields
            analysis.analysisType === 'retention' && analysis.retentionCube && meta
              ? {
                  ...meta,
                  cubes: meta.cubes?.filter((c) => c.name === analysis.retentionCube) || [],
                } as MetaResponse
              : meta as MetaResponse | null
          }
          selectedFields={[
            ...analysis.queryState.metrics.map((m) => m.field),
            ...analysis.effectiveBreakdowns.map((b) => b.field),
            // Include retention breakdowns in selected fields to show checkmarks
            ...(analysis.analysisType === 'retention' ? analysis.retentionBreakdowns.map((b) => b.field) : [])
          ]}
        />
      </div>
    )
  }
)

AnalysisBuilderInner.displayName = 'AnalysisBuilderInner'

/**
 * AnalysisBuilder - Main exported component
 *
 * Wraps the inner component with the store provider to ensure
 * each AnalysisBuilder instance has its own isolated state.
 */
const AnalysisBuilder = forwardRef<AnalysisBuilderRef, AnalysisBuilderProps>(
  (props, ref) => {
    const {
      initialQuery,
      initialChartConfig,
      initialAnalysisType,
      initialFunnelState,
      initialFlowState,
      initialRetentionState,
      disableLocalStorage = false,
      ...innerProps
    } = props

    // Parse share URL synchronously to extract initial state before store creation
    // This prevents the flash of wrong view (e.g., chart when share specifies table)
    // and ensures analysisType is correct from the start (prevents useEffect race conditions)
    const shareHash = parseShareHash()
    const sharedState = shareHash ? decodeAndDecompress(shareHash) : null
    const initialActiveViewFromShare = sharedState?.activeView
    const initialAnalysisTypeFromShare = sharedState?.analysisType

    // Phase 3: Extract funnel state from AnalysisConfig format
    // For funnel mode, funnel config is in query.funnel, chart config is in charts.funnel
    const initialFunnelStateFromShare = (() => {
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
    })()

    // Extract flow state from AnalysisConfig format (for share URLs)
    const initialFlowStateFromShare = (() => {
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
    })()

    // Extract retention state from AnalysisConfig format (for share URLs)
    const initialRetentionStateFromShare = (() => {
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
    })()

    // Hide share button when using initialQuery (e.g., viewing a shared analysis)
    const hideShare = !!initialQuery || !!initialFunnelState || !!initialFlowState || !!initialRetentionState

    return (
      <AnalysisBuilderStoreProvider
        initialQuery={initialQuery}
        initialChartConfig={initialChartConfig}
        initialAnalysisType={initialAnalysisType || initialAnalysisTypeFromShare}
        initialFunnelState={initialFunnelState || initialFunnelStateFromShare}
        initialFlowState={initialFlowState || initialFlowStateFromShare}
        initialRetentionState={initialRetentionState || initialRetentionStateFromShare}
        initialActiveView={initialActiveViewFromShare}
        disableLocalStorage={disableLocalStorage || !!initialQuery || !!initialFunnelState || !!initialFlowState || !!initialRetentionState || !!shareHash}
      >
        <AnalysisBuilderInner ref={ref} {...innerProps} hideShare={hideShare} />
      </AnalysisBuilderStoreProvider>
    )
  }
)

AnalysisBuilder.displayName = 'AnalysisBuilder'

export default AnalysisBuilder
