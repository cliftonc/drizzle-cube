/**
 * AnalysisQueryPanelParts
 *
 * Presentational sub-components extracted from AnalysisQueryPanel to keep its
 * render flat: the dedicated mode content (funnel / flow / retention), the
 * Query/Chart/Display tab bar, the validation banners, and the locked-breakdown
 * list. Behaviour and markup are identical to the previous inline rendering.
 */

import React from 'react'
import type { AnalysisQueryPanelProps, BreakdownItem } from './types'
import type { MetaField } from '../../shared/types'
import type { QueryMergeStrategy, CubeMeta } from '../../types'
import { getIcon } from '../../icons'
import BreakdownItemCard from './BreakdownItemCard'
import FunnelBindingKeySelector from './FunnelBindingKeySelector'
import FunnelModeContent from './FunnelModeContent'
import FlowModeContent from './FlowModeContent'
import RetentionModeContent from './RetentionModeContent'
import MetricsSection from './MetricsSection'
import BreakdownSection from './BreakdownSection'
import AnalysisFilterSection from './AnalysisFilterSection'
import LimitSection from './LimitSection'
import AnalysisChartConfigPanel from './AnalysisChartConfigPanel'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'
import { useTranslation } from '../../hooks/useTranslation'

const AddIcon = getIcon('add')
const CloseIcon = getIcon('close')
const InfoIcon = getIcon('info')
const WarningIcon = getIcon('warning')
const LinkIcon = getIcon('link')

type Props = AnalysisQueryPanelProps

/** True when the funnel mode UI has all the callbacks it needs to render. */
export function canRenderFunnelMode(p: Props): boolean {
  return (
    p.analysisType === 'funnel' &&
    !!p.onFunnelCubeChange &&
    !!p.onAddFunnelStep &&
    !!p.onRemoveFunnelStep &&
    !!p.onUpdateFunnelStep &&
    !!p.onSelectFunnelStep &&
    !!p.onReorderFunnelSteps &&
    !!p.onFunnelTimeDimensionChange &&
    !!p.onFunnelBindingKeyChange
  )
}

/** True when the flow mode UI has all the callbacks/state it needs to render. */
export function canRenderFlowMode(p: Props): boolean {
  return (
    p.analysisType === 'flow' &&
    !!p.onFlowCubeChange &&
    !!p.onFlowBindingKeyChange &&
    !!p.onFlowTimeDimensionChange &&
    !!p.onEventDimensionChange &&
    !!p.onStartingStepFiltersChange &&
    !!p.onStepsBeforeChange &&
    !!p.onStepsAfterChange &&
    !!p.startingStep
  )
}

/**
 * Whether a dedicated mode (funnel/flow/retention) replaces the standard layout.
 */
export function shouldRenderModeContent(p: Props): boolean {
  return canRenderFunnelMode(p) || canRenderFlowMode(p) || p.analysisType === 'retention'
}

function FunnelModeSection(props: Props) {
  const {
    schema,
    colorPalette,
    funnelCube = null,
    funnelSteps = [],
    activeFunnelStepIndex = 0,
    funnelTimeDimension,
    funnelBindingKey,
    onFunnelCubeChange,
    onAddFunnelStep,
    onRemoveFunnelStep,
    onUpdateFunnelStep,
    onSelectFunnelStep,
    onReorderFunnelSteps,
    onFunnelTimeDimensionChange,
    onFunnelBindingKeyChange,
    funnelDisplayConfig,
    onFunnelDisplayConfigChange,
  } = props
  return (
    <FunnelModeContent
      funnelCube={funnelCube}
      funnelSteps={funnelSteps}
      activeFunnelStepIndex={activeFunnelStepIndex}
      funnelTimeDimension={funnelTimeDimension ?? null}
      funnelBindingKey={funnelBindingKey ?? null}
      schema={schema as CubeMeta | null}
      onCubeChange={onFunnelCubeChange!}
      onAddStep={onAddFunnelStep!}
      onRemoveStep={onRemoveFunnelStep!}
      onUpdateStep={onUpdateFunnelStep!}
      onSelectStep={onSelectFunnelStep!}
      onReorderSteps={onReorderFunnelSteps!}
      onTimeDimensionChange={onFunnelTimeDimensionChange!}
      onBindingKeyChange={onFunnelBindingKeyChange!}
      chartType="funnel"
      displayConfig={funnelDisplayConfig}
      colorPalette={colorPalette}
      onDisplayConfigChange={onFunnelDisplayConfigChange}
    />
  )
}

