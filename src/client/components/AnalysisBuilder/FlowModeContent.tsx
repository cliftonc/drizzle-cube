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
      <div className="dc:flex dc:border-b border-dc-border dc:flex-shrink-0">
        <button
          onClick={() => setActiveTab('config')}
          className={`dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors ${
            activeTab === 'config'
              ? 'text-dc-primary dc:border-b-2 border-dc-primary'
              : 'text-dc-text-secondary hover:text-dc-text'
          }`}
        >
          Flow
        </button>
        <button
          onClick={() => hasDisplayTab && setActiveTab('display')}
          disabled={!hasDisplayTab}
          className={`dc:flex-1 dc:px-4 dc:py-3 dc:text-sm dc:font-medium dc:transition-colors ${
            activeTab === 'display'
              ? 'text-dc-primary dc:border-b-2 border-dc-primary'
              : !hasDisplayTab
                ? 'text-dc-text-muted dc:cursor-not-allowed dc:opacity-50'
                : 'text-dc-text-secondary hover:text-dc-text'
          }`}
          title={!hasDisplayTab ? 'Display options not available' : 'Display options'}
        >
          Display
        </button>
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
                <SectionHeading>Visualization</SectionHeading>
                <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                  Choose how to visualize the flow data. This affects how data is aggregated.
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
                      <span>Sankey</span>
                      <span className="dc:text-[10px] dc:font-normal text-dc-text-muted">
                        Paths can converge
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
                      <span>Sunburst</span>
                      <span className="dc:text-[10px] dc:font-normal text-dc-text-muted">
                        Unique paths only
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Starting Step Section */}
            <div>
              <SectionHeading>Starting Step</SectionHeading>
              <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                Define the anchor event from which paths will be explored in both directions.
              </p>

              {/* Starting Step Filters */}
              <div>
                <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-2">
                  Filter Conditions
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
              <SectionHeading>Exploration Depth</SectionHeading>
              <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                {chartType === 'sunburst'
                  ? 'How many steps to explore after the starting step.'
                  : 'How many steps to explore before and after the starting step.'}
              </p>

              <div className="dc:grid dc:grid-cols-2 dc:gap-4">
                {/* Steps Before - disabled for sunburst */}
                <div className={chartType === 'sunburst' ? 'dc:opacity-50' : ''}>
                  <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
                    Steps Before
                    {chartType === 'sunburst' && (
                      <span className="dc:ml-1 text-dc-text-muted">(N/A)</span>
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
                    <span className="dc:w-6 dc:text-sm dc:font-medium text-dc-text text-center">
                      {chartType === 'sunburst' ? '-' : stepsBefore}
                    </span>
                  </div>
                </div>

                {/* Steps After */}
                <div>
                  <label className="dc:block dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
                    Steps After
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
                    <span className="dc:w-6 dc:text-sm dc:font-medium text-dc-text text-center">
                      {stepsAfter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance warning for high depth */}
              {((chartType !== 'sunburst' && stepsBefore >= 4) || stepsAfter >= 4) && (
                <div className="dc:mt-3 dc:px-3 dc:py-2 bg-dc-warning-bg dc:rounded dc:border border-dc-warning dc:text-xs text-dc-warning">
                  High step depth (4-5) may impact query performance on large datasets.
                </div>
              )}

            </div>

            {/* Join strategy selection */}
            <div>
              <SectionHeading>Join Strategy</SectionHeading>
              <p className="dc:text-xs text-dc-text-muted dc:mb-3">
                Control how before/after steps are fetched. Switch to window if lateral is slower on your DB.
              </p>
              <select
                className="dc:w-full dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 dc:text-sm bg-dc-surface text-dc-text"
                value={joinStrategy}
                onChange={(e) =>
                  onJoinStrategyChange?.(e.target.value as 'auto' | 'lateral' | 'window')
                }
              >
                <option value="auto">Auto (prefer lateral if available)</option>
                <option value="lateral">Lateral (index seeks)</option>
                <option value="window">Window (ROW_NUMBER)</option>
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
