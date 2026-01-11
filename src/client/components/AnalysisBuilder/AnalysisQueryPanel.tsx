/**
 * AnalysisQueryPanel Component
 *
 * Right-side panel containing Query and Chart tabs with sections for
 * Metrics, Filters, and Breakdowns.
 */

import React, { useEffect, memo, useCallback, useMemo } from 'react'
import type { AnalysisQueryPanelProps, BreakdownItem } from './types'
import type { MetaField } from '../../shared/types'
import type { QueryMergeStrategy, CubeMeta } from '../../types'
import { getIcon } from '../../icons'
import MetricsSection from './MetricsSection'
import BreakdownSection from './BreakdownSection'
import BreakdownItemCard from './BreakdownItemCard'
import AnalysisFilterSection from './AnalysisFilterSection'
import AnalysisChartConfigPanel from './AnalysisChartConfigPanel'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'
import FunnelBindingKeySelector from './FunnelBindingKeySelector'
import AnalysisTypeSelector from './AnalysisTypeSelector'
import FunnelModeContent from './FunnelModeContent'
import FlowModeContent from './FlowModeContent'

const AddIcon = getIcon('add')
const CloseIcon = getIcon('close')
const InfoIcon = getIcon('info')
const WarningIcon = getIcon('warning')
const LinkIcon = getIcon('link')

/**
 * AnalysisQueryPanel displays the right-side query builder with:
 * - Query/Chart tab switcher (with multi-query support)
 * - Metrics section (measures)
 * - Filter section
 * - Breakdown section (dimensions)
 * - Chart configuration (in Chart tab)
 */
