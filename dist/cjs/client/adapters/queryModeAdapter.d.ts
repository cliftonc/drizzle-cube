import { ModeAdapter } from './modeAdapter.js';
import { QueryMergeStrategy } from '../types.js';
import { AnalysisBuilderState } from '../components/AnalysisBuilder/types.js';
/**
 * The shape of query mode state in the store.
 * This is what the adapter's load() returns and save() receives.
 */
export interface QuerySliceState {
    /** Array of query states (one per query tab) */
    queryStates: AnalysisBuilderState[];
    /** Index of the active query tab */
    activeQueryIndex: number;
    /** Strategy for combining multiple queries */
    mergeStrategy: QueryMergeStrategy;
}
export declare const queryModeAdapter: ModeAdapter<QuerySliceState>;
