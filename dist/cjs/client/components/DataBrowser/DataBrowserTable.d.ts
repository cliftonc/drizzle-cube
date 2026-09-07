import { default as React } from 'react';
interface DataBrowserTableProps {
    data: unknown[] | null;
    columns: string[];
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (column: string) => void;
    getFieldLabel: (field: string) => string;
    meta: any;
    isLoading: boolean;
    isFetching: boolean;
    selectedCube: string | null;
    loadingComponent?: React.ReactNode;
}
declare const _default: React.MemoExoticComponent<({ data, columns, sortColumn, sortDirection, onSort, getFieldLabel, meta, isLoading, isFetching, selectedCube, loadingComponent, }: DataBrowserTableProps) => React.JSX.Element>;
export default _default;
