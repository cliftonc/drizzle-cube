import { StateCreator } from 'zustand';
import { AnalysisBuilderStore } from '../analysisBuilderStore.js';
import { Filter, FunnelBindingKey } from '../../types.js';
import { ServerRetentionQuery, RetentionSliceState, RetentionGranularity, RetentionType, DateRange, RetentionBreakdownItem } from '../../types/retention.js';
/**
 * Retention slice actions
 */
export interface RetentionSliceActions {
    /** Set the single cube for retention analysis (clears related fields) */
    setRetentionCube: (cube: string | null) => void;
    /** Set the retention binding key */
    setRetentionBindingKey: (key: FunnelBindingKey | null) => void;
    /** Set the single timestamp dimension */
    setRetentionTimeDimension: (dim: string | null) => void;
    /** Set the date range (REQUIRED) */
    setRetentionDateRange: (range: DateRange) => void;
    /** Set all cohort filters at once */
    setRetentionCohortFilters: (filters: Filter[]) => void;
    /** Add a cohort filter */
    addRetentionCohortFilter: (filter: Filter) => void;
    /** Remove a cohort filter by index */
    removeRetentionCohortFilter: (index: number) => void;
    /** Update a cohort filter by index */
    updateRetentionCohortFilter: (index: number, filter: Filter) => void;
    /** Set all activity filters at once */
    setRetentionActivityFilters: (filters: Filter[]) => void;
    /** Add an activity filter */
    addRetentionActivityFilter: (filter: Filter) => void;
    /** Remove an activity filter by index */
    removeRetentionActivityFilter: (index: number) => void;
    /** Update an activity filter by index */
    updateRetentionActivityFilter: (index: number, filter: Filter) => void;
    /** Set all breakdown dimensions */
    setRetentionBreakdowns: (breakdowns: RetentionBreakdownItem[]) => void;
    /** Add a breakdown dimension */
    addRetentionBreakdown: (breakdown: RetentionBreakdownItem) => void;
    /** Remove a breakdown dimension by field */
    removeRetentionBreakdown: (field: string) => void;
    /** Set the view granularity */
    setRetentionViewGranularity: (granularity: RetentionGranularity) => void;
    /** Set the number of periods */
    setRetentionPeriods: (periods: number) => void;
    /** Set the retention type */
    setRetentionType: (type: RetentionType) => void;
    /** Check if in retention mode (analysisType === 'retention') */
    isRetentionMode: () => boolean;
    /** Check if retention mode is properly configured and ready for execution */
    isRetentionModeEnabled: () => boolean;
    /** Build ServerRetentionQuery from retention state */
    buildRetentionQuery: () => ServerRetentionQuery | null;
    /** Get validation errors explaining why retention query cannot be built */
    getRetentionValidation: () => {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
}
export type RetentionSlice = RetentionSliceState & RetentionSliceActions;
export declare const createInitialRetentionState: () => RetentionSliceState;
/**
 * Create the retention slice.
 * Uses StateCreator pattern for composability.
 */
export declare const createRetentionSlice: StateCreator<AnalysisBuilderStore, [
], [
], RetentionSlice>;
