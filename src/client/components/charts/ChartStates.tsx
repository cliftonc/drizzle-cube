import React from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'

/**
 * Shared guard/state components for chart rendering.
 *
 * Cartesian charts (bar, line, area, pie, …) all duplicated the same
 * centred flex blocks for their empty / config-error / render-error states,
 * differing only in the hint text. These components own the duplicated wrapper
 * JSX; each chart supplies its own already-resolved `hint` (a translation key
 * resolved via `t()`, or a literal string) so per-chart messaging is preserved.
 */

interface ChartStateProps {
  height?: string | number
  /** Already-resolved hint text (caller resolves its own i18n key) */
  hint?: React.ReactNode
}

/**
 * Empty / no-data state (muted styling). `titleKey` defaults to the generic
 * "No data available" heading but can be overridden (e.g. for the post-transform
 * "No valid data" state).
 */
export function ChartEmptyState({
  height,
  hint,
  titleKey = 'chart.runtime.noData'
}: ChartStateProps & { titleKey?: string }) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
      <div className="dc:text-center">
        <div className="dc:text-sm dc:font-semibold dc:mb-1">{t(titleKey)}</div>
        {hint != null && <div className="dc:text-xs text-dc-text-secondary">{hint}</div>}
      </div>
    </div>
  )
}

/**
 * Invalid-configuration state (warning styling). Title is always
 * "Configuration Error"; the chart supplies a hint describing what is missing.
 */
export function ChartConfigError({ height, hint }: ChartStateProps) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
      <div className="dc:text-center">
        <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.configError')}</div>
        {hint != null && <div className="dc:text-xs">{hint}</div>}
      </div>
    </div>
  )
}

/**
 * Render-error state (error styling), used in chart `catch` blocks.
 */
export function ChartRenderError({
  height,
  chartType,
  error
}: {
  height?: string | number
  /** Display name used in the "{chartType} Error" heading */
  chartType: string
  error: unknown
}) {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4" style={{ height }}>
      <div className="dc:text-center">
        <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.chartError', { chartType })}</div>
        <div className="dc:text-xs dc:mb-2">{error instanceof Error ? error.message : t('chart.runtime.unknownError')}</div>
        <div className="dc:text-xs text-dc-text-muted">{t('chart.runtime.checkConfig')}</div>
      </div>
    </div>
  )
}
