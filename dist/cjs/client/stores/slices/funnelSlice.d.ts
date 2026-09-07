import { StateCreator } from 'zustand';
import { AnalysisBuilderStore } from '../analysisBuilderStore.js';
import { FunnelStepState, FunnelBindingKey, FunnelConfig } from '../../types.js';
import { ServerFunnelQuery } from '../../types/funnel.js';
/**
 * Funnel slice state
 */
export interface FunnelSliceState {
    /** Selected cube for funnel mode (all steps use this cube) */
    funnelCube: string | null;
    /** Dedicated funnel steps (separate from queryStates) */
    funnelSteps: FunnelStepState[];
    /** Index of currently active funnel step */
    activeFunnelStepIndex: number;
    /** Time dimension for funnel temporal ordering */
    funnelTimeDimension: string | null;
    /** Binding key dimension that links funnel steps together */
    funnelBindingKey: FunnelBindingKey | null;
    /** @deprecated Use funnelSteps[].timeToConvert instead - kept for backward compat */
    stepTimeToConvert: (string | null)[];
}
/**
 * Funnel slice actions
 */
export interface FunnelSliceActions {
    /** Add a new funnel step */
    addFunnelStep: () => void;
    /** Remove a funnel step by index */
    removeFunnelStep: (index: number) => void;
    /** Update a funnel step by index */
    updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void;
    /** Set the active funnel step index */
    setActiveFunnelStepIndex: (index: number) => void;
    /** Reorder funnel steps */
    reorderFunnelSteps: (fromIndex: number, toIndex: number) => void;
    /** Set the time dimension for funnel */
    setFunnelTimeDimension: (dimension: string | null) => void;
    /** Set the funnel binding key */
    setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void;
    /** Set the funnel cube (clears binding key/time dimension, updates all steps) */
    setFunnelCube: (cube: string | null) => void;
    /** @deprecated No-op - use updateFunnelStep with timeToConvert instead */
    setStepTimeToConvert: (stepIndex: number, duration: string | null) => void;
    /** @deprecated Always returns null - use buildFunnelQueryFromSteps instead */
    buildFunnelConfig: () => FunnelConfig | null;
    /** Build ServerFunnelQuery from dedicated funnelSteps */
    buildFunnelQueryFromSteps: () => ServerFunnelQuery | null;
    /** Check if in funnel mode (analysisType === 'funnel') */
    isFunnelMode: () => boolean;
    /** Check if funnel mode is properly configured and ready for execution */
    isFunnelModeEnabled: () => boolean;
}
export type FunnelSlice = FunnelSliceState & FunnelSliceActions;
export declare const createInitialFunnelState: () => FunnelSliceState;
/**
 * Create the funnel slice.
 * Uses StateCreator pattern for composability.
 */
export declare const createFunnelSlice: StateCreator<AnalysisBuilderStore, [
], [
], FunnelSlice>;
