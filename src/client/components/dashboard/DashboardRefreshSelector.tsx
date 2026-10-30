/**
 * Edit-mode control for the dashboard's default refresh interval: the
 * interval every portlet without its own setting refreshes on. Offers preset
 * intervals at or above the minimum, plus the current interval when it is not
 * a preset (set through import or code). Rendered only when
 * `features.refresh.enabled` is set.
 */

import { useTranslation } from '../../hooks/useTranslation.js'
import type { DashboardRefreshConfig } from '../../types.js'

/** Preset intervals, in seconds */
const PRESET_INTERVALS = [10, 30, 60, 300, 900, 3600]

/** Value of the "off" option */
const OFF = ''

/**
 * The intervals to offer: presets at or above the minimum, plus the current
 * interval when it is not one of them.
 */
export function refreshIntervalOptions(currentSeconds: number | undefined, minIntervalSeconds: number): number[] {
  const options = PRESET_INTERVALS.filter((seconds) => seconds >= minIntervalSeconds)
  if (currentSeconds !== undefined && !options.includes(currentSeconds)) {
    options.push(currentSeconds)
    options.sort((a, b) => a - b)
  }
  return options
}

export default function DashboardRefreshSelector({
  refresh,
  minIntervalSeconds,
  onChange
}: {
  refresh: DashboardRefreshConfig | undefined
  minIntervalSeconds: number
  /** The new dashboard refresh config; undefined turns the default off */
  onChange: (refresh: DashboardRefreshConfig | undefined) => void
}) {
  const { t } = useTranslation()
  const current = refresh?.intervalSeconds

  const formatInterval = (seconds: number): string => {
    const amount = seconds % 3600 === 0
      ? t('dashboard.portlet.freshness.hours', { count: seconds / 3600 })
      : seconds % 60 === 0
        ? t('dashboard.portlet.freshness.minutes', { count: seconds / 60 })
        : t('dashboard.portlet.freshness.seconds', { count: seconds })
    return t('dashboard.refreshDefault.every', { interval: amount })
  }

  const handleChange = (value: string) => {
    if (value === OFF) {
      onChange(undefined)
      return
    }
    // Keep the dashboard's other refresh settings (pauseWhenHidden)
    onChange({ ...refresh, intervalSeconds: Number(value) })
  }

  const label = t('dashboard.refreshDefault.label')

  return (
    <select
      value={current === undefined ? OFF : String(current)}
      onChange={(e) => handleChange(e.target.value)}
      aria-label={label}
      title={label}
      data-testid="dashboard-refresh-default"
      className="dc:px-3 dc:py-2 dc:text-sm dc:font-medium bg-dc-surface dc:border border-dc-border dc:rounded-md text-dc-text-secondary hover:bg-dc-surface-hover focus:outline-hidden dc:focus:ring-2 dc:focus:ring-offset-2 focus:ring-dc-accent"
    >
      <option value={OFF}>{t('dashboard.refreshDefault.off')}</option>
      {refreshIntervalOptions(current, minIntervalSeconds).map((seconds) => (
        <option key={seconds} value={String(seconds)}>
          {formatInterval(seconds)}
        </option>
      ))}
    </select>
  )
}
