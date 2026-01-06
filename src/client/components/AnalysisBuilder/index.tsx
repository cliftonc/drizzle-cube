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
import { useCubeContext } from '../../providers/CubeProvider'
import { AnalysisBuilderStoreProvider } from '../../stores/analysisBuilderStore'
import { useAnalysisBuilder } from '../../hooks/useAnalysisBuilderHook'
import { useAnalysisBuilderStoreApi } from '../../stores/analysisBuilderStore'
import { useAnalysisAI } from '../../hooks/useAnalysisAI'
import { useAnalysisShare } from '../../hooks/useAnalysisShare'
import type {
  AnalysisBuilderProps,
  AnalysisBuilderRef,
} from './types'
import FieldSearchModal from './FieldSearchModal'
import AnalysisResultsPanel from './AnalysisResultsPanel'
import AnalysisQueryPanel from './AnalysisQueryPanel'
import AnalysisAIPanel from './AnalysisAIPanel'
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
    const { meta, features } = useCubeContext()

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
      aiEndpoint: features?.aiEndpoint
    })

    // ========================================================================
    // Share Hook - Provides share URL functionality
    // ========================================================================
    const {
      shareButtonState,
      handleShare
    } = useAnalysisShare({
      isValidQuery: analysis.isValidQuery,
      queryStatesLength: analysis.queryStates.length,
      allQueries: analysis.allQueries,
      currentQuery: analysis.currentQuery,
      mergeStrategy: analysis.mergeStrategy,
      mergeKeys: analysis.mergeKeys,
      chartType: analysis.chartType,
      chartConfig: analysis.chartConfig,
      displayConfig: analysis.displayConfig,
      activeView: analysis.activeView
    })

    // ========================================================================
    // Derived Values
    // ========================================================================

    // Check if query can be cleared
    const canClear = useMemo(() => {
      return (
        analysis.queryState.metrics.length > 0 ||
        analysis.queryState.breakdowns.length > 0 ||
        analysis.queryState.filters.length > 0
      )
    }, [analysis.queryState.metrics.length, analysis.queryState.breakdowns.length, analysis.queryState.filters.length])

    // ========================================================================
    // Expose API via ref
    // ========================================================================
    useImperativeHandle(
      ref,
      () => ({
        getQueryConfig: analysis.getQueryConfig,
        getChartConfig: analysis.getChartConfig,
        executeQuery: () => {
          // Manual execute would refetch - for now just invalidate cache
          // This could be enhanced to trigger a refetch
        },
        clearQuery: analysis.actions.clearQuery
      }),
      [analysis.getQueryConfig, analysis.getChartConfig, analysis.actions.clearQuery]
    )

    // ========================================================================
    // Render
    // ========================================================================
    return (
      <div
        className={`flex flex-col lg:flex-row bg-dc-surface border-x border-b border-dc-border ${maxHeight ? 'lg:h-[var(--dc-max-h)] lg:max-h-[var(--dc-max-h)] lg:overflow-hidden' : 'lg:h-full'} ${className}`}
        style={maxHeight ? { ['--dc-max-h' as string]: maxHeight } : undefined}
      >
        {/* Top/Left Panel - Results */}
        <div className="h-[60vh] lg:h-auto lg:flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-dc-border overflow-auto flex flex-col">
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
          <div className="flex-1 overflow-auto">
            <AnalysisResultsPanel
              executionStatus={analysis.executionStatus}
              executionResults={analysis.executionResults}
              executionError={analysis.error?.message || null}
              totalRowCount={null}
              resultsStale={analysis.isLoading && analysis.executionResults !== null}
              chartType={analysis.chartType}
              chartConfig={analysis.chartConfig}
              displayConfig={analysis.displayConfig}
              colorPalette={analysis.colorPalette}
              // Only show palette selector in standalone mode (not when editing portlet)
              currentPaletteName={!externalColorPalette ? analysis.localPaletteName : undefined}
              onColorPaletteChange={!externalColorPalette ? analysis.actions.setLocalPaletteName : undefined}
              allQueries={analysis.allQueries}
              schema={meta as MetaResponse | null}
              activeView={analysis.activeView}
              onActiveViewChange={analysis.actions.setActiveView}
              displayLimit={analysis.displayLimit}
              onDisplayLimitChange={analysis.actions.setDisplayLimit}
              hasMetrics={analysis.queryState.metrics.length > 0}
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
              // Clear props
              onClearClick={analysis.actions.clearQuery}
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
            />
          </div>
        </div>

        {/* Bottom/Right Panel - Query Builder */}
        <div className="w-full lg:w-96 flex-shrink-0 lg:h-full overflow-auto lg:overflow-hidden">
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
          />
        </div>

        {/* Field Search Modal */}
        <FieldSearchModal
          isOpen={analysis.showFieldModal}
          onClose={analysis.actions.closeFieldModal}
          onSelect={analysis.actions.handleFieldSelected}
          mode={analysis.fieldModalMode}
          schema={meta as MetaResponse | null}
          selectedFields={[
            ...analysis.queryState.metrics.map((m) => m.field),
            ...analysis.effectiveBreakdowns.map((b) => b.field)
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
      disableLocalStorage = false,
      ...innerProps
    } = props

    // Hide share button when using initialQuery (e.g., viewing a shared analysis)
    const hideShare = !!initialQuery

    return (
      <AnalysisBuilderStoreProvider
        initialQuery={initialQuery}
        initialChartConfig={initialChartConfig}
        disableLocalStorage={disableLocalStorage || !!initialQuery}
      >
        <AnalysisBuilderInner ref={ref} {...innerProps} hideShare={hideShare} />
      </AnalysisBuilderStoreProvider>
    )
  }
)

AnalysisBuilder.displayName = 'AnalysisBuilder'

export default AnalysisBuilder