function FlowModeSection(props: Props) {
  const {
    schema,
    colorPalette,
    chartType,
    onChartTypeChange,
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
  } = props
  return (
    <FlowModeContent
      flowCube={flowCube ?? null}
      flowBindingKey={flowBindingKey ?? null}
      flowTimeDimension={flowTimeDimension ?? null}
      eventDimension={eventDimension ?? null}
      startingStep={startingStep!}
      stepsBefore={stepsBefore}
      stepsAfter={stepsAfter}
      joinStrategy={flowJoinStrategy}
      schema={schema as CubeMeta | null}
      onCubeChange={onFlowCubeChange!}
      onBindingKeyChange={onFlowBindingKeyChange!}
      onTimeDimensionChange={onFlowTimeDimensionChange!}
      onEventDimensionChange={onEventDimensionChange!}
      onStartingStepFiltersChange={onStartingStepFiltersChange!}
      onStepsBeforeChange={onStepsBeforeChange!}
      onStepsAfterChange={onStepsAfterChange!}
      onJoinStrategyChange={onFlowJoinStrategyChange}
      chartType={chartType}
      onChartTypeChange={onChartTypeChange}
      displayConfig={flowDisplayConfig}
      colorPalette={colorPalette}
      onDisplayConfigChange={onFlowDisplayConfigChange}
    />
  )
}

function RetentionModeSection(props: Props) {
  const {
    schema,
    colorPalette,
    chartType,
    onAddBreakdown,
    retentionCube,
    retentionBindingKey,
    retentionTimeDimension,
    retentionDateRange,
    retentionCohortFilters = [],
    retentionActivityFilters = [],
    retentionBreakdowns = [],
    retentionViewGranularity = 'week',
    retentionPeriods = 12,
    retentionType = 'classic',
    onRetentionCubeChange,
    onRetentionBindingKeyChange,
    onRetentionTimeDimensionChange,
    onRetentionDateRangeChange,
    onRetentionCohortFiltersChange,
    onRetentionActivityFiltersChange,
    onRetentionBreakdownsChange,
    onAddRetentionBreakdown,
    onRemoveRetentionBreakdown,
    onRetentionViewGranularityChange,
    onRetentionPeriodsChange,
    onRetentionTypeChange,
    retentionDisplayConfig,
    onRetentionDisplayConfigChange,
  } = props
  const noop = () => {}
  return (
    <RetentionModeContent
      retentionCube={retentionCube ?? null}
      retentionBindingKey={retentionBindingKey ?? null}
      retentionTimeDimension={retentionTimeDimension ?? null}
      retentionDateRange={retentionDateRange ?? { start: '', end: '' }}
      retentionCohortFilters={retentionCohortFilters}
      retentionActivityFilters={retentionActivityFilters}
      retentionBreakdowns={retentionBreakdowns}
      retentionViewGranularity={retentionViewGranularity}
      retentionPeriods={retentionPeriods}
      retentionType={retentionType}
      schema={schema as CubeMeta | null}
      onCubeChange={onRetentionCubeChange ?? noop}
      onBindingKeyChange={onRetentionBindingKeyChange ?? noop}
      onTimeDimensionChange={onRetentionTimeDimensionChange ?? noop}
      onDateRangeChange={onRetentionDateRangeChange ?? noop}
      onCohortFiltersChange={onRetentionCohortFiltersChange ?? noop}
      onActivityFiltersChange={onRetentionActivityFiltersChange ?? noop}
      onBreakdownsChange={onRetentionBreakdownsChange ?? noop}
      onAddBreakdown={onAddRetentionBreakdown ?? noop}
      onRemoveBreakdown={onRemoveRetentionBreakdown ?? noop}
      onGranularityChange={onRetentionViewGranularityChange ?? noop}
      onPeriodsChange={onRetentionPeriodsChange ?? noop}
      onRetentionTypeChange={onRetentionTypeChange ?? noop}
      onOpenFieldModal={onAddBreakdown}
      chartType={chartType}
      displayConfig={retentionDisplayConfig}
      colorPalette={colorPalette}
      onDisplayConfigChange={onRetentionDisplayConfigChange}
    />
  )
}

