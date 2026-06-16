/**
 * FieldSearchResults Component
 *
 * Renders the middle results column of FieldSearchModal: the empty state,
 * recent fields, and cube-grouped field lists. Extracted to keep the modal's
 * render body small.
 */

import { memo, MouseEvent } from 'react'
import type { FieldOption } from './types.js'
import type { MetaResponse } from '../../shared/types.js'
import FieldSearchItem from './FieldSearchItem.js'
import { getCubeTitle } from './utils/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

interface FieldSearchResultsProps {
  mode: 'metrics' | 'breakdown' | 'filter' | 'dimensionFilter'
  schema: MetaResponse | null
  searchTerm: string
  recentOptions: FieldOption[]
  groupedFields: Map<string, FieldOption[]>
  filteredCount: number
  selectedFields: string[]
  focusedIndex: number
  onSelectField: (field: FieldOption, fieldIndex: number, shiftKey: boolean) => void
  onFocusField: (field: FieldOption, index: number) => void
}

/**
 * Compute the flat-list index of a field within its cube group, accounting for
 * the recent-options prefix and all preceding cube groups.
 */
function computeFieldIndex(
  groupedFields: Map<string, FieldOption[]>,
  recentCount: number,
  cubeName: string,
  fields: FieldOption[],
  field: FieldOption
): number {
  const entries = Array.from(groupedFields.entries())
  const cubePosition = Array.from(groupedFields.keys()).indexOf(cubeName)
  const precedingCount = entries
    .slice(0, cubePosition)
    .reduce((sum, [, f]) => sum + f.length, 0)
  return recentCount + precedingCount + fields.indexOf(field)
}

const FieldSearchResults = memo(function FieldSearchResults({
  mode,
  schema,
  searchTerm,
  recentOptions,
  groupedFields,
  filteredCount,
  selectedFields,
  focusedIndex,
  onSelectField,
  onFocusField
}: FieldSearchResultsProps) {
  const { t } = useTranslation()

  if (filteredCount === 0 && recentOptions.length === 0) {
    let emptyDetail: string
    if (searchTerm) {
      emptyDetail = mode === 'metrics'
        ? t('fieldSearch.empty.noMatchMetrics', { searchTerm })
        : t('fieldSearch.empty.noMatchDimensions', { searchTerm })
    } else {
      emptyDetail = mode === 'metrics'
        ? t('fieldSearch.empty.noMetrics')
        : t('fieldSearch.empty.noDimensions')
    }

    return (
      <div className="dc:text-center dc:py-12 text-dc-text-muted">
        <p className="dc:text-lg dc:mb-2">{t('fieldSearch.empty.heading')}</p>
        <p className="dc:text-sm">{emptyDetail}</p>
      </div>
    )
  }

  const renderItem = (field: FieldOption, fieldIndex: number, keyPrefix = '') => (
    <FieldSearchItem
      key={`${keyPrefix}${field.name}`}
      field={field}
      isSelected={selectedFields.includes(field.name)}
      isFocused={focusedIndex === fieldIndex}
      onClick={(e: MouseEvent) => onSelectField(field, fieldIndex, e.shiftKey)}
      onMouseEnter={() => onFocusField(field, fieldIndex)}
      data-field-index={fieldIndex}
    />
  )

  return (
    <div className="dc:space-y-6">
      {/* Recent Fields */}
      {recentOptions.length > 0 && (
        <div>
          <h3 className="dc:text-xs dc:font-semibold text-dc-text-muted dc:uppercase dc:tracking-wider dc:mb-2">
            {t('fieldSearch.section.recents')}
          </h3>
          <div className="dc:space-y-1">
            {recentOptions.map((field, idx) => renderItem(field, idx, 'recent-'))}
          </div>
        </div>
      )}

      {/* Grouped by Cube */}
      {Array.from(groupedFields.entries()).map(([cubeName, fields]) => (
        <div key={cubeName}>
          <h3 className="dc:text-xs dc:font-semibold text-dc-text-muted dc:uppercase dc:tracking-wider dc:mb-2">
            {getCubeTitle(cubeName, schema)}
          </h3>
          <div className="dc:space-y-1">
            {fields.map((field) =>
              renderItem(
                field,
                computeFieldIndex(groupedFields, recentOptions.length, cubeName, fields, field)
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

export default FieldSearchResults
