import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * SankeyChart Component
 *
 * Renders a Sankey diagram visualization from FlowChartData.
 * Shows flow paths with nodes at each layer and links between them.
 */
declare const SankeyChart: React.MemoExoticComponent<({ data, height, colorPalette, displayConfig, }: ChartProps) => React.JSX.Element>;
export default SankeyChart;