/**
 * Renders the dedicated mode UI (funnel / flow / retention) when one of those
 * analysis types is active and all the required callbacks are present. Returns
 * null when the standard query/chart/display layout should be used instead.
 */
export function AnalysisModeContent(props: Props) {
  if (canRenderFunnelMode(props)) return <FunnelModeSection {...props} />
  if (canRenderFlowMode(props)) return <FlowModeSection {...props} />
  if (props.analysisType === 'retention') return <RetentionModeSection {...props} />
  return null
}

interface TabBarProps {
  activeTab: Props['activeTab']
  onActiveTabChange: Props['onActiveTabChange']
  isMultiQuery: boolean
  queryCount: number
  activeQueryIndex: number
  onAddQuery?: Props['onAddQuery']
  getQueryTabLabel: (index: number) => string
  handleQueryTabClick: (index: number) => void
  handleRemoveQuery: (e: React.MouseEvent, index: number) => void
}

function QueryTabs({
  isMultiQuery,
  queryCount,
  activeQueryIndex,
  activeTab,
  onActiveTabChange,
  onAddQuery,
  getQueryTabLabel,
  handleQueryTabClick,
  handleRemoveQuery,
}: TabBarProps) {
  const { t } = useTranslation()

  if (isMultiQuery) {
    return (
      <div className="dc:flex dc:min-w-max">
        {Array.from({ length: queryCount }).map((_, index) => {
          const isActiveQuery = index === activeQueryIndex && activeTab === 'query'
          return (
            <button
              key={`q${index}`}
              onClick={() => handleQueryTabClick(index)}
              className={`dc:flex dc:items-center dc:gap-1 dc:px-3 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap ${
                isActiveQuery
                  ? 'text-dc-primary dc:border-b-2 border-dc-primary'
                  : 'text-dc-text-secondary hover:text-dc-text'
              }`}
            >
              {getQueryTabLabel(index)}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleRemoveQuery(e, index)}
                onKeyDown={(e) => e.key === 'Enter' && handleRemoveQuery(e as unknown as React.MouseEvent, index)}
                className="dc:p-0.5 dc:rounded hover:bg-dc-danger-bg hover:text-dc-error dc:transition-colors dc:ml-0.5"
                title={t('analysis.multiQuery.removeQuery')}
                aria-label={`Remove ${getQueryTabLabel(index)}`}
              >
                <CloseIcon className="dc:w-3 dc:h-3" />
              </span>
            </button>
          )
        })}
        {/* Add Query Button */}
        <button
          onClick={onAddQuery}
          className="dc:flex dc:items-center dc:justify-center dc:px-2 dc:py-3 text-dc-text-secondary hover:text-dc-text dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap"
          title={t('analysis.multiQuery.addQuery')}
          aria-label={t('analysis.multiQuery.addQuery')}
        >
          <AddIcon className="dc:w-4 dc:h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => onActiveTabChange('query')}
      className={`dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${
        activeTab === 'query'
          ? 'text-dc-primary dc:border-b-2 border-dc-primary'
          : 'text-dc-text-secondary hover:text-dc-text'
      }`}
    >
      {t('analysis.tabs.query')}
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
          className="dc:ml-2 dc:p-0.5 dc:rounded hover:bg-dc-surface-hover dc:transition-colors dc:inline-flex dc:items-center"
          title={t('analysis.multiQuery.addAnother')}
          aria-label={t('analysis.multiQuery.addAnother')}
        >
          <AddIcon className="dc:w-3 dc:h-3" />
        </span>
      )}
    </button>
  )
}

