/**
 * DatePresetChips Component
 *
 * Quick-select date preset chips for the compact filter bar.
 * Displays common date ranges as clickable chips (Today, Yesterday, 7D, 30D, etc.)
 */

import React, { useMemo } from 'react'
import { DATE_PRESETS, calculateDateRange, formatDateRangeDisplay } from '../shared/utils'

interface DatePresetChipsProps {
  activePreset: string | null
  onPresetSelect: (presetValue: string) => void
  disabled?: boolean
}

const DatePresetChips: React.FC<DatePresetChipsProps> = ({
  activePreset,
  onPresetSelect,
  disabled = false
}) => {
  // Memoize tooltip content for each preset
  const presetTooltips = useMemo(() => {
    const tooltips: Record<string, string> = {}
    for (const preset of DATE_PRESETS) {
      const range = calculateDateRange(preset.value)
      if (range) {
        tooltips[preset.id] = formatDateRangeDisplay(range.start, range.end)
      }
    }
    return tooltips
  }, [])

  return (
    <div className="dc:flex dc:items-center dc:gap-1">
      {DATE_PRESETS.map(preset => {
        const isActive = activePreset === preset.id
        const tooltip = presetTooltips[preset.id]

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetSelect(preset.value)}
            disabled={disabled}
            title={tooltip}
            className={`
              dc:px-2.5 dc:py-1 dc:rounded dc:text-xs dc:font-medium dc:transition-colors
              dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-1
              dc:disabled:opacity-50 dc:disabled:cursor-not-allowed
              ${isActive ? 'dc:shadow-sm' : 'dc:border'}
            `}
            style={{
              backgroundColor: isActive ? 'var(--dc-primary)' : 'var(--dc-surface)',
              color: isActive ? 'white' : 'var(--dc-text)',
              borderColor: isActive ? 'transparent' : 'var(--dc-border)',
              ...(disabled ? {} : {
                cursor: 'pointer'
              })
            }}
            onMouseEnter={(e) => {
              if (!isActive && !disabled) {
                e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && !disabled) {
                e.currentTarget.style.backgroundColor = 'var(--dc-surface)'
              }
            }}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}

export default DatePresetChips
