import { CubeMeta, FunnelBindingKey, FunnelStepState, ChartType, ChartDisplayConfig } from '../../types.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
export interface FunnelModeContentProps {
    /** Currently selected cube for funnel */
    funnelCube: string | null;
    /** Current funnel steps */
    funnelSteps: FunnelStepState[];
    /** Index of the currently active step */
    activeFunnelStepIndex: number;
    /** Time dimension for funnel temporal ordering */
    funnelTimeDimension: string | null;
    /** Binding key that links steps together */
    funnelBindingKey: FunnelBindingKey | null;
    /** Cube metadata for field selection */
    schema: CubeMeta | null;
    /** Callback when cube changes */
    onCubeChange: (cube: string | null) => void;
    /** Add a new funnel step */
    onAddStep: () => void;
    /** Remove a funnel step by index */
    onRemoveStep: (index: number) => void;
    /** Update a funnel step */
    onUpdateStep: (index: number, updates: Partial<FunnelStepState>) => void;
    /** Set the active step index */
    onSelectStep: (index: number) => void;
    /** Reorder funnel steps */
    onReorderSteps: (fromIndex: number, toIndex: number) => void;
    /** Set the time dimension */
    onTimeDimensionChange: (dimension: string | null) => void;
    /** Set the binding key */
    onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void;
    /** Chart type for funnel display */
    chartType?: ChartType;
    /** Display configuration */
    displayConfig?: ChartDisplayConfig;
    /** Color palette */
    colorPalette?: ColorPalette;
    /** Callback when display config changes */
    onDisplayConfigChange?: (config: ChartDisplayConfig) => void;
}
/**
 * FunnelModeContent displays the complete funnel configuration interface:
 * - Tabs: Steps | Display
 * - Steps tab: Config panel (binding key + time dimension) + step list
 * - Display tab: Funnel chart display options
 */
declare const FunnelModeContent: import('react').MemoExoticComponent<({ funnelCube, funnelSteps, activeFunnelStepIndex, funnelTimeDimension, funnelBindingKey, schema, onCubeChange, onAddStep, onRemoveStep, onUpdateStep, onSelectStep, onReorderSteps, onTimeDimensionChange, onBindingKeyChange, chartType, displayConfig, colorPalette, onDisplayConfigChange, }: FunnelModeContentProps) => import("react").JSX.Element>;
export default FunnelModeContent;
