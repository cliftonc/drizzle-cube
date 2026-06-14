/**
 * FieldSearchModal Component
 *
 * A full-screen search modal for selecting cube fields (measures/dimensions).
 * Features:
 * - Real-time search filtering
 * - Cube-based category filtering
 * - Three-column layout: Categories | Results | Details
 * - Keyboard navigation support
 * - Recent fields tracking
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { getIcon } from '../../icons'
import type { FieldSearchModalProps, FieldOption } from './types'
import type { MetaField } from '../../shared/types'
import {
  schemaToFieldOptions,
  filterFieldOptions,
  groupFieldsByCube,
  getCubeNames,
  getCubeTitle,
  getRecentFields,
  addRecentField,
  getRecentFieldOptions
} from './utils'
import FieldDetailPanel from './FieldDetailPanel'
import FieldSearchResults from './FieldSearchResults'
import { useFieldSearchKeyboard } from './hooks/useFieldSearchKeyboard'
import { useTranslation } from '../../hooks/useTranslation'

const SearchIcon = getIcon('search')
const CloseIcon = getIcon('close')

export default function FieldSearchModal({
  isOpen,
  onClose,
  onSelect,
  mode,
  schema,
  selectedFields,
  recentFields: externalRecentFields
}: FieldSearchModalProps) {
  const { t } = useTranslation()
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCube, setSelectedCube] = useState<string | null>(null)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get recent fields from localStorage or props
  const recentFieldNames = useMemo(() => {
    if (externalRecentFields) return externalRecentFields
    const stored = getRecentFields()
    return mode === 'metrics' ? stored.metrics : stored.breakdowns
  }, [externalRecentFields, mode])

  // Map mode to field options mode
  const fieldOptionsMode = mode

  // Get all field options for current mode
  const allFieldOptions = useMemo(() => {
    return schemaToFieldOptions(schema, fieldOptionsMode)
  }, [schema, fieldOptionsMode])

  // Get cube names for category filter
  const cubeNames = useMemo(() => {
    return getCubeNames(schema)
  }, [schema])

  // Filter fields by search and cube
  const filteredFields = useMemo(() => {
    return filterFieldOptions(allFieldOptions, searchTerm, selectedCube)
  }, [allFieldOptions, searchTerm, selectedCube])

  // Group filtered fields by cube
  const groupedFields = useMemo(() => {
    return groupFieldsByCube(filteredFields)
  }, [filteredFields])

  // Get recent field options (only when not searching)
  const recentOptions = useMemo(() => {
    if (searchTerm.trim()) return []
    return getRecentFieldOptions(schema, fieldOptionsMode, recentFieldNames).filter(
      (f) => !selectedCube || f.cubeName === selectedCube
    )
  }, [schema, fieldOptionsMode, recentFieldNames, searchTerm, selectedCube])

  // Flat list of visible fields for keyboard navigation
  const flatFieldsList = useMemo(() => {
    const list: FieldOption[] = [...recentOptions]
    groupedFields.forEach((fields) => {
      list.push(...fields)
    })
    return list
  }, [recentOptions, groupedFields])

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle single field selection
  const selectSingleField = useCallback(
    (field: FieldOption, keepOpen: boolean = false) => {
      // Add to recent fields
      addRecentField(field.name, mode === 'metrics' ? 'metrics' : 'breakdowns')

      // Create MetaField object for callback
      const metaField: MetaField = {
        name: field.name,
        title: field.title,
        shortTitle: field.shortTitle,
        type: field.type,
        description: field.description
      }

      onSelect(metaField, field.fieldType, field.cubeName, keepOpen)
    },
    [mode, onSelect]
  )

  // Handle field selection with shift-click support for range selection
  const handleSelectField = useCallback(
    (field: FieldOption, fieldIndex: number, shiftKey: boolean = false) => {
      // Shift-click for range selection - keep modal open
      if (shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== fieldIndex) {
        const startIndex = Math.min(lastSelectedIndex, fieldIndex)
        const endIndex = Math.max(lastSelectedIndex, fieldIndex)

        // Select all fields in the range, keep modal open for all
        for (let i = startIndex; i <= endIndex; i++) {
          const rangeField = flatFieldsList[i]
          if (rangeField && !selectedFields.includes(rangeField.name)) {
            selectSingleField(rangeField, true) // Keep modal open
          }
        }
      } else if (shiftKey) {
        // Shift-click on single item - select but keep modal open
        selectSingleField(field, true)
      } else {
        // Normal single selection - close modal after
        selectSingleField(field, false)
      }

      // Update last selected index for next shift-click
      setLastSelectedIndex(fieldIndex)
    },
    [flatFieldsList, lastSelectedIndex, selectSingleField, selectedFields]
  )

  // Keyboard navigation + focus-scroll behaviour
  const {
    focusedField,
    setFocusedField,
    focusedIndex,
    setFocusedIndex,
    resultsContainerRef,
    handleKeyDown
  } = useFieldSearchKeyboard(flatFieldsList, handleSelectField, onClose)

  // Focus a field via mouse hover
  const handleFocusField = useCallback((field: FieldOption, index: number) => {
    setFocusedField(field)
    setFocusedIndex(index)
  }, [setFocusedField, setFocusedIndex])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSelectedCube(null)
      setFocusedField(null)
      setFocusedIndex(-1)
      setLastSelectedIndex(null)
    }
  }, [isOpen, setFocusedField, setFocusedIndex])

  if (!isOpen) return null

  const searchPlaceholder =
    mode === 'metrics' ? t('fieldSearch.placeholder.metrics') : mode === 'filter' ? t('fieldSearch.placeholder.filter') : t('fieldSearch.placeholder.dimensions')

  const modalTitle = mode === 'metrics' ? t('fieldSearch.modal.title.metrics') : mode === 'filter' ? t('fieldSearch.modal.title.filter') : t('fieldSearch.modal.title.dimensions')
  const focusedFieldId = focusedIndex >= 0 && flatFieldsList[focusedIndex]
    ? `field-option-${flatFieldsList[focusedIndex].name.replace(/\./g, '-')}`
    : undefined

  return (
    <div
      className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center"
      style={{ backgroundColor: 'var(--dc-overlay)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        className="bg-dc-surface dc:shadow-xl dc:w-full dc:h-full dc:md:rounded-lg dc:md:w-[900px] dc:md:max-w-[900px] dc:md:h-[80vh] dc:md:max-h-[700px] dc:flex dc:flex-col dc:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header with Search */}
        <div className="dc:shrink-0 dc:border-b border-dc-border">
          <div className="dc:flex dc:items-center dc:px-4 dc:py-3 dc:gap-3">
            <SearchIcon className="dc:w-5 dc:h-5 text-dc-text-muted" aria-hidden={true} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setFocusedIndex(-1)
              }}
              placeholder={searchPlaceholder}
              className="dc:flex-1 bg-transparent dc:border-none dc:outline-none text-dc-text placeholder-dc-text-muted dc:text-lg"
              aria-label={searchPlaceholder}
              aria-controls="field-search-results"
              aria-activedescendant={focusedFieldId}
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
            />
            <button
              onClick={onClose}
              className="dc:p-1 text-dc-text-secondary hover:text-dc-text dc:rounded"
              aria-label="Close dialog"
            >
              <CloseIcon className="dc:w-5 dc:h-5" aria-hidden={true} />
            </button>
          </div>
          {/* Mobile cube filter - shown only on mobile */}
          {cubeNames.length > 1 && (
            <div className="dc:md:hidden dc:px-4 dc:pb-3">
              <select
                value={selectedCube || ''}
                onChange={(e) => setSelectedCube(e.target.value || null)}
                className="dc:w-full dc:px-3 dc:py-2 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:text-sm text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
                aria-label="Filter by cube"
              >
                <option value="">{t('fieldSearch.filter.allCubes')}</option>
                {cubeNames.map((cubeName) => (
                  <option key={cubeName} value={cubeName}>
                    {getCubeTitle(cubeName, schema)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Three Column Layout - Single column on mobile */}
        <div className="dc:flex-1 dc:flex dc:overflow-hidden">
          {/* Left Column - Categories (hidden on mobile) */}
          <nav
            className="dc:hidden dc:md:block dc:w-48 dc:shrink-0 dc:border-r border-dc-border dc:overflow-y-auto bg-dc-surface-secondary"
            aria-label="Filter by cube"
          >
            <div className="dc:p-2" role="group" aria-label="Cube categories">
              <button
                onClick={() => setSelectedCube(null)}
                className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:rounded-md dc:text-sm dc:transition-colors ${
                  selectedCube === null
                    ? 'bg-dc-primary/10 text-dc-primary dc:font-medium'
                    : 'text-dc-text hover:bg-dc-surface-hover'
                }`}
                aria-pressed={selectedCube === null}
              >
                {t('fieldSearch.categories.all')}
              </button>
              {cubeNames.map((cubeName) => (
                <button
                  key={cubeName}
                  onClick={() => setSelectedCube(cubeName)}
                  className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:rounded-md dc:text-sm dc:transition-colors dc:truncate ${
                    selectedCube === cubeName
                      ? 'bg-dc-primary/10 text-dc-primary dc:font-medium'
                      : 'text-dc-text hover:bg-dc-surface-hover'
                  }`}
                  title={getCubeTitle(cubeName, schema)}
                  aria-pressed={selectedCube === cubeName}
                >
                  {getCubeTitle(cubeName, schema)}
                </button>
              ))}
            </div>
          </nav>

          {/* Middle Column - Results */}
          <div
            id="field-search-results"
            ref={resultsContainerRef}
            className="dc:flex-1 dc:overflow-y-auto dc:p-4"
            role="listbox"
            aria-label="Available fields"
          >
            <FieldSearchResults
              mode={mode}
              schema={schema}
              searchTerm={searchTerm}
              recentOptions={recentOptions}
              groupedFields={groupedFields}
              filteredCount={filteredFields.length}
              selectedFields={selectedFields}
              focusedIndex={focusedIndex}
              onSelectField={handleSelectField}
              onFocusField={handleFocusField}
            />
          </div>

          {/* Right Column - Field Details (hidden on mobile) */}
          <div className="dc:hidden dc:md:block dc:w-72 dc:shrink-0 dc:border-l border-dc-border bg-dc-surface-secondary dc:overflow-y-auto">
            <FieldDetailPanel field={focusedField} />
          </div>
        </div>

        {/* Footer */}
        <div className="dc:shrink-0 dc:border-t border-dc-border dc:px-4 dc:py-3 dc:flex dc:items-center dc:justify-between dc:text-sm text-dc-text-muted">
          <div>
            <span className="text-dc-text-secondary">{filteredFields.length}</span>{' '}
            {mode === 'metrics' ? t('fieldSearch.footer.metricsAvailable') : mode === 'filter' ? t('fieldSearch.footer.fieldsAvailable') : t('fieldSearch.footer.dimensionsAvailable')}
          </div>
          {/* Keyboard shortcuts - hidden on mobile */}
          <div className="dc:hidden dc:md:flex dc:items-center dc:gap-4">
            <span>
              <kbd className="dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded dc:text-xs">↑↓</kbd> {t('fieldSearch.shortcut.navigate')}
            </span>
            <span>
              <kbd className="dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded dc:text-xs">{t('fieldSearch.shortcut.keyEnter')}</kbd> {t('fieldSearch.shortcut.select')}
            </span>
            <span>
              <kbd className="dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded dc:text-xs">{t('fieldSearch.shortcut.keyShift')}</kbd>{t('fieldSearch.shortcut.plusClick')} {t('fieldSearch.shortcut.multiSelect')}
            </span>
            <span>
              <kbd className="dc:px-1.5 dc:py-0.5 bg-dc-surface-tertiary dc:rounded dc:text-xs">{t('fieldSearch.shortcut.keyEsc')}</kbd> {t('fieldSearch.shortcut.close')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
