/**
 * Dashboard interval refresh.
 *
 * Groups portlets by effective refresh interval and runs one timer per group.
 * Each tick calls the same portlet refresh action as the refresh button, with
 * max-age equal to the interval, so viewers in one security context share one
 * server execution per interval, and portlets in one group share one batch
 * call. A per-observer `refetchInterval` would split that batch.
 *
 * Nothing ticks unless `features.refresh.enabled` is set; `manualRefresh`,
 * edit mode and a dashboard-level pause stop every timer; a per-portlet pause
 * or a hidden tab (with `pauseWhenHidden`) skips that portlet's ticks.
 */

import { useEffect, useMemo, useRef } from 'react'
import type { DashboardRefreshConfig, FeaturesConfig, PortletConfig } from '../../types.js'
import { resolveEffectiveRefresh } from '../../utils/freshness.js'

/** One portlet in an interval group. */
export interface RefreshGroupMember {
  portletId: string
  pauseWhenHidden: boolean
}

/**
 * Portlets keyed by effective refresh interval (seconds). Portlets with no
 * effective refresh are left out.
 */
export function groupPortletsByRefreshInterval(
  portlets: PortletConfig[],
  dashboardRefresh: DashboardRefreshConfig | undefined,
  features: FeaturesConfig
): Map<number, RefreshGroupMember[]> {
  const groups = new Map<number, RefreshGroupMember[]>()
  for (const portlet of portlets) {
    const refresh = resolveEffectiveRefresh(portlet.refresh, dashboardRefresh, features)
    if (!refresh) continue
    const member = { portletId: portlet.id, pauseWhenHidden: refresh.pauseWhenHidden }
    const group = groups.get(refresh.intervalSeconds)
    if (group) group.push(member)
    else groups.set(refresh.intervalSeconds, [member])
  }
  return groups
}

export interface UseDashboardRefreshTimerParams {
  portlets: PortletConfig[]
  dashboardRefresh?: DashboardRefreshConfig
  features: FeaturesConfig
  /** Stop every timer (edit mode or dashboard-level pause) */
  stopped: boolean
  /** Portlets the viewer paused; their ticks are skipped */
  pausedPortletIds: string[]
  /** The refresh button's action */
  refreshPortlet: (portletId: string, options: { maxAgeSeconds: number }) => void
}

export interface DashboardRefreshTimerState {
  /** Whether any portlet on the dashboard has an effective refresh interval */
  hasRefresh: boolean
}

function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

export function useDashboardRefreshTimer({
  portlets,
  dashboardRefresh,
  features,
  stopped,
  pausedPortletIds,
  refreshPortlet
}: UseDashboardRefreshTimerParams): DashboardRefreshTimerState {
  const groups = useMemo(
    () => groupPortletsByRefreshInterval(portlets, dashboardRefresh, features),
    [portlets, dashboardRefresh, features]
  )

  // Ticks read the latest groups, pauses and action, so editing the config or
  // pausing one portlet does not restart the timers.
  const groupsRef = useRef(groups)
  groupsRef.current = groups
  const pausedRef = useRef(pausedPortletIds)
  pausedRef.current = pausedPortletIds
  const refreshPortletRef = useRef(refreshPortlet)
  refreshPortletRef.current = refreshPortlet

  // Timers restart only when the set of intervals changes
  const intervalsKey = useMemo(
    () => Array.from(groups.keys()).sort((a, b) => a - b).join(','),
    [groups]
  )

  useEffect(() => {
    if (stopped || intervalsKey === '') return

    const timers = intervalsKey.split(',').map(Number).map((intervalSeconds) =>
      setInterval(() => {
        const members = groupsRef.current.get(intervalSeconds) ?? []
        const hidden = isDocumentHidden()
        for (const member of members) {
          if (pausedRef.current.includes(member.portletId)) continue
          if (hidden && member.pauseWhenHidden) continue
          refreshPortletRef.current(member.portletId, { maxAgeSeconds: intervalSeconds })
        }
      }, intervalSeconds * 1000)
    )

    return () => {
      timers.forEach(clearInterval)
    }
  }, [intervalsKey, stopped])

  return { hasRefresh: groups.size > 0 }
}
