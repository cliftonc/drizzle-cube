import { default as React } from 'react';
import { CubeMeta, FunnelBindingKey } from '../../types.js';
export interface FunnelConfigPanelProps {
    /** Currently selected cube for this funnel */
    selectedCube: string | null;
    /** Current binding key */
    bindingKey: FunnelBindingKey | null;
    /** Current time dimension */
    timeDimension: string | null;
    /** Cube metadata */
    schema: CubeMeta | null;
    /** Callback when cube changes */
    onCubeChange: (cube: string | null) => void;
    /** Callback when binding key changes */
    onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void;
    /** Callback when time dimension changes */
    onTimeDimensionChange: (dimension: string | null) => void;
}
/**
 * FunnelConfigPanel displays selectors for cube, binding key and time dimension
 * in a collapsible section that auto-collapses once all fields are configured.
 */
declare const FunnelConfigPanel: React.MemoExoticComponent<({ selectedCube, bindingKey, timeDimension, schema, onCubeChange, onBindingKeyChange, onTimeDimensionChange, }: FunnelConfigPanelProps) => React.JSX.Element>;
export default FunnelConfigPanel;
