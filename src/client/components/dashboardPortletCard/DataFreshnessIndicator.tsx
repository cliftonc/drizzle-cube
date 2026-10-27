/**
 * Freshness of a portlet's data, shown in its header: a status dot and the age
 * of computed-at (when the rows were computed on the server, earlier than
 * receipt for a cached result). The dot pulses while fetching, and the dot and
 * age turn the warning color when computed-at is older than two refresh
 * intervals. The pause controls show a paused refresh; here it only stops the
 * stale warning. The tooltip spells out computed-at and the stale or paused
 * state.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { isComputedAtStale } from '../../utils/freshness.js'

/** How often the relative age re-renders */
const CLOCK_TICK_MS = 5000

export interface DataFreshnessIndicatorProps {
  /** When the rows were computed (ISO string) */
  computedAt?: string
  /** Whether a fetch is in flight */
  isFetching: boolean
  /** The portlet's effective refresh interval, when it refreshes on one */
  intervalSeconds?: number
  /** Whether the viewer paused this portlet's refresh (portlet or dashboard) */
  isPaused: boolean
}

function useNow(tickMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), tickMs)
    return () => clearInterval(timer)
  }, [tickMs])
  return now
}

export default function DataFreshnessIndicator({
  computedAt,
  isFetching,
  intervalSeconds,
  isPaused
}: DataFreshnessIndicatorProps) {
  const { t, locale } = useTranslation()
  const now = useNow(CLOCK_TICK_MS)

  const computedMs = computedAt ? Date.parse(computedAt) : NaN
  const hasComputedAt = Number.isFinite(computedMs)
  const isStale = !isPaused && !isFetching && isComputedAtStale(computedAt, intervalSeconds, now)

  let ageLabel: string | null = null
  if (hasComputedAt) {
    const ageSeconds = Math.max(0, Math.floor((now - computedMs) / 1000))
    if (ageSeconds < 5) {
      ageLabel = t('dashboard.portlet.freshness.justNow')
    } else {
      const age = ageSeconds < 60
        ? t('dashboard.portlet.freshness.seconds', { count: ageSeconds })
        : ageSeconds < 3600
          ? t('dashboard.portlet.freshness.minutes', { count: Math.floor(ageSeconds / 60) })
          : t('dashboard.portlet.freshness.hours', { count: Math.floor(ageSeconds / 3600) })
      ageLabel = t('dashboard.portlet.freshness.ago', { age })
    }
  }

  if (!ageLabel && !isFetching) return null

  const title = [
    hasComputedAt ? t('dashboard.portlet.freshness.computedAt', { time: new Date(computedMs).toLocaleString(locale) }) : null,
    isFetching ? t('dashboard.portlet.freshness.updating') : null,
    isStale && intervalSeconds !== undefined ? t('dashboard.portlet.freshness.staleTitle', { interval: intervalSeconds }) : null,
    isPaused ? t('dashboard.portlet.freshness.pausedTitle') : null
  ].filter(Boolean).join(' · ')

  const state = isFetching ? 'updating' : isStale ? 'stale' : isPaused ? 'paused' : 'fresh'
  const dotClass = isFetching ? 'bg-dc-primary dc:animate-pulse' : isStale ? 'bg-dc-warning' : 'bg-dc-border'

  return (
    <span
      className={`dc:inline-flex dc:items-center dc:gap-1 dc:text-xs dc:whitespace-nowrap ${isStale ? 'text-dc-warning' : 'text-dc-text-muted'}`}
      title={title}
      data-testid="portlet-freshness"
      data-state={state}
    >
      <span
        className={`dc:inline-block dc:w-1.5 dc:h-1.5 dc:rounded-full ${dotClass}`}
        data-testid="portlet-freshness-dot"
        data-updating={isFetching ? 'true' : 'false'}
        aria-label={isFetching ? t('dashboard.portlet.freshness.updating') : undefined}
        role={isFetching ? 'status' : undefined}
      />
      {ageLabel && (
        <span data-testid="portlet-freshness-age" data-computed-at={computedAt}>
          {ageLabel}
        </span>
      )}
    </span>
  )
}
