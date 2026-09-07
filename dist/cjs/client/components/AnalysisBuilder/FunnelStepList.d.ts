import { default as React } from 'react';
import { CubeMeta, FunnelStepState } from '../../types.js';
export interface FunnelStepListProps {
    /** Array of funnel steps */
    steps: FunnelStepState[];
    /** Index of currently active step */
    activeStepIndex: number;
    /** Cube metadata for cube/field selection */
    schema: CubeMeta | null;
    /** Add a new step */
    onAddStep: () => void;
    /** Remove a step by index */
    onRemoveStep: (index: number) => void;
    /** Update a step */
    onUpdateStep: (index: number, updates: Partial<FunnelStepState>) => void;
    /** Select a step */
    onSelectStep: (index: number) => void;
    /** Reorder steps (drag and drop) */
    onReorderSteps: (fromIndex: number, toIndex: number) => void;
}
/**
 * FunnelStepList displays a vertical list of funnel steps
 * with drag-and-drop reordering support.
 */
declare const FunnelStepList: React.MemoExoticComponent<({ steps, activeStepIndex, schema, onAddStep, onRemoveStep, onUpdateStep, onSelectStep, onReorderSteps, }: FunnelStepListProps) => React.JSX.Element>;
export default FunnelStepList;
