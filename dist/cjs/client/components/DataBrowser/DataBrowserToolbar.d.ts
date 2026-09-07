/**
 * DataBrowserToolbar
 *
 * Top toolbar with filter toggle, column picker, row count, and pagination.
 */
interface DataBrowserToolbarProps {
    showFilterBar: boolean;
    filterCount: number;
    onToggleFilterBar: () => void;
    onToggleColumnPicker: () => void;
    page: number;
    pageSize: number;
    rowCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isFetching: boolean;
    onRefresh: () => void;
}
export default function DataBrowserToolbar({ showFilterBar, filterCount, onToggleFilterBar, onToggleColumnPicker, page, pageSize, rowCount, hasNextPage, hasPrevPage, onPageChange, onPageSizeChange, isFetching, onRefresh, }: DataBrowserToolbarProps): import("react").JSX.Element;
export {};
