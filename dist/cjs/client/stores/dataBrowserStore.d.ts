import { ReactNode } from 'react';
import { Filter } from '../types.js';
export interface DataBrowserStore {
    selectedCube: string | null;
    visibleColumns: string[];
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    page: number;
    pageSize: number;
    filters: Filter[];
    showFilterBar: boolean;
    showColumnPicker: boolean;
    columnWidths: Record<string, number>;
    selectCube: (cubeName: string, allDimensions: string[]) => void;
    setVisibleColumns: (columns: string[]) => void;
    toggleColumn: (column: string) => void;
    setSort: (column: string) => void;
    clearSort: () => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setFilters: (filters: Filter[]) => void;
    toggleFilterBar: () => void;
    setShowColumnPicker: (show: boolean) => void;
    setColumnWidth: (column: string, width: number) => void;
    setColumnWidths: (widths: Record<string, number>) => void;
}
export interface DataBrowserStoreProviderProps {
    children: ReactNode;
    defaultPageSize?: number;
    defaultCube?: string;
    defaultColumns?: string[];
}
export declare function DataBrowserStoreProvider({ children, defaultPageSize, defaultCube, defaultColumns, }: DataBrowserStoreProviderProps): import("react").JSX.Element;
export declare function useDataBrowserStore<T>(selector: (state: DataBrowserStore) => T): T;
