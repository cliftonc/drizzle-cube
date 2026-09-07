import { default as React } from 'react';
import { CubeMeta, FunnelBindingKey } from '../../types.js';
export interface FlowConfigPanelProps {
    /** Currently selected cube for flow analysis */
    selectedCube: string | null;
    /** Current binding key */
    bindingKey: FunnelBindingKey | null;
    /** Current time dimension */
    timeDimension: string | null;
    /** Current event dimension */
    eventDimension: string | null;
    /** Cube metadata */
    schema: CubeMeta | null;
    /** Callback when cube changes */
    onCubeChange: (cube: string | null) => void;
    /** Callback when binding key changes */
    onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void;
    /** Callback when time dimension changes */
    onTimeDimensionChange: (dimension: string | null) => void;
    /** Callback when event dimension changes */
    onEventDimensionChange: (dimension: string | null) => void;
}
/**
 * FlowConfigPanel displays selectors for cube, binding key, time dimension,
 * and event dimension in a collapsible section.
 */
declare const FlowConfigPanel: React.MemoExoticComponent<({ selectedCube, bindingKey, timeDimension, eventDimension, schema, onCubeChange, onBindingKeyChange, onTimeDimensionChange, onEventDimensionChange, }: FlowConfigPanelProps) => React.JSX.Element>;
export default FlowConfigPanel;
