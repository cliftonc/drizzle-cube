import { StateCreator } from 'zustand';
import { AnalysisBuilderStore } from '../analysisBuilderStore.js';
import { Filter, FunnelBindingKey } from '../../types.js';
import { ServerFlowQuery, FlowStartingStep } from '../../types/flow.js';
/**
 * Flow slice state
 */
export interface FlowSliceState {
    /** Selected cube for flow mode (must be an eventStream cube) */
    flowCube: string | null;
    /** Binding key that links events to entities */
    flowBindingKey: FunnelBindingKey | null;
    /** Time dimension for event ordering */
    flowTimeDimension: string | null;
    /** Starting step configuration (anchor point for exploration) */
    startingStep: FlowStartingStep;
    /** Number of steps to explore before starting step (0-5) */
    stepsBefore: number;
    /** Number of steps to explore after starting step (0-5) */
    stepsAfter: number;
    /** Event dimension that categorizes events (node labels) */
    eventDimension: string | null;
    /** Join strategy for flow execution */
    joinStrategy: 'auto' | 'lateral' | 'window';
}
/**
 * Flow slice actions
 */
export interface FlowSliceActions {
    /** Set the flow cube (clears binding key/time dimension) */
    setFlowCube: (cube: string | null) => void;
    /** Set the flow binding key */
    setFlowBindingKey: (key: FunnelBindingKey | null) => void;
    /** Set the flow time dimension */
    setFlowTimeDimension: (dim: string | null) => void;
    /** Set the event dimension */
    setEventDimension: (dim: string | null) => void;
    /** Set the starting step name */
    setStartingStepName: (name: string) => void;
    /** Set all starting step filters at once */
    setStartingStepFilters: (filters: Filter[]) => void;
    /** Add a filter to the starting step */
    addStartingStepFilter: (filter: Filter) => void;
    /** Remove a filter from the starting step by index */
    removeStartingStepFilter: (index: number) => void;
    /** Update a filter in the starting step by index */
    updateStartingStepFilter: (index: number, filter: Filter) => void;
    /** Set the number of steps to explore before starting step */
    setStepsBefore: (count: number) => void;
    /** Set the number of steps to explore after starting step */
    setStepsAfter: (count: number) => void;
    /** Set the join strategy */
    setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void;
    /** Check if in flow mode (analysisType === 'flow') */
    isFlowMode: () => boolean;
    /** Check if flow mode is properly configured and ready for execution */
    isFlowModeEnabled: () => boolean;
    /** Build ServerFlowQuery from flow state */
    buildFlowQuery: () => ServerFlowQuery | null;
}
export type FlowSlice = FlowSliceState & FlowSliceActions;
export declare const createInitialFlowState: () => FlowSliceState;
/**
 * Create the flow slice.
 * Uses StateCreator pattern for composability.
 */
export declare const createFlowSlice: StateCreator<AnalysisBuilderStore, [
], [
], FlowSlice>;
