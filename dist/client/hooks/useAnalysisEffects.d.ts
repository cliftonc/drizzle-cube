import { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types.js';
import { AIState } from '../components/AnalysisBuilder/types.js';
import { UseAnalysisStateResult } from './useAnalysisState.js';
import { UseAnalysisQueryResult } from './useAnalysisQuery.js';
export interface UseAnalysisEffectsOptions {
    /** State responsibility hook result (store reads/derivation + actions) */
    state: UseAnalysisStateResult;
    /** Query responsibility hook result (execution + hasDebounced) */
    query: UseAnalysisQueryResult;
    /** AI endpoint URL */
    aiEndpoint?: string;
    /** Callback when query changes */
    onQueryChange?: (query: CubeQuery) => void;
    /** Callback when chart config changes */
    onChartConfigChange?: (config: {
        chartType: ChartType;
        chartConfig: ChartAxisConfig;
        displayConfig: ChartDisplayConfig;
    }) => void;
}
export declare function useAnalysisEffects(options: UseAnalysisEffectsOptions): {
    aiState: AIState;
    openAI: () => void;
    closeAI: () => void;
    setAIPrompt: (prompt: string) => void;
    generateAI: () => Promise<void>;
    acceptAI: () => void;
    cancelAI: () => void;
    shareButtonState: "idle" | "copied" | "copied-no-chart";
    share: () => Promise<void>;
    canShare: boolean;
};
export type UseAnalysisEffectsResult = ReturnType<typeof useAnalysisEffects>;
