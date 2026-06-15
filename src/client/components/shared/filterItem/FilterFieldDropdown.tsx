/**
 * Field-selection dropdown for FilterItem: trigger button + searchable list of
 * query fields and all available fields.
 */

import React from 'react'
import { getIcon } from '../../../icons'
import { useTranslation } from '../../../hooks/useTranslation'
import type { MetaField } from '../types'
import { getFieldTypeIcon, getFieldTypeBadge } from './fieldVisuals'

const FilterIcon = getIcon('filter')
const ChevronDownIcon = getIcon('chevronDown')
const SearchIcon = getIcon('search')

interface FieldOptionProps {
  field: MetaField
  keyPrefix: string
  selectedMember: string | undefined
  onSelect: (fieldName: string) => void
}

function FieldOption({ field, keyPrefix, selectedMember, onSelect }: FieldOptionProps) {
  return (
    <button
      key={`${keyPrefix}-${field.name}`}
      onClick={() => onSelect(field.name)}
      className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
        field.name === selectedMember ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
      }`}
    >
      <div className="dc:flex dc:items-center dc:gap-2">
        {getFieldTypeIcon(field)}
        <div className="dc:flex-1 dc:min-w-0">
          <div className="dc:flex dc:items-center dc:gap-2">
            <span className="dc:font-medium dc:truncate">{field.name}</span>
            {getFieldTypeBadge(field)}
          </div>
          {field.title !== field.name && (
            <div className="dc:text-xs text-dc-text-muted dc:truncate">{field.title}</div>
          )}
        </div>
      </div>
    </button>
  )
}

interface FilterFieldDropdownProps {
  isOpen: boolean
  selectedField: MetaField | undefined
  selectedMember: string | undefined
  fieldSearchTerm: string
  filteredQueryFields: MetaField[]
  filteredAllFields: MetaField[]
  searchInputRef: React.RefObject<HTMLInputElement>
  onToggle: () => void
  onSearchTermChange: (term: string) => void
  onFieldChange: (fieldName: string) => void
}

export function FilterFieldDropdown({
  isOpen,
  selectedField,
  selectedMember,
  fieldSearchTerm,
  filteredQueryFields,
  filteredAllFields,
  searchInputRef,
  onToggle,
  onSearchTermChange,
  onFieldChange
}: FilterFieldDropdownProps) {
  const { t } = useTranslation()

  return (
    <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
      <FilterIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0" />

      {/* Field selection */}
      <div className="dc:relative dc:flex-1 dc:min-w-0">
        <button
          onClick={onToggle}
          className="dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:min-w-0"
        >
          <span className="dc:truncate">
            {selectedField ? (
              <span className="dc:font-medium">{selectedField.name}</span>
            ) : (
              <span className="text-dc-text-muted">{t('filter.shared.selectField')}</span>
            )}
          </span>
          <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-1 dc:transition-transform ${
            isOpen ? 'dc:transform dc:rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-80 dc:overflow-hidden">
            {/* Search input */}
            <div className="dc:p-2 dc:border-b border-dc-border">
              <div className="dc:relative">
                <SearchIcon className="dc:w-4 dc:h-4 dc:absolute dc:left-2 dc:top-1/2 dc:transform dc:-translate-y-1/2 text-dc-text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('filter.shared.searchFields')}
                  value={fieldSearchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text dc:focus:ring-1 focus:ring-dc-accent focus:border-dc-accent"
                />
              </div>
            </div>

            {/* Fields list */}
            <div className="dc:max-h-60 dc:overflow-y-auto">
              {/* Query fields section */}
              {filteredQueryFields.length > 0 && (
                <div>
                  <div className="dc:px-3 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-muted bg-dc-surface-secondary dc:border-b border-dc-border">
                    {t('filter.shared.fieldsInQuery', { count: filteredQueryFields.length })}
                  </div>
                  {filteredQueryFields.map((field) => (
                    <FieldOption
                      key={`query-${field.name}`}
                      field={field}
                      keyPrefix="query"
                      selectedMember={selectedMember}
                      onSelect={onFieldChange}
                    />
                  ))}
                </div>
              )}

              {/* All fields section */}
              <div>
                {filteredQueryFields.length > 0 && (
                  <div className="dc:px-3 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-muted bg-dc-surface-secondary dc:border-b border-dc-border">
                    {t('filter.shared.allAvailableFields', { count: filteredAllFields.length })}
                  </div>
                )}
                {filteredAllFields.map((field) => (
                  <FieldOption
                    key={`all-${field.name}`}
                    field={field}
                    keyPrefix="all"
                    selectedMember={selectedMember}
                    onSelect={onFieldChange}
                  />
                ))}
              </div>

              {/* No results message */}
              {filteredAllFields.length === 0 && (
                <div className="dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted dc:text-center">
                  No fields found matching "{fieldSearchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
