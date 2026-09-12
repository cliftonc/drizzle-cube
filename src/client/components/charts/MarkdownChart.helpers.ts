/**
 * Presentation helpers and the template hook for MarkdownChart.
 *
 * The chart resolves a lot of small styling choices from its display config —
 * heading scale, alignment, accent border — and, since gaining a template mode,
 * also runs an async render. Both live here so the component itself stays a
 * readable sequence of "read config, render body".
 */

import { useContext, useEffect, useMemo, useState } from 'react'
import { sanitizer } from 'markdown-to-jsx'
import type { CSSProperties } from 'react'
import { CubeMetaContext, type CubeMetaContextValue } from '../../providers/CubeMetaContext.js'
import { queryHasMembers } from '../../../shared/query-shape.js'
import type { CubeQuery } from '../../types.js'
import {
  buildTemplateContext,
  renderMarkdownTemplate,
  type MarkdownTemplateDiagnostic,
  type MarkdownTemplateResult
} from './markdownTemplate.js'

/** Heading scale per fontSize setting. */
const HEADER_SIZES: Record<string, Record<number, string>> = {
  small: { 1: 'dc:text-lg', 2: 'dc:text-base', 3: 'dc:text-sm' },
  medium: { 1: 'dc:text-3xl', 2: 'dc:text-2xl', 3: 'dc:text-xl' },
  large: { 1: 'dc:text-5xl', 2: 'dc:text-4xl', 3: 'dc:text-3xl' }
}

const HEADER_MARGINS: Record<number, string> = { 1: 'dc:mb-4', 2: 'dc:mb-3', 3: 'dc:mb-2' }

const BODY_SIZES: Record<string, string> = {
  small: 'dc:text-sm',
  medium: 'dc:text-lg',
  large: 'dc:text-xl'
}

const ALIGNMENTS: Record<string, string> = {
  left: 'dc:text-left',
  center: 'dc:text-center',
  right: 'dc:text-right'
}

/** Body text size class for a fontSize setting. */
export function bodySizeClass(fontSize: string): string {
  return BODY_SIZES[fontSize] ?? BODY_SIZES.medium
}

/** Text alignment class for an alignment setting. */
export function alignmentClass(alignment: string): string {
  return ALIGNMENTS[alignment] ?? ALIGNMENTS.left
}

/** Heading class pair for one level, falling back to the medium scale. */
function headingProps(fontSize: string, level: 1 | 2 | 3, accentColor: string) {
  const size = HEADER_SIZES[fontSize]?.[level] ?? HEADER_SIZES.medium[level]
  return {
    props: {
      className: `dc:font-bold ${size} ${HEADER_MARGINS[level]}`,
      style: { color: accentColor }
    }
  }
}

/**
 * markdown-to-jsx options for the chart's themed elements.
 *
 * The `sanitizer` is markdown-to-jsx's own, named rather than left implicit:
 * template output can carry warehouse values into link and image destinations,
 * so the protocol policy should be visible in our code.
 */
export function buildMarkdownOptions(accentColor: string, fontSize: string) {
  return {
    sanitizer: (value: string) => sanitizer(value),
    overrides: {
      h1: headingProps(fontSize, 1, accentColor),
      h2: headingProps(fontSize, 2, accentColor),
      h3: headingProps(fontSize, 3, accentColor),
      p: { props: { className: 'dc:mb-3 dc:leading-relaxed text-dc-text' } },
      strong: { props: { className: 'dc:font-bold text-dc-text' } },
      em: { props: { className: 'dc:italic text-dc-text' } },
      a: {
        props: {
          className: 'dc:hover:underline dc:transition-colors',
          target: '_blank',
          rel: 'nofollow noopener noreferrer',
          style: { color: accentColor }
        }
      },
      code: { props: { className: 'dc:px-1 dc:py-0.5 dc:rounded-sm dc:text-xs bg-dc-surface-secondary text-dc-accent dc:font-mono' } },
      pre: { props: { className: 'dc:rounded-lg dc:p-3 dc:my-2 dc:overflow-x-auto dc:text-xs bg-dc-surface-secondary text-dc-text dc:font-mono' } },
      ul: { props: { className: 'dc:list-disc dc:ml-6 dc:mb-3 text-dc-text dc:space-y-1' } },
      ol: { props: { className: 'dc:list-decimal dc:ml-6 dc:mb-3 text-dc-text dc:space-y-1' } },
      li: { props: { className: 'dc:mb-1 text-dc-text' } },
      blockquote: { props: { className: 'dc:border-l-4 border-dc-accent dc:pl-3 dc:my-2 dc:italic text-dc-text-secondary' } },
      hr: {
        props: {
          className: 'dc:my-4 dc:border-none',
          style: { height: '2px', backgroundColor: accentColor, opacity: 0.3 }
        }
      },
      table: { props: { className: 'dc:w-full dc:border-collapse dc:my-3 dc:text-sm' } },
      thead: { props: { className: 'bg-dc-surface-secondary' } },
      th: { props: { className: 'dc:px-3 dc:py-2 dc:text-left dc:font-semibold dc:text-xs text-dc-text-secondary dc:uppercase dc:tracking-wider border-dc-border dc:border-b' } },
      td: { props: { className: 'dc:px-3 dc:py-2 text-dc-text border-dc-border dc:border-b' } },
      tr: { props: { className: 'dc:hover:opacity-80' } }
    }
  }
}

