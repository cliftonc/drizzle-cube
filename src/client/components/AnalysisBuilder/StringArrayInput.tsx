/**
 * StringArrayInput Component
 *
 * A textarea that edits an array of strings. Uses local state while editing and
 * only commits to the parent on blur. Extracted from DisplayOptionControl so the
 * structured-option renderers stay presentational. Behaviour is identical to the
 * previous inline implementation.
 */

import { useState, useCallback, useEffect } from 'react'

interface StringArrayInputProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  description?: string
}

export default function StringArrayInput({
  label,
  value,
  onChange,
  placeholder,
  description,
}: StringArrayInputProps) {
  const [localText, setLocalText] = useState(() => value.join('\n'))

  // Sync local state when external value changes (e.g., from undo/redo or load)
  useEffect(() => {
    setLocalText(value.join('\n'))
  }, [value])

  const handleBlur = useCallback(() => {
    const arrayValue = localText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    onChange(arrayValue)
  }, [localText, onChange])

  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{label}</label>
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={4}
        className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text dc:resize-y"
      />
      {description && <p className="dc:text-xs text-dc-text-muted">{description}</p>}
    </div>
  )
}
