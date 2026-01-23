/**
 * RetentionModeContent Component
 *
 * Container for all retention mode UI in AnalysisBuilder.
 * Displays tabs for Retention Configuration and Display options.
 *
 * Pattern matches FlowModeContent for consistency:
 * - Collapsible config panel at top
 * - Flat sections for filters, breakdowns, settings
 * - Reuses existing components (AnalysisFilterSection, BreakdownSection)
 */

import { memo, useState, useCallback, useMemo } from 'react'
import type { CubeMeta, FunnelBindingKey, ChartType, ChartDisplayConfig, Filter } from '../../types'
import type { ColorPalette } from '../../utils/colorPalettes'
import type {
  DateRange,
  RetentionGranularity,
  RetentionType,
  RetentionBreakdownItem,
} from '../../types/retention'
import {
  RETENTION_GRANULARITY_OPTIONS,
  RETENTION_TYPE_OPTIONS,
  RETENTION_MIN_PERIODS,
  RETENTION_MAX_PERIODS,
} from '../../types/retention'
import type { MetaResponse } from '../../shared/types'
import type { BreakdownItem } from './types'
import RetentionConfigPanel, { DateRangeSelector } from './RetentionConfigPanel'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'
import AnalysisFilterSection from './AnalysisFilterSection'
import BreakdownSection from './BreakdownSection'
import SectionHeading from './SectionHeading'

type RetentionPanelTab = 'config' | 'display'

export interface RetentionModeContentProps {
  /** Currently selected cube for retention analysis */
  retentionCube: string | null
  /** Binding key that links events to entities */
  retentionBindingKey: FunnelBindingKey | null
  /** Time dimension for event ordering */
  retentionTimeDimension: string | null
  /** Date range for cohort analysis */
  retentionDateRange: DateRange
  /** Cohort filters - define who enters the cohort */
  retentionCohortFilters: Filter[]
  /** Activity filters - define what counts as a return */
  retentionActivityFilters: Filter[]
  /** Breakdown dimensions for segmentation */
  retentionBreakdowns: RetentionBreakdownItem[]
  /** Granularity for viewing retention periods */
  retentionViewGranularity: RetentionGranularity
  /** Number of periods to analyze */
  retentionPeriods: number
  /** Retention calculation type */
  retentionType: RetentionType
  /** Cube metadata for field selection */
  schema: CubeMeta | null

  // Actions - Configuration
  /** Callback when cube changes */
  onCubeChange: (cube: string | null) => void
  /** Callback when binding key changes */
  onBindingKeyChange: (key: FunnelBindingKey | null) => void
  /** Callback when time dimension changes */
  onTimeDimensionChange: (dim: string | null) => void
  /** Callback when date range changes */
  onDateRangeChange: (range: DateRange) => void
  /** Callback when cohort filters change */
  onCohortFiltersChange: (filters: Filter[]) => void
  /** Callback when activity filters change */
  onActivityFiltersChange: (filters: Filter[]) => void
  /** Callback when breakdowns change (set all) */
  onBreakdownsChange: (breakdowns: RetentionBreakdownItem[]) => void
  /** Callback to add a breakdown */
  onAddBreakdown: (breakdown: RetentionBreakdownItem) => void
  /** Callback to remove a breakdown */
  onRemoveBreakdown: (field: string) => void
  /** Callback when granularity changes */
  onGranularityChange: (granularity: RetentionGranularity) => void
  /** Callback when periods changes */
  onPeriodsChange: (periods: number) => void
  /** Callback when retention type changes */
  onRetentionTypeChange: (type: RetentionType) => void
  /** Callback to open field modal for adding breakdowns */
  onOpenFieldModal?: () => void

  // Display configuration (optional - for Display tab)
  /** Chart type for retention display */
  chartType?: ChartType
  /** Callback when chart type changes */
  onChartTypeChange?: (type: ChartType) => void
  /** Display configuration */
  displayConfig?: ChartDisplayConfig
  /** Color palette */
  colorPalette?: ColorPalette
  /** Callback when display config changes */
  onDisplayConfigChange?: (config: ChartDisplayConfig) => void
}

