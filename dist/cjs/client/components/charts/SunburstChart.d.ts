import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * SunburstChart Component
 *
 * Renders a sunburst diagram visualization from FlowChartData.
 * Shows hierarchical flow paths radiating from a central starting step.
 */
declare const SunburstChart: React.MemoExoticComponent<({ data, height, colorPalette, displayConfig, }: ChartProps) => React.JSX.Element>;
export default SunburstChart;
