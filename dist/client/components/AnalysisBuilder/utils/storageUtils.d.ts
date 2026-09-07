import { Filter } from '../../../types.js';
import { MetricItem, BreakdownItem, AnalysisBuilderState, AnalysisBuilderStorageState } from '../types.js';
export declare const STORAGE_KEY = "drizzle-cube-analysis-builder-v3";
/** @deprecated Use STORAGE_KEY instead */
export declare const STORAGE_KEY_V2 = "drizzle-cube-analysis-builder-v2";
/**
 * Create initial empty state for AnalysisBuilder
 *
 * Note: Only client-side configuration state is stored.
 * Server state (execution results, loading, errors) is managed by TanStack Query.
 */
export declare function createInitialState(): AnalysisBuilderState;
/**
 * Load all state from localStorage once (to avoid repeated parsing)
 */
export declare function loadInitialStateFromStorage(disableLocalStorage: boolean): AnalysisBuilderStorageState | null;
/**
 * Save state to localStorage
 */
export declare function saveStateToStorage(state: {
    metrics: MetricItem[];
    breakdowns: BreakdownItem[];
    filters: Filter[];
    chartType: string;
    chartConfig: object;
    displayConfig: object;
    activeView: string;
}): void;
/**
 * Load state from localStorage (legacy format for backward compatibility)
 */
export declare function loadStateFromStorage(): {
    metrics: MetricItem[];
    breakdowns: BreakdownItem[];
    filters: Filter[];
    chartType: string;
    chartConfig: object;
    displayConfig: object;
    activeView: string;
} | null;
/**
 * Clear state from localStorage
 */
export declare function clearStateFromStorage(): void;
