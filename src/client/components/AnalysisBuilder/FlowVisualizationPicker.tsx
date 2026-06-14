/**
 * FlowVisualizationPicker Component
 *
 * Sankey vs Sunburst visualization selector for flow mode. Extracted from
 * FlowModeContent to keep its render body flat.
 */

import { memo } from 'react'
import type { ChartType } from '../../types'
import SectionHeading from './SectionHeading'
import { useTranslation } from '../../hooks/useTranslation'

interface FlowVisualizationPickerProps {
  chartType: ChartType
  onChartTypeChange: (type: ChartType) => void
}

interface FlowVizOption {
  value: ChartType
  labelKey: string
  hintKey: string
}

const OPTIONS: FlowVizOption[] = [
  { value: 'sankey', labelKey: 'flow.visualization.sankey', hintKey: 'flow.visualization.sankeyHint' },
  { value: 'sunburst', labelKey: 'flow.visualization.sunburst', hintKey: 'flow.visualization.sunburstHint' }
]

const FlowVisualizationPicker = memo(function FlowVisualizationPicker({
  chartType,
  onChartTypeChange
}: FlowVisualizationPickerProps) {
  const { t } = useTranslation()

  return (
    <div>
      <SectionHeading>{t('flow.visualization.title')}</SectionHeading>
      <p className="dc:text-xs text-dc-text-muted dc:mb-3">
        {t('flow.visualization.description')}
      </p>
      <div className="dc:flex dc:gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChartTypeChange(option.value)}
            className={`dc:flex-1 dc:px-3 dc:py-2 dc:rounded-md dc:border dc:text-sm dc:font-medium dc:transition-colors ${
              chartType === option.value
                ? 'border-dc-primary bg-dc-primary/10 text-dc-primary'
                : 'border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text'
            }`}
          >
            <div className="dc:flex dc:flex-col dc:items-center dc:gap-1">
              <span>{t(option.labelKey)}</span>
              <span className="dc:text-[10px] dc:font-normal text-dc-text-muted">
                {t(option.hintKey)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
})

export default FlowVisualizationPicker
