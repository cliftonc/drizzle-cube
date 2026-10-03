/**
 * Groups a row layout into "sections": a full-width markdown header row plus
 * every row beneath it, up to the next header. The row layout itself stays a
 * flat ordered list - this is a read-only view over it, used to draw a section
 * as one card instead of a pile of separate ones.
 *
 * Pure and DOM-free on purpose: nothing here measures rendered content, so the
 * same answer holds on the server, in tests and mid-drag.
 */

import type { PortletConfig, RowLayout } from '../../types.js'
import { ensureAnalysisConfig } from '../../utils/configMigration.js'

/** A markdown portlet that sizes itself to its content - the shape of a header. */
export function isAutoHeightMarkdownPortlet(portlet: PortletConfig): boolean {
  const normalized = ensureAnalysisConfig(portlet)
  const chartMode = normalized.analysisConfig.charts[normalized.analysisConfig.analysisType]
  return chartMode?.chartType === 'markdown' && (chartMode.displayConfig?.autoHeight ?? true)
}

/**
 * A row sizes itself to its content only when every column is a markdown
 * portlet asking for it. A group column has an explicit height, so it never
 * auto-heights.
 */
export function isAutoHeightRow(
  row: RowLayout,
  portletMap: Map<string, PortletConfig>
): boolean {
  return row.columns.length > 0 && row.columns.every(column => {
    if (column.groupId) return false
    const portlet = column.portletId ? portletMap.get(column.portletId) : undefined
    return !!portlet && isAutoHeightMarkdownPortlet(portlet)
  })
}

/**
 * A section header is a lone full-width auto-height markdown row.
 *
 * The width test matters: a single column is not automatically full width, and
 * one narrower than `cols` renders as a partial-width card that shouldn't
 * capture the rows below it. `normalizeRows` -> `adjustRowWidths` guarantees a
 * row's columns sum to exactly `cols`, so a lone column does reach it.
 */
export function isSectionHeaderRow(
  row: RowLayout,
  portletMap: Map<string, PortletConfig>,
  cols: number
): boolean {
  if (row.columns.length !== 1) return false
  const [column] = row.columns
  if (column.groupId || !column.portletId) return false
  if (Math.abs(column.w - cols) > 1e-6) return false
  return isAutoHeightRow(row, portletMap)
}

/** A markdown rule: three or more of the same -, * or _, spaces allowed. */
const MARKDOWN_RULE = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/

/**
 * True when the header already draws its own line along its bottom edge -
 * either the `accentBorder: 'bottom'` display option, or markdown content
 * ending in a horizontal rule.
 *
 * Such a header separates itself from the section body, so the section must not
 * draw its own divider underneath as well: two parallel lines a few pixels
 * apart is the thing this whole feature exists to avoid.
 */
export function headerHasBottomRule(portlet: PortletConfig): boolean {
  const normalized = ensureAnalysisConfig(portlet)
  const chartMode = normalized.analysisConfig.charts[normalized.analysisConfig.analysisType]
  const displayConfig = chartMode?.displayConfig
  if (displayConfig?.accentBorder === 'bottom') return true

  const content = displayConfig?.content
  if (typeof content !== 'string') return false

  const lines = content.trimEnd().split('\n')
  return MARKDOWN_RULE.test(lines[lines.length - 1] ?? '')
}

export type RowBand =
  /** A row that belongs to no section, drawn exactly as it always has been. */
  | { kind: 'loose'; rowIndex: number }
  | { kind: 'section'; headerRowIndex: number; bodyRowIndices: number[] }

/**
 * Split `rows` into bands top-down. Rows before the first header stay loose,
 * and a header with nothing beneath it stays loose too - a trailing markdown
 * note is a note, not an empty section card.
 */
export function computeRowBands(
  rows: RowLayout[],
  portletMap: Map<string, PortletConfig>,
  cols: number
): RowBand[] {
  const bands: RowBand[] = []
  let index = 0

  while (index < rows.length) {
    if (!isSectionHeaderRow(rows[index], portletMap, cols)) {
      bands.push({ kind: 'loose', rowIndex: index })
      index += 1
      continue
    }

    const headerRowIndex = index
    const bodyRowIndices: number[] = []
    index += 1
    while (index < rows.length && !isSectionHeaderRow(rows[index], portletMap, cols)) {
      bodyRowIndices.push(index)
      index += 1
    }

    bands.push(
      bodyRowIndices.length === 0
        ? { kind: 'loose', rowIndex: headerRowIndex }
        : { kind: 'section', headerRowIndex, bodyRowIndices }
    )
  }

  return bands
}

/** True when at least one section would be drawn - lets callers skip the wrapper entirely. */
export function hasSection(bands: RowBand[]): boolean {
  return bands.some(band => band.kind === 'section')
}
