/**
 * LegacyBooleanOptions Component
 *
 * Backward-compatibility renderer for the simple boolean `displayOptions`
 * (showLegend, showGrid, etc.) used before structured `displayOptionsConfig`.
 * Extracted from AnalysisDisplayConfigPanel to keep it flat. Behaviour is
 * identical to the previous inline checkboxes.
 */

import { memo } from 'react'
import type { ChartDisplayConfig } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

interface LegacyBooleanOptionsProps {
  displayOptions?: string[]
  displayConfig: ChartDisplayConfig
  onDisplayConfigChange: (config: ChartDisplayConfig) => void
}

interface LegacyOptionSpec {
  key: keyof ChartDisplayConfig
  labelKey: string
  defaultChecked: boolean
}

// Preserves the original ordering and translation keys exactly.
const LEGACY_OPTIONS: LegacyOptionSpec[] = [
  { key: 'showLegend', labelKey: 'display.showLegend', defaultChecked: true },
  { key: 'showGrid', labelKey: 'display.showGrid', defaultChecked: true },
  { key: 'showTooltip', labelKey: 'display.showTooltip', defaultChecked: true },
  { key: 'stacked', labelKey: 'display.stacked', defaultChecked: false },
  { key: 'showAllXLabels', labelKey: 'chart.option.showAllXLabels.label', defaultChecked: true },
  { key: 'hideHeader', labelKey: 'display.hideHeader', defaultChecked: false }
]

const LegacyBooleanOptions = memo(function LegacyBooleanOptions({
  displayOptions,
  displayConfig,
  onDisplayConfigChange
}: LegacyBooleanOptionsProps) {
  const { t } = useTranslation()

  if (!displayOptions || displayOptions.length === 0) return null

  return (
    <>
      {LEGACY_OPTIONS.filter((spec) => displayOptions.includes(spec.key)).map((spec) => (
        <label key={spec.key} className="dc:flex dc:items-center dc:space-x-2">
          <input
            type="checkbox"
            checked={(displayConfig[spec.key] as boolean) ?? spec.defaultChecked}
            onChange={(e) =>
              onDisplayConfigChange({ ...displayConfig, [spec.key]: e.target.checked })
            }
            className="dc:rounded border-dc-border focus:ring-dc-accent"
            style={{ color: 'var(--dc-primary)' }}
          />
          <span className="dc:text-sm text-dc-text">{t(spec.labelKey)}</span>
        </label>
      ))}
    </>
  )
})

export default LegacyBooleanOptions
