/**
 * Portlet Filter Configuration Modal
 * Allows users to configure which dashboard filters apply to a specific portlet,
 * and optionally remap a filter to a different (join-reachable) field for this portlet
 */

import { useState, useEffect, useMemo } from 'react'
import type {
  DashboardFilter,
  DashboardFilterMapping,
  DashboardFilterMappingEntry,
  CubeMeta,
  PortletConfig
} from '../types'
import { normalizeFilterMapping, serializeFilterMapping } from '../utils/filterUtils'
import { getReachableDimensionOptions } from '../utils/joinReachability'
import { useTranslation } from '../hooks/useTranslation'

interface PortletFilterConfigModalProps {
  isOpen: boolean
  onClose: () => void
  dashboardFilters: DashboardFilter[]
  currentMapping: DashboardFilterMapping
  onSave: (mapping: DashboardFilterMapping) => void
  portletTitle: string
  schema?: CubeMeta | null
  portlet?: PortletConfig | null
}

export default function PortletFilterConfigModal({
  isOpen,
  onClose,
  dashboardFilters = [],
  currentMapping = [],
  onSave,
  portletTitle,
  schema = null,
  portlet = null
}: PortletFilterConfigModalProps) {
  const { t } = useTranslation()
  const [selectedEntries, setSelectedEntries] = useState<DashboardFilterMappingEntry[]>(
    () => normalizeFilterMapping(currentMapping)
  )

  // Update local state when props change. Bail out (return the previous
  // state) when the content is unchanged: the prop may be a fresh array
  // identity on every render, and always setting fresh state would loop.
  useEffect(() => {
    setSelectedEntries(prev => {
      const next = normalizeFilterMapping(currentMapping)
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
    })
  }, [currentMapping, isOpen])

  const handleToggleFilter = (filterId: string) => {
    setSelectedEntries(prev => {
      if (prev.some(e => e.filterId === filterId)) {
        return prev.filter(e => e.filterId !== filterId)
      } else {
        return [...prev, { filterId }]
      }
    })
  }

  const handleMemberChange = (filterId: string, member: string) => {
    setSelectedEntries(prev =>
      prev.map(e =>
        e.filterId === filterId
          ? (member ? { filterId, member } : { filterId })
          : e
      )
    )
  }

  const handleSave = () => {
    onSave(serializeFilterMapping(selectedEntries))
    onClose()
  }

  const handleCancel = () => {
    setSelectedEntries(normalizeFilterMapping(currentMapping)) // Reset to original
    onClose()
  }

  // Reachable, type-compatible field options per simple filter member.
  // Keyed by the filter's own member so filters sharing a member share options.
  const fieldOptionsByMember = useMemo(() => {
    const result = new Map<string, ReturnType<typeof getReachableDimensionOptions>>()
    if (!schema || !portlet) return result

    dashboardFilters.forEach(df => {
      if (df.isUniversalTime) return
      if (!('member' in df.filter) || !df.filter.member) return
      if (result.has(df.filter.member)) return
      result.set(
        df.filter.member,
        getReachableDimensionOptions(schema, portlet, { sameTypeAs: df.filter.member })
      )
    })
    return result
  }, [schema, portlet, dashboardFilters])

  // Format filter preview text
  const formatFilterPreview = (filter: DashboardFilter): string => {
    if (!filter.filter) return ''

    // Handle simple filters
    if ('member' in filter.filter && filter.filter.member) {
      const values = filter.filter.values || []
      const valuesText = values.length > 0 ? values.join(', ') : t('portlet.filterConfig.noValue')
      return `${filter.filter.member} ${filter.filter.operator} ${valuesText}`
    }

    // Handle group filters (AND/OR)
    if ('type' in filter.filter && filter.filter.type) {
      const filterCount = filter.filter.filters?.length || 0
      return filterCount === 1
        ? t('portlet.filterConfig.groupFilter', { type: filter.filter.type.toUpperCase(), count: filterCount })
        : t('portlet.filterConfig.groupFilterPlural', { type: filter.filter.type.toUpperCase(), count: filterCount })
    }

    return t('portlet.filterConfig.complexFilter')
  }

  if (!isOpen) return null

  return (
    <div className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center bg-black bg-opacity-50" onClick={handleCancel}>
      <div
        className="bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:max-w-2xl dc:w-full dc:mx-4 dc:max-h-[80vh] dc:flex dc:flex-col"
        style={{ boxShadow: 'var(--dc-shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dc:px-6 dc:py-4 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg">
          <h2 className="dc:text-lg dc:font-semibold text-dc-text">{t('portlet.filterConfig.title')}</h2>
          <p className="dc:text-sm text-dc-text-secondary dc:mt-1">
            {t('portlet.filterConfig.subtitle', { portletTitle })}
          </p>
        </div>

        {/* Content */}
        <div className="dc:flex-1 dc:overflow-y-auto dc:px-6 dc:py-4">
          {dashboardFilters.length === 0 ? (
            <div className="dc:text-center dc:py-8 text-dc-text-muted">
              <svg
                className="dc:mx-auto dc:h-12 dc:w-12 dc:mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <p className="dc:text-sm dc:font-medium">{t('portlet.filterConfig.noFilters')}</p>
              <p className="dc:text-xs dc:mt-1">{t('portlet.filterConfig.noFiltersHint')}</p>
            </div>
          ) : (
            <div className="dc:space-y-3">
              <div className="dc:flex dc:items-center dc:justify-between dc:mb-4 dc:pb-2 dc:border-b border-dc-border">
                <span className="dc:text-sm dc:font-medium text-dc-text">{t('portlet.filterConfig.availableFilters')}</span>
                <span className="dc:text-xs text-dc-text-secondary">
                  {t('portlet.filterConfig.selectedCount', {
                    // Count only entries for filters that still exist - stale
                    // mapping entries (deleted filters) aren't shown in the list
                    selected: selectedEntries.filter(e => dashboardFilters.some(df => df.id === e.filterId)).length,
                    total: dashboardFilters.length
                  })}
                </span>
              </div>

              {dashboardFilters.map(filter => {
                const entry = selectedEntries.find(e => e.filterId === filter.id)
                const isSelected = !!entry
                const isSimpleFilter = !!filter.filter && 'member' in filter.filter && !!filter.filter.member
                const canRemap = isSelected && isSimpleFilter && !filter.isUniversalTime
                const fieldOptions = canRemap
                  ? fieldOptionsByMember.get((filter.filter as { member: string }).member) || []
                  : []
                // A saved override pointing at a field that's no longer offered
                // (schema changed) is kept selected, with a warning
                const overrideIsStale = !!entry?.member &&
                  !fieldOptions.some(group => group.dimensions.some(d => d.name === entry.member))

                return (
                  <label
                    key={filter.id}
                    className={`dc:flex dc:items-start dc:p-3 dc:rounded-md dc:border dc:cursor-pointer dc:transition-colors ${
                      isSelected
                        ? 'border-dc-primary bg-dc-surface-secondary'
                        : 'border-dc-border hover:bg-dc-surface-hover'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleFilter(filter.id)}
                      className="dc:mt-0.5 dc:mr-3 dc:h-4 dc:w-4 dc:rounded border-dc-border dc:focus:ring-2 focus:ring-dc-primary"
                      style={{
                        accentColor: 'var(--dc-primary)'
                      }}
                    />
                    <div className="dc:flex-1 dc:min-w-0">
                      <div className="dc:flex dc:items-center dc:gap-2">
                        <span className="dc:font-medium dc:text-sm text-dc-text dc:truncate">
                          {filter.label}
                        </span>
                        {isSelected && (
                          <span
                            className="dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-full"
                            style={{
                              backgroundColor: 'var(--dc-primary)',
                              color: 'white'
                            }}
                          >
                            {t('portlet.filterConfig.applied')}
                          </span>
                        )}
                        {entry?.member && (
                          <span
                            className="dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-full bg-dc-accent-bg text-dc-accent dc:truncate"
                            title={entry.member}
                          >
                            {t('portlet.filterConfig.mappedTo', { field: entry.member })}
                          </span>
                        )}
                      </div>
                      <div className="dc:mt-1 dc:text-xs text-dc-text-secondary dc:break-words">
                        {formatFilterPreview(filter)}
                      </div>
                      {canRemap && fieldOptions.length > 0 && (
                        <div className="dc:mt-2" onClick={(e) => e.preventDefault()}>
                          <label className="dc:block dc:text-xs dc:font-medium text-dc-text-secondary dc:mb-1">
                            {t('portlet.filterConfig.applyToField')}
                          </label>
                          <select
                            value={entry?.member || ''}
                            onChange={(e) => handleMemberChange(filter.id, e.target.value)}
                            className="dc:w-full dc:text-sm dc:rounded-md dc:border border-dc-border bg-dc-surface text-dc-text dc:px-2 dc:py-1.5 dc:focus:ring-2 focus:ring-dc-primary"
                          >
                            <option value="">
                              {t('portlet.filterConfig.applyToFieldDefault', { field: (filter.filter as { member: string }).member })}
                            </option>
                            {overrideIsStale && entry?.member && (
                              <option value={entry.member}>{entry.member}</option>
                            )}
                            {fieldOptions.map(group => (
                              <optgroup key={group.cubeName} label={group.cubeTitle}>
                                {group.dimensions.map(dimension => (
                                  <option key={dimension.name} value={dimension.name}>
                                    {dimension.title || dimension.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          {overrideIsStale && (
                            <p className="dc:mt-1 dc:text-xs text-dc-warning">
                              {t('portlet.filterConfig.mappedFieldMissing', { field: entry?.member || '' })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dc:px-6 dc:py-4 dc:border-t border-dc-border bg-dc-surface-secondary dc:rounded-b-lg dc:flex dc:justify-end dc:gap-3">
          <button
            onClick={handleCancel}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover dc:transition-colors text-dc-text"
          >
            {t('common.actions.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md text-white dc:transition-colors"
            style={{
              backgroundColor: 'var(--dc-primary)'
            }}
          >
            {t('portlet.filterConfig.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  )
}
