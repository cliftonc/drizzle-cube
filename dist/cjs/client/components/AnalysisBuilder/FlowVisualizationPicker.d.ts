import { ChartType } from '../../types.js';
interface FlowVisualizationPickerProps {
    chartType: ChartType;
    onChartTypeChange: (type: ChartType) => void;
}
declare const FlowVisualizationPicker: import('react').MemoExoticComponent<({ chartType, onChartTypeChange }: FlowVisualizationPickerProps) => import("react").JSX.Element>;
export default FlowVisualizationPicker;
