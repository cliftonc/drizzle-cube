import { default as React } from 'react';
import { ChartProps } from '../../types.js';
/**
 * Retention display mode
 * - 'heatmap': Show retention as color-coded bars
 * - 'line': Show retention as line curves
 * - 'combined': Show both heatmap background and line overlay
 */
export type RetentionDisplayMode = 'heatmap' | 'line' | 'combined';
/**
 * RetentionCombinedChart Component
 */
declare const RetentionCombinedChart: React.MemoExoticComponent<({ data, height, displayConfig, colorPalette, }: ChartProps) => React.JSX.Element>;
export default RetentionCombinedChart;
