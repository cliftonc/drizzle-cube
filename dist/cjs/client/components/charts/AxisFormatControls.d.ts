import { AxisFormatConfig } from '../../types.js';
interface AxisFormatControlsProps {
    value: AxisFormatConfig;
    onChange: (config: AxisFormatConfig) => void;
    axisLabel: string;
    /** Sample value for preview (default: 1250000) */
    previewValue?: number;
}
/**
 * Single axis format control section
 */
export declare function AxisFormatControls({ value, onChange, axisLabel, previewValue }: AxisFormatControlsProps): import("react").JSX.Element;
interface MultiAxisFormatControlsProps {
    displayConfig: {
        xAxisFormat?: AxisFormatConfig;
        leftYAxisFormat?: AxisFormatConfig;
        rightYAxisFormat?: AxisFormatConfig;
    };
    onChange: (updates: {
        xAxisFormat?: AxisFormatConfig;
        leftYAxisFormat?: AxisFormatConfig;
        rightYAxisFormat?: AxisFormatConfig;
    }) => void;
    /** Which axes to show controls for */
    showAxes?: {
        xAxis?: boolean;
        leftYAxis?: boolean;
        rightYAxis?: boolean;
    };
}
/**
 * Container component for multiple axis format controls. Each configured axis
 * renders an `AxisFormatControls`; the per-axis entries are data-driven so the
 * three branches collapse into a single map.
 */
export declare function MultiAxisFormatControls({ displayConfig, onChange, showAxes }: MultiAxisFormatControlsProps): import("react").JSX.Element;
export default AxisFormatControls;