export function QueryPanelTabBar(props: TabBarProps) {
  const { t } = useTranslation()
  const { isMultiQuery, activeTab, onActiveTabChange } = props
  const secondaryTabClass = isMultiQuery ? '' : 'dc:flex-1'
  return (
    <div className="dc:border-b border-dc-border dc:flex-shrink-0 dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin">
      <div className="dc:flex dc:min-w-max">
        <QueryTabs {...props} />

        <button
          onClick={() => onActiveTabChange('chart')}
          className={`dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap ${secondaryTabClass} ${
            activeTab === 'chart'
              ? 'text-dc-primary dc:border-b-2 border-dc-primary'
              : 'text-dc-text-secondary hover:text-dc-text'
          }`}
          title={t('analysis.tabs.chartTitle')}
        >
          {t('analysis.tabs.chart')}
        </button>
        <button
          onClick={() => onActiveTabChange('display')}
          className={`dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:flex-shrink-0 dc:whitespace-nowrap ${secondaryTabClass} ${
            activeTab === 'display'
              ? 'text-dc-primary dc:border-b-2 border-dc-primary'
              : 'text-dc-text-secondary hover:text-dc-text'
          }`}
          title={t('analysis.tabs.displayTitle')}
        >
          {t('analysis.tabs.display')}
        </button>
      </div>
    </div>
  )
}

export function MergeStrategyControls({
  mergeStrategy,
  onMergeStrategyChange,
  isFunnelMode,
  funnelBindingKey,
  onFunnelBindingKeyChange,
  schema,
}: {
  mergeStrategy: QueryMergeStrategy
  onMergeStrategyChange?: Props['onMergeStrategyChange']
  isFunnelMode: boolean
  funnelBindingKey?: Props['funnelBindingKey']
  onFunnelBindingKeyChange?: Props['onFunnelBindingKeyChange']
  schema: Props['schema']
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:gap-2 dc:px-4 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border-b border-dc-border">
      {LinkIcon && <LinkIcon className="dc:w-3.5 dc:h-3.5 text-dc-text-muted dc:flex-shrink-0" />}
      <select
        value={mergeStrategy}
        onChange={(e) => onMergeStrategyChange?.(e.target.value as QueryMergeStrategy)}
        className="dc:px-2 dc:py-1 dc:text-xs bg-dc-surface dc:border border-dc-border dc:rounded text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
      >
        <option value="concat">{t('analysis.mergeStrategy.concat')}</option>
        <option value="merge">{t('analysis.mergeStrategy.merge')}</option>
        <option value="funnel">{t('analysis.mergeStrategy.funnel')}</option>
      </select>

      {/* Funnel Binding Key Selector (inline, only shown in funnel mode) */}
      {isFunnelMode && onFunnelBindingKeyChange && (
        <FunnelBindingKeySelector
          bindingKey={funnelBindingKey ?? null}
          onChange={onFunnelBindingKeyChange}
          schema={schema}
          className="dc:w-[180px] dc:flex-shrink-0"
        />
      )}
    </div>
  )
}

export function AdapterValidationBanner({
  adapterValidation,
}: {
  adapterValidation: NonNullable<Props['adapterValidation']>
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-warning-bg dc:space-y-1">
      {adapterValidation.errors.map((error, i) => (
        <div key={`adapter-error-${i}`} className="dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-error">
          <WarningIcon className="dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" />
          <span>{t(error)}</span>
        </div>
      ))}
      {adapterValidation.warnings.map((warning, i) => (
        <div key={`adapter-warning-${i}`} className="dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-warning">
          <InfoIcon className="dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" />
          <span>{t(warning)}</span>
        </div>
      ))}
    </div>
  )
}

export function MultiQueryValidationBanner({
  multiQueryValidation,
}: {
  multiQueryValidation: NonNullable<Props['multiQueryValidation']>
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-warning-bg">
      {multiQueryValidation.errors.map((error, i) => (
        <div key={`error-${i}`} className="dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-error">
          <WarningIcon className="dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" />
          <span>{t(error.message)}</span>
        </div>
      ))}
      {multiQueryValidation.warnings.map((warning, i) => (
        <div key={`warning-${i}`} className="dc:flex dc:items-start dc:gap-2 dc:text-xs text-dc-warning">
          <WarningIcon className="dc:w-3.5 dc:h-3.5 dc:mt-0.5 dc:flex-shrink-0" />
          <span>{t(warning.message)}</span>
        </div>
      ))}
    </div>
  )
}

interface TabContentProps extends Props {
  isMultiQuery: boolean
  getFieldMeta: (breakdown: BreakdownItem) => MetaField | null
  comparisonEnabledBreakdown: BreakdownItem | undefined
}

