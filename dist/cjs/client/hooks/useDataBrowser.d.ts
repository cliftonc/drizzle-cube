import { CubeQuery } from '../types.js';
/**
 * Get field type from metadata
 */
export declare function getFieldType(fieldName: string, meta: {
    cubes: Array<{
        name: string;
        dimensions: Array<{
            name: string;
            type: string;
        }>;
        measures: Array<{
            name: string;
            type: string;
        }>;
    }>;
} | null): string;
/**
 * Get all browsable columns for a cube (dimensions + ungrouped-compatible measures)
 */
export declare function getCubeColumns(cubeName: string, meta: {
    cubes: Array<{
        name: string;
        dimensions: Array<{
            name: string;
        }>;
        measures: Array<{
            name: string;
            type: string;
        }>;
    }>;
} | null): {
    dimensions: string[];
    measures: string[];
};
export declare function useDataBrowser(): {
    refetch: (options?: import('./queries/useCubeLoadQuery.js').RefetchOptions) => void;
    selectCube: (cubeName: string, allDimensions: string[]) => void;
    setVisibleColumns: (columns: string[]) => void;
    toggleColumn: (column: string) => void;
    setSort: (column: string) => void;
    clearSort: () => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setFilters: (filters: import('../types.js').Filter[]) => void;
    toggleFilterBar: () => void;
    setShowColumnPicker: (show: boolean) => void;
    selectedCube: string | null;
    visibleColumns: string[];
    sortColumn: string | null;
    sortDirection: "asc" | "desc";
    page: number;
    pageSize: number;
    filters: import('../types.js').Filter[];
    showFilterBar: boolean;
    showColumnPicker: boolean;
    rawData: unknown[] | null;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    query: CubeQuery | null;
    rowCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    meta: import('../types.js').CubeMeta | null;
    getFieldLabel: (fieldName: string) => string;
};
