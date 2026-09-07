import { ModeAdapter } from './modeAdapter.js';
import { FunnelStepState, FunnelBindingKey } from '../types.js';
/**
 * The shape of funnel mode state in the store.
 * This is what the adapter's load() returns and save() receives.
 */
export interface FunnelSliceState {
    /** The cube all funnel steps use (single-cube mode) */
    funnelCube: string | null;
    /** Funnel step definitions */
    funnelSteps: FunnelStepState[];
    /** Currently selected step index */
    activeFunnelStepIndex: number;
    /** Time dimension for temporal ordering */
    funnelTimeDimension: string | null;
    /** Binding key that links entities across steps */
    funnelBindingKey: FunnelBindingKey | null;
}
export declare const funnelModeAdapter: ModeAdapter<FunnelSliceState>;
