import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * FunnelChart Component
 *
 * Renders a funnel visualization from FunnelChartData array.
 * Shows each step as a horizontal bar with width proportional to count.
 * Displays conversion rates between steps.
 */
declare const FunnelChart: React.MemoExoticComponent<({ data, height, colorPalette, displayConfig, }: ChartProps) => React.JSX.Element>;
export default FunnelChart;
