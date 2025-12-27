/**
 * AnalysisQueryPanel Component
 *
 * Right-side panel containing Query and Chart tabs with sections for
 * Metrics, Filters, and Breakdowns.
 */

import { useEffect } from 'react'
import type { AnalysisQueryPanelProps } from './types'
import MetricsSection from './MetricsSection'
import BreakdownSection from './BreakdownSection'
import AnalysisFilterSection from './AnalysisFilterSection'
import AnalysisChartConfigPanel from './AnalysisChartConfigPanel'

/**
 * AnalysisQueryPanel displays the right-side query builder with:
 * - Query/Chart tab switcher
 * - Metrics section (measures)
 * - Filter section
 * - Breakdown section (dimensions)
 * - Chart configuration (in Chart tab)
 */
export default function AnalysisQueryPanel({
  metrics,
  breakdowns,
  filters,
  schema,
  activeTab,
  onActiveTabChange,
  onAddMetric,
  onRemoveMetric,
  onAddBreakdown,
  onRemoveBreakdown,
  onBreakdownGranularityChange,
  onFiltersChange,
  // Sorting
  order,
  onOrderChange,
  // Chart configuration
  chartType,
  chartConfig,
  displayConfig,
  chartAvailability,
  onChartTypeChange,
  onChartConfigChange,
  onDisplayConfigChange
}: AnalysisQueryPanelProps) {
  // Force query tab when no metrics are selected
  useEffect(() => {
    if (metrics.length === 0 && activeTab === 'chart') {
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
            />

            {/* Filter Section */}
            <AnalysisFilterSection
              filters={filters}
              schema={schema}
              onFiltersChange={onFiltersChange}
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
            />
          </div>
        ) : activeTab === 'chart' ? (
          /* Chart Tab Content */
          <AnalysisChartConfigPanel
            chartType={chartType}
            chartConfig={chartConfig}
            displayConfig={displayConfig}
            metrics={metrics}
            breakdowns={breakdowns}
            schema={schema}
            chartAvailability={chartAvailability}
            onChartTypeChange={onChartTypeChange}
            onChartConfigChange={onChartConfigChange}
            onDisplayConfigChange={onDisplayConfigChange}
          />
        ) : null}
      </div>
    </div>
  )
}
