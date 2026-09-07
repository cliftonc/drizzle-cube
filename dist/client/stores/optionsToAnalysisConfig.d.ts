import { CubeQuery, MultiQueryConfig } from '../types.js';
import { AnalysisBuilderState } from '../components/AnalysisBuilder/types.js';
import { AnalysisConfig } from '../types/analysisConfig.js';
import { CreateStoreOptions } from './analysisBuilderStore.js';
/**
 * Convert CubeQuery to AnalysisBuilderState
 */
export declare function queryToState(query: CubeQuery): AnalysisBuilderState;
/**
 * Check if config is MultiQueryConfig
 */
export declare function isMultiQueryConfig(config: CubeQuery | MultiQueryConfig): config is MultiQueryConfig;
/**
 * Convert store creation options to AnalysisConfig.
 * Returns null if no meaningful options are provided (use defaults).
 */
export declare function optionsToAnalysisConfig(options: CreateStoreOptions): AnalysisConfig | null;
