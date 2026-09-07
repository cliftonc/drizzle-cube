import { ChartPagination, ChartType, CubeQuery } from '../../types.js';
/** Fixed page sizes, matching the records table's own `pageSize` option. */
export declare const PAGE_SIZE_OPTIONS: number[];
export interface UsePortletPaginationParams {
    chartType: ChartType;
    /** The query to paginate — the drilled query when one is active, else the base query. */
    activeQuery: CubeQuery | null;
    /** Authored page size from the portlet's display config. */
    pageSize?: number;
}
export interface UsePortletPaginationResult {
    /** `activeQuery` with limit/offset/order/total merged in, or it unchanged when paging is off. */
    paginatedQuery: CubeQuery | null;
    /**
     * Passed to the chart as `ChartProps.pagination`; undefined when paging is
     * off. `total` is left unset here — it arrives with the response, so the
     * caller fills it in from the result set.
     */
    pagination?: Omit<ChartPagination, 'total'>;
}
export declare function usePortletPagination({ chartType, activeQuery, pageSize: authoredPageSize }: UsePortletPaginationParams): UsePortletPaginationResult;