/**
 * Convert RetentionBreakdownItem[] to BreakdownItem[] for BreakdownSection
 */
function convertToBreakdownItems(items: RetentionBreakdownItem[] | undefined | null): BreakdownItem[] {
  if (!items || !Array.isArray(items)) return []
  return items.map((item) => ({
    id: item.field, // Use field as id
    field: item.field,
    isTimeDimension: false, // Retention breakdowns are never time dimensions
    granularity: undefined,
    enableComparison: false,
  }))
}

/**
 * RetentionModeContent displays the complete retention configuration interface:
 * - Tabs: Retention | Display
 * - Retention tab: Config panel + cohort filter + activity filter + breakdown + settings
 * - Display tab: Heatmap/chart display options
 */
const RetentionModeContent = memo(function RetentionModeContent({
  retentionCube = null,
  retentionBindingKey = null,
  retentionTimeDimension = null,
  retentionDateRange = { start: '', end: '' },
  retentionCohortFilters = [],
  retentionActivityFilters = [],
  retentionBreakdowns = [],
  retentionViewGranularity = 'week',
  retentionPeriods = 12,
  retentionType = 'classic',
  schema = null,
  onCubeChange = () => {},
  onBindingKeyChange = () => {},
  onTimeDimensionChange = () => {},
  onDateRangeChange = () => {},
  onCohortFiltersChange = () => {},
  onActivityFiltersChange = () => {},
  onBreakdownsChange: _onBreakdownsChange = () => {},
  onAddBreakdown: _onAddBreakdown = () => {},
  onRemoveBreakdown = () => {},
  onGranularityChange = () => {},
  onPeriodsChange = () => {},
  onRetentionTypeChange = () => {},
  onOpenFieldModal = () => {},
  // Display props
  chartType = 'retentionCombined',
  onChartTypeChange: _onChartTypeChange,
  displayConfig,
  colorPalette,
  onDisplayConfigChange,
}: RetentionModeContentProps) {
  const [activeTab, setActiveTab] = useState<RetentionPanelTab>('config')

  // Check if display tab is available
  const hasDisplayTab = displayConfig && onDisplayConfigChange

  // Filter schema to only include the selected cube
  // Cast to MetaResponse for compatibility with AnalysisFilterSection
  const filteredSchema = useMemo((): MetaResponse | null => {
    if (!schema || !retentionCube) return schema as MetaResponse | null
    return {
      ...schema,
      cubes: schema.cubes?.filter((c) => c.name === retentionCube) || [],
    } as MetaResponse
  }, [schema, retentionCube])

  // Convert breakdowns to BreakdownItem format for BreakdownSection
  const breakdownItems = useMemo(
    () => convertToBreakdownItems(retentionBreakdowns),
    [retentionBreakdowns]
  )

  // Handler for breakdown removal (converts id back to field)
  const handleRemoveBreakdown = useCallback(
    (id: string) => {
      onRemoveBreakdown(id) // id is the field name
    },
    [onRemoveBreakdown]
  )

  // Handler for adding breakdown via BreakdownSection (opens field modal)
  const handleAddBreakdown = useCallback(() => {
    if (onOpenFieldModal) {
      onOpenFieldModal()
    }
  }, [onOpenFieldModal])

  // No-op handlers for BreakdownSection (retention doesn't use granularity/comparison)
  const handleGranularityChange = useCallback(() => {
    // No-op - retention breakdowns don't have granularity
  }, [])

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-dc-border flex-shrink-0">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'config'
              ? 'text-dc-primary border-b-2 border-dc-primary'
              : 'text-dc-text-secondary hover:text-dc-text'
          }`}
        >
          Retention
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
      {activeTab === 'config' ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Configuration Panel - Cube + Binding Key + Time Dimension */}
          <RetentionConfigPanel
            selectedCube={retentionCube}
            bindingKey={retentionBindingKey}
            timeDimension={retentionTimeDimension}
            dateRange={retentionDateRange}
            schema={schema}
            onCubeChange={onCubeChange}
            onBindingKeyChange={onBindingKeyChange}
            onTimeDimensionChange={onTimeDimensionChange}
          />

          {/* Retention Configuration - scrollable */}
          <div className="flex-1 min-h-0 overflow-auto p-4 space-y-6">
            {/* Date Range Selector - at top for visibility */}
            <div>
              <SectionHeading>Date Range</SectionHeading>
              <p className="text-xs text-dc-text-muted mb-3">
                Select the date range for cohort entry. Users who first appear within this range will be analyzed.
              </p>
              <DateRangeSelector
                dateRange={retentionDateRange}
                onDateRangeChange={onDateRangeChange}
              />
            </div>

            {/* Cohort Filter Section */}
            <div>
              <SectionHeading>Cohort Filter</SectionHeading>
              <p className="text-xs text-dc-text-muted mb-3">
                Define who enters the cohort. Users whose first event matches these filters within the date range are included.
              </p>
              <AnalysisFilterSection
                filters={retentionCohortFilters}
                schema={filteredSchema}
                onFiltersChange={onCohortFiltersChange}
                dimensionsOnly={true}
              />
            </div>

            {/* Return Filter Section */}
            <div>
              <SectionHeading>Return Filter</SectionHeading>
              <p className="text-xs text-dc-text-muted mb-3">
                Define what counts as a return. Events matching these filters in subsequent periods count as retention.
              </p>
              <AnalysisFilterSection
                filters={retentionActivityFilters}
                schema={filteredSchema}
                onFiltersChange={onActivityFiltersChange}
                dimensionsOnly={true}
              />
            </div>

            {/* Breakdown Section */}
            <div>
              <SectionHeading>Breakdown</SectionHeading>
              <p className="text-xs text-dc-text-muted mb-3">
                Optionally segment retention by dimensions (e.g., country, plan type).
              </p>
              <BreakdownSection
                breakdowns={breakdownItems}
                schema={filteredSchema}
                onAdd={handleAddBreakdown}
                onRemove={handleRemoveBreakdown}
                onGranularityChange={handleGranularityChange}
              />
            </div>

            {/* Settings Section */}
            <div>
              <SectionHeading>Settings</SectionHeading>
              <p className="text-xs text-dc-text-muted mb-3">
                Configure how retention is calculated and displayed.
              </p>

              <div className="space-y-4">
                {/* Granularity */}
                <div>
                  <label className="block text-xs font-medium text-dc-text-muted mb-1">
                    Period Granularity
                  </label>
                  <div className="flex gap-2">
                    {RETENTION_GRANULARITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onGranularityChange(option.value)}
                        className={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                          retentionViewGranularity === option.value
                            ? 'border-dc-primary bg-dc-primary/10 text-dc-primary'
                            : 'border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Periods */}
                <div>
                  <label className="block text-xs font-medium text-dc-text-muted mb-1">
                    Number of Periods ({RETENTION_MIN_PERIODS}-{RETENTION_MAX_PERIODS})
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={RETENTION_MIN_PERIODS}
                      max={RETENTION_MAX_PERIODS}
                      value={retentionPeriods}
                      onChange={(e) => onPeriodsChange(parseInt(e.target.value, 10))}
                      className="flex-1"
                    />
                    <span className="w-8 text-sm font-medium text-dc-text text-center">
                      {retentionPeriods}
                    </span>
                  </div>
                  {retentionPeriods > 26 && (
                    <p className="mt-1 text-xs text-dc-warning">
                      High period count may impact query performance.
                    </p>
                  )}
                </div>

                {/* Retention Type */}
                <div>
                  <label className="block text-xs font-medium text-dc-text-muted mb-1">
                    Retention Type
                  </label>
                  <div className="flex gap-2">
                    {RETENTION_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onRetentionTypeChange(option.value)}
                        className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors ${
                          retentionType === option.value
                            ? 'border-dc-primary bg-dc-primary/10 text-dc-primary'
                            : 'border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-[10px] font-normal text-dc-text-muted">
                            {option.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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

export default RetentionModeContent
