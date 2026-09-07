import { StateCreator } from 'zustand';
import { AnalysisBuilderStore } from '../analysisBuilderStore.js';
import { AnalysisConfig, AnalysisType, ChartConfig, AnalysisWorkspace } from '../../types/analysisConfig.js';
import { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../types.js';
/**
 * Core slice state
 */
export interface CoreSliceState {
    /** Current analysis mode */
    analysisType: AnalysisType;
    /**
     * Per-mode chart configuration map.
     * Each mode owns its own chart settings.
     * Phase 4: This is now the source of truth for all chart configuration.
     */
    charts: {
        [K in AnalysisType]?: ChartConfig;
    };
    /**
     * Per-mode active view (table or chart) map.
     * Each mode owns its own view preference.
     * This preserves view preference when switching between modes.
     */
    activeViews: {
        [K in AnalysisType]?: 'table' | 'chart';
    };
    /** Whether user manually selected a chart type */
    userManuallySelectedChart: boolean;
    /** Color palette name */
    localPaletteName: string;
}
/**
 * Core slice actions
 */
export interface CoreSliceActions {
    /** Set the analysis type (switches between Query/Funnel modes) */
    setAnalysisType: (type: AnalysisType) => void;
    /** Set chart type for current mode */
    setChartType: (type: ChartType) => void;
    /** Set chart type with manual selection flag */
    setChartTypeManual: (type: ChartType) => void;
    /** Set chart config for current mode */
    setChartConfig: (config: ChartAxisConfig) => void;
    /** Set display config for current mode */
    setDisplayConfig: (config: ChartDisplayConfig) => void;
    /** Set color palette name */
    setLocalPaletteName: (name: string) => void;
    /** Set user manually selected chart flag */
    setUserManuallySelectedChart: (value: boolean) => void;
    /**
     * @deprecated Use setChartType() instead - works for any mode via charts map.
     * This setter is kept for backward compatibility but will be removed in a future version.
     */
    setFunnelChartType: (type: ChartType) => void;
    /**
     * @deprecated Use setChartConfig() instead - works for any mode via charts map.
     * This setter is kept for backward compatibility but will be removed in a future version.
     */
    setFunnelChartConfig: (config: ChartAxisConfig) => void;
    /**
     * @deprecated Use setDisplayConfig() instead - works for any mode via charts map.
     * This setter is kept for backward compatibility but will be removed in a future version.
     */
    setFunnelDisplayConfig: (config: ChartDisplayConfig) => void;
    /**
     * Save current state to AnalysisConfig format.
     * Delegates to the appropriate adapter based on analysisType.
     * Use for share URLs and portlets (single-mode).
     */
    save: () => AnalysisConfig;
    /**
     * Load state from AnalysisConfig.
     * Delegates to the appropriate adapter based on config.analysisType.
     * Use for share URLs and portlets (single-mode).
     */
    load: (config: AnalysisConfig) => void;
    /**
     * Save ALL modes to AnalysisWorkspace format.
     * Used for localStorage persistence to preserve state across mode switches.
     */
    saveWorkspace: () => AnalysisWorkspace;
    /**
     * Load ALL modes from AnalysisWorkspace.
     * Used for localStorage persistence to restore state for all modes.
     */
    loadWorkspace: (workspace: AnalysisWorkspace) => void;
}
export type CoreSlice = CoreSliceState & CoreSliceActions;
export declare const createInitialCoreState: () => CoreSliceState;
/**
 * Create the core slice.
 * Uses StateCreator pattern for composability with other slices.
 */
export declare const createCoreSlice: StateCreator<AnalysisBuilderStore, [
], [
], CoreSlice>;
