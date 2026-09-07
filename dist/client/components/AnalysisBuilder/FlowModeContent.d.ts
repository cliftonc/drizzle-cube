import { CubeMeta, FunnelBindingKey, ChartType, ChartDisplayConfig, Filter } from '../../types.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
import { FlowStartingStep } from '../../types/flow.js';
export interface FlowModeContentProps {
    /** Currently selected cube for flow analysis */
    flowCube: string | null;
    /** Binding key that links events to entities */
    flowBindingKey: FunnelBindingKey | null;
    /** Time dimension for event ordering */
    flowTimeDimension: string | null;
    /** Event dimension that categorizes events */
    eventDimension: string | null;
    /** Starting step configuration */
    startingStep: FlowStartingStep;
    /** Number of steps to explore before starting step */
    stepsBefore: number;
    /** Number of steps to explore after starting step */
    stepsAfter: number;
    /** Join strategy for server execution */
    joinStrategy: 'auto' | 'lateral' | 'window';
    /** Cube metadata for field selection */
    schema: CubeMeta | null;
    /** Callback when cube changes */
    onCubeChange: (cube: string | null) => void;
    /** Callback when binding key changes */
    onBindingKeyChange: (key: FunnelBindingKey | null) => void;
    /** Callback when time dimension changes */
    onTimeDimensionChange: (dim: string | null) => void;
    /** Callback when event dimension changes */
    onEventDimensionChange: (dim: string | null) => void;
    /** Callback when starting step filters change */
    onStartingStepFiltersChange: (filters: Filter[]) => void;
    /** Callback when steps before changes */
    onStepsBeforeChange: (count: number) => void;
    /** Callback when steps after changes */
    onStepsAfterChange: (count: number) => void;
    /** Callback when join strategy changes */
    onJoinStrategyChange?: (strategy: 'auto' | 'lateral' | 'window') => void;
    /** Chart type for flow display */
    chartType?: ChartType;
    /** Callback when chart type changes (affects query!) */
    onChartTypeChange?: (type: ChartType) => void;
    /** Display configuration */
    displayConfig?: ChartDisplayConfig;
    /** Color palette */
    colorPalette?: ColorPalette;
    /** Callback when display config changes */
    onDisplayConfigChange?: (config: ChartDisplayConfig) => void;
}
/**
 * FlowModeContent displays the complete flow configuration interface:
 * - Tabs: Flow | Display
 * - Flow tab: Config panel + starting step + depth controls
 * - Display tab: Sankey chart display options
 */
declare const FlowModeContent: import('react').MemoExoticComponent<({ flowCube, flowBindingKey, flowTimeDimension, eventDimension, startingStep, stepsBefore, stepsAfter, joinStrategy, schema, onCubeChange, onBindingKeyChange, onTimeDimensionChange, onEventDimensionChange, onStartingStepFiltersChange, onStepsBeforeChange, onStepsAfterChange, onJoinStrategyChange, chartType, onChartTypeChange, displayConfig, colorPalette, onDisplayConfigChange, }: FlowModeContentProps) => import("react").JSX.Element>;
export default FlowModeContent;
