/**
 * "Auto-refresh" section of the portlet edit modal: the portlet's refresh
 * interval (empty = dashboard default) and whether to pause while the tab is
 * hidden. Shown only when `features.refresh.enabled` is set.
 */

import { useTranslation } from '../../hooks/useTranslation.js'
import type { PortletRefreshConfig } from '../../types.js'

/**
 * Form state for the section: the interval as typed, plus the hidden-tab flag.
 * An undefined flag inherits the dashboard default; a boolean is an explicit
 * portlet override, false included.
 */
export interface RefreshSettingsValue {
  intervalText: string
  pauseWhenHidden?: boolean
}

export function toRefreshSettingsValue(refresh: PortletRefreshConfig | undefined): RefreshSettingsValue {
  return {
    intervalText: refresh?.intervalSeconds !== undefined ? String(refresh.intervalSeconds) : '',
    pauseWhenHidden: refresh?.pauseWhenHidden
  }
}

/**
 * The portlet `refresh` config for the form state, or undefined when neither
 * field overrides the dashboard default. An empty or invalid interval inherits
 * the dashboard's; a valid one is floored by `minIntervalSeconds`.
 */
export function fromRefreshSettingsValue(
  value: RefreshSettingsValue,
  minIntervalSeconds: number
): PortletRefreshConfig | undefined {
  const refresh: PortletRefreshConfig = {}
  const trimmed = value.intervalText.trim()
  const interval = trimmed === '' ? NaN : Number(trimmed)
  if (Number.isFinite(interval) && interval > 0) {
    refresh.intervalSeconds = Math.max(Math.ceil(interval), minIntervalSeconds)
  }
  if (value.pauseWhenHidden !== undefined) refresh.pauseWhenHidden = value.pauseWhenHidden
  return Object.keys(refresh).length > 0 ? refresh : undefined
}

export default function RefreshSettings({
  value,
  minIntervalSeconds,
  inheritedPauseWhenHidden = false,
  onChange
}: {
  value: RefreshSettingsValue
  minIntervalSeconds: number
  /** The dashboard default, shown while the portlet has no override of its own */
  inheritedPauseWhenHidden?: boolean
  onChange: (value: RefreshSettingsValue) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="dc:flex dc:flex-wrap dc:items-center dc:gap-3" data-testid="portlet-refresh-settings">
      <span className="dc:text-sm dc:font-medium text-dc-text-secondary dc:shrink-0">
        {t('portletModal.refresh.label')}
      </span>
      <div className="dc:flex dc:items-center dc:gap-2">
        <input
          id="portlet-refresh-interval"
          type="number"
          min={minIntervalSeconds}
          step={1}
          inputMode="numeric"
          value={value.intervalText}
          onChange={(e) => onChange({ ...value, intervalText: e.target.value })}
          placeholder={t('portletModal.refresh.intervalPlaceholder')}
          aria-label={t('portletModal.refresh.interval')}
          title={t('portletModal.refresh.minHint', { min: minIntervalSeconds })}
          className="dc:w-36 dc:px-3 dc:py-1.5 dc:text-sm bg-dc-surface dc:border border-dc-border dc:rounded-md text-dc-text placeholder-dc-text-muted dc:focus:outline-none dc:focus:ring-2 focus:ring-dc-accent focus:border-transparent"
        />
        <span className="dc:text-sm text-dc-text-muted">{t('portletModal.refresh.seconds')}</span>
      </div>
      <label className="dc:inline-flex dc:items-center dc:gap-2 dc:text-sm text-dc-text-secondary dc:cursor-pointer">
        <input
          type="checkbox"
          checked={value.pauseWhenHidden ?? inheritedPauseWhenHidden}
          onChange={(e) => onChange({ ...value, pauseWhenHidden: e.target.checked })}
          className="dc:h-4 dc:w-4 dc:rounded-sm border-dc-border dc:focus:ring-2 focus:ring-dc-primary"
          style={{ accentColor: 'var(--dc-primary)' }}
        />
        {t('portletModal.refresh.pauseWhenHidden')}
      </label>
    </div>
  )
}
