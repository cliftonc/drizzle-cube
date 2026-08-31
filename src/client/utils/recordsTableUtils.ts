/**
 * Cell formatting and column-width persistence for the records table.
 *
 * Kept out of the component so each piece is unit-testable without a DOM, and
 * so the format switch stays a pure value → display transform.
 */

import type { ColumnFormatConfig, ColumnFormatKind } from '../types.js'
import { formatAxisValue, formatTimeValue } from './chartUtils.js'

/** Fallback when an author has not sized a column. */
export const DEFAULT_COLUMN_WIDTH = 160
/** Narrower than this and the resize handle overlaps the header text. */
export const MIN_COLUMN_WIDTH = 60

const COLUMN_WIDTHS_STORAGE_KEY = 'dc-records-table-column-widths'
const COLUMN_ORDER_STORAGE_KEY = 'dc-records-table-column-order'

/**
 * Identity under which a viewer's column widths are remembered.
 *
 * A chart component has no portlet id, so widths key on the columns themselves:
 * two records tables showing the same fields share widths, which is the
 * behaviour an author would expect from two views of the same records.
 */
export function columnWidthStorageKey(columns: string[]): string {
  return [...columns].sort().join('|')
}

export function loadColumnWidths(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)[key] ?? {}
  } catch {
    return {}
  }
}

export function saveColumnWidths(key: string, widths: Record<string, number>): void {
  try {
    const raw = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[key] = widths
    localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable (private mode, SSR) — widths stay session-local
  }
}

/**
 * A viewer's own column order, remembered under the same identity as widths.
 *
 * Stored as a list rather than a map so it survives the author adding or
 * removing a column: {@link applyColumnOrder} reconciles it against the
 * columns that actually exist.
 */
export function loadColumnOrder(key: string): string[] {
  try {
    const raw = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY)
    if (!raw) return []
    const stored = JSON.parse(raw)[key]
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export function saveColumnOrder(key: string, order: string[]): void {
  try {
    const raw = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[key] = order
    localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable — the order stays session-local
  }
}

/**
 * Lay a remembered order over the columns the chart actually has.
 *
 * Columns the order does not mention keep their authored position relative to
 * the end, so an author adding a column still sees it rather than having it
 * silently swallowed by a stale local order.
 */
export function applyColumnOrder(columns: string[], order: string[]): string[] {
  if (order.length === 0) return columns
  const present = new Set(columns)
  const ordered = order.filter(column => present.has(column))
  const remaining = columns.filter(column => !ordered.includes(column))
  return [...ordered, ...remaining]
}

/** Move one column to another's position, returning a new order. */
export function moveColumn(columns: string[], from: string, to: string): string[] {
  const fromIndex = columns.indexOf(from)
  const toIndex = columns.indexOf(to)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return columns

  const next = [...columns]
  next.splice(fromIndex, 1)
  next.splice(toIndex, 0, from)
  return next
}

/**
 * A cell resolved to something renderable. `progress` carries its own shape
 * because the component draws a bar or a ring rather than a string; every
 * other kind reduces to text plus, for badges, a colour.
 *
 * The component only ever sees a `RenderedCell`, so the progress `style` is
 * resolved here rather than being read back out of the column's config.
 */
export type RenderedCell =
  | { kind: 'text'; text: string }
  | { kind: 'badge'; text: string; colorIndex?: number }
  | { kind: 'progress'; text: string; fraction: number; style: 'bar' | 'circle' }

const EMPTY: RenderedCell = { kind: 'text', text: '' }

/**
 * Turn a raw cell value into its display form under the column's format.
 *
 * Every kind degrades to text rather than erroring: a non-numeric value under
 * `number`/`progress` renders as-is (EAV columns legitimately contain 'n/a'),
 * and a badge value with no colour mapping renders neutral rather than being
 * given a guessed colour.
 */
export function renderCellValue(
  value: unknown,
  format: ColumnFormatConfig | undefined
): RenderedCell {
  if (isEmpty(value)) return EMPTY
  const render = RENDERERS[format?.kind ?? 'text'] ?? renderText
  return render(value, format)
}

type CellRenderer = (value: unknown, format: ColumnFormatConfig | undefined) => RenderedCell

const RENDERERS: Record<ColumnFormatKind, CellRenderer> = {
  text: renderText,
  number: renderNumber,
  date: renderDate,
  badge: renderBadge,
  progress: renderProgress
}

function renderText(value: unknown): RenderedCell {
  return { kind: 'text', text: stringify(value) }
}

function renderNumber(value: unknown, format: ColumnFormatConfig | undefined): RenderedCell {
  const num = toNumber(value)
  if (num === null) return { kind: 'text', text: String(value) }
  return { kind: 'text', text: formatAxisValue(num, format?.numberFormat ?? {}) }
}

function renderDate(value: unknown, format: ColumnFormatConfig | undefined): RenderedCell {
  return { kind: 'text', text: formatTimeValue(value, format?.dateGranularity) }
}

function renderBadge(value: unknown, format: ColumnFormatConfig | undefined): RenderedCell {
  const text = stringify(value)
  return { kind: 'badge', text, colorIndex: format?.badgeColors?.find(e => e.value === text)?.colorIndex }
}

const PROGRESS_NUMBER_FORMAT = { unit: 'number', abbreviate: false, decimals: 0 } as const

function renderProgress(value: unknown, format: ColumnFormatConfig | undefined): RenderedCell {
  const num = toNumber(value)
  if (num === null) return { kind: 'text', text: String(value) }

  return {
    kind: 'progress',
    fraction: progressFraction(num, format),
    style: format?.progressStyle ?? 'bar',
    text: formatAxisValue(num, format?.numberFormat ?? PROGRESS_NUMBER_FORMAT)
  }
}

/** Where a value sits within the column's bounds, as 0-1. */
function progressFraction(value: number, format: ColumnFormatConfig | undefined): number {
  const min = format?.progressMin ?? 0
  const max = format?.progressMax ?? 100
  const span = max - min
  // A zero-width range would divide by zero; treat it as "full".
  return span === 0 ? 1 : clamp((value - min) / span, 0, 1)
}

function stringify(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return value.toLocaleString()
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Sort rows by one column, client-side.
 *
 * Only used when the host provides no server-side pagination — with paging on,
 * sorting the loaded page alone would put the wrong rows on page 1.
 */
export function sortRows(
  rows: Record<string, unknown>[],
  column: string,
  direction: 'asc' | 'desc'
): Record<string, unknown>[] {
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    // Empty values sort last in *both* directions — reversing the sort should
    // not push a column's blanks to the top of the table.
    const aEmpty = isEmpty(a[column])
    const bEmpty = isEmpty(b[column])
    if (aEmpty || bEmpty) return aEmpty && bEmpty ? 0 : aEmpty ? 1 : -1
    return factor * compareValues(a[column], b[column])
  })
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

function compareValues(a: unknown, b: unknown): number {
  const aNum = toNumber(a)
  const bNum = toNumber(b)
  if (aNum !== null && bNum !== null) return aNum - bNum

  return String(a).localeCompare(String(b))
}
