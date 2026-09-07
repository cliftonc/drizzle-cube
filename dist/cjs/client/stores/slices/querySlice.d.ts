import { StateCreator } from 'zustand';
import { AnalysisBuilderStore } from '../analysisBuilderStore.js';
import { Filter, QueryMergeStrategy, CubeQuery, MultiQueryConfig } from '../../types.js';
import { AnalysisBuilderState } from '../../components/AnalysisBuilder/types.js';
/**
 * Query slice state
 */
export interface QuerySliceState {
    /** Array of query states (one per tab) */
    queryStates: AnalysisBuilderState[];
    /** Index of the currently active query tab */
    activeQueryIndex: number;
    /** Strategy for merging multi-query results */
    mergeStrategy: QueryMergeStrategy;
}
/**
 * Query slice actions
 */
export interface QuerySliceActions {
    setQueryStates: (states: AnalysisBuilderState[]) => void;
    updateQueryState: (index: number, updater: (state: AnalysisBuilderState) => AnalysisBuilderState) => void;
    setActiveQueryIndex: (index: number) => void;
    setMergeStrategy: (strategy: QueryMergeStrategy) => void;
    addQuery: () => void;
    removeQuery: (index: number) => void;
    addMetric: (field: string, label?: string) => void;
    removeMetric: (id: string) => void;
    toggleMetric: (fieldName: string) => void;
    reorderMetrics: (fromIndex: number, toIndex: number) => void;
    addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void;
    removeBreakdown: (id: string) => void;
    toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void;
    setBreakdownGranularity: (id: string, granularity: string) => void;
    toggleBreakdownComparison: (id: string) => void;
    reorderBreakdowns: (fromIndex: number, toIndex: number) => void;
    setFilters: (filters: Filter[]) => void;
    dropFieldToFilter: (field: string) => void;
    setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void;
    setLimit: (limit: number | undefined) => void;
    getCurrentState: () => AnalysisBuilderState;
    getMergeKeys: () => string[] | undefined;
    isMultiQueryMode: () => boolean;
    buildCurrentQuery: () => CubeQuery;
    buildAllQueries: () => CubeQuery[];
    buildMultiQueryConfig: () => MultiQueryConfig | null;
}
export type QuerySlice = QuerySliceState & QuerySliceActions;
export declare const createInitialQueryState: () => QuerySliceState;
/**
 * Create the query slice.
 * Uses StateCreator pattern for composability.
 */
export declare const createQuerySlice: StateCreator<AnalysisBuilderStore, [
], [
], QuerySlice>;
