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
import FieldSearchItem from './FieldSearchItem'
import FieldDetailPanel from './FieldDetailPanel'

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
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCube, setSelectedCube] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<FieldOption | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSelectedCube(null)
      setFocusedField(null)
      setFocusedIndex(-1)
      setLastSelectedIndex(null)
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

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (flatFieldsList.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, flatFieldsList.length - 1)
            setFocusedField(flatFieldsList[next])
            return next
          })
          break

        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0)
            setFocusedField(flatFieldsList[next])
            return next
          })
          break

        case 'Enter':
          e.preventDefault()
          if (focusedIndex >= 0 && flatFieldsList[focusedIndex]) {
            handleSelectField(flatFieldsList[focusedIndex], focusedIndex, e.shiftKey)
          }
          break

        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [flatFieldsList, focusedIndex, handleSelectField, onClose]
  )

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && resultsContainerRef.current) {
      const focusedElement = resultsContainerRef.current.querySelector(
        `[data-field-index="${focusedIndex}"]`
      )
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [focusedIndex])

  if (!isOpen) return null

  const searchPlaceholder =
    mode === 'metrics' ? 'Search metrics...' : mode === 'filter' ? 'Search fields to filter...' : 'Search dimensions...'

  const modalTitle = mode === 'metrics' ? 'Select a Metric' : mode === 'filter' ? 'Select a Field to Filter' : 'Select a Dimension'
  const focusedFieldId = focusedIndex >= 0 && flatFieldsList[focusedIndex]
    ? `field-option-${flatFieldsList[focusedIndex].name.replace(/\./g, '-')}`
    : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        className="bg-dc-surface shadow-xl w-full h-full md:rounded-lg md:w-[900px] md:max-w-[900px] md:h-[80vh] md:max-h-[700px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header with Search */}
        <div className="shrink-0 border-b border-dc-border">
          <div className="flex items-center px-4 py-3 gap-3">
            <SearchIcon className="w-5 h-5 text-dc-text-muted" aria-hidden={true} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setFocusedIndex(-1)
              }}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent border-none outline-none text-dc-text placeholder-dc-text-muted text-lg"
              aria-label={searchPlaceholder}
              aria-controls="field-search-results"
              aria-activedescendant={focusedFieldId}
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
            />
            <button
              onClick={onClose}
              className="p-1 text-dc-text-secondary hover:text-dc-text rounded"
              aria-label="Close dialog"
            >
              <CloseIcon className="w-5 h-5" aria-hidden={true} />
            </button>
          </div>
          {/* Mobile cube filter - shown only on mobile */}
          {cubeNames.length > 1 && (
            <div className="md:hidden px-4 pb-3">
              <select
                value={selectedCube || ''}
                onChange={(e) => setSelectedCube(e.target.value || null)}
                className="w-full px-3 py-2 bg-dc-surface border border-dc-border rounded-lg text-sm text-dc-text focus:outline-none focus:ring-1 focus:ring-dc-primary"
                aria-label="Filter by cube"
              >
                <option value="">All Cubes</option>
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Categories (hidden on mobile) */}
          <nav
            className="hidden md:block w-48 shrink-0 border-r border-dc-border overflow-y-auto bg-dc-surface-secondary"
            aria-label="Filter by cube"
          >
            <div className="p-2" role="group" aria-label="Cube categories">
              <button
                onClick={() => setSelectedCube(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCube === null
                    ? 'bg-dc-primary/10 text-dc-primary font-medium'
                    : 'text-dc-text hover:bg-dc-surface-hover'
                }`}
                aria-pressed={selectedCube === null}
              >
                All
              </button>
              {cubeNames.map((cubeName) => (
                <button
                  key={cubeName}
                  onClick={() => setSelectedCube(cubeName)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                    selectedCube === cubeName
                      ? 'bg-dc-primary/10 text-dc-primary font-medium'
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
            className="flex-1 overflow-y-auto p-4"
            role="listbox"
            aria-label="Available fields"
          >
            {filteredFields.length === 0 && recentOptions.length === 0 ? (
              <div className="text-center py-12 text-dc-text-muted">
                <p className="text-lg mb-2">No fields found</p>
                <p className="text-sm">
                  {searchTerm
                    ? `No ${mode === 'metrics' ? 'metrics' : 'dimensions'} match "${searchTerm}"`
                    : `No ${mode === 'metrics' ? 'metrics' : 'dimensions'} available`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recent Fields */}
                {recentOptions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-dc-text-muted uppercase tracking-wider mb-2">
                      Recents
                    </h3>
                    <div className="space-y-1">
                      {recentOptions.map((field, idx) => (
                        <FieldSearchItem
                          key={`recent-${field.name}`}
                          field={field}
                          isSelected={selectedFields.includes(field.name)}
                          isFocused={focusedIndex === idx}
                          onClick={(e) => handleSelectField(field, idx, e.shiftKey)}
                          onMouseEnter={() => {
                            setFocusedField(field)
                            setFocusedIndex(idx)
                          }}
                          data-field-index={idx}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Grouped by Cube */}
                {Array.from(groupedFields.entries()).map(([cubeName, fields]) => (
                  <div key={cubeName}>
                    <h3 className="text-xs font-semibold text-dc-text-muted uppercase tracking-wider mb-2">
                      {getCubeTitle(cubeName, schema)}
                    </h3>
                    <div className="space-y-1">
                      {fields.map((field) => {
                        const fieldIndex =
                          recentOptions.length +
                          Array.from(groupedFields.entries())
                            .slice(
                              0,
                              Array.from(groupedFields.keys()).indexOf(cubeName)
                            )
                            .reduce((sum, [, f]) => sum + f.length, 0) +
                          fields.indexOf(field)

                        return (
                          <FieldSearchItem
                            key={field.name}
                            field={field}
                            isSelected={selectedFields.includes(field.name)}
                            isFocused={focusedIndex === fieldIndex}
                            onClick={(e) => handleSelectField(field, fieldIndex, e.shiftKey)}
                            onMouseEnter={() => {
                              setFocusedField(field)
                              setFocusedIndex(fieldIndex)
                            }}
                            data-field-index={fieldIndex}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Field Details (hidden on mobile) */}
          <div className="hidden md:block w-72 shrink-0 border-l border-dc-border bg-dc-surface-secondary overflow-y-auto">
            <FieldDetailPanel field={focusedField} />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-dc-border px-4 py-3 flex items-center justify-between text-sm text-dc-text-muted">
          <div>
            <span className="text-dc-text-secondary">{filteredFields.length}</span>{' '}
            {mode === 'metrics' ? 'metrics' : mode === 'filter' ? 'fields' : 'dimensions'} available
          </div>
          {/* Keyboard shortcuts - hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-dc-surface-tertiary rounded text-xs">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-dc-surface-tertiary rounded text-xs">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-dc-surface-tertiary rounded text-xs">Shift</kbd>+Click Multi-select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-dc-surface-tertiary rounded text-xs">Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
