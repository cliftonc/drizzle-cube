/**
 * useFieldSearchKeyboard Hook
 *
 * Encapsulates the keyboard navigation + focus-scroll behaviour for the
 * FieldSearchModal results list. Owns focusedIndex/focusedField state and the
 * arrow/enter/escape key handling.
 */

import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react'
import type { RefObject } from 'react'
import type { FieldOption } from '../types.js'

export interface FieldSearchKeyboardApi {
  focusedField: FieldOption | null
  setFocusedField: (field: FieldOption | null) => void
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  resultsContainerRef: RefObject<HTMLDivElement>
  handleKeyDown: (e: KeyboardEvent) => void
}

export function useFieldSearchKeyboard(
  flatFieldsList: FieldOption[],
  onSelectField: (field: FieldOption, fieldIndex: number, shiftKey: boolean) => void,
  onClose: () => void
): FieldSearchKeyboardApi {
  const [focusedField, setFocusedField] = useState<FieldOption | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  const moveFocus = useCallback((delta: 1 | -1) => {
    setFocusedIndex((prev) => {
      const next = delta > 0
        ? Math.min(prev + 1, flatFieldsList.length - 1)
        : Math.max(prev - 1, 0)
      setFocusedField(flatFieldsList[next])
      return next
    })
  }, [flatFieldsList])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (flatFieldsList.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          moveFocus(1)
          break
        case 'ArrowUp':
          e.preventDefault()
          moveFocus(-1)
          break
        case 'Enter':
          e.preventDefault()
          if (focusedIndex >= 0 && flatFieldsList[focusedIndex]) {
            onSelectField(flatFieldsList[focusedIndex], focusedIndex, e.shiftKey)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [flatFieldsList, focusedIndex, moveFocus, onSelectField, onClose]
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

  return {
    focusedField,
    setFocusedField,
    focusedIndex,
    setFocusedIndex,
    resultsContainerRef,
    handleKeyDown
  }
}
