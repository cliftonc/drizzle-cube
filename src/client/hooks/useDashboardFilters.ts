import { useMemo, useState } from 'react'
import type { DashboardConfig, DashboardFilter } from '../types.js'
import { stableStringify } from '../shared/queryKey.js'

const EMPTY_FILTERS: DashboardFilter[] = []

/** A viewer's picks on config filters, made against one version of the saved filters. */
interface ViewerPicks {
  savedFilters: string
  values: Map<string, DashboardFilter['filter']>
}

/** One accepted set of values for both controls and portlet queries. */
export function useDashboardFilters(
  config: DashboardConfig,
  overrides: DashboardFilter[] = EMPTY_FILTERS,
  onConfigChange?: (config: DashboardConfig) => void,
  onOverridesChange?: (overrides: DashboardFilter[], changedFilterId: string) => void
) {
  const configFilters = config.filters ?? EMPTY_FILTERS
  const savedFilters = useMemo(() => stableStringify(configFilters), [configFilters])
  const overrideById = useMemo(() => new Map(overrides.map(filter => [filter.id, filter])), [overrides])
  const configById = useMemo(() => new Map(configFilters.map(filter => [filter.id, filter])), [configFilters])

  // Without onConfigChange the dashboard keeps a viewer's picks itself. They apply
  // only while the saved filters match the ones they were made against.
  const [picks, setPicks] = useState<ViewerPicks | null>(null)
  const viewerValues = !onConfigChange && picks?.savedFilters === savedFilters ? picks.values : undefined

  const dashboardFilters = useMemo(() => {
    // Keep the config's array when nothing overrides it, so portlets skip re-rendering.
    if (overrides.length === 0 && !viewerValues) return configFilters
    return [
      ...configFilters.map(filter => {
        const value = overrideById.get(filter.id)?.filter ?? viewerValues?.get(filter.id)
        return value ? { ...filter, filter: value } : filter
      }),
      ...overrides.filter(filter => !configById.has(filter.id))
    ]
  }, [configFilters, overrideById, viewerValues, overrides, configById])

  // Each request changes one filter, so it goes only to that filter's owner.
  function onDashboardFiltersChange(next: DashboardFilter[], changedFilterId: string) {
    const nextById = new Map(next.map(filter => [filter.id, filter]))
    if (overrideById.has(changedFilterId)) {
      // Without onOverridesChange the host's filters are read-only and their controls disabled.
      onOverridesChange?.(overrides.flatMap(filter => {
        const updated = nextById.get(filter.id)
        return updated ? [{ ...filter, filter: updated.filter }] : []
      }), changedFilterId)
    } else if (onConfigChange) {
      // Prop values must not overwrite saved config defaults or introduce
      // prop-only definitions into the config callback.
      const nextConfigFilters = next.flatMap(filter => {
        if (!overrideById.has(filter.id)) return [filter]
        const original = configById.get(filter.id)
        return original ? [{ ...filter, filter: original.filter }] : []
      })
      onConfigChange({ ...config, filters: nextConfigFilters })
    } else {
      const changed = nextById.get(changedFilterId)
      if (!changed || !configById.has(changedFilterId)) return
      setPicks(current => ({
        savedFilters,
        values: new Map(current?.savedFilters === savedFilters ? current.values : []).set(changedFilterId, changed.filter)
      }))
    }
  }

  return {
    dashboardFilters,
    onDashboardFiltersChange,
    readOnlyFilterIds: onOverridesChange ? [] : overrides.map(filter => filter.id)
  }
}
