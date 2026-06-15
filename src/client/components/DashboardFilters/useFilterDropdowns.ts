/**
 * useFilterDropdowns
 *
 * Owns the open/closed state of the three mutually-exclusive popover dropdowns
 * (operator, value, date-range) plus the click-outside effect that closes them
 * all. This is the single "which dropdown is open" concern; it exposes the
 * container ref the effect watches and the individual open flags/setters.
 *
 * Behaviour is identical to the previous inline implementation — same effect,
 * same dependency array, same setters.
 */

import { useState, useRef, useEffect } from 'react'

export function useFilterDropdowns() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOperatorDropdownOpen(false)
        setIsValueDropdownOpen(false)
        setIsDateRangeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return {
    containerRef,
    isOperatorDropdownOpen,
    setIsOperatorDropdownOpen,
    isValueDropdownOpen,
    setIsValueDropdownOpen,
    isDateRangeDropdownOpen,
    setIsDateRangeDropdownOpen
  }
}

export type UseFilterDropdowns = ReturnType<typeof useFilterDropdowns>
