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
import FlowConfigPanel from './FlowConfigPanel'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'
import AnalysisFilterSection from './AnalysisFilterSection'
import SectionHeading from './SectionHeading'
import FlowVisualizationPicker from './FlowVisualizationPicker'
import FlowDepthControls from './FlowDepthControls'
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
              <FlowVisualizationPicker
                chartType={chartType}
                onChartTypeChange={onChartTypeChange}
              />
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
            <FlowDepthControls
              chartType={chartType}
              stepsBefore={stepsBefore}
              stepsAfter={stepsAfter}
              onStepsBeforeChange={onStepsBeforeChange}
              onStepsAfterChange={onStepsAfterChange}
            />

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
