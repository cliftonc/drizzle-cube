import { default as React } from 'react';
import { ChartAxisConfig, ChartPagination, CubeQuery } from '../../types.js';
export declare const DEFAULT_PAGE_SIZE = 25;
/**
 * Which columns to render, in which order.
 *
 * The author's arrangement comes from the Columns drop zone; a viewer can drag
 * a header on top of it, and that order is remembered per column set. It is
 * *reconciled* rather than substituted, so a column the author adds later still
 * appears instead of being swallowed by a stale local order.
 */
export declare function useRecordsColumns(params: {
    rows: Record<string, unknown>[];
    chartConfig?: ChartAxisConfig;
    queryObject?: CubeQuery;
}): {
    columns: string[];
    storageKey: string;
    draggedColumn: string | null;
    didDragRef: React.MutableRefObject<boolean>;
    startColumnDrag: (column: string) => void;
    endColumnDrag: () => void;
    dropColumn: (target: string) => void;
};
/**
 * Drag-resizable column widths, remembered per column set.
 *
 * A chart has no portlet id and no write path back to `displayConfig`, so an
 * authored `columnWidths` acts as the default a viewer's own drags layer over —
 * the same arrangement the data browser uses.
 */
export declare function useColumnWidths(params: {
    columns: string[];
    storageKey: string;
    authored?: Record<string, number>;
}): {
    columnWidths: Record<string, number>;
    totalWidth: number | undefined;
    tableRef: React.RefObject<HTMLTableElement>;
    didResizeRef: React.MutableRefObject<boolean>;
    startResize: (event: React.MouseEvent, column: string) => void;
};
/**
 * Sorting and paging, server-side when the host offers it.
 *
 * With a `pagination` prop the host re-queries, so both must go through it:
 * sorting only the loaded page would put the wrong rows on page 1. Without one
 * — the AnalysisBuilder preview, the notebook, plugin hosts — the table sorts
 * and pages over the rows it already has.
 */
export declare function useRecordsPaging(params: {
    rows: Record<string, unknown>[];
    pagination?: ChartPagination;
    authoredPageSize?: number;
}): {
    sort: {
        column: string;
        direction: "asc" | "desc";
    } | null;
    toggleSort: (column: string) => void;
    visibleRows: Record<string, unknown>[];
    page: number;
    pageSize: number;
    pageCount: number;
    rowCount: number;
    goToPage: (next: number) => void;
    showPager: boolean;
};
