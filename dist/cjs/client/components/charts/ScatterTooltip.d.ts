import { AxisFormatConfig } from '../../types.js';
import { ScatterPoint } from './ScatterChart.helpers.js';
interface ScatterTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload?: ScatterPoint;
    }>;
    xAxisField: string;
    yAxisField: string;
    xAxisFormat?: AxisFormatConfig;
    yAxisFormat?: AxisFormatConfig;
    getFieldLabel: (field: string) => string;
}
/**
 * Custom Recharts tooltip content for ScatterChart.
 *
 * Extracted from the inline `content` render prop to keep the chart body lean.
 * Renders the point name, any time-dimension values, and the formatted x/y.
 */
export declare function ScatterTooltip({ active, payload, xAxisField, yAxisField, xAxisFormat, yAxisFormat, getFieldLabel }: ScatterTooltipProps): import("react").JSX.Element | null;
export {};
