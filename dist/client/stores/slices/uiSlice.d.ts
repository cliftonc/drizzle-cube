import { StateCreator } from 'zustand';
import { AnalysisBuilderStore } from '../analysisBuilderStore.js';
import { QueryPanelTab, AIState } from '../../components/AnalysisBuilder/types.js';
/**
 * Field modal mode for field search
 */
export type FieldModalMode = 'metrics' | 'breakdown';
/**
 * UI slice state
 */
export interface UISliceState {
    /** Active tab in query panel */
    activeTab: QueryPanelTab;
    /** Active view (table or chart) */
    activeView: 'table' | 'chart';
    /** Display limit for table */
    displayLimit: number;
    /** Whether field search modal is open */
    showFieldModal: boolean;
    /** Current mode for field search modal */
    fieldModalMode: FieldModalMode;
    /** AI panel state */
    aiState: AIState;
}
/**
 * UI slice actions
 */
export interface UISliceActions {
    setActiveTab: (tab: QueryPanelTab) => void;
    setActiveView: (view: 'table' | 'chart') => void;
    setDisplayLimit: (limit: number) => void;
    openMetricsModal: () => void;
    openBreakdownsModal: () => void;
    closeFieldModal: () => void;
    openAI: () => void;
    closeAI: () => void;
    setAIPrompt: (prompt: string) => void;
    setAIGenerating: (generating: boolean) => void;
    setAIError: (error: string | null) => void;
    setAIHasGeneratedQuery: (hasQuery: boolean) => void;
    saveAIPreviousState: () => void;
    restoreAIPreviousState: () => void;
}
export type UISlice = UISliceState & UISliceActions;
export declare const createInitialUIState: () => UISliceState;
/**
 * Create the UI slice.
 * Uses StateCreator pattern for composability.
 */
export declare const createUISlice: StateCreator<AnalysisBuilderStore, [
], [
], UISlice>;
