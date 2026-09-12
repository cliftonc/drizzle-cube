/**
 * A textarea with syntax highlighting, for the markdown template field.
 *
 * A textarea cannot style its own contents, so the text is drawn twice: a
 * coloured layer underneath, and the real textarea on top with transparent text
 * and a visible caret. The two only stay aligned if they share every metric
 * that affects layout — font, size, line height, padding, border, wrapping —
 * so those live in one constant rather than on each element.
 */

import { useCallback, useMemo, useRef } from 'react'
import type { CSSProperties, UIEvent } from 'react'
import { tokenizeTemplate, type TemplateTokenKind } from './templateSyntax.js'

/** Every property that influences where a character lands. */
const SHARED_METRICS: CSSProperties = {
  margin: 0,
  padding: '0.25rem 0.5rem',
  border: '1px solid transparent',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.875rem',
  lineHeight: '1.5rem',
  letterSpacing: 'normal',
  tabSize: 2,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'normal'
}

/**
 * Stands in for the empty last line when the value ends with a newline: a
 * trailing newline creates no line box, so the layer would be one row short.
 */
const TRAILING_LINE_ANCHOR = '\u200B'

/**
 * Four theme colours that stay distinct in both light and dark: purple for
 * structure, blue for the data you name, amber for the filters applied to it,
 * green for literals. Punctuation recedes so the names stand out.
 */
const TOKEN_CLASSES: Record<TemplateTokenKind, string> = {
  keyword: 'text-dc-filter',
  identifier: 'text-dc-accent',
  filter: 'text-dc-warning',
  string: 'text-dc-success',
  number: 'text-dc-success',
  delimiter: 'text-dc-text-muted',
  operator: 'text-dc-text-muted',
  heading: 'dc:font-bold text-dc-text-secondary',
  text: 'text-dc-text'
}

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export default function TemplateEditor({ value, onChange, placeholder, rows = 8 }: TemplateEditorProps) {
  const highlightRef = useRef<HTMLPreElement>(null)

  // A trailing newline leaves no line box in the highlight layer, so the last
  // line would sit one row higher than the caret. The zero-width space keeps it.
  const tokens = useMemo(
    () => tokenizeTemplate(value.endsWith('\n') ? `${value}${TRAILING_LINE_ANCHOR}` : value),
    [value]
  )

  const syncScroll = useCallback((event: UIEvent<HTMLTextAreaElement>) => {
    const layer = highlightRef.current
    if (!layer) return
    layer.scrollTop = event.currentTarget.scrollTop
    layer.scrollLeft = event.currentTarget.scrollLeft
  }, [])

  const height = `calc(${rows} * 1.5rem + 0.5rem + 2px)`

  return (
    <div
      className="dc:relative dc:w-full dc:rounded-sm dc:border border-dc-border focus-within:ring-dc-accent dc:focus-within:ring-1 bg-dc-surface"
      style={{ height }}
    >
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className="dc:absolute dc:inset-0 dc:overflow-auto dc:pointer-events-none"
        style={SHARED_METRICS}
      >
        {/* The textarea's own placeholder would inherit its transparent colour,
            so the visible one is drawn here. The attribute stays on the
            textarea for assistive technology. */}
        {value === '' && placeholder ? (
          <span className="text-dc-text-muted">{placeholder}</span>
        ) : (
          tokens.map((token, index) => (
            <span key={index} className={TOKEN_CLASSES[token.kind]}>{token.text}</span>
          ))
        )}
      </pre>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="dc:absolute dc:inset-0 dc:w-full dc:h-full dc:resize-none dc:bg-transparent focus:outline-hidden"
        style={{
          ...SHARED_METRICS,
          color: 'transparent',
          caretColor: 'var(--dc-text)',
          WebkitTextFillColor: 'transparent'
        }}
      />
    </div>
  )
}
