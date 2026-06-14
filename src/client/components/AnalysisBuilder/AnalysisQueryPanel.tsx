/**
 * AnalysisQueryPanel Component
 *
 * Right-side panel containing Query and Chart tabs with sections for
 * Metrics, Filters, and Breakdowns.
 */

import React, { memo, useCallback, useMemo } from 'react'
import type { AnalysisQueryPanelProps, BreakdownItem } from './types'
import type { MetaField } from '../../shared/types'
import type { CubeMeta } from '../../types'
import AnalysisTypeSelector from './AnalysisTypeSelector'
import {
  AnalysisModeContent,
  shouldRenderModeContent,
  QueryPanelTabBar,
  QueryPanelTabContent,
  MergeStrategyControls,
  AdapterValidationBanner,
  MultiQueryValidationBanner,
} from './AnalysisQueryPanelParts'
import { useTranslation } from '../../hooks/useTranslation'

/**
 * AnalysisQueryPanel displays the right-side query builder with:
 * - Query/Chart tab switcher (with multi-query support)
 * - Metrics section (measures)
 * - Filter section
 * - Breakdown section (dimensions)
 * - Chart configuration (in Chart tab)
 */
const AnalysisQueryPanel = memo(function AnalysisQueryPanel(props: AnalysisQueryPanelProps) {
  const {
    breakdowns,
    schema,
    activeTab,
    onActiveTabChange,
    // Multi-query props
    queryCount = 1,
    activeQueryIndex = 0,
    mergeStrategy = 'concat',
    onActiveQueryChange,
    onAddQuery,
    onRemoveQuery,
    onMergeStrategyChange,
    multiQueryValidation,
    adapterValidation,
    // Funnel props (legacy - for merge strategy mode)
    funnelBindingKey,
    onFunnelBindingKeyChange,
    // Analysis Type props
    analysisType = 'query',
    onAnalysisTypeChange,
  } = props

  const { t } = useTranslation()

  const isMultiQuery = queryCount > 1
  // Funnel mode is determined by analysisType === 'funnel'
  const isFunnelMode = analysisType === 'funnel'

  // Whether a dedicated mode (funnel/flow/retention) replaces the standard layout.
  const showModeContent = shouldRenderModeContent(props)

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
    if (!isMultiQuery) return t('analysis.tabs.query')
    // In funnel mode, show "S1", "S2", etc.
    if (isFunnelMode) return `S${index + 1}`
    return `Q${index + 1}`
  }

  return (
    <div className="dc:h-full dc:flex dc:flex-col bg-dc-surface">
      {/* Analysis Type Selector - always visible */}
      {onAnalysisTypeChange && (
        <AnalysisTypeSelector
          value={analysisType}
          onChange={onAnalysisTypeChange}
          schema={schema as CubeMeta | null}
        />
      )}

      {/* Dedicated mode UI (funnel / flow / retention) replaces the standard layout */}
      {showModeContent ? (
        <AnalysisModeContent {...props} />
      ) : (
        <>
          {/* Tab Bar - only shown when not in a dedicated mode */}
          <QueryPanelTabBar
            activeTab={activeTab}
            onActiveTabChange={onActiveTabChange}
            isMultiQuery={isMultiQuery}
            queryCount={queryCount}
            activeQueryIndex={activeQueryIndex}
            onAddQuery={onAddQuery}
            getQueryTabLabel={getQueryTabLabel}
            handleQueryTabClick={handleQueryTabClick}
            handleRemoveQuery={handleRemoveQuery}
          />

          {/* Merge Strategy Controls (only shown when multiple queries and on query tab) */}
          {isMultiQuery && activeTab === 'query' && (
            <MergeStrategyControls
              mergeStrategy={mergeStrategy}
              onMergeStrategyChange={onMergeStrategyChange}
              isFunnelMode={isFunnelMode}
              funnelBindingKey={funnelBindingKey}
              onFunnelBindingKeyChange={onFunnelBindingKeyChange}
              schema={schema}
            />
          )}

          {/* Adapter Validation Errors/Warnings */}
          {adapterValidation && (adapterValidation.errors.length > 0 || adapterValidation.warnings.length > 0) && activeTab === 'query' && (
            <AdapterValidationBanner adapterValidation={adapterValidation} />
          )}

          {/* Multi-Query Validation Warnings (hidden in funnel mode - funnels can have same metrics) */}
          {multiQueryValidation && !isFunnelMode && (multiQueryValidation.warnings.length > 0 || multiQueryValidation.errors.length > 0) && activeTab === 'query' && (
            <MultiQueryValidationBanner multiQueryValidation={multiQueryValidation} />
          )}

          {/* Tab Content */}
          <div className="dc:flex-1 dc:overflow-auto dc:p-4">
            <QueryPanelTabContent
              {...props}
              isMultiQuery={isMultiQuery}
              getFieldMeta={getFieldMeta}
              comparisonEnabledBreakdown={comparisonEnabledBreakdown}
            />
          </div>
        </>
      )}
    </div>
  )
})

export default AnalysisQueryPanel
