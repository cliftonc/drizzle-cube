import { ColumnFormatConfig } from '../types.js';
/** Fallback when an author has not sized a column. */
export declare const DEFAULT_COLUMN_WIDTH = 160;
/** Narrower than this and the resize handle overlaps the header text. */
export declare const MIN_COLUMN_WIDTH = 60;
/**
 * Identity under which a viewer's column widths are remembered.
 *
 * A chart component has no portlet id, so widths key on the columns themselves:
 * two records tables showing the same fields share widths, which is the
 * behaviour an author would expect from two views of the same records.
 */
export declare function columnWidthStorageKey(columns: string[]): string;
export declare function loadColumnWidths(key: string): Record<string, number>;
export declare function saveColumnWidths(key: string, widths: Record<string, number>): void;
/**
 * A viewer's own column order, remembered under the same identity as widths.
 *
 * Stored as a list rather than a map so it survives the author adding or
 * removing a column: {@link applyColumnOrder} reconciles it against the
 * columns that actually exist.
 */
export declare function loadColumnOrder(key: string): string[];
export declare function saveColumnOrder(key: string, order: string[]): void;
/**
 * Lay a remembered order over the columns the chart actually has.
 *
 * Columns the order does not mention keep their authored position relative to
 * the end, so an author adding a column still sees it rather than having it
 * silently swallowed by a stale local order.
 */
export declare function applyColumnOrder(columns: string[], order: string[]): string[];
/** Move one column to another's position, returning a new order. */
export declare function moveColumn(columns: string[], from: string, to: string): string[];
/**
 * A cell resolved to something renderable. `progress` carries its own shape
 * because the component draws a bar or a ring rather than a string; every
 * other kind reduces to text plus, for badges, a colour.
 *
 * The component only ever sees a `RenderedCell`, so the progress `style` is
 * resolved here rather than being read back out of the column's config.
 */
export type RenderedCell = {
    kind: 'text';
    text: string;
} | {
    kind: 'badge';
    text: string;
    colorIndex?: number;
} | {
    kind: 'progress';
    text: string;
    fraction: number;
    style: 'bar' | 'circle';
};
/**
 * Turn a raw cell value into its display form under the column's format.
 *
 * Every kind degrades to text rather than erroring: a non-numeric value under
 * `number`/`progress` renders as-is (EAV columns legitimately contain 'n/a'),
 * and a badge value with no colour mapping renders neutral rather than being
 * given a guessed colour.
 */
export declare function renderCellValue(value: unknown, format: ColumnFormatConfig | undefined): RenderedCell;
/**
 * Sort rows by one column, client-side.
 *
 * Only used when the host provides no server-side pagination — with paging on,
 * sorting the loaded page alone would put the wrong rows on page 1.
 */
export declare function sortRows(rows: Record<string, unknown>[], column: string, direction: 'asc' | 'desc'): Record<string, unknown>[];