function QueryTabSections({
  metrics,
  breakdowns,
  filters,
  schema,
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
  order,
  onOrderChange,
  limit,
  onLimitChange,
  breakdownsLocked = false,
  onMergeStrategyChange,
  getFieldMeta,
  comparisonEnabledBreakdown,
}: TabContentProps) {
  return (
    <div className="dc:space-y-6">
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
        <LockedBreakdownList
          breakdowns={breakdowns}
          getFieldMeta={getFieldMeta}
          comparisonEnabledBreakdown={comparisonEnabledBreakdown}
          onBreakdownGranularityChange={onBreakdownGranularityChange}
          onBreakdownComparisonToggle={onBreakdownComparisonToggle}
          onMergeStrategyChange={onMergeStrategyChange}
        />
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

      {/* Limit Section */}
      {onLimitChange && (
        <LimitSection
          limit={limit}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  )
}

/**
 * Renders the active tab's body (query sections / chart config / display config)
 * for the standard (non-mode) layout.
 */
export function QueryPanelTabContent(props: TabContentProps) {
  const {
    activeTab,
    isMultiQuery,
    metrics,
    breakdowns,
    schema,
    chartType,
    chartConfig,
    combinedMetrics,
    combinedBreakdowns,
    chartAvailability,
    onChartTypeChange,
    onChartConfigChange,
    displayConfig,
    colorPalette,
    onDisplayConfigChange,
  } = props

  if (activeTab === 'query') {
    return <QueryTabSections {...props} />
  }

  if (activeTab === 'chart') {
    return (
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
    )
  }

  if (activeTab === 'display') {
    return (
      <AnalysisDisplayConfigPanel
        chartType={chartType}
        displayConfig={displayConfig}
        colorPalette={colorPalette}
        onDisplayConfigChange={onDisplayConfigChange}
      />
    )
  }

  return null
}

export function LockedBreakdownList({
  breakdowns,
  getFieldMeta,
  comparisonEnabledBreakdown,
  onBreakdownGranularityChange,
  onBreakdownComparisonToggle,
  onMergeStrategyChange,
}: {
  breakdowns: BreakdownItem[]
  getFieldMeta: (breakdown: BreakdownItem) => MetaField | null
  comparisonEnabledBreakdown: BreakdownItem | undefined
  onBreakdownGranularityChange: Props['onBreakdownGranularityChange']
  onBreakdownComparisonToggle?: Props['onBreakdownComparisonToggle']
  onMergeStrategyChange?: Props['onMergeStrategyChange']
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:mb-4">
      <div className="dc:flex dc:items-center dc:justify-between dc:mb-2">
        <h4 className="dc:text-sm dc:font-medium text-dc-text">{t('analysis.sections.dimensions')}</h4>
      </div>
      {/* Explanation with link to switch mode */}
      <div className="dc:flex dc:items-start dc:gap-2 dc:px-3 dc:py-2 dc:mb-3 bg-dc-surface-secondary dc:rounded dc:border border-dc-border dc:text-xs">
        {InfoIcon && <InfoIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:flex-shrink-0 dc:mt-0.5" />}
        <span className="text-dc-text-muted">
          {t('analysis.multiQuery.mergeExplanation')}
          {onMergeStrategyChange && (
            <button
              onClick={() => onMergeStrategyChange('concat')}
              className="text-dc-primary dc:hover:underline dc:ml-1"
            >
              {t('analysis.multiQuery.switchToSeparate')}
            </button>
          )}
        </span>
      </div>
      {/* Show breakdown cards with granularity controls (but no remove) */}
      {breakdowns.length > 0 && (
        <div className="dc:space-y-1">
          {breakdowns.map((breakdown) => (
            <BreakdownItemCard
              key={breakdown.id}
              breakdown={breakdown}
              fieldMeta={getFieldMeta(breakdown)}
              onRemove={() => {}}
              onGranularityChange={breakdown.isTimeDimension ? (granularity) => onBreakdownGranularityChange(breakdown.id, granularity) : undefined}
              onComparisonToggle={breakdown.isTimeDimension && onBreakdownComparisonToggle ? () => onBreakdownComparisonToggle(breakdown.id) : undefined}
              comparisonDisabled={!!comparisonEnabledBreakdown && comparisonEnabledBreakdown.id !== breakdown.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
