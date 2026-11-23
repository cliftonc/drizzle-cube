import React, { useMemo, useRef, type ReactNode } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { compiler, type MarkdownToJSX } from 'markdown-to-jsx'
import type { ChartProps } from '../../types.js'
import type { MarkdownTemplateDiagnostic } from './markdownTemplate.js'
import { parseMarkdownDisclosures, type MarkdownSegment } from './markdownDisclosure.js'
import {
  alignmentClass,
  bodySizeClass,
  buildAccentBorderStyle,
  buildMarkdownOptions,
  resolveAccentColor,
  useMarkdownTemplate
} from './MarkdownChart.helpers.js'

/**
 * A template that failed to parse or render reports its diagnostics in place.
 * Showing them beats showing nothing: the author is usually looking straight at
 * the portlet while editing, and a thrown error would take the dashboard down.
 */
function Diagnostics({ heading, items, tone }: {
  heading: string
  items: MarkdownTemplateDiagnostic[]
  tone: 'error' | 'warning'
}) {
  return (
    <>
      <div className={`dc:font-semibold dc:mb-2 ${tone === 'error' ? 'text-dc-error' : 'text-dc-warning'}`}>
        {heading}
      </div>
      <ul className="dc:list-disc dc:ml-5 dc:space-y-1 dc:text-xs text-dc-text-secondary">
        {items.map((item, index) => (
          <li key={`${item.line}:${item.column}:${index}`}>
            <span className="dc:font-mono">{`${item.line}:${item.column}`}</span>
            {` ${item.message}`}
          </li>
        ))}
      </ul>
    </>
  )
}

type DisclosureState = Record<string, boolean>

function isDisclosureState(value: unknown): value is DisclosureState {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Object.values(value).every(open => typeof open === 'boolean')
}

function renderSegments(
  segments: MarkdownSegment[],
  options: MarkdownToJSX.Options,
  openState: DisclosureState,
  onToggle: (key: string, open: boolean) => void
): ReactNode[] {
  return segments.map((segment, index) => {
    if (segment.kind === 'markdown') {
      return segment.text.trim() ? <React.Fragment key={index}>{compiler(segment.text, options)}</React.Fragment> : null
    }
    return (
      <details
        key={segment.key}
        className="text-dc-text dc:my-2"
        open={openState[segment.key] === true}
        onToggle={event => onToggle(segment.key, event.currentTarget.open)}
      >
        <summary className="text-dc-text dc:cursor-pointer dc:rounded-sm dc:font-semibold dc:focus-visible:outline-2 dc:focus-visible:outline-offset-2">
          {compiler(segment.summary, { ...options, forceInline: true })}
        </summary>
        {renderSegments(segment.body, options, openState, onToggle)}
      </details>
    )
  })
}

const MarkdownChart = React.memo(function MarkdownChart({
  data,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette,
  initialViewState,
  onViewStateChange
}: ChartProps) {
  const { t } = useTranslation()
  const disclosureState = useRef<DisclosureState>(isDisclosureState(initialViewState) ? { ...initialViewState } : {})
  const content = displayConfig.content || ''
  const fontSize = displayConfig.fontSize || 'medium'
  const transparentBackground = !!displayConfig.transparentBackground

  const accentColor = resolveAccentColor(colorPalette?.colors, displayConfig.accentColorIndex ?? 0)

  // With a query attached the content is a Knap template over the result rows
  // rather than literal markdown. Without one this is inert.
  const template = useMarkdownTemplate(content, data, queryObject)

  // In template mode the rendered output replaces the raw content. Before the
  // first async render lands there is nothing to show, so the body is empty for
  // one paint rather than flashing the un-rendered template source.
  const body = template.errors.length > 0 ? '' : template.isTemplate ? (template.output ?? '') : content
  const markdown = useMemo(() => {
    if (!body) return null
    const options = buildMarkdownOptions(accentColor, fontSize)
    const segments = parseMarkdownDisclosures(body)
    if (segments.every(segment => segment.kind === 'markdown')) return compiler(body, options)
    return renderSegments(segments, options, disclosureState.current, (key, open) => {
      if (disclosureState.current[key] === open) return
      disclosureState.current = { ...disclosureState.current, [key]: open }
      onViewStateChange?.(disclosureState.current)
    })
  }, [body, accentColor, fontSize, onViewStateChange])

  if (!content.trim()) {
    if (transparentBackground) return null

    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{ height: height === "100%" ? "100%" : height }}
      >
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.markdown.noContent')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.markdown.addContent')}</div>
        </div>
      </div>
    )
  }

  const containerStyle = {
    height: height === "100%" ? "100%" : height,
    ...buildAccentBorderStyle(displayConfig.accentBorder || 'none', accentColor, transparentBackground)
  }
  const padding = transparentBackground ? '' : 'dc:p-4 '

  if (template.errors.length > 0) {
    return (
      <div
        className={`dc-markdown-content dc:w-full dc:overflow-auto ${padding}dc:text-sm`}
        style={containerStyle}
      >
        <Diagnostics
          heading={t('chart.runtime.markdown.templateError')}
          items={template.errors}
          tone="error"
        />
      </div>
    )
  }

  const alignment = alignmentClass(displayConfig.alignment || 'left')

  return (
    <div
      className={`dc-markdown-content dc:w-full dc:overflow-auto ${padding}${bodySizeClass(fontSize)} ${alignment}`}
      style={containerStyle}
    >
      {/* Shown above the body, not instead of it: the rest of the narrative is
          usually correct, and the blank it leaves behind is the only other clue
          the author gets. */}
      {template.warnings.length > 0 ? (
        <div className="dc:mb-3 dc:pb-2 dc:text-sm border-dc-border dc:border-b">
          <Diagnostics
            heading={t('chart.runtime.markdown.templateWarning')}
            items={template.warnings}
            tone="warning"
          />
        </div>
      ) : null}
      {markdown}
    </div>
  )
})

export default MarkdownChart
