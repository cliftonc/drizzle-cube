/**
 * AnalysisQueryPanel Component
 *
 * Right-side panel containing Query and Chart tabs with sections for
 * Metrics, Filters, and Breakdowns.
 */

import { useEffect, memo } from 'react'
import type { AnalysisQueryPanelProps } from './types'
import MetricsSection from './MetricsSection'
import BreakdownSection from './BreakdownSection'
import AnalysisFilterSection from './AnalysisFilterSection'
import AnalysisChartConfigPanel from './AnalysisChartConfigPanel'
import AnalysisDisplayConfigPanel from './AnalysisDisplayConfigPanel'

/**
 * AnalysisQueryPanel displays the right-side query builder with:
 * - Query/Chart tab switcher
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
  onDisplayConfigChange
}: AnalysisQueryPanelProps) {
  // Force query tab when no metrics are selected
  useEffect(() => {
    if (metrics.length === 0 && (activeTab === 'chart' || activeTab === 'display')) {
      onActiveTabChange('query')
    }
  }, [metrics.length, activeTab, onActiveTabChange])

  return (
    <div className="h-full flex flex-col bg-dc-surface">
      {/* Tab Bar */}
      <div className="flex border-b border-dc-border flex-shrink-0">
        <button
          onClick={() => onActiveTabChange('query')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'query'
              ? 'text-dc-primary border-b-2 border-dc-primary'
              : 'text-dc-text-secondary hover:text-dc-text'
          }`}
        >
          Query
        </button>
        <button
          onClick={() => metrics.length > 0 && onActiveTabChange('chart')}
          disabled={metrics.length === 0}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
            <BreakdownSection
              breakdowns={breakdowns}
              schema={schema}
              onAdd={onAddBreakdown}
              onRemove={onRemoveBreakdown}
              onGranularityChange={onBreakdownGranularityChange}
              order={order}
              onOrderChange={onOrderChange}
              onReorder={onReorderBreakdowns}
            />

            {/* Filter Section */}
            <AnalysisFilterSection
              filters={filters}
              schema={schema}
              onFiltersChange={onFiltersChange}
              onFieldDropped={onDropFieldToFilter}
            />
          </div>
        ) : activeTab === 'chart' ? (
          /* Chart Tab Content */
          <AnalysisChartConfigPanel
            chartType={chartType}
            chartConfig={chartConfig}
            metrics={metrics}
            breakdowns={breakdowns}
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
    </div>
  )
})

export default AnalysisQueryPanel
