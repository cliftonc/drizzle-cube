import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * HeatMapChart Component
 *
 * Renders a heatmap visualization from query results.
 * Shows intensity patterns across two categorical dimensions.
 */
declare const HeatMapChart: React.MemoExoticComponent<({ data, height, chartConfig, colorPalette, displayConfig, queryObject, }: ChartProps) => React.JSX.Element>;
export default HeatMapChart;
