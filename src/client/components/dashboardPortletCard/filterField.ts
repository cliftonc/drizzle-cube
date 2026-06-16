/**
 * Resolves which field a selected dashboard filter targets on a given portlet.
 * Extracted from DashboardPortletCard's memo.
 */

import type { DashboardFilter, PortletConfig } from '../../types.js'
import { getMappingMemberOverride } from '../../utils/filterUtils.js'

export interface EffectiveFilterField {
  field: string
  isOverride: boolean
}

export function resolveEffectiveFilterField(params: {
  isInSelectionMode: boolean
  hasSelectedFilter: boolean
  selectedFilterId: string | null | undefined
  dashboardFilters?: DashboardFilter[]
  dashboardFilterMapping: PortletConfig['dashboardFilterMapping']
}): EffectiveFilterField | null {
  const { isInSelectionMode, hasSelectedFilter, selectedFilterId, dashboardFilters, dashboardFilterMapping } = params

  if (!isInSelectionMode || !hasSelectedFilter || !selectedFilterId) return null

  const selectedFilter = dashboardFilters?.find(f => f.id === selectedFilterId)
  if (!selectedFilter || selectedFilter.isUniversalTime) return null

  const override = getMappingMemberOverride(dashboardFilterMapping, selectedFilterId)
  if (override) return { field: override, isOverride: true }

  if ('member' in selectedFilter.filter && selectedFilter.filter.member) {
    return { field: selectedFilter.filter.member, isOverride: false }
  }
  return null
}
