/**
 * FlowModeContent Component
 *
 * Container for all flow mode UI in AnalysisBuilder.
 * Displays tabs for Flow Configuration and Display options.
 */

import { memo, useState, useCallback } from 'react'
import type { CubeMeta, FunnelBindingKey, ChartType, ChartDisplayConfig, Filter } from '../../types'
import type { ColorPalette } from '../../utils/colorPalettes'
import type { FlowStartingStep } from '../../types/flow'
import { FLOW_MIN_DEPTH, FLOW_MAX_DEPTH } from '../../types/flow'
import FlowConfigPanel from './FlowConfigPanel'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'
import AnalysisFilterSection from './AnalysisFilterSection'
import SectionHeading from './SectionHeading'
import { useTranslation } from '../../hooks/useTranslation'

type FlowPanelTab = 'config' | 'display'

export interface FlowModeContentProps {
  /** Currently selected cube for flow analysis */
  flowCube: string | null
  /** Binding key that links events to entities */
  flowBindingKey: FunnelBindingKey | null
  /** Time dimension for event ordering */
  flowTimeDimension: string | null
  /** Event dimension that categorizes events */
  eventDimension: string | null
  /** Starting step configuration */
  startingStep: FlowStartingStep
  /** Number of steps to explore before starting step */
  stepsBefore: number
  /** Number of steps to explore after starting step */
  stepsAfter: number
  /** Join strategy for server execution */
  joinStrategy: 'auto' | 'lateral' | 'window'
  /** Cube metadata for field selection */
  schema: CubeMeta | null

  // Actions - Configuration
  /** Callback when cube changes */
  onCubeChange: (cube: string | null) => void
  /** Callback when binding key changes */
  onBindingKeyChange: (key: FunnelBindingKey | null) => void
  /** Callback when time dimension changes */
  onTimeDimensionChange: (dim: string | null) => void
  /** Callback when event dimension changes */
  onEventDimensionChange: (dim: string | null) => void
  /** Callback when starting step filters change */
  onStartingStepFiltersChange: (filters: Filter[]) => void
  /** Callback when steps before changes */
  onStepsBeforeChange: (count: number) => void
  /** Callback when steps after changes */
  onStepsAfterChange: (count: number) => void
  /** Callback when join strategy changes */
  onJoinStrategyChange?: (strategy: 'auto' | 'lateral' | 'window') => void

  // Chart type (core - affects query behavior)
  /** Chart type for flow display */
  chartType?: ChartType
  /** Callback when chart type changes (affects query!) */
  onChartTypeChange?: (type: ChartType) => void

  // Display configuration (optional - for Display tab)
  /** Display configuration */
  displayConfig?: ChartDisplayConfig
  /** Color palette */
  colorPalette?: ColorPalette
  /** Callback when display config changes */
  onDisplayConfigChange?: (config: ChartDisplayConfig) => void
}

/**
 * FlowModeContent displays the complete flow configuration interface:
 * - Tabs: Flow | Display
 * - Flow tab: Config panel + starting step + depth controls
 * - Display tab: Sankey chart display options
 */
