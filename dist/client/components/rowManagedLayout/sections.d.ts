import { PortletConfig, RowLayout } from '../../types.js';
/** A markdown portlet that sizes itself to its content - the shape of a header. */
export declare function isAutoHeightMarkdownPortlet(portlet: PortletConfig): boolean;
/**
 * A row sizes itself to its content only when every column is a markdown
 * portlet asking for it. A group column has an explicit height, so it never
 * auto-heights.
 */
export declare function isAutoHeightRow(row: RowLayout, portletMap: Map<string, PortletConfig>): boolean;
/**
 * A section header is a lone full-width auto-height markdown row.
 *
 * The width test matters: a single column is not automatically full width, and
 * one narrower than `cols` renders as a partial-width card that shouldn't
 * capture the rows below it. `normalizeRows` -> `adjustRowWidths` guarantees a
 * row's columns sum to exactly `cols`, so a lone column does reach it.
 */
export declare function isSectionHeaderRow(row: RowLayout, portletMap: Map<string, PortletConfig>, cols: number): boolean;
/**
 * True when the header already draws its own line along its bottom edge -
 * either the `accentBorder: 'bottom'` display option, or markdown content
 * ending in a horizontal rule.
 *
 * Such a header separates itself from the section body, so the section must not
 * draw its own divider underneath as well: two parallel lines a few pixels
 * apart is the thing this whole feature exists to avoid.
 */
export declare function headerHasBottomRule(portlet: PortletConfig): boolean;
export type RowBand = 
/** A row that belongs to no section, drawn exactly as it always has been. */
{
    kind: 'loose';
    rowIndex: number;
} | {
    kind: 'section';
    headerRowIndex: number;
    bodyRowIndices: number[];
};
/**
 * Split `rows` into bands top-down. Rows before the first header stay loose,
 * and a header with nothing beneath it stays loose too - a trailing markdown
 * note is a note, not an empty section card.
 */
export declare function computeRowBands(rows: RowLayout[], portletMap: Map<string, PortletConfig>, cols: number): RowBand[];
/** True when at least one section would be drawn - lets callers skip the wrapper entirely. */
export declare function hasSection(bands: RowBand[]): boolean;
