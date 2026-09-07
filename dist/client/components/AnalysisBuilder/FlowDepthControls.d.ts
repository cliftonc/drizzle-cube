import { ChartType } from '../../types.js';
interface FlowDepthControlsProps {
    chartType: ChartType;
    stepsBefore: number;
    stepsAfter: number;
    onStepsBeforeChange: (count: number) => void;
    onStepsAfterChange: (count: number) => void;
}
declare const FlowDepthControls: import('react').MemoExoticComponent<({ chartType, stepsBefore, stepsAfter, onStepsBeforeChange, onStepsAfterChange }: FlowDepthControlsProps) => import("react").JSX.Element>;
export default FlowDepthControls;
