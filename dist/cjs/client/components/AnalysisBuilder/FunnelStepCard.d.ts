import { default as React } from 'react';
import { CubeMeta, FunnelStepState } from '../../types.js';
export interface FunnelStepCardProps {
    /** The step state */
    step: FunnelStepState;
    /** Index of this step (0-based) */
    stepIndex: number;
    /** Whether this step is currently active/selected */
    isActive: boolean;
    /** Whether this step can be removed (false if only 1 step) */
    canRemove: boolean;
    /** Cube metadata for filter field selection */
    schema: CubeMeta | null;
    /** Select this step */
    onSelect: () => void;
    /** Remove this step */
    onRemove: () => void;
    /** Update this step */
    onUpdate: (updates: Partial<FunnelStepState>) => void;
}
/**
 * FunnelStepCard displays a single funnel step with inline editing
 */
declare const FunnelStepCard: React.MemoExoticComponent<({ step, stepIndex, isActive, canRemove, schema, onSelect, onRemove, onUpdate, }: FunnelStepCardProps) => React.JSX.Element>;
export default FunnelStepCard;
