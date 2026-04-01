/**
 * LimitSection Component
 *
 * Row limit section for the AnalysisBuilder query panel.
 * Provides preset pills (5, 10, 25, ...) plus a custom input option.
 */

import { useState, useRef, useEffect } from 'react'
import SectionHeading from './SectionHeading'
import { useTranslation } from '../../hooks/useTranslation'

const LIMIT_PRESETS = [5, 10, 25, 50, 100, 500, 1000] as const

interface LimitSectionProps {
  /** Current limit value */
  limit?: number
  /** Callback when limit changes */
  onLimitChange: (limit: number | undefined) => void
}

export default function LimitSection({ limit, onLimitChange }: LimitSectionProps) {
  const { t } = useTranslation()
  const isCustom = limit != null && !LIMIT_PRESETS.includes(limit as typeof LIMIT_PRESETS[number])
  const [showCustomInput, setShowCustomInput] = useState(isCustom)
  const [customValue, setCustomValue] = useState(isCustom ? String(limit) : '')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when switching to custom mode
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [showCustomInput])

  // Sync custom value when limit changes externally (e.g. AI)
  useEffect(() => {
    if (limit != null && !LIMIT_PRESETS.includes(limit as typeof LIMIT_PRESETS[number])) {
      setCustomValue(String(limit))
      setShowCustomInput(true)
    }
  }, [limit])

  const handlePresetClick = (preset: number | undefined) => {
    setShowCustomInput(false)
    onLimitChange(preset)
  }

  const handleCustomClick = () => {
    setShowCustomInput(true)
    if (customValue) {
      const num = parseInt(customValue, 10)
      if (!isNaN(num) && num > 0) onLimitChange(num)
    }
  }

  const commitCustomValue = () => {
    const val = customValue.trim()
    if (val === '') {
      onLimitChange(undefined)
      setShowCustomInput(false)
    } else {
      const num = parseInt(val, 10)
      if (!isNaN(num) && num > 0) {
        onLimitChange(num)
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="dc:flex dc:items-center dc:justify-between dc:mb-3">
        <SectionHeading>
          {t('query.limit.label')}
          {limit != null && (
            <span className="dc:ml-1.5 dc:text-xs dc:font-normal text-dc-text-muted dc:normal-case dc:tracking-normal">
              ({limit.toLocaleString()})
            </span>
          )}
        </SectionHeading>
        {limit != null && (
          <span
            role="button"
            tabIndex={0}
            onClick={() => handlePresetClick(undefined)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handlePresetClick(undefined)
            }}
            className="dc:text-xs text-dc-text-muted hover:text-dc-error dc:underline dc:cursor-pointer"
          >
            {t('query.limit.clear')}
          </span>
        )}
      </div>

      {/* Preset pills + custom */}
      <div className="dc:flex dc:flex-wrap dc:gap-1">
        {LIMIT_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`dc:px-2 dc:py-0.5 dc:text-xs dc:rounded dc:border dc:transition-colors ${
              limit === preset && !showCustomInput
                ? 'bg-dc-primary/10 border-dc-primary text-dc-primary dc:font-medium'
                : 'border-dc-border text-dc-text-secondary dc:hover:border-dc-primary/50 dc:hover:text-dc-primary'
            }`}
          >
            {preset >= 1000 ? `${preset / 1000}k` : preset}
          </button>
        ))}
        {showCustomInput ? (
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onBlur={commitCustomValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCustomValue()
              if (e.key === 'Escape') {
                setShowCustomInput(false)
                if (!customValue.trim()) onLimitChange(undefined)
              }
            }}
            placeholder="#"
            className="dc:w-16 dc:px-2 dc:py-0.5 dc:text-xs dc:rounded dc:border border-dc-primary bg-dc-surface text-dc-text dc:text-center dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
          />
        ) : (
          <button
            onClick={handleCustomClick}
            className={`dc:px-2 dc:py-0.5 dc:text-xs dc:rounded dc:border dc:transition-colors ${
              isCustom
                ? 'bg-dc-primary/10 border-dc-primary text-dc-primary dc:font-medium'
                : 'border-dc-border text-dc-text-secondary dc:hover:border-dc-primary/50 dc:hover:text-dc-primary'
            }`}
          >
            {isCustom ? limit : '...'}
          </button>
        )}
      </div>
    </div>
  )
}