const AnalysisQueryPanel = memo(function AnalysisQueryPanel({
  metrics,
  breakdowns,
  filters,
  schema,
  activeTab,
  onActiveTabChange,
  onAddMetric,
  onRemoveMetric,
  onReorderMetrics,
  onAddBreakdown,
  onRemoveBreakdown,
  onBreakdownGranularityChange,
  onBreakdownComparisonToggle,
  onReorderBreakdowns,
  onFiltersChange,
  onDropFieldToFilter,
  // Sorting
  order,
  onOrderChange,
  // Chart configuration
  chartType,
  chartConfig,
  displayConfig,
  colorPalette,
  chartAvailability,
  onChartTypeChange,
  onChartConfigChange,
  onDisplayConfigChange,
  // Validation
  validationStatus: _validationStatus,
  validationError: _validationError,
  // Multi-query props
  queryCount = 1,
  activeQueryIndex = 0,
  mergeStrategy = 'concat',
  onActiveQueryChange,
  onAddQuery,
  onRemoveQuery,
  onMergeStrategyChange,
  breakdownsLocked = false,
  combinedMetrics,
  combinedBreakdowns,
  multiQueryValidation,
  adapterValidation,
  // Funnel props (legacy - for merge strategy mode)
  funnelBindingKey,
  onFunnelBindingKeyChange,
  // Analysis Type props
  analysisType = 'query',
  onAnalysisTypeChange,
  // Funnel Mode props (new dedicated state)
  funnelCube = null,
  funnelSteps = [],
  activeFunnelStepIndex = 0,
  funnelTimeDimension,
  onFunnelCubeChange,
  onAddFunnelStep,
  onRemoveFunnelStep,
  onUpdateFunnelStep,
  onSelectFunnelStep,
  onReorderFunnelSteps,
  onFunnelTimeDimensionChange,
  // Funnel display config (for Display tab)
  funnelDisplayConfig,
  onFunnelDisplayConfigChange,
  // Flow Mode props
  flowCube,
  flowBindingKey,
  flowTimeDimension,
  eventDimension,
  startingStep,
  stepsBefore = 3,
  stepsAfter = 3,
  flowJoinStrategy = 'auto',
  onFlowCubeChange,
  onFlowBindingKeyChange,
  onFlowTimeDimensionChange,
  onEventDimensionChange,
  onStartingStepFiltersChange,
  onStepsBeforeChange,
  onStepsAfterChange,
  onFlowJoinStrategyChange,
  flowDisplayConfig,
  onFlowDisplayConfigChange,
}: AnalysisQueryPanelProps) {
  // Mark unused props
  void _validationStatus
  void _validationError

  const isMultiQuery = queryCount > 1
  // Note: Legacy mergeStrategy === 'funnel' is no longer supported
  // Funnel mode is determined by analysisType === 'funnel'
  const isFunnelMode = analysisType === 'funnel'
  // Flow mode is determined by analysisType === 'flow'
  const isFlowMode = analysisType === 'flow'

  // Alias for clarity - same as isFunnelMode now
  const isNewFunnelMode = analysisType === 'funnel'

  // Helper to find field metadata for a breakdown
  const getFieldMeta = useCallback((breakdown: BreakdownItem): MetaField | null => {
    if (!schema?.cubes) return null
    const [cubeName] = breakdown.field.split('.')
    const cube = schema.cubes.find(c => c.name === cubeName)
    if (!cube) return null
    // Check dimensions first, then time dimensions (which are in dimensions array)
    return cube.dimensions?.find(d => d.name === breakdown.field) || null
  }, [schema])

  // Check if another breakdown already has comparison enabled
  const comparisonEnabledBreakdown = useMemo(() => {
    return breakdowns.find(b => b.isTimeDimension && b.enableComparison)
  }, [breakdowns])

  // Force query tab when no metrics are selected
  useEffect(() => {
    if (metrics.length === 0 && (activeTab === 'chart' || activeTab === 'display')) {
      onActiveTabChange('query')
    }
  }, [metrics.length, activeTab, onActiveTabChange])

  // Handle query tab click
  const handleQueryTabClick = useCallback((index: number) => {
    onActiveQueryChange?.(index)
    // Ensure we're on the query tab when switching queries
    if (activeTab !== 'query') {
      onActiveTabChange('query')
    }
  }, [onActiveQueryChange, activeTab, onActiveTabChange])

  // Handle remove query
  const handleRemoveQuery = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    onRemoveQuery?.(index)
  }, [onRemoveQuery])

  // Get tab label for query tabs
  const getQueryTabLabel = (index: number) => {
    if (!isMultiQuery) return 'Query'
    // In funnel mode, show "S1", "S2", etc.
    if (isFunnelMode) return `S${index + 1}`
    return `Q${index + 1}`
  }

  return (
    <div className="h-full flex flex-col bg-dc-surface">
      {/* Analysis Type Selector - always visible */}
      {onAnalysisTypeChange && (
        <AnalysisTypeSelector
          value={analysisType}
          onChange={onAnalysisTypeChange}
        />
      )}

      {/* Funnel Mode - dedicated UI when analysisType === 'funnel' */}
      {isNewFunnelMode && onFunnelCubeChange && onAddFunnelStep && onRemoveFunnelStep && onUpdateFunnelStep && onSelectFunnelStep && onReorderFunnelSteps && onFunnelTimeDimensionChange && onFunnelBindingKeyChange ? (
        <FunnelModeContent
          funnelCube={funnelCube}
          funnelSteps={funnelSteps}
          activeFunnelStepIndex={activeFunnelStepIndex}
          funnelTimeDimension={funnelTimeDimension ?? null}
          funnelBindingKey={funnelBindingKey ?? null}
          schema={schema as CubeMeta | null}
          onCubeChange={onFunnelCubeChange}
          onAddStep={onAddFunnelStep}
          onRemoveStep={onRemoveFunnelStep}
          onUpdateStep={onUpdateFunnelStep}
          onSelectStep={onSelectFunnelStep}
          onReorderSteps={onReorderFunnelSteps}
          onTimeDimensionChange={onFunnelTimeDimensionChange}
          onBindingKeyChange={onFunnelBindingKeyChange}
          // Display tab props
          chartType="funnel"
          displayConfig={funnelDisplayConfig}
          colorPalette={colorPalette}
          onDisplayConfigChange={onFunnelDisplayConfigChange}
        />
      ) : isFlowMode && onFlowCubeChange && onFlowBindingKeyChange && onFlowTimeDimensionChange && onEventDimensionChange && onStartingStepFiltersChange && onStepsBeforeChange && onStepsAfterChange && startingStep ? (
        /* Flow Mode - dedicated UI when analysisType === 'flow' */
        <FlowModeContent
          flowCube={flowCube ?? null}
          flowBindingKey={flowBindingKey ?? null}
          flowTimeDimension={flowTimeDimension ?? null}
          eventDimension={eventDimension ?? null}
          startingStep={startingStep}
          stepsBefore={stepsBefore}
          stepsAfter={stepsAfter}
          joinStrategy={flowJoinStrategy}
          schema={schema as CubeMeta | null}
          onCubeChange={onFlowCubeChange}
          onBindingKeyChange={onFlowBindingKeyChange}
          onTimeDimensionChange={onFlowTimeDimensionChange}
          onEventDimensionChange={onEventDimensionChange}
          onStartingStepFiltersChange={onStartingStepFiltersChange}
          onStepsBeforeChange={onStepsBeforeChange}
          onStepsAfterChange={onStepsAfterChange}
          onJoinStrategyChange={onFlowJoinStrategyChange}
          // Chart type (now core - affects query aggregation)
          chartType={chartType}
          onChartTypeChange={onChartTypeChange}
          // Display tab props
          displayConfig={flowDisplayConfig}
          colorPalette={colorPalette}
          onDisplayConfigChange={onFlowDisplayConfigChange}
        />
      ) : (
        <>
      {/* Tab Bar - only shown when not in new funnel mode */}
      <div className="flex border-b border-dc-border flex-shrink-0">
        {/* Query Tabs - show Q1, Q2, etc. when multi-query, or single "Query" tab */}
        {isMultiQuery ? (
          <div className="flex min-w-0 overflow-x-auto scrollbar-thin">
            {Array.from({ length: queryCount }).map((_, index) => {
              const isActiveQuery = index === activeQueryIndex && activeTab === 'query'
              return (
                <button
                  key={`q${index}`}
                  onClick={() => handleQueryTabClick(index)}
                  className={`flex items-center gap-1 px-3 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
                    isActiveQuery
                      ? 'text-dc-primary border-b-2 border-dc-primary'
                      : 'text-dc-text-secondary hover:text-dc-text'
                  }`}
                >
                  {getQueryTabLabel(index)}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleRemoveQuery(e, index)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRemoveQuery(e as unknown as React.MouseEvent, index)}
                    className="p-0.5 rounded hover:bg-dc-danger-bg hover:text-dc-error transition-colors ml-0.5"
                    title="Remove query"
                    aria-label={`Remove ${getQueryTabLabel(index)}`}
                  >
                    <CloseIcon className="w-3 h-3" />
                  </span>
                </button>
              )
            })}
            {/* Add Query Button */}
            <button
              onClick={onAddQuery}
              className="flex items-center justify-center px-2 py-3 text-dc-text-secondary hover:text-dc-text transition-colors flex-shrink-0"
              title="Add query"
              aria-label="Add new query"
            >
              <AddIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onActiveTabChange('query')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'query'
                ? 'text-dc-primary border-b-2 border-dc-primary'
                : 'text-dc-text-secondary hover:text-dc-text'
            }`}
          >
            Query
            {/* Add button to convert to multi-query */}
            {onAddQuery && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onAddQuery()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    onAddQuery()
                  }
                }}
                className="ml-2 p-0.5 rounded hover:bg-dc-surface-hover transition-colors inline-flex items-center"
                title="Add another query"
                aria-label="Add another query"
              >
                <AddIcon className="w-3 h-3" />
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => metrics.length > 0 && onActiveTabChange('chart')}
          disabled={metrics.length === 0}
          className={`px-4 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
            isMultiQuery ? '' : 'flex-1'
          } ${
            activeTab === 'chart'
              ? 'text-dc-primary border-b-2 border-dc-primary'
              : metrics.length === 0
                ? 'text-dc-text-muted cursor-not-allowed opacity-50'
                : 'text-dc-text-secondary hover:text-dc-text'
          }`}
          title={metrics.length === 0 ? 'Add metrics to configure chart' : 'Chart configuration'}
        >
          Chart
        </button>
        <button
          onClick={() => metrics.length > 0 && onActiveTabChange('display')}
          disabled={metrics.length === 0}
          className={`px-4 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
            isMultiQuery ? '' : 'flex-1'
          } ${
            activeTab === 'display'
              ? 'text-dc-primary border-b-2 border-dc-primary'
              : metrics.length === 0
                ? 'text-dc-text-muted cursor-not-allowed opacity-50'
                : 'text-dc-text-secondary hover:text-dc-text'
          }`}
          title={metrics.length === 0 ? 'Add metrics to configure display' : 'Display options'}
        >
          Display
        </button>
      </div>

      {/* Merge Strategy Controls (only shown when multiple queries and on query tab) */}
      {isMultiQuery && activeTab === 'query' && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-sm bg-dc-surface-secondary border-b border-dc-border">
          {LinkIcon && <LinkIcon className="w-3.5 h-3.5 text-dc-text-muted flex-shrink-0" />}
          <select
            value={mergeStrategy}
            onChange={(e) => onMergeStrategyChange?.(e.target.value as QueryMergeStrategy)}
            className="px-2 py-1 text-xs bg-dc-surface border border-dc-border rounded text-dc-text focus:outline-none focus:ring-1 focus:ring-dc-primary"
          >
            <option value="concat">Separate series</option>
            <option value="merge">Merge by dimension</option>
            <option value="funnel">Funnel</option>
          </select>

          {/* Funnel Binding Key Selector (inline, only shown in funnel mode) */}
          {isFunnelMode && onFunnelBindingKeyChange && (
            <FunnelBindingKeySelector
              bindingKey={funnelBindingKey ?? null}
              onChange={onFunnelBindingKeyChange}
              schema={schema}
              className="w-[180px] flex-shrink-0"
            />
          )}
        </div>
      )}

      {/* Adapter Validation Errors/Warnings (NEW - Phase 5) */}
      {adapterValidation && (adapterValidation.errors.length > 0 || adapterValidation.warnings.length > 0) && activeTab === 'query' && (
        <div className="px-4 py-2 border-b border-dc-border bg-dc-warning-bg space-y-1">
          {adapterValidation.errors.map((error, i) => (
            <div key={`adapter-error-${i}`} className="flex items-start gap-2 text-xs text-dc-error">
              <WarningIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
          {adapterValidation.warnings.map((warning, i) => (
            <div key={`adapter-warning-${i}`} className="flex items-start gap-2 text-xs text-dc-warning">
              <InfoIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Query Validation Warnings (hidden in funnel mode - funnels can have same metrics) */}
      {multiQueryValidation && !isFunnelMode && (multiQueryValidation.warnings.length > 0 || multiQueryValidation.errors.length > 0) && activeTab === 'query' && (
        <div className="px-4 py-2 border-b border-dc-border bg-dc-warning-bg">
          {multiQueryValidation.errors.map((error, i) => (
            <div key={`error-${i}`} className="flex items-start gap-2 text-xs text-dc-error">
              <WarningIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          ))}
          {multiQueryValidation.warnings.map((warning, i) => (
            <div key={`warning-${i}`} className="flex items-start gap-2 text-xs text-dc-warning">
              <WarningIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'query' ? (
          <div className="space-y-6">
            {/* Metrics Section */}
            <MetricsSection
              metrics={metrics}
              schema={schema}
              onAdd={onAddMetric}
              onRemove={onRemoveMetric}
              order={order}
              onOrderChange={onOrderChange}
              onReorder={onReorderMetrics}
            />

            {/* Breakdown Section */}
            {breakdownsLocked ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-dc-text">Dimensions</h4>
                </div>
                {/* Explanation with link to switch mode */}
                <div className="flex items-start gap-2 px-3 py-2 mb-3 bg-dc-surface-secondary rounded border border-dc-border text-xs">
                  {InfoIcon && <InfoIcon className="w-4 h-4 text-dc-text-muted flex-shrink-0 mt-0.5" />}
                  <span className="text-dc-text-muted">
                    In merge mode, dimensions are shared from Q1.
                    {onMergeStrategyChange && (
                      <button
                        onClick={() => onMergeStrategyChange('concat')}
                        className="text-dc-primary hover:underline ml-1"
                      >
                        Switch to separate series
                      </button>
                    )}
                  </span>
                </div>
                {/* Show breakdown cards with granularity controls (but no remove) */}
                {breakdowns.length > 0 && (
                  <div className="space-y-1">
                    {breakdowns.map((breakdown) => (
                      <BreakdownItemCard
                        key={breakdown.id}
                        breakdown={breakdown}
                        fieldMeta={getFieldMeta(breakdown)}
                        onRemove={() => {}}  // No-op - can't remove in locked mode
                        onGranularityChange={breakdown.isTimeDimension ? (granularity) => onBreakdownGranularityChange(breakdown.id, granularity) : undefined}
                        onComparisonToggle={breakdown.isTimeDimension && onBreakdownComparisonToggle ? () => onBreakdownComparisonToggle(breakdown.id) : undefined}
                        comparisonDisabled={!!comparisonEnabledBreakdown && comparisonEnabledBreakdown.id !== breakdown.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <BreakdownSection
                breakdowns={breakdowns}
                schema={schema}
                onAdd={onAddBreakdown}
                onRemove={onRemoveBreakdown}
                onGranularityChange={onBreakdownGranularityChange}
                onComparisonToggle={onBreakdownComparisonToggle}
                order={order}
                onOrderChange={onOrderChange}
                onReorder={onReorderBreakdowns}
              />
            )}

            {/* Filter Section */}
            <AnalysisFilterSection
              filters={filters}
              schema={schema}
              onFiltersChange={onFiltersChange}
              onFieldDropped={onDropFieldToFilter}
            />
          </div>
        ) : activeTab === 'chart' ? (
          /* Chart Tab Content - use combined metrics/breakdowns in multi-query mode */
          <AnalysisChartConfigPanel
            chartType={chartType}
            chartConfig={chartConfig}
            metrics={isMultiQuery && combinedMetrics ? combinedMetrics : metrics}
            breakdowns={isMultiQuery && combinedBreakdowns ? combinedBreakdowns : breakdowns}
            schema={schema}
            chartAvailability={chartAvailability}
            onChartTypeChange={onChartTypeChange}
            onChartConfigChange={onChartConfigChange}
          />
        ) : activeTab === 'display' ? (
          /* Display Tab Content */
          <AnalysisDisplayConfigPanel
            chartType={chartType}
            displayConfig={displayConfig}
            colorPalette={colorPalette}
            onDisplayConfigChange={onDisplayConfigChange}
          />
        ) : null}
      </div>
        </>
      )}
    </div>
  )
})

export default AnalysisQueryPanel