/** The accent stripe, on whichever side the config names. */
export function buildAccentBorderStyle(
  accentBorder: string,
  accentColor: string,
  transparentBackground: boolean
): CSSProperties {
  if (accentBorder === 'none') return {}

  const side = accentBorder.charAt(0).toUpperCase() + accentBorder.slice(1)
  const style: CSSProperties = {
    [`border${side}`]: `4px solid ${accentColor}`
  }
  // A transparent block has no padding of its own, so the stripe would sit
  // flush against the text.
  if (transparentBackground && accentBorder === 'left') {
    style.paddingLeft = '12px'
  }
  return style
}

/** The palette colour at `index`, or the chart default. */
export function resolveAccentColor(
  colors: string[] | undefined,
  index: number
): string {
  return colors && index < colors.length ? colors[index] : '#8884d8'
}

/** Rows arrive as `unknown[]`; only plain objects can become template variables. */
export function toTemplateRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return []
  return data.filter(
    (row): row is Record<string, unknown> =>
      typeof row === 'object' && row !== null && !Array.isArray(row)
  )
}

export interface MarkdownTemplateState {
  /** Whether the content is a template rather than literal markdown. */
  isTemplate: boolean
  /** The rendered body, or null before the first async render lands. */
  output: string | null
  errors: MarkdownTemplateDiagnostic[]
  /** References that resolved to nothing, reported alongside the output. */
  warnings: MarkdownTemplateDiagnostic[]
}

/**
 * Render the chart's content as a Knap template when a query is attached.
 *
 * A real query is what distinguishes the two modes, and it has to be the
 * members rather than the object: several callers pass `{}` for "no query", and
 * treating that as a template would silently reinterpret every text block.
 */
export function useMarkdownTemplate(
  content: string,
  data: unknown,
  queryObject: CubeQuery | undefined
): MarkdownTemplateState {
  const isTemplate = queryHasMembers(queryObject)
  const rows = useMemo(() => toTemplateRows(data), [data])

  // Field labels give `{{ labelled | table }}` readable column headers. Read
  // from context directly rather than through useCubeFieldLabel, which throws
  // outside a CubeProvider — the chart also renders in previews and in the MCP
  // app, where losing labels is fine but crashing is not.
  const metaContext = useContext(CubeMetaContext) as CubeMetaContextValue | null
  const getFieldLabel = metaContext?.getFieldLabel

  const [result, setResult] = useState<MarkdownTemplateResult | null>(null)

  useEffect(() => {
    if (!isTemplate || !content.trim()) {
      setResult(null)
      return
    }

    let cancelled = false
    const context = buildTemplateContext(rows, getFieldLabel)
    void renderMarkdownTemplate(content, context).then((rendered) => {
      if (!cancelled) setResult(rendered)
    })

    return () => {
      cancelled = true
    }
  }, [isTemplate, content, rows, getFieldLabel])

  return {
    isTemplate,
    output: result?.output ?? null,
    errors: result?.errors ?? [],
    warnings: result?.warnings ?? []
  }
}
