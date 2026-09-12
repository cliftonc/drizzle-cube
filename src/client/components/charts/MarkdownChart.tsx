import React, { useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import Markdown from 'markdown-to-jsx'
import type { ChartProps } from '../../types.js'
import type { MarkdownTemplateDiagnostic } from './markdownTemplate.js'
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
function TemplateErrors({ errors, t }: {
  errors: MarkdownTemplateDiagnostic[]
  t: (key: string) => string
}) {
  return (
    <>
      <div className="dc:font-semibold dc:mb-2 text-dc-error">
        {t('chart.runtime.markdown.templateError')}
      </div>
      <ul className="dc:list-disc dc:ml-5 dc:space-y-1 dc:text-xs text-dc-text-secondary">
        {errors.map((error, index) => (
          <li key={`${error.line}:${error.column}:${index}`}>
            <span className="dc:font-mono">{`${error.line}:${error.column}`}</span>
            {` ${error.message}`}
          </li>
        ))}
      </ul>
    </>
  )
}

const MarkdownChart = React.memo(function MarkdownChart({
  data,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()
  const content = displayConfig.content || ''
  const fontSize = displayConfig.fontSize || 'medium'
  const transparentBackground = !!displayConfig.transparentBackground

  const accentColor = resolveAccentColor(colorPalette?.colors, displayConfig.accentColorIndex ?? 0)

  // With a query attached the content is a Knap template over the result rows
  // rather than literal markdown. Without one this is inert.
  const template = useMarkdownTemplate(content, data, queryObject)

  const markdownOptions = useMemo(
    () => buildMarkdownOptions(accentColor, fontSize),
    [accentColor, fontSize]
  )

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
        <TemplateErrors errors={template.errors} t={t} />
      </div>
    )
  }

  // In template mode the rendered output replaces the raw content. Before the
  // first async render lands there is nothing to show, so the body is empty for
  // one paint rather than flashing the un-rendered template source.
  const body = template.isTemplate ? (template.output ?? '') : content
  const alignment = alignmentClass(displayConfig.alignment || 'left')

  return (
    <div
      className={`dc-markdown-content dc:w-full dc:overflow-auto ${padding}${bodySizeClass(fontSize)} ${alignment}`}
      style={containerStyle}
    >
      {body ? <Markdown options={markdownOptions}>{body}</Markdown> : null}
    </div>
  )
})

export default MarkdownChart