const FlowModeContent = memo(function FlowModeContent({
  flowCube,
  flowBindingKey,
  flowTimeDimension,
  eventDimension,
  startingStep,
  stepsBefore,
  stepsAfter,
  joinStrategy = 'auto',
  schema,
  onCubeChange,
  onBindingKeyChange,
  onTimeDimensionChange,
  onEventDimensionChange,
  onStartingStepFiltersChange,
  onStepsBeforeChange,
  onStepsAfterChange,
  onJoinStrategyChange,
  // Chart type (affects query!)
  chartType = 'sankey',
  onChartTypeChange,
  // Display props
  displayConfig,
  colorPalette,
  onDisplayConfigChange,
}: FlowModeContentProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<FlowPanelTab>('config')

  // Check if display tab is available
  const hasDisplayTab = displayConfig && onDisplayConfigChange

  // Handler for filter changes from AnalysisFilterSection
  const handleFiltersChange = useCallback(
    (filters: Filter[]) => {
      onStartingStepFiltersChange(filters)
    },
    [onStartingStepFiltersChange]
  )

  return (
    <div className="dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:overflow-hidden">
      {/* Tab Bar */}
      <div className="dc:border-b border-dc-border dc:flex-shrink-0 dc:overflow-x-auto dc:overflow-y-hidden scrollbar-thin">
        <div className="dc:flex dc:min-w-max">
          <button
            onClick={() => setActiveTab('config')}
            className={`dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${
              activeTab === 'config'
                ? 'text-dc-primary dc:border-b-2 border-dc-primary'
                : 'text-dc-text-secondary hover:text-dc-text'
            }`}
          >
            {t('flow.tabs.flow')}
          </button>
          <button
            onClick={() => hasDisplayTab && setActiveTab('display')}
            disabled={!hasDisplayTab}
            className={`dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors dc:whitespace-nowrap ${
              activeTab === 'display'
                ? 'text-dc-primary dc:border-b-2 border-dc-primary'
                : !hasDisplayTab
                  ? 'text-dc-text-muted dc:cursor-not-allowed dc:opacity-50'
                  : 'text-dc-text-secondary hover:text-dc-text'
            }`}
            title={!hasDisplayTab ? t('flow.tabs.displayUnavailable') : t('flow.tabs.displayTitle')}
          >
            {t('flow.tabs.display')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' ? (
        <div className="dc:flex dc:flex-col dc:flex-1 dc:min-h-0">
          {/* Configuration Panel - Cube + Binding Key + Time Dimension + Event Dimension */}
          <FlowConfigPanel
            selectedCube={flowCube}
            bindingKey={flowBindingKey}
            timeDimension={flowTimeDimension}
            eventDimension={eventDimension}
            schema={schema}
            onCubeChange={onCubeChange}
            onBindingKeyChange={onBindingKeyChange}
            onTimeDimensionChange={onTimeDimensionChange}
            onEventDimensionChange={onEventDimensionChange}
          />

          {/* Flow Configuration - scrollable */}
          <div className="dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4 dc:space-y-6">
            {/* Visualization Type - now in main config since it affects query */}
            {onChartTypeChange && (
              <div>
                <SectionHeading>{t('flow.visualization.title')}</SectionHeading>
                <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                  {t('flow.visualization.description')}
                </p>
                <div className="dc:flex dc:gap-2">
                  <button
                    type="button"
                    onClick={() => onChartTypeChange('sankey')}
                    className={`dc:flex-1 dc:px-3 dc:py-2 dc:rounded-md dc:border dc:text-sm dc:font-medium dc:transition-colors ${
                      chartType === 'sankey'
                        ? 'border-dc-primary bg-dc-primary/10 text-dc-primary'
                        : 'border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text'
                    }`}
                  >
                    <div className="dc:flex dc:flex-col dc:items-center dc:gap-1">
                      <span>{t('flow.visualization.sankey')}</span>
                      <span className="dc:text-[10px] dc:font-normal text-dc-text-muted">
                        {t('flow.visualization.sankeyHint')}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChartTypeChange('sunburst')}
                    className={`dc:flex-1 dc:px-3 dc:py-2 dc:rounded-md dc:border dc:text-sm dc:font-medium dc:transition-colors ${
                      chartType === 'sunburst'
                        ? 'border-dc-primary bg-dc-primary/10 text-dc-primary'
                        : 'border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text'
                    }`}
                  >
                    <div className="dc:flex dc:flex-col dc:items-center dc:gap-1">
                      <span>{t('flow.visualization.sunburst')}</span>
                      <span className="dc:text-[10px] dc:font-normal text-dc-text-muted">
                        {t('flow.visualization.sunburstHint')}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Starting Step Section */}
            <div>
              <SectionHeading>{t('flow.startingStep.title')}</SectionHeading>
              <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                {t('flow.startingStep.description')}
              </p>

              {/* Starting Step Filters */}
              <div>
                <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-2">
                  {t('flow.startingStep.filterLabel')}
                </label>
                <AnalysisFilterSection
                  filters={startingStep.filters}
                  schema={schema as unknown as import('../../shared/types').MetaResponse | null}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            </div>

            {/* Depth Configuration */}
            <div>
              <SectionHeading>{t('flow.depth.title')}</SectionHeading>
              <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                {chartType === 'sunburst'
                  ? t('flow.depth.descriptionSunburst')
                  : t('flow.depth.descriptionSankey')}
              </p>

              <div className="dc:grid dc:grid-cols-2 dc:gap-4">
                {/* Steps Before - disabled for sunburst */}
                <div className={chartType === 'sunburst' ? 'dc:opacity-50' : ''}>
                  <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
                    {t('flow.depth.stepsBefore')}
                    {chartType === 'sunburst' && (
                      <span className="dc:ml-1 text-dc-text-muted">{t('flow.depth.stepsBeforeNA')}</span>
                    )}
                  </label>
                  <div className="dc:flex dc:items-center dc:gap-2">
                    <input
                      type="range"
                      min={FLOW_MIN_DEPTH}
                      max={FLOW_MAX_DEPTH}
                      value={stepsBefore}
                      onChange={(e) => onStepsBeforeChange(parseInt(e.target.value, 10))}
                      disabled={chartType === 'sunburst'}
                      className="dc:flex-1 dc:disabled:cursor-not-allowed"
                    />
                    <span className="dc:w-6 dc:text-sm dc:font-medium text-dc-text dc:text-center">
                      {chartType === 'sunburst' ? '-' : stepsBefore}
                    </span>
                  </div>
                </div>

                {/* Steps After */}
                <div>
                  <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
                    {t('flow.depth.stepsAfter')}
                  </label>
                  <div className="dc:flex dc:items-center dc:gap-2">
                    <input
                      type="range"
                      min={FLOW_MIN_DEPTH}
                      max={FLOW_MAX_DEPTH}
                      value={stepsAfter}
                      onChange={(e) => onStepsAfterChange(parseInt(e.target.value, 10))}
                      className="dc:flex-1"
                    />
                    <span className="dc:w-6 dc:text-sm dc:font-medium text-dc-text dc:text-center">
                      {stepsAfter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance warning for high depth */}
              {((chartType !== 'sunburst' && stepsBefore >= 4) || stepsAfter >= 4) && (
                <div className="dc:mt-3 dc:px-3 dc:py-2 bg-dc-warning-bg dc:rounded dc:border border-dc-warning dc:text-xs text-dc-warning">
                  {t('flow.depth.performanceWarning')}
                </div>
              )}

            </div>

            {/* Join strategy selection */}
            <div>
              <SectionHeading>{t('flow.joinStrategy.title')}</SectionHeading>
              <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                {t('flow.joinStrategy.description')}
              </p>
              <select
                className="dc:w-full dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 dc:text-sm bg-dc-surface text-dc-text"
                value={joinStrategy}
                onChange={(e) =>
                  onJoinStrategyChange?.(e.target.value as 'auto' | 'lateral' | 'window')
                }
              >
                <option value="auto">{t('flow.joinStrategy.auto')}</option>
                <option value="lateral">{t('flow.joinStrategy.lateral')}</option>
                <option value="window">{t('flow.joinStrategy.window')}</option>
              </select>
            </div>
          </div>
        </div>
      ) : activeTab === 'display' && displayConfig && onDisplayConfigChange ? (
        <div className="dc:flex-1 dc:min-h-0 dc:overflow-auto dc:p-4">
          <AnalysisDisplayConfigPanel
            chartType={chartType}
            displayConfig={displayConfig}
            colorPalette={colorPalette}
            onDisplayConfigChange={onDisplayConfigChange}
          />
        </div>
      ) : null}
    </div>
  )
})

export default FlowModeContent
