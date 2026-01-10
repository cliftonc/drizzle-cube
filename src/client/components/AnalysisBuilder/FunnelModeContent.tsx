/**
 * FunnelModeContent Component
 *
 * Container for all funnel mode UI in AnalysisBuilder.
 * Displays tabs for Steps and Display configuration.
 */

import { memo, useState } from 'react'
import type { CubeMeta, FunnelBindingKey, FunnelStepState, ChartType, ChartDisplayConfig } from '../../types'
import type { FunnelPanelTab } from './types'
import type { ColorPalette } from '../../utils/colorPalettes'
import FunnelConfigPanel from './FunnelConfigPanel'
import FunnelStepList from './FunnelStepList'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'

export interface FunnelModeContentProps {
  /** Currently selected cube for funnel */
  funnelCube: string | null
  /** Current funnel steps */
  funnelSteps: FunnelStepState[]
  /** Index of the currently active step */
  activeFunnelStepIndex: number
  /** Time dimension for funnel temporal ordering */
  funnelTimeDimension: string | null
  /** Binding key that links steps together */
  funnelBindingKey: FunnelBindingKey | null
  /** Cube metadata for field selection */
  schema: CubeMeta | null

  // Actions - Steps
  /** Callback when cube changes */
  onCubeChange: (cube: string | null) => void
  /** Add a new funnel step */
  onAddStep: () => void
  /** Remove a funnel step by index */
  onRemoveStep: (index: number) => void
  /** Update a funnel step */
  onUpdateStep: (index: number, updates: Partial<FunnelStepState>) => void
  /** Set the active step index */
  onSelectStep: (index: number) => void
  /** Reorder funnel steps */
  onReorderSteps: (fromIndex: number, toIndex: number) => void
  /** Set the time dimension */
  onTimeDimensionChange: (dimension: string | null) => void
  /** Set the binding key */
  onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void

  // Display configuration (optional - for Display tab)
  /** Chart type for funnel display */
  chartType?: ChartType
  /** Display configuration */
  displayConfig?: ChartDisplayConfig
  /** Color palette */
  colorPalette?: ColorPalette
  /** Callback when display config changes */
  onDisplayConfigChange?: (config: ChartDisplayConfig) => void
}

/**
 * FunnelModeContent displays the complete funnel configuration interface:
 * - Tabs: Steps | Display
 * - Steps tab: Config panel (binding key + time dimension) + step list
 * - Display tab: Funnel chart display options
 */
const FunnelModeContent = memo(function FunnelModeContent({
  funnelCube,
  funnelSteps,
  activeFunnelStepIndex,
  funnelTimeDimension,
  funnelBindingKey,
  schema,
  onCubeChange,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onSelectStep,
  onReorderSteps,
  onTimeDimensionChange,
  onBindingKeyChange,
  // Display props
  chartType = 'funnel',
  displayConfig,
  colorPalette,
  onDisplayConfigChange,
}: FunnelModeContentProps) {
  const [activeTab, setActiveTab] = useState<FunnelPanelTab>('steps')

  // Check if display tab is available
  const hasDisplayTab = displayConfig && onDisplayConfigChange

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex border-b border-dc-border flex-shrink-0">
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'steps'
              ? 'text-dc-primary border-b-2 border-dc-primary'
              : 'text-dc-text-secondary hover:text-dc-text'
          }`}
        >
          Steps
        </button>
        <button
          onClick={() => hasDisplayTab && setActiveTab('display')}
          disabled={!hasDisplayTab}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'display'
              ? 'text-dc-primary border-b-2 border-dc-primary'
              : !hasDisplayTab
                ? 'text-dc-text-muted cursor-not-allowed opacity-50'
                : 'text-dc-text-secondary hover:text-dc-text'
          }`}
          title={!hasDisplayTab ? 'Display options not available' : 'Display options'}
        >
          Display
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'steps' ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Configuration Panel - Cube + Binding Key + Time Dimension */}
          <FunnelConfigPanel
            selectedCube={funnelCube}
            bindingKey={funnelBindingKey}
            timeDimension={funnelTimeDimension}
            schema={schema}
            onCubeChange={onCubeChange}
            onBindingKeyChange={onBindingKeyChange}
            onTimeDimensionChange={onTimeDimensionChange}
          />

          {/* Step List - scrollable with extra bottom padding for "Add step" button */}
          <div className="flex-1 min-h-0 overflow-auto p-4 pb-24">
            <FunnelStepList
              steps={funnelSteps}
              activeStepIndex={activeFunnelStepIndex}
              schema={schema}
              onAddStep={onAddStep}
              onRemoveStep={onRemoveStep}
              onUpdateStep={onUpdateStep}
              onSelectStep={onSelectStep}
              onReorderSteps={onReorderSteps}
            />
          </div>
        </div>
      ) : activeTab === 'display' && displayConfig && onDisplayConfigChange ? (
        <div className="flex-1 min-h-0 overflow-auto p-4">
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

export default FunnelModeContent
